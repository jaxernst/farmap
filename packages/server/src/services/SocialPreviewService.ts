import { AttachmentNotFound } from "@farmap/domain/Api"
import { FileId, FileStore } from "@farmap/domain/FileStorage"
import type { AttachmentId } from "@farmap/domain/MapAttachments"
import { Config, Context, Effect, Layer, Option, pipe } from "effect"
import sharp from "sharp"
import StaticMaps from "staticmaps"
import { AttachmentsRepo } from "../Repo.js"

const PREVIEW_WIDTH = 1200
const PREVIEW_HEIGHT = 800
const DEFAULT_MAP_SIZE = 280
const DEFAULT_MAP_ZOOM = 14
const BG_COLOR = "#7c65c1"

export interface MapImageOptions {
  lat: number
  long: number
  zoom: number
  width: number
  height: number
}

class MapboxAccessToken extends Context.Tag("MapboxAccessToken")<MapboxAccessToken, string>() {
  static readonly Live = Layer.effect(
    MapboxAccessToken,
    pipe(
      Config.string("MAPBOX_ACCESS_TOKEN"),
      Effect.orDie
    )
  )
}

export const generateMapImage = ({
  height,
  lat,
  long,
  width,
  zoom
}: MapImageOptions) =>
  Effect.gen(function*() {
    const accessToken = yield* MapboxAccessToken

    const map = new StaticMaps({
      width,
      height,
      paddingX: 0,
      paddingY: 0,
      tileUrl: `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${accessToken}`,
      tileSize: 512
    })

    const coord: [number, number] = [long, lat]
    const marker = {
      coord,
      color: "#4caf50",
      radius: 10
    } as const

    map.addCircle(marker)

    return yield* Effect.promise(async () => {
      await map.render(coord, zoom)
      return map.image.buffer("image/png")
    })
  }).pipe(Effect.provide(MapboxAccessToken.Live))

export const generateSocialPreview = ({
  lat,
  long,
  mapSize = DEFAULT_MAP_SIZE,
  mapZoom = DEFAULT_MAP_ZOOM,
  photoBuffer
}: {
  photoBuffer: Buffer
  lat: number
  long: number
  mapZoom?: number
  mapSize?: number
}) =>
  Effect.gen(function*() {
    const mapBuffer = yield* generateMapImage({
      lat,
      long,
      width: mapSize,
      height: mapSize,
      zoom: mapZoom
    })

    // Map with rounded corners
    const roundedMapBuffer = yield* Effect.promise(() =>
      sharp(mapBuffer)
        .composite([
          {
            input: Buffer.from(
              `<svg><rect x="0" y="0" width="250" height="250" rx="20" ry="20"/></svg>`
            ),
            blend: "dest-in"
          }
        ])
        .ensureAlpha()
        .linear(1, 0.5)
        .toBuffer()
    )

    const canvasWidth = PREVIEW_WIDTH
    const canvasHeight = PREVIEW_HEIGHT

    // Normalize the image first to handle EXIF orientation
    const normalizedBuffer = yield* Effect.promise(() =>
      sharp(photoBuffer)
        .rotate() // Automatically rotate based on EXIF orientation
        .toBuffer()
    )

    // Get metadata from the normalized image
    const metadata = yield* Effect.promise(() => sharp(normalizedBuffer).metadata())
    const imageAspectRatio = (metadata.width || 1) / (metadata.height || 1)

    const bgColor = BG_COLOR

    let finalImage

    // If image is significantly taller than wide (portrait/tall orientation)
    if (imageAspectRatio < 0.8) {
      // Calculate dimensions for the centered photo
      // Make it nearly fill the height (95%)
      const photoHeight = canvasHeight * 0.95
      const photoWidth = photoHeight * imageAspectRatio

      // Position of the mini map on the right side
      const mapLeftPosition = canvasWidth - mapSize - 15

      // Center photo between left edge and left edge of mini map
      // Available width is from 0 to mapLeftPosition
      const availableWidth = mapLeftPosition
      const photoLeft = Math.floor((availableWidth - photoWidth) / 2)

      const resizedPhotoBuffer = yield* Effect.promise(() =>
        sharp(normalizedBuffer) // Use the normalized buffer here
          .resize({
            height: Math.round(photoHeight),
            width: Math.round(photoWidth),
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .toBuffer()
      )

      // Apply corner rounding separately
      const roundedPhotoBuffer = yield* Effect.promise(() =>
        sharp(resizedPhotoBuffer)
          .composite([
            {
              input: Buffer.from(
                `<svg><rect x="0" y="0" width="${Math.round(photoWidth)}" height="${
                  Math.round(photoHeight)
                }" rx="20" ry="20"/></svg>`
              ),
              blend: "dest-in"
            }
          ])
          .ensureAlpha()
          .png()
          .toBuffer()
      )

      // Create a canvas with the background color
      finalImage = yield* Effect.promise(() =>
        sharp({
          create: {
            width: canvasWidth,
            height: canvasHeight,
            channels: 4,
            background: bgColor
          }
        })
          .composite([
            {
              // Position the photo on the canvas with new horizontal centering
              input: roundedPhotoBuffer,
              left: photoLeft,
              top: Math.floor((canvasHeight - photoHeight) / 2)
            },
            {
              input: roundedMapBuffer,
              top: 15,
              left: mapLeftPosition
            }
          ])
          .flatten({ background: bgColor }) // Flatten with background color
          .jpeg({ quality: 80 })
          .toBuffer()
      )
    } else {
      // For normal or wide aspect ratios, use the existing behavior
      const resizedPhotoBuffer = yield* Effect.promise(() =>
        sharp(normalizedBuffer) // Use the normalized buffer here
          .resize({
            width: canvasWidth,
            height: canvasHeight,
            fit: "cover",
            position: "center"
          })
          .toBuffer() // Remove the explicit rotate(0) call
      )

      finalImage = yield* Effect.promise(() =>
        sharp(resizedPhotoBuffer)
          .composite([
            {
              input: roundedMapBuffer,
              top: 15,
              left: canvasWidth - mapSize - 15
            }
          ])
          .jpeg({ quality: 80 })
          .toBuffer()
      )
    }

    return finalImage
  }).pipe(Effect.withLogSpan("generateSocialPreview"))

export class SocialPreviewService extends Effect.Service<SocialPreviewService>()(
  "api/SocialPreview",
  {
    effect: Effect.gen(function*() {
      const repo = yield* AttachmentsRepo
      const fileStorage = yield* FileStore

      const getOrGenerateSocialPreview = (attachmentId: AttachmentId) =>
        Effect.gen(function*() {
          // Get the attachment from the repository
          const attachment = yield* repo.findById(attachmentId).pipe(
            Effect.flatMap(
              Option.match({
                onSome: Effect.succeed,
                onNone: () => Effect.fail(new AttachmentNotFound({ id: attachmentId }))
              })
            )
          )

          // Check if previewUrl already exists
          if (attachment.previewUrl) {
            return {
              url: attachment.previewUrl,
              attachment
            }
          }

          // Get the file from storage
          const fileUrl = attachment.fileUrl
          const fileId = fileUrl.split("/").pop() as FileId

          // Currently assuming all files are images
          // const fileMetadata = yield* fileStorage.getFileMetadata(fileId);

          const photoBuffer = yield* fileStorage.getFile(fileId)
          const previewImageBuffer = yield* generateSocialPreview({
            photoBuffer,
            lat: attachment.latitude,
            long: attachment.longitude
          })

          // Upload the preview image directly to storage
          const previewFileId = FileId.make(
            `preview-${attachmentId}-${Date.now()}`
          )

          yield* fileStorage.uploadFile(
            previewFileId,
            previewImageBuffer,
            "image/jpeg"
          )

          const previewUrl = fileStorage.toFileUrl(previewFileId)

          yield* Effect.log(
            yield* repo.updatePreviewUrl(attachmentId, previewUrl)
          )

          return {
            url: previewUrl,
            attachment
          }
        }).pipe(Effect.withLogSpan("getOrGenerateSocialPreview"))

      return {
        getOrGenerateSocialPreview
      }
    }),
    dependencies: [AttachmentsRepo.Default]
  }
) {}

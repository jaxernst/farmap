import { Effect, Schema } from "effect";
import StaticMaps from "staticmaps";
import sharp from "sharp";
import { AttachmentId } from "@farmap/domain/MapAttachments";
import { AttachmentNotFound } from "@farmap/domain/Api";
import { FileStore, FileId } from "@farmap/domain/FileStorage";
import { AttachmentsRepo } from "../Repo.js";
import { Option } from "effect";

export interface MapImageOptions {
  lat: number;
  long: number;
  zoom?: number;
  width?: number;
  height?: number;
}

export const generateMapImage = ({
  lat,
  long,
  zoom = 13,
  width = 150,
  height = 150,
}: MapImageOptions) =>
  Effect.promise(async () => {
    const map = new StaticMaps({
      width,
      height,
      paddingX: 0,
      paddingY: 0,
      tileUrl:
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png",
      tileSubdomains: ["a", "b", "c", "d"],
      zoomRange: { min: 1, max: 17 },
    });

    // Add a marker at the location
    const coord: [number, number] = [long, lat];
    const marker = {
      coord,
      color: "#4caf50",
      radius: 10,
    } as const;

    map.addCircle(marker);

    // Render the map
    await map.render([long, lat], zoom);

    // Get the buffer
    return map.image.buffer("image/png");
  });

export const generateSocialPreview = ({
  photoBuffer,
  lat,
  long,
}: {
  photoBuffer: Buffer;
  lat: number;
  long: number;
}) =>
  Effect.gen(function* () {
    // Generate a larger map for better visibility
    const mapBuffer = yield* generateMapImage({
      lat,
      long,
      width: 250,
      height: 250,
      zoom: 13,
    });

    // Add rounded corners to the map and make it semi-transparent
    const roundedMapBuffer = yield* Effect.promise(() =>
      sharp(mapBuffer)
        .composite([
          {
            input: Buffer.from(
              `<svg><rect x="0" y="0" width="250" height="250" rx="20" ry="20"/></svg>`
            ),
            blend: "dest-in",
          },
        ])
        .ensureAlpha()
        .linear(1, 0.5)
        .toBuffer()
    );

    // Set fixed dimensions for OG image (1200x630 is standard)
    const canvasWidth = 1200;
    const canvasHeight = 630;

    // Resize and center the photo to fit the OG image dimensions
    const resizedPhotoBuffer = yield* Effect.promise(() =>
      sharp(photoBuffer)
        .resize({
          width: canvasWidth,
          height: canvasHeight,
          fit: "cover",
          position: "center",
        })
        .toBuffer()
    );

    const finalImage = yield* Effect.promise(() =>
      sharp(resizedPhotoBuffer)
        .composite([
          {
            input: roundedMapBuffer,
            top: 15,
            left: canvasWidth - 265,
          },
        ])
        .jpeg({ quality: 80 })
        .toBuffer()
    );

    return finalImage;
  });

export class FileFetchError extends Schema.TaggedError<FileFetchError>()(
  "FileFetchError",
  {
    id: FileId,
    message: Schema.String,
  }
) {}

export class SocialPreviewService extends Effect.Service<SocialPreviewService>()(
  "api/SocialPreview",
  {
    effect: Effect.gen(function* () {
      const repo = yield* AttachmentsRepo;
      const fileStorage = yield* FileStore;

      const getOrGenerateSocialPreview = (attachmentId: AttachmentId) =>
        Effect.gen(function* () {
          // Get the attachment from the repository
          const attachment = yield* repo.findById(attachmentId).pipe(
            Effect.flatMap(
              Option.match({
                onSome: Effect.succeed,
                onNone: () =>
                  Effect.fail(new AttachmentNotFound({ id: attachmentId })),
              })
            )
          );

          // Check if previewUrl already exists
          if (attachment.previewUrl) {
            return {
              url: attachment.previewUrl,
              attachment,
            };
          }

          // Get the file from storage
          const fileUrl = attachment.fileUrl;
          const fileId = fileUrl.split("/").pop() as FileId;
          const fileMetadata = yield* fileStorage.getFileMetadata(fileId);

          // Download the file
          const fileResponse = yield* Effect.tryPromise({
            try: () => fetch(fileMetadata.url),
            catch: (error) =>
              new FileFetchError({
                id: fileId,
                message: (error as any).toString(),
              }),
          });

          const photoBuffer = yield* Effect.promise(() =>
            fileResponse.arrayBuffer().then((buffer) => Buffer.from(buffer))
          );

          // Generate the social preview
          const previewImageBuffer = yield* generateSocialPreview({
            photoBuffer,
            lat: attachment.latitude,
            long: attachment.longitude,
          });

          // Generate a unique file ID for the preview
          const previewFileId = FileId.make(
            `preview-${attachmentId}-${Date.now()}`
          );

          // Upload the preview image directly to storage
          yield* fileStorage.uploadFile(
            previewFileId,
            previewImageBuffer,
            "image/jpeg"
          );

          const previewUrl = fileStorage.toFileUrl(previewFileId);
          yield* repo.updatePreviewUrl(attachmentId, previewUrl);

          return {
            url: previewUrl,
            attachment,
          };
        });

      return {
        getOrGenerateSocialPreview,
      };
    }),
    dependencies: [AttachmentsRepo.Default],
  }
) {}

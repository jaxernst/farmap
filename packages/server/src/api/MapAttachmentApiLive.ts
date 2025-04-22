import { HttpApiBuilder } from "@effect/platform"
import { AttachmentNotFound, FarMapApi, InputError } from "@farmap/domain/Api"
import { FileStore } from "@farmap/domain/FileStorage"
import { MapAttachmentModel } from "@farmap/domain/MapAttachments"
import { AttachmentQueryParams } from "@farmap/domain/Query"
import { User, UserPreview } from "@farmap/domain/Users"
import { Effect, Option, pipe, Schema } from "effect"
import { MapAttachmentService } from "../services/MapAttachmentsService.js"
import { SocialPreviewService } from "../services/SocialPreviewService.js"
import { UserService } from "../services/UserService.js"

export const MapAttachmentsApiLive = HttpApiBuilder.group(
  FarMapApi,
  "MapAttachments",
  (handlers) =>
    Effect.gen(function*() {
      const map = yield* MapAttachmentService
      const mapPreviews = yield* SocialPreviewService
      const fileStorage = yield* FileStore
      const users = yield* UserService

      return handlers
        .handle("createUploadUrl", ({ payload }) =>
          fileStorage.getUploadUrl(payload).pipe(
            Effect.map(({ fileId, signedUrl }) => ({ signedUrl, fileId })),
            Effect.orDie
          ))
        .handle("attachPhoto", ({ payload: { fileId, fileType, position } }) =>
          User.pipe(
            Effect.andThen((user) => map.attachToMap(user, position, fileId, fileType)),
            // Asynchronously generate the social preview
            Effect.tap(({ id }) => Effect.forkDaemon(mapPreviews.getOrGenerateSocialPreview(id)))
          ))
        .handle("myAttachments", () =>
          User.pipe(
            Effect.andThen((user) =>
              map.query({ userId: user }).pipe(
                Effect.map((attachments) => ({
                  attachments,
                  totalCount: attachments.length
                }))
              )
            )
          ))
        .handle("deleteAttachment", ({ path: { id } }) =>
          User.pipe(
            Effect.andThen((user) => map.deleteUserAttachment(user, id)),
            Effect.tap((attachment) =>
              Effect.forkDaemon(
                Effect.all([
                  fileStorage.deleteFile(fileStorage.fromFileUrl(attachment.fileUrl)),
                  fileStorage.deleteFile(fileStorage.fromFileUrl(attachment.previewUrl!))
                ]).pipe(
                  Effect.tap(() => Effect.logInfo("Attachment cleanup completed successfully")),
                  Effect.catchAll((error) => Effect.logError("Attachment cleanup failed", { error }))
                )
              ).pipe(Effect.withLogSpan("deleteAttachment.cleanup"))
            ),
            Effect.map(() => ({ ok: true }))
          ))
        .handle("getById", ({ path: { id } }) =>
          Effect.gen(function*() {
            const attachment = yield* map.getById(id)
            const creator = Option.getOrThrow(yield* users.getById(attachment.creatorId))

            return {
              attachment,
              creator: UserPreview.make({
                userId: creator.id,
                fid: creator.fid,
                displayName: creator.displayName,
                displayImage: creator.displayImage
              })
            }
          }))
        .handle("getByIds", ({ urlParams: { ids } }) =>
          map.getByIds(ids).pipe(
            Effect.map((attachments) => ({
              attachments,
              totalCount: attachments.length
            }))
          ))
        .handle("getSocialPreview", ({ path: { id } }) =>
          Effect.gen(function*() {
            const { attachment, url } = yield* mapPreviews.getOrGenerateSocialPreview(id)
            const creator = Option.getOrThrow(yield* users.getById(attachment.userId))

            return {
              url,
              attachment: MapAttachmentModel.toAttachmentSchema(attachment),
              creator: UserPreview.make({
                userId: creator.id,
                fid: creator.fid,
                displayName: creator.displayName,
                displayImage: creator.displayImage
              })
            }
          }).pipe(Effect.catchTags({
            FileNotFound: () => Effect.fail(new AttachmentNotFound({ id })),
            FileFetchError: (error) => pipe(Effect.logError(error), Effect.die)
          })))
        .handle("query", ({ urlParams }) =>
          Schema.decodeUnknown(AttachmentQueryParams)(urlParams).pipe(
            Effect.andThen((params) => map.query(params)),
            Effect.map((attachments) => ({
              attachments,
              totalCount: attachments.length
            })),
            Effect.catchTag("ParseError", () => Effect.fail(new InputError({ message: "Invalid query params" })))
          ))
    })
)

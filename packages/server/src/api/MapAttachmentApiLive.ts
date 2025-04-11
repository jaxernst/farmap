import { HttpApiBuilder } from "@effect/platform";
import { Effect, pipe, Schema } from "effect";
import { MapAttachmentService } from "../services/MapAttachmentsService.js";
import { AttachmentNotFound, FarMapApi, InputError } from "@farmap/domain/Api";
import { AttachmentQueryParams } from "@farmap/domain/Query";
import { User } from "@farmap/domain/Users";
import { FileStore } from "@farmap/domain/FileStorage";
import { SocialPreviewService } from "../services/SocialPreviewService.js";
import { MapAttachmentModel } from "@farmap/domain/MapAttachments";

export const MapAttachmentsApiLive = HttpApiBuilder.group(
  FarMapApi,
  "MapAttachments",
  (handlers) =>
    Effect.gen(function* () {
      const map = yield* MapAttachmentService;
      const mapPreviews = yield* SocialPreviewService;
      const fileStorage = yield* FileStore;

      return handlers
        .handle("createUploadUrl", ({ payload }) =>
          fileStorage.getUploadUrl(payload).pipe(
            Effect.map(({ signedUrl, fileId }) => ({ signedUrl, fileId })),
            Effect.orDie
          )
        )
        .handle("attachPhoto", ({ payload: { position, fileId, fileType } }) =>
          User.pipe(
            Effect.andThen((user) =>
              map.attachToMap(user, position, fileId, fileType)
            )
          )
        )
        .handle("myAttachments", () =>
          User.pipe(
            Effect.andThen((user) =>
              map.query({ userId: user }).pipe(
                Effect.map((attachments) => ({
                  attachments,
                  totalCount: attachments.length,
                }))
              )
            )
          )
        )
        .handle("deleteAttachment", ({ path: { id } }) =>
          User.pipe(
            Effect.andThen((user) => map.deleteUserAttachment(user, id)),
            Effect.map(() => ({ ok: true }))
          )
        )
        .handle("getById", ({ path: { id } }) => map.getById(id))
        .handle("getByIds", ({ urlParams: { ids } }) =>
          map.getByIds(ids).pipe(
            Effect.map((attachments) => ({
              attachments,
              totalCount: attachments.length,
            }))
          )
        )
        .handle("getSocialPreview", ({ path: { id } }) =>
          mapPreviews.getOrGenerateSocialPreview(id).pipe(
            Effect.map(({ url, attachment }) => ({
              url,
              attachment: MapAttachmentModel.toAttachmentSchema(attachment),
            })),
            Effect.catchTags({
              FileNotFound: () => Effect.fail(new AttachmentNotFound({ id })),
              FileFetchError: (error) =>
                pipe(Effect.logError(error), Effect.die),
            })
          )
        )
        .handle("query", ({ urlParams }) =>
          Schema.decodeUnknown(AttachmentQueryParams)(urlParams).pipe(
            Effect.andThen((params) => map.query(params)),
            Effect.map((attachments) => ({
              attachments,
              totalCount: attachments.length,
            })),
            Effect.catchTag("ParseError", () =>
              Effect.fail(new InputError({ message: "Invalid query params" }))
            )
          )
        );
    })
);

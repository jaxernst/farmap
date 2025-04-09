import { HttpApiBuilder } from "@effect/platform";
import { Effect, Schema } from "effect";
import { MapAttachmentService } from "../services/MapAttachmentsService.js";
import { FarMapApi, InputError } from "@farmap/domain/Api";
import { AttachmentQueryParams } from "@farmap/domain/Query";
import { User } from "@farmap/domain/Users";
import { FileStore } from "@farmap/domain/FileStorage";

export const MapAttachmentsApiLive = HttpApiBuilder.group(
  FarMapApi,
  "MapAttachments",
  (handlers) =>
    Effect.gen(function* () {
      const map = yield* MapAttachmentService;
      const fileStorage = yield* FileStore;

      return handlers
        .handle("createUploadUrl", ({ payload }) =>
          fileStorage.getUploadUrl(payload).pipe(
            Effect.map((url) => ({ url })),
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
        .handle("getById", ({ path: { id } }) => map.getById(id))
        .handle("getByIds", ({ urlParams: { ids } }) =>
          map.getByIds(ids).pipe(
            Effect.map((attachments) => ({
              attachments,
              totalCount: attachments.length,
            }))
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

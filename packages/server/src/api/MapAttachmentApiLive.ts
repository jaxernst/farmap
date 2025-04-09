import { HttpApiBuilder } from "@effect/platform";
import { Effect, Schema } from "effect";
import { MapAttachmentService } from "../services/MapAttachmentsService.js";
import { FarMapApi, InputError } from "@farmap/domain/Api";
import { AttachmentQueryParams } from "@farmap/domain/Query";
import { User } from "@farmap/domain/Users";

export const MapAttachmentsApiLive = HttpApiBuilder.group(
  FarMapApi,
  "MapAttachments",
  (handlers) =>
    Effect.gen(function* () {
      const map = yield* MapAttachmentService;

      return handlers
        .handle("attachPhoto", ({ payload: { position, blob } }) =>
          Effect.gen(function* () {
            console.log("attachPhoto", position, blob);
            const user = yield* User;
            console.log("user", user);
            return yield* map.attachToMap(user, position, blob);
          })
        )
        .handle("getById", ({ path: { id } }) => map.getById(id))
        .handle("getByIds", ({ urlParams: { ids } }) =>
          Effect.gen(function* () {
            const attachments = yield* map.getByIds(ids);
            return {
              attachments,
              totalCount: attachments.length,
            };
          })
        )
        .handle("query", ({ urlParams }) =>
          Effect.gen(function* () {
            const params = yield* Schema.decodeUnknown(AttachmentQueryParams)(
              urlParams
            );

            const attachments = yield* map.query(params);
            return {
              attachments,
              totalCount: attachments.length,
            };
          }).pipe(
            Effect.catchTag("ParseError", () =>
              Effect.fail(new InputError({ message: "Invalid query params" }))
            )
          )
        );
    })
);

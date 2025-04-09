import { HttpApiBuilder } from "@effect/platform";
import { Effect, Layer, Schema } from "effect";
import { MapAttachmentService } from "./MapAttachmentsService.js";
import { Authentication, FarMapApi, InputError } from "@farmap/domain/Api";
import { AttachmentQueryParams } from "@farmap/domain/Query";
import { User } from "@farmap/domain/Users";
import { AuthService } from "./AuthService.js";
import { UserService } from "./UserService.js";

const AuthApiLive = HttpApiBuilder.group(FarMapApi, "Auth", (handlers) =>
  Effect.gen(function* () {
    const auth = yield* AuthService;
    const userService = yield* UserService;

    return handlers
      .handle("signInWithFarcaster", ({ payload }) =>
        Effect.gen(function* () {
          const fid = yield* auth.verifyFarcasterCredential(payload);
          const user = yield* userService.getOrCreateByFid(fid);
          const token = yield* auth.createSession(user.id);
          return token;
        }).pipe(
          Effect.tap((token) =>
            HttpApiBuilder.securitySetCookie(
              Authentication.security.cookie,
              token
            )
          )
        )
      )
      .handle("signOut", ({ payload: { token } }) =>
        Effect.gen(function* () {
          // yield* auth.signOut(token);
          return {};
        })
      );
  })
);

const MapAttachmentsApiLive = HttpApiBuilder.group(
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

export const ApiLive = HttpApiBuilder.api(FarMapApi).pipe(
  Layer.provide(MapAttachmentsApiLive),
  Layer.provide(AuthApiLive)
);

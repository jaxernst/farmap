import { HttpApiBuilder } from "@effect/platform";
import { Effect } from "effect";
import { Authentication, FarMapApi } from "@farmap/domain/Api";
import { AuthService } from "../services/AuthService.js";
import { UserService } from "../services/UserService.js";

export const AuthApiLive = HttpApiBuilder.group(FarMapApi, "Auth", (handlers) =>
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

import { HttpApiBuilder } from "@effect/platform"
import { Authentication, FarMapApi } from "@farmap/domain/Api"
import { Duration, Effect, Option } from "effect"
import { SessionNotFound } from "../../../domain/src/Auth.js"
import { User } from "../../../domain/src/Users.js"
import { AuthService } from "../services/AuthService.js"
import { UserService } from "../services/UserService.js"

export const AuthApiLive = HttpApiBuilder.group(FarMapApi, "Auth", (handlers) =>
  Effect.gen(function*() {
    const auth = yield* AuthService
    const userService = yield* UserService

    return handlers
      .handle("getCurrentUser", () =>
        User.pipe(
          Effect.andThen((uid) => userService.getById(uid)),
          Effect.flatMap((user) =>
            Option.match(user, {
              onNone: () => Effect.fail(new SessionNotFound()),
              onSome: (user) =>
                Effect.succeed({
                  fid: user.fid,
                  userId: user.id,
                  displayName: user.displayName,
                  displayImage: user.displayImage
                })
            })
          )
        ))
      .handle("nonce", () => auth.generateNonce())
      .handle("signInWithFarcaster", ({ payload }) =>
        Effect.gen(function*() {
          // const fid = yield* auth.verifyFarcasterCredential(payload)
          const user = yield* userService.getOrCreateByFid(12163)
          const token = yield* auth.createSession(user.id)

          return {
            fid: user.fid,
            userId: user.id,
            displayName: user.displayName,
            displayImage: user.displayImage,
            token
          }
        }).pipe(
          Effect.tap(({ token }) =>
            HttpApiBuilder.securitySetCookie(
              Authentication.security.cookie,
              token,
              {
                sameSite: "none",
                secure: true,
                httpOnly: true,
                path: "/",
                maxAge: Duration.hours(24)
              }
            )
          )
        ))
      .handle("signOut", () =>
        User.pipe(
          Effect.andThen((userId) => auth.deleteSession(userId)),
          Effect.map(() => ({ ok: true }))
        ))
  }))

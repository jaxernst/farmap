import { Effect, Layer } from "effect"

import { Unauthorized } from "@effect/platform/HttpApiError"
import { Authentication } from "@farmap/domain/Api"
import type { SessionToken } from "@farmap/domain/Auth"
import { AuthService } from "./services/AuthService.js"

export const AuthMiddlewareLive = Layer.effect(
  Authentication,
  Effect.gen(function*() {
    const authService = yield* AuthService

    return Authentication.of({
      cookie: (sessionToken) =>
        authService.getSession(sessionToken as SessionToken).pipe(
          Effect.catchAll(() => {
            return new Unauthorized()
          })
        )
    })
  })
)

import { Effect, Layer } from "effect"

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
          Effect.catchAll((error) => {
            Effect.logError(error)
            return Effect.fail(error)
          })
        )
    })
  })
)

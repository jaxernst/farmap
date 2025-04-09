import { Layer } from "effect";

import { Authentication } from "@farmap/domain/Api";
import { Effect } from "effect";
import { AuthService } from "./services/AuthService.js";
import { SessionToken } from "@farmap/domain/Auth";

export const AuthMiddlewareLive = Layer.effect(
  Authentication,
  Effect.gen(function* () {
    const authService = yield* AuthService;

    return Authentication.of({
      cookie: (sessionToken) =>
        authService.getSession(sessionToken as SessionToken).pipe(
          Effect.catchAll((error) => {
            console.log("Error", error);
            return Effect.fail(error);
          })
        ),
    });
  })
);

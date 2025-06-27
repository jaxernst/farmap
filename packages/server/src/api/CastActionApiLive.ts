import { HttpApiBuilder } from "@effect/platform"
import { FarMapApi } from "@farmap/domain/Api"
import { Effect } from "effect"
import { CastActionService } from "../services/CastActionService.js"

export const CastActionApiLive = HttpApiBuilder.group(
  FarMapApi,
  "CastAction",
  (handlers) =>
    Effect.gen(function*() {
      const castAction = yield* CastActionService

      return handlers
        .handle("getMetadata", () =>
          Effect.succeed({
            name: "Upload to FarMap",
            icon: "image",
            description: "map and share photos",
            aboutUrl: "https://farmap.vercel.app",
            action: {
              type: "post" as const,
              postUrl: "https://farmap.vercel.app/api/cast-action"
            }
          }))
        .handle("handleAction", ({ payload }) => castAction.handleAction(payload))
    })
)

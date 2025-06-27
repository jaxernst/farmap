import { HttpApiBuilder } from "@effect/platform"
import { FarMapApi } from "@farmap/domain/Api"
import { Layer } from "effect"
import { AuthApiLive } from "./AuthApiLive.js"
import { MapAttachmentsApiLive } from "./MapAttachmentApiLive.js"

export const ApiLive = HttpApiBuilder.api(FarMapApi).pipe(
  Layer.provide(MapAttachmentsApiLive),
  Layer.provide(AuthApiLive)
)

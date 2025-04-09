import { HttpApiBuilder } from "@effect/platform";
import { FarMapApi } from "@farmap/domain/Api";
import { Layer } from "effect";
import { MapAttachmentsApiLive } from "./MapAttachmentApiLive.js";
import { AuthApiLive } from "./AuthApiLive.js";

export const ApiLive = HttpApiBuilder.api(FarMapApi).pipe(
  Layer.provide(MapAttachmentsApiLive),
  Layer.provide(AuthApiLive)
);

import { HttpApiBuilder } from "@effect/platform";
import { Effect, Layer } from "effect";
import { MapAttachmentService } from "./MapAttachmentsService.js";
import { FarMapApi } from "@farmap/domain/Api";

const MapAttachmentsApiLive = HttpApiBuilder.group(
  FarMapApi,
  "MapAttachments",
  (handlers) =>
    Effect.gen(function* () {
      const map = yield* MapAttachmentService;

      return handlers
        .handle("attachPhoto", ({ payload: { position, data } }) =>
          map.attachToMap(position, {
            tag: "photo",
            mimeType: "image/png",
            data,
          })
        )
        .handle("getById", ({ path: { id } }) => map.getById(id));
    })
);

export const ApiLive = HttpApiBuilder.api(FarMapApi).pipe(
  Layer.provide(MapAttachmentsApiLive)
);

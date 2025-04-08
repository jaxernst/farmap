import { HttpApiClient  } from "@effect/platform";
import { BrowserHttpClient, BrowserRuntime } from "@effect/platform-browser";
import { Effect, Layer } from "effect";
import { type Blob, type Position, AttachmentId, FarMapApi, Latitude, Longitude } from "@farmap/domain";

export class MapApiClient extends Effect.Service<MapApiClient>()(
  "ui/MapApiClient",
  {
    accessors: true,
    effect: Effect.gen(function* () {
      const client = yield* HttpApiClient.make(FarMapApi, {
        baseUrl: "/api",
      });

      async function attachPhoto(position: Position, blob: Blob) {
        return client.MapAttachments.attachPhoto({
          payload: { 
            position, 
            blob
          }
        }).pipe(Effect.runPromise);
      }

      async function getPhotoById(id: number) {
        return client.MapAttachments.getById({ path: { id: AttachmentId.make(id) } }).pipe(Effect.runPromise);
      }

      return {
        attachPhoto,
        getPhotoById,
      } as const;
    }),
    dependencies: [BrowserHttpClient.layerXMLHttpRequest],
  }, 
) {}

const makeApi = Effect.gen(function* () {
  return yield* MapApiClient
}).pipe(Effect.provide(MapApiClient.Default))

export const farmpApi = Effect.runSync(makeApi)
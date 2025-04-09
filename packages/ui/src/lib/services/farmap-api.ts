import { HttpApi, HttpApiClient, HttpClient  } from "@effect/platform";
import { BrowserHttpClient, BrowserRuntime } from "@effect/platform-browser";
import { Effect, Layer, pipe } from "effect";
import { type Blob, type Position, AttachmentId, FarMapApi, Latitude, Longitude } from "@farmap/domain";

export class FarmapClient extends Effect.Service<FarmapClient>()(
  "ui/FarmapClient",
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
        }).pipe( Effect.runPromise); }

      async function getPhotoById(id: number) {
        return client.MapAttachments.getById({ path: { id: AttachmentId.make(id) } }).pipe(Effect.runPromise);
      }

      async function signInWithFarcaster(fid: number) {
        return client.Auth.signInWithFarcaster({ 
          payload: { 
            fid, 
            message: "Sign in with Farcaster", 
            timestamp: Date.now(), 
            signature: "", 
            username: "" 
          } 
        }).pipe(Effect.runPromise);
      }

      return {
        attachPhoto,
        getPhotoById,
        signInWithFarcaster,
      } as const;
    }),
    dependencies: [BrowserHttpClient.layerXMLHttpRequest],
  }, 
) {}

export const farmapApi = pipe(
  Effect.gen(function* () {
    return yield* FarmapClient
  }),
  Effect.provide(FarmapClient.Default),
  Effect.runSync
)


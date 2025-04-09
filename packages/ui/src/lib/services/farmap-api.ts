import {  HttpApiClient } from "@effect/platform";
import { BrowserHttpClient } from "@effect/platform-browser";
import { Effect, Layer, pipe, Context } from "effect";
import { type Blob, type Position, AttachmentId, FarMapApi } from "@farmap/domain";
import type { HttpClient } from "@effect/platform/HttpClient";

class BaseUrl extends Context.Tag("ui/BaseUrl")<BaseUrl, string>() { }

export class FarmapClient extends Effect.Service<FarmapClient>()(
  "ui/FarmapClient",
  {
    accessors: true,
    effect: Effect.gen(function* () {
      const url = yield* BaseUrl
      const client = yield* HttpApiClient.make(FarMapApi, {
        baseUrl: url as string,
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
  }, 
) {}

export const BrowserClient = BrowserHttpClient.layerXMLHttpRequest

export function makeFarmapClient(baseURL: string, layer: Layer.Layer<HttpClient>) {
  return pipe(
    Effect.gen(function* () {
      return yield* FarmapClient
    }),
    Effect.provide(FarmapClient.Default),
    Effect.provide(Layer.succeed(BaseUrl, baseURL)),
    Effect.provide(layer),
    Effect.runSync
  )
}

const farmapPublicClient = makeFarmapClient("/api", BrowserClient)
export { farmapPublicClient as farmapApi }
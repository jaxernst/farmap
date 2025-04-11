import {  HttpApiClient } from "@effect/platform";
import { BrowserHttpClient } from "@effect/platform-browser";
import { Effect, Layer, pipe, Context } from "effect";
import {  type Position, AttachmentId, FarMapApi } from "@farmap/domain";
import type { HttpClient } from "@effect/platform/HttpClient";
import { uploadToPresignedUrl } from "./s3-api";

type Upload = {
  filename: string;
  contentType: string;
  size: number;
  file: File;
}

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


      const attachPhoto = (position: Position, upload: Upload) => 
        Effect.gen(function* () {
          const { signedUrl, fileId } = yield* client.MapAttachments.createUploadUrl({ 
            payload: {
              filename: upload.filename,
              contentType: upload.contentType,
              size: upload.size
            } 
          });
          
          yield* uploadToPresignedUrl(signedUrl, upload.file)
          
          return yield* client.MapAttachments.attachPhoto({ 
            payload: { 
              position, 
              fileType: "image", 
              fileId
            } 
          });
        })

      const getPhotoById = (id: number) =>
        client.MapAttachments.getById({ path: { id: AttachmentId.make(id) } })

      const signInWithFarcaster = (fid: number) =>
        client.Auth.signInWithFarcaster({ 
          payload: { 
            fid, 
            message: "Sign in with Farcaster", 
            timestamp: Date.now(), 
            signature: "", 
            username: "" 
          } 
        })
      
      const myAttachments = () =>
        client.MapAttachments.myAttachments()

      const getSocialPreview = (id: number) =>
        client.MapAttachments.getSocialPreview({ path: { id: AttachmentId.make(id) } })

      const deleteAttachment = (id: number) =>
        client.MapAttachments.deleteAttachment({ path: { id: AttachmentId.make(id) } })

      return {
        attachPhoto,
        deleteAttachment,
        getPhotoById,
        signInWithFarcaster,
        myAttachments,
        getSocialPreview,
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

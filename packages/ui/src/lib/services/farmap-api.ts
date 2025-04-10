import {  HttpApiClient } from "@effect/platform";
import { BrowserHttpClient } from "@effect/platform-browser";
import { Effect, Layer, pipe, Context } from "effect";
import {  type Position, AttachmentId, FarMapApi } from "@farmap/domain";
import type { HttpClient } from "@effect/platform/HttpClient";

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


      const attachPhoto = async (position: Position, upload: Upload) => 
        Effect.gen(function* () {
          const { signedUrl, fileId } = yield* client.MapAttachments.createUploadUrl({ 
            payload: {
              filename: upload.filename,
              contentType: upload.contentType,
              size: upload.size
            } 
          });
          
          const uploadSuccess = yield* Effect.tryPromise({
            try: () => uploadFileToS3(signedUrl, upload.file),
            catch: (e) => new Error("Failed to upload to signed URL", { cause: e })
          });

          
          if (!uploadSuccess) {
            return yield* Effect.fail(new Error('Failed to upload file to S3'));
          }
          
          return yield* client.MapAttachments.attachPhoto({ 
            payload: { 
              position, 
              fileType: "image", 
              fileId
            } 
          });

        }).pipe(Effect.runPromise);

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

      async function myAttachments() {
        return client.MapAttachments.myAttachments().pipe(Effect.runPromise);
      }

      return {
        attachPhoto,
        getPhotoById,
        signInWithFarcaster,
        myAttachments,
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

//

//

//

export const uploadFileToS3 = async (
  presignedUrl: string, 
  file: File
): Promise<boolean> => {
    const response = await fetch(presignedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
      credentials: 'omit'
    });
    
    if (!response.ok) {
      throw new Error(`S3 upload failed with status: ${response.status}`);
    }
    
    return true;
}
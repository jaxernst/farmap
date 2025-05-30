import { HttpApiClient } from "@effect/platform"
import { BrowserHttpClient } from "@effect/platform-browser"
import type { HttpClient } from "@effect/platform/HttpClient"
import { mapRequest } from "@effect/platform/HttpClient"
import { AttachmentId, FarMapApi, type Position } from "@farmap/domain"
import type { FarcasterCredential } from "@farmap/domain/Auth"
import { Context, Effect, Layer, pipe } from "effect"
import { uploadToPresignedUrl } from "./s3-api"

type Upload = {
  filename: string
  contentType: string
  size: number
  file: File
}

class BaseUrl extends Context.Tag("ui/BaseUrl")<BaseUrl, string>() {}

export class FarmapClient extends Effect.Service<FarmapClient>()("ui/FarmapClient", {
  accessors: true,
  effect: Effect.gen(function*() {
    const url = yield* BaseUrl

    const client = yield* HttpApiClient.make(FarMapApi, {
      baseUrl: url as string,
      transformClient: (client) =>
        mapRequest(client, (request) => ({
          ...request
        }))
    })

    const attachPhoto = (position: Position, upload: Upload) =>
      Effect.gen(function*() {
        const { fileId, signedUrl } = yield* client.MapAttachments.createUploadUrl({
          payload: {
            filename: upload.filename,
            contentType: upload.contentType,
            size: upload.size
          }
        })

        yield* uploadToPresignedUrl(signedUrl, upload.file)

        return yield* client.MapAttachments.attachPhoto({
          payload: {
            position,
            fileType: "image",
            fileId
          }
        })
      })

    const getPhotoById = (id: number) => client.MapAttachments.getById({ path: { id: AttachmentId.make(id) } })

    const getNonce = () => client.Auth.nonce()

    const getCurrentUser = () => client.Auth.getCurrentUser().pipe(Effect.catchAll(() => Effect.succeed(null)))

    const signInWithFarcaster = (credential: FarcasterCredential) =>
      client.Auth.signInWithFarcaster({
        payload: credential
      })

    const signOut = client.Auth.signOut

    const myAttachments = client.MapAttachments.myAttachments

    const getAllAttachments = client.MapAttachments.getAll

    const getSocialPreview = (id: number) =>
      client.MapAttachments.getSocialPreview({ path: { id: AttachmentId.make(id) } })

    const deleteAttachment = (id: number) =>
      client.MapAttachments.deleteAttachment({ path: { id: AttachmentId.make(id) } })

    return {
      attachPhoto,
      deleteAttachment,
      getPhotoById,
      myAttachments,
      getAllAttachments,
      getSocialPreview,

      auth: {
        getNonce,
        getCurrentUser,
        signInWithFarcaster,
        signOut
      }
    } as const
  })
}) {}

export const BrowserClient = BrowserHttpClient.layerXMLHttpRequest

export function makeFarmapClient(baseURL: string, layer: Layer.Layer<HttpClient>) {
  return pipe(
    Effect.gen(function*() {
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

import { HttpBody } from "@effect/platform"
import { BrowserHttpClient } from "@effect/platform-browser"
import { HttpClient } from "@effect/platform/HttpClient"
import { Effect } from "effect"

export const uploadToPresignedUrl = (presignedUrl: string, file: File) =>
  Effect.gen(function*() {
    const httpClient = yield* HttpClient

    const response = yield* httpClient.put(presignedUrl, {
      "body": HttpBody.fileWeb(file),
      headers: {
        "Content-Type": file.type
      }
    })

    return response
  }).pipe(
    Effect.provide(BrowserHttpClient.layerXMLHttpRequest)
  )

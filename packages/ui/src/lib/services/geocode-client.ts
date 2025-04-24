import { HttpClient } from "@effect/platform"
import { layerXMLHttpRequest } from "@effect/platform-browser/BrowserHttpClient"
import { Context, Effect, Schema } from "effect"

const ToQueryParams = Schema.transform(
  Schema.String,
  Schema.Struct({
    lat: Schema.Number,
    long: Schema.Number
  }),
  {
    strict: false,
    decode: (fromString) => {
      const params = new URLSearchParams(fromString)
      return {
        lat: params.get("latitude"),
        long: params.get("longitude")
      }
    },
    encode: (struct) => `?latitude=${struct.lat}&longitude=${struct.long}`
  }
)

export class Geocoder extends Context.Tag("geocode/reverse")<Geocoder, {
  readonly reverse: (lat: number, long: number) => Effect.Effect<string | null>
}>() {}

const BdcGeocoder = Effect.gen(function*() {
  const httpClient = yield* HttpClient.HttpClient

  const BDC_API_HOST = "https://api-bdc.io/data"
  const reverseGeocodeEndpoint = BDC_API_HOST + "/reverse-geocode-client"

  const BdcReverseGeocodeResponse = Schema.Struct({
    localityInfo: Schema.Struct({
      informative: Schema.Array(Schema.Struct({
        name: Schema.String,
        description: Schema.optional(Schema.String),
        order: Schema.Number
      }))
    })
  })

  const reverse = (lat: number, long: number) =>
    Effect.gen(function*() {
      const params = Schema.encodeSync(ToQueryParams)({ lat, long })
      console.log()
      const response = yield* httpClient.get(`${reverseGeocodeEndpoint}${params}`)
      const res = yield* Schema.decodeUnknown(BdcReverseGeocodeResponse)(yield* response.json)
      // Get the most specific location name
      const mostSpecific = res.localityInfo.informative
        .filter((x) => !["FIPS code", "postal code", "time zone"].includes(x.description ?? ""))
        .toSorted(({ order: a }, { order: b }) => b - a)[0]

      return mostSpecific.name
    }).pipe(
      Effect.catchTag("ParseError", (e) => {
        console.error("Unexpected response from BDC api:", e)
        return Effect.succeed(null)
      }),
      Effect.orElseSucceed(() => null)
    )

  return Geocoder.of({ reverse })
})

export const GeocoderClient = BdcGeocoder.pipe(
  Effect.provide(layerXMLHttpRequest),
  Effect.runSync
)

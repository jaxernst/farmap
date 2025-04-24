import { PUBLIC_MAPBOX_ACCESS_TOKEN } from "$env/static/public"
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
    encode: (struct) => `/${struct.long},${struct.lat}.json`
  }
)

export class Geocoder extends Context.Tag("geocode/reverse")<Geocoder, {
  readonly reverse: (lat: number, long: number) => Effect.Effect<string | null>
}>() {}

const MapboxGeocoder = Effect.gen(function*() {
  const httpClient = yield* HttpClient.HttpClient

  const MAPBOX_API_HOST = "https://api.mapbox.com/geocoding/v5/mapbox.places"
  const MAPBOX_ACCESS_TOKEN = PUBLIC_MAPBOX_ACCESS_TOKEN

  // Mapbox response schema (simplified)
  const MapboxReverseGeocodeResponse = Schema.Struct({
    features: Schema.Array(Schema.Struct({
      place_type: Schema.Array(Schema.String),
      text: Schema.String,
      place_name: Schema.String
    }))
  })

  const reverse = (lat: number, long: number) =>
    Effect.gen(function*() {
      const params = Schema.encodeSync(ToQueryParams)({ lat, long })
      // Focus on POIs, parks, and places for concise names
      const types = "poi,neighborhood,locality,place"
      const url = `${MAPBOX_API_HOST}${params}?types=${types}&access_token=${MAPBOX_ACCESS_TOKEN}`

      const response = yield* httpClient.get(url)
      const res = yield* Schema.decodeUnknown(MapboxReverseGeocodeResponse)(yield* response.json)
      return res.features[0]?.text ?? null
    }).pipe(
      Effect.catchTag("ParseError", (e) => {
        console.error("Unexpected response from Mapbox API:", e)
        return Effect.succeed(null)
      }),
      Effect.orElseSucceed(() => null)
    )

  return Geocoder.of({ reverse })
})

export const GeocoderClient = MapboxGeocoder.pipe(
  Effect.provide(layerXMLHttpRequest),
  Effect.runSync
)

import { PUBLIC_MAPBOX_ACCESS_TOKEN } from "$env/static/public"
import { HttpClient } from "@effect/platform"
import { layerXMLHttpRequest } from "@effect/platform-browser/BrowserHttpClient"
import { Cache, Context, Duration, Effect, Schema } from "effect"

export class Geocoder extends Context.Tag("geocode/reverse")<Geocoder, {
  readonly reverseSearchLocation: (lat: number, long: number) => Effect.Effect<string | null>
}>() {}

const MapboxGeocoder = Effect.gen(function*() {
  const httpClient = yield* HttpClient.HttpClient
  const MAPBOX_ENDPOINT = "https://api.mapbox.com/search/geocode/v6/reverse"
  const MAPBOX_ACCESS_TOKEN = PUBLIC_MAPBOX_ACCESS_TOKEN

  const responseSchema = Schema.Struct({
    features: Schema.Array(Schema.Struct({
      properties: Schema.Struct({
        full_address: Schema.optional(Schema.String),
        feature_type: Schema.String
      })
    }))
  })

  const ignoreFeatures = ["address", "street", "district", "postcode", "country"]

  const reverseSearchLocation = (
    { lat, long }: { lat: number; long: number }
  ) =>
    Effect.gen(function*() {
      const url = `${MAPBOX_ENDPOINT}?longitude=${long}&latitude=${lat}&access_token=${MAPBOX_ACCESS_TOKEN}`

      const response = yield* httpClient.get(url)
      const res = yield* Schema.decodeUnknown(responseSchema)(
        yield* response.json
      )

      const filtered = res.features.filter((feature) => !ignoreFeatures.includes(feature.properties.feature_type))
      if (filtered.length > 0 && filtered[0].properties.full_address) {
        // Trim to 3 comma separated fragments at most
        const fragments = filtered[0].properties.full_address.split(",")
          .map((fragment) => fragment.trim())
          .slice(0, 3)

        return fragments.join(", ")
      }

      return null
    }).pipe(
      Effect.catchAll(() => Effect.succeed(null))
    )

  const reverseSearchCache = yield* Cache.make({
    capacity: 1000,
    timeToLive: Duration.infinity,
    lookup: reverseSearchLocation
  })

  return Geocoder.of({
    reverseSearchLocation: (lat, long) => reverseSearchCache.get({ lat, long })
  })
})

export const GeocoderClient = MapboxGeocoder.pipe(
  Effect.provide(layerXMLHttpRequest),
  Effect.runSync
)

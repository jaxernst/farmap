import { NodeHttpClient } from "@effect/platform-node"
import { HttpClient } from "@effect/platform/HttpClient"
import type { Fid, UserDataType, UserDataTypeToValueType } from "@farmap/domain/Farcaster"
import { Farcaster, HubError, LinkResponse, UserDataMessage, userDataTypeToValue } from "@farmap/domain/Farcaster"
import { Context, Effect, Layer, pipe, Schema } from "effect"

export class PinataConfig extends Context.Tag("PinataConfig")<
  PinataConfig,
  {
    // Using free hub api with no auth
    // apiKey: string;
    // apiSecret: string;
    baseUrl: string
  }
>() {
  static readonly Default = Layer.succeed(PinataConfig, { baseUrl: "https://hub.pinata.cloud" })
}

const makeGetRequest = (
  config: PinataConfig["Type"],
  httpClient: HttpClient
) => {
  return (endpoint: string, options: RequestInit = {}) =>
    Effect.gen(function*() {
      const response = yield* httpClient.get(`${config.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...options.headers,
          // Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json"
        }
      })

      if (response.status >= 400) {
        return yield* new HubError({
          message: `Pinata API error: ${response.status}`
        })
      }

      return yield* response.json
    }).pipe(
      Effect.catchAll((e) =>
        Effect.fail(
          new HubError({
            message: e.message
          })
        )
      )
    )
}

const decodeResponse = <T>(response: unknown, schema: Schema.Schema<T>) =>
  pipe(
    Schema.decodeUnknown(schema)(response),
    Effect.catchTag("ParseError", (e) =>
      Effect.fail(
        new HubError({
          message: "Unexpected hub response received",
          cause: e
        })
      ))
  )

const makePinataHubService = Effect.gen(function*() {
  const config = yield* PinataConfig
  const httpClient = yield* HttpClient

  const get = makeGetRequest(config, httpClient)

  // Generic method to get any user data type
  const getUserData = <T extends UserDataType>(dataType: T, fid: Fid) =>
    Effect.gen(function*() {
      const response = yield* get(
        `/v1/userDataByFid?fid=${fid}&user_data_type=${userDataTypeToValue[dataType]}`
      )

      const userData = yield* decodeResponse(
        response,
        UserDataMessage as unknown as Schema.Schema<UserDataMessage> // Weird inference issue - skill issue probably
      )

      if (userData.data.userDataBody.type !== dataType) {
        return yield* Effect.fail(
          new HubError({
            message: `Expected user data type ${dataType}`
          })
        )
      }

      return userData.data.userDataBody.value as UserDataTypeToValueType[T]
    })

  const getFollowers = (fid: Fid) =>
    Effect.gen(function*() {
      const response = yield* get(
        `/v1/linksByTargetFid?target_fid=${fid}&link_type=follow`
      )

      const result = yield* decodeResponse(
        response,
        LinkResponse as unknown as Schema.Schema<LinkResponse> // Weird inference issue - skill issue probably
      )

      return result.messages.map((msg) => msg.data.linkBody.targetFid)
    })

  const getFollowing = (fid: Fid) =>
    Effect.gen(function*() {
      const response = yield* get(`/v1/linksByFid?fid=${fid}&link_type=follow`)

      const result = yield* decodeResponse(
        response,
        LinkResponse as unknown as Schema.Schema<LinkResponse> // Weird inference issue - skill issue probably
      )

      return result.messages.map((msg) => msg.data.linkBody.targetFid)
    })

  const getFriends = (fid: Fid) =>
    Effect.gen(function*() {
      const [followers, following] = yield* Effect.all([
        getFollowers(fid),
        getFollowing(fid)
      ])

      // Find intersection of followers and following to get friends
      const followerFids = new Set(followers)
      return following.filter((f) => followerFids.has(f))
    })

  return {
    getUserData,
    getFriends,
    getFollowers,
    getFollowing
  }
})

const PinataFaracsterService = Layer.effect(Farcaster, makePinataHubService)

export class FarcasterService extends Farcaster {
  static readonly PinataLive = PinataFaracsterService.pipe(
    Layer.provide(PinataConfig.Default),
    Layer.provide(NodeHttpClient.layer)
  )
}

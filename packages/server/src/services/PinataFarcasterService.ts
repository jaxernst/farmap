import { Effect, Context, Layer, Schema, pipe } from "effect";
import {
  FarcasterService,
  Fid,
  LinkResponse,
  UserDataMessage,
  UserDataType,
  userDataTypeToValue,
  UserDataTypeToValueType,
} from "@farmap/domain/Farcaster";
import { HttpClient } from "@effect/platform/HttpClient";
import { HubError } from "@farmap/domain/Farcaster";
import { NodeHttpClient } from "@effect/platform-node";

export class PinataConfig extends Context.Tag("PinataConfig")<
  PinataConfig,
  {
    // Using free hub api with no auth
    // apiKey: string;
    // apiSecret: string;
    baseUrl: string;
  }
>() {}

const PinataLiveConfig = Layer.effect(
  PinataConfig,
  Effect.gen(function* (_) {
    return PinataConfig.of({
      // apiKey: yield* Config.string("PINATA_API_KEY"),
      // apiSecret: yield* Config.string("PINATA_API_SECRET"),
      baseUrl: "https://hub.pinata.cloud",
    });
  })
);

const makeGetRequest = (
  config: PinataConfig["Type"],
  httpClient: HttpClient
) => {
  return (endpoint: string, options: RequestInit = {}) =>
    Effect.gen(function* () {
      const response = yield* httpClient.get(`${config.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...options.headers,
          // Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status >= 400) {
        return yield* new HubError({
          message: `Pinata API error: ${response.status}`,
        });
      }

      return yield* response.json;
    }).pipe(
      Effect.catchAll((e) =>
        Effect.fail(
          new HubError({
            message: e.message,
          })
        )
      )
    );
};

const decodeResponse = <T>(response: unknown, schema: Schema.Schema<T>) =>
  pipe(
    Schema.decodeUnknown(schema)(response),
    Effect.catchTag("ParseError", (e) =>
      Effect.fail(
        new HubError({
          message: "Unexpected hub response received",
          cause: e,
        })
      )
    )
  );

export const FarcasterServiceLive = Layer.effect(
  FarcasterService,
  Effect.gen(function* () {
    const config = yield* PinataConfig;
    const httpClient = yield* HttpClient;

    const get = makeGetRequest(config, httpClient);

    // Generic method to get any user data type
    const getUserData = <T extends UserDataType>(dataType: T, fid: Fid) =>
      Effect.gen(function* () {
        const response = yield* get(
          `/v1/userDataByFid?fid=${fid}&user_data_type=${userDataTypeToValue[dataType]}`
        );

        const userData = yield* decodeResponse(
          response,
          UserDataMessage as unknown as Schema.Schema<UserDataMessage> // Weird inference issue - skill issue probably
        );

        if (userData.data.userDataBody.type !== dataType) {
          return yield* Effect.fail(
            new HubError({
              message: `Expected user data type ${dataType}`,
            })
          );
        }

        return userData.data.userDataBody.value as UserDataTypeToValueType[T];
      });

    const getFollowers = (fid: Fid) =>
      Effect.gen(function* () {
        const response = yield* get(
          `/v1/linksByTargetFid?target_fid=${fid}&link_type=follow`
        );

        const result = yield* decodeResponse(
          response,
          LinkResponse as unknown as Schema.Schema<LinkResponse> // Weird inference issue - skill issue probably
        );

        return result.messages.map((msg) => msg.data.linkBody.targetFid);
      });

    const getFollowing = (fid: Fid) =>
      Effect.gen(function* () {
        const response = yield* get(
          `/v1/linksByFid?fid=${fid}&link_type=follow`
        );

        const result = yield* decodeResponse(
          response,
          LinkResponse as unknown as Schema.Schema<LinkResponse> // Weird inference issue - skill issue probably
        );

        return result.messages.map((msg) => msg.data.linkBody.targetFid);
      });

    const getFriends = (fid: Fid) =>
      Effect.gen(function* () {
        const [followers, following] = yield* Effect.all([
          getFollowers(fid),
          getFollowing(fid),
        ]);

        // Find intersection of followers and following to get friends
        const followerFids = new Set(followers);
        return following.filter((f) => followerFids.has(f));
      });

    return {
      getUserData,
      getFriends,
      getFollowers,
      getFollowing,
    };
  })
).pipe(Layer.provide(PinataLiveConfig), Layer.provide(NodeHttpClient.layer));

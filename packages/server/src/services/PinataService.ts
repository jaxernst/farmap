import { Effect, Context, Layer, Config, pipe } from "effect";
import { FarcasterService, FcProfile } from "@farmap/domain/Farcaster";
import { HttpClient } from "@effect/platform/HttpClient";

export class PinataConfig extends Context.Tag("PinataConfig")<
  PinataConfig,
  {
    apiKey: string;
    apiSecret: string;
    baseUrl: string;
  }
>() {}

const PinataLiveConfig = Layer.effect(
  PinataConfig,
  Effect.gen(function* (_) {
    return PinataConfig.of({
      apiKey: yield* Config.string("PINATA_API_KEY"),
      apiSecret: yield* Config.string("PINATA_API_SECRET"),
      baseUrl: "https://api.pinata.cloud/v3/farcaster",
    });
  })
);

const makeGetRequest = (config: PinataConfig) => {
  return (endpoint: string, options: RequestInit = {}) => {
    return Effect.gen(function* () {
      const httpClient = yield* HttpClient;
      const config = yield* PinataConfig;

      const response = yield* httpClient.get(`${config.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status >= 400) {
        return yield* Effect.fail(
          new Error(`Pinata API error: ${response.status}`)
        );
      }

      return yield* response.json;
    });
  };
};

export const PinataService = Layer.effect(
  FarcasterService,
  Effect.gen(function* () {
    const config = yield* PinataConfig;
    const get = makeGetRequest(config);

    const getFollowers = (fid: number) => null;

    const getFollowing = (fid: number) => null;

    const getFriends = (fid: number) => {
      const [followers, following] =
        yield * Effect.all([getFollowers(fid), getFollowing(fid)]);

      // Find intersection of followers and following to get friends
      const followerFids = new Set(followers.map((f) => f.fid));
      return following.filter((f) => followerFids.has(f.fid));
    };

    return {
      getFriends,
      getFollowers,
      getFollowing,
    };
  })
);

export const PinataServiceLive = Layer.provide(PinataService, PinataLiveConfig);

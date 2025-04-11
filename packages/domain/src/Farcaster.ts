import { Context, Effect, pipe, Schema } from "effect";

export type Fid = typeof Fid.Type;
const Fid = pipe(Schema.Number, Schema.brand("Fid"));

export type FcProfile = typeof FcProfile.Type;
const FcProfile = Schema.Struct({
  fid: Schema.Number,
  fname: Schema.String,
  displayName: Schema.String,
  avatar: Schema.String,
});

export class FarcasterService extends Context.Tag("FarcasterService")<
  FarcasterService,
  {
    getFriends: (fid: Fid) => Effect.Effect<FcProfile[]>;
    getFollowers: (fid: Fid) => Effect.Effect<FcProfile[]>;
    getFollowing: (fid: Fid) => Effect.Effect<FcProfile[]>;
  }
>() {}

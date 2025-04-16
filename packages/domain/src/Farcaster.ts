import { Context, Effect, pipe, Schema } from "effect";

export type Fid = typeof Fid.Type;
export const Fid = pipe(Schema.Number, Schema.brand("Fid"));

export enum UserDataTypeValue {
  PFP = 1,
  DISPLAY_NAME = 2,
  BIO = 3,
  URL = 5,
  USER_NAME = 6,
  LOCATION = 7,
  TWITTER = 8,
  GITHUB = 9,
}

export type UserDataType = "USER_DATA_TYPE_PFP" | "USER_DATA_TYPE_DISPLAY"; // Only supporting these two for now

// Map from string type to integer value for Hub queries
export const userDataTypeToValue: Record<UserDataType, UserDataTypeValue> = {
  USER_DATA_TYPE_PFP: UserDataTypeValue.PFP,
  USER_DATA_TYPE_DISPLAY: UserDataTypeValue.DISPLAY_NAME,
};

export type PfpUrl = typeof PfpUrl.Type;
export const PfpUrl = Schema.String;

export type DisplayName = typeof DisplayName.Type;
export const DisplayName = Schema.String;

export type UserDataTypeToValueType = {
  USER_DATA_TYPE_PFP: PfpUrl;
  USER_DATA_TYPE_DISPLAY: DisplayName;
};

export type UserDataBody = typeof UserDataBody.Type;
export const UserDataBody = Schema.Union(
  Schema.Struct({
    type: Schema.Literal("USER_DATA_TYPE_PFP"),
    value: PfpUrl,
  }),
  Schema.Struct({
    type: Schema.Literal("USER_DATA_TYPE_DISPLAY"),
    value: DisplayName,
  })
);

export type UserDataMessageData = typeof UserDataMessageData.Type;
export const UserDataMessageData = Schema.Struct({
  type: Schema.Literal("MESSAGE_TYPE_USER_DATA_ADD"),
  fid: Fid,
  timestamp: Schema.Number,
  network: Schema.String,
  userDataBody: UserDataBody,
});

export type UserDataMessage = typeof UserDataMessage.Type;
export const UserDataMessage = Schema.Struct({
  data: UserDataMessageData,
  hash: Schema.String,
  hashScheme: Schema.String,
  signature: Schema.String,
  signatureScheme: Schema.String,
  signer: Schema.String,
});

// Link-related schemas
export type LinkType = typeof LinkType.Type;
const LinkType = pipe(Schema.Literal("follow"), Schema.brand("LinkType"));

export type LinkBody = typeof LinkBody.Type;
const LinkBody = Schema.Struct({
  type: LinkType,
  targetFid: Fid,
});

export type LinkData = typeof LinkData.Type;
const LinkData = Schema.Struct({
  type: Schema.Literal("MESSAGE_TYPE_LINK_ADD"),
  fid: Fid,
  timestamp: Schema.Number,
  network: Schema.String,
  linkBody: LinkBody,
});

export type Link = typeof Link.Type;
const Link = Schema.Struct({
  data: LinkData,
  hash: Schema.String,
  hashScheme: Schema.String,
  signature: Schema.String,
  signatureScheme: Schema.String,
  signer: Schema.String,
});

export type LinkResponse = typeof LinkResponse.Type;
export const LinkResponse = Schema.Struct({
  messages: Schema.Array(Link),
  nextPageToken: Schema.String,
});

// Error types
export class HubError extends Schema.TaggedError<HubError>()("HubError", {
  message: Schema.String,
  cause: Schema.optional(Schema.Unknown),
}) {}

export class Farcaster extends Context.Tag("Farcaster")<
  Farcaster,
  {
    getUserData: <T extends UserDataType>(
      dataType: T,
      fid: Fid
    ) => Effect.Effect<UserDataTypeToValueType[T], HubError>;

    getFriends: (fid: Fid) => Effect.Effect<Fid[], HubError>;
    getFollowers: (fid: Fid) => Effect.Effect<Fid[], HubError>;
    getFollowing: (fid: Fid) => Effect.Effect<Fid[], HubError>;
  }
>() {}

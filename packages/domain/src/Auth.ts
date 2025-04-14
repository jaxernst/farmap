import { Schema, Redacted } from "effect";
import { UserId } from "./Users.js";
import { Model } from "@effect/sql";

export const FarcasterCredential = Schema.Struct({
  _devdomain: Schema.optional(Schema.String),
  nonce: Schema.String,
  message: Schema.String,
  signature: Schema.String,
});

export type FarcasterCredential = Schema.Schema.Type<
  typeof FarcasterCredential
>;

// Session token schema
export type SessionToken = Schema.Schema.Type<typeof SessionToken>;
export const SessionTokenString = Schema.String.pipe(
  Schema.brand("SessionToken")
);

export const SessionToken = Schema.Redacted(SessionTokenString);

export const sessionTokenFromString = (token: string): SessionToken =>
  Redacted.make(SessionTokenString.make(token));

export class SessionNotFound extends Schema.TaggedError<SessionNotFound>()(
  "SessionNotFound",
  {}
) {}

export class SessionExpired extends Schema.TaggedError<SessionExpired>()(
  "SessionExpired",
  {}
) {}

export class SessionModel extends Model.Class<SessionModel>("Session")({
  token: SessionToken,
  userId: UserId,
  expiresAt: Schema.DateTimeUtc,
  createdAt: Model.DateTimeInsert,
}) {}

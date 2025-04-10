import { Model } from "@effect/sql";
import { Context, Schema } from "effect";

export type UserId = typeof UserId.Type;
export const UserId = Schema.Number.pipe(Schema.brand("UserId"));

export class UserNotFound extends Schema.TaggedError<UserNotFound>()(
  "UserNotFound",
  {
    id: UserId,
  }
) {}

export class UserAlreadyExists extends Schema.TaggedError<UserAlreadyExists>()(
  "UserAlreadyExists",
  {
    fid: Schema.Number,
  }
) {}

export class UserModel extends Model.Class<UserModel>("users/UserModel")({
  id: Model.Generated(UserId),
  fid: Schema.Number,
  displayName: Schema.NullOr(Schema.String),
  displayImage: Schema.NullOr(Schema.String),
  createdAt: Model.DateTimeInsert,
  updatedAt: Model.DateTimeUpdate,
}) {}

export class User extends Context.Tag("users/User")<User, UserId>() {}

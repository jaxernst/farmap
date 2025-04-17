import { Model } from "@effect/sql"
import { Context, Schema } from "effect"
import { Fid } from "./Farcaster.js"

export type UserId = typeof UserId.Type
export const UserId = Schema.Number.pipe(Schema.brand("UserId"))

export type UserPreview = typeof UserPreview.Type
export const UserPreview = Schema.Struct({
  userId: UserId,
  fid: Schema.Number,
  displayName: Schema.NullOr(Schema.String),
  displayImage: Schema.NullOr(Schema.String)
})

export class UserNotFound extends Schema.TaggedError<UserNotFound>()(
  "UserNotFound",
  {
    id: UserId
  }
) {}

export class UserAlreadyExists extends Schema.TaggedError<UserAlreadyExists>()(
  "UserAlreadyExists",
  {
    fid: Schema.Number
  }
) {}

export class UserModel extends Model.Class<UserModel>("users/UserModel")({
  id: Model.Generated(UserId),
  fid: Fid,
  displayName: Schema.NullOr(Schema.String),
  displayImage: Schema.NullOr(Schema.String),
  createdAt: Model.DateTimeInsert,
  updatedAt: Model.DateTimeUpdate
}) {}

export class User extends Context.Tag("users/User")<User, UserId>() {}

import { Schema } from "effect"
import { AttachmentSchema, Latitude, Longitude } from "./MapAttachments.js"
import { UserId, UserPreview } from "./Users.js"

export type AttachmentQueryParams = Schema.Schema.Type<
  typeof AttachmentQueryParams
>

export const AttachmentQueryParams = Schema.Struct({
  lat: Schema.optional(Latitude),
  long: Schema.optional(Longitude),
  userId: Schema.optional(UserId),
  limit: Schema.optional(Schema.Number),
  cursor: Schema.optional(Schema.String)
})

export const AttachmentUrlParams = Schema.Struct({
  ...AttachmentQueryParams.fields,
  lat: Schema.optional(Schema.String),
  long: Schema.optional(Schema.String),
  userId: Schema.optional(Schema.String),
  limit: Schema.optional(Schema.String)
})

export const AttachmentPage = Schema.Struct({
  attachments: Schema.Array(AttachmentSchema),
  nextCursor: Schema.optional(Schema.String),
  totalCount: Schema.Number
})

export const AttachmentWithCreator = Schema.Struct({
  attachment: AttachmentSchema,
  creator: UserPreview
})

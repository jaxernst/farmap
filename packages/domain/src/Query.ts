import { Schema } from "effect";
import { Latitude, Longitude, PositionSchema } from "./MapAttachments.js";
import { UserId } from "./Users.js";

export type AttachmentQueryParams = Schema.Schema.Type<
  typeof AttachmentQueryParams
>;

export const AttachmentQueryParams = Schema.Struct({
  lat: Schema.optional(Latitude),
  long: Schema.optional(Longitude),
  userId: Schema.optional(UserId),
  limit: Schema.optional(Schema.Number),
  cursor: Schema.optional(Schema.String),
});

export const AttachmentUrlParams = Schema.Struct({
  ...AttachmentQueryParams.fields,
  lat: Schema.optional(Schema.String),
  long: Schema.optional(Schema.String),
  userId: Schema.optional(Schema.String),
  limit: Schema.optional(Schema.String),
});

export const AttachmentPreviewSchema = Schema.Struct({
  id: Schema.Number.pipe(Schema.brand("AttachmentId")),
  position: PositionSchema,
  userId: UserId,
  timestamp: Schema.DateFromString,
});

export const AttachmentPreviewPage = Schema.Struct({
  attachments: Schema.Array(AttachmentPreviewSchema),
  nextCursor: Schema.optional(Schema.String),
  totalCount: Schema.Number,
});

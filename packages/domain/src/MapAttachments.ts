import { Model } from "@effect/sql"
import { Schema } from "effect"
import { FileTypeSchema, FileUrl } from "./FileStorage.js"
import { UserId } from "./Users.js"

export type AttachmentId = typeof AttachmentId.Type
export const AttachmentId = Schema.Number.pipe(Schema.brand("AttachmentId"))
export const AttachmentIdFromString = Schema.NumberFromString.pipe(
  Schema.compose(AttachmentId)
)

export const Latitude = Schema.Number.pipe(Schema.brand("Latitude"))
export const Longitude = Schema.Number.pipe(Schema.brand("Longitude"))

export type Position = Schema.Schema.Type<typeof PositionSchema>
export const PositionSchema = Schema.Struct({
  lat: Latitude,
  long: Longitude
})

export type Attachment = Schema.Schema.Type<typeof AttachmentSchema>
export const AttachmentSchema = Schema.Struct({
  id: AttachmentId,
  position: PositionSchema,
  fileUrl: FileUrl,
  fileType: FileTypeSchema,
  previewUrl: Schema.optional(FileUrl),
  creatorId: UserId
})

export class MapAttachmentModel extends Model.Class<MapAttachmentModel>(
  "MapAttachment"
)({
  id: Model.Generated(AttachmentId),
  latitude: Latitude,
  longitude: Longitude,
  fileUrl: FileUrl,
  fileType: FileTypeSchema,
  previewUrl: Schema.NullOr(FileUrl),
  userId: UserId,
  createdAt: Model.DateTimeInsert,
  updatedAt: Model.DateTimeUpdate
}) {
  static toAttachmentSchema = (row: MapAttachmentModel) =>
    AttachmentSchema.make({
      id: row.id,
      position: { lat: row.latitude, long: row.longitude },
      fileUrl: row.fileUrl,
      fileType: row.fileType,
      previewUrl: row.previewUrl ?? undefined,
      creatorId: row.userId
    })
}

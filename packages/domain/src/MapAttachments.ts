import { Model } from "@effect/sql";
import { Schema } from "effect";

export const AttachmentId = Schema.Number.pipe(Schema.brand("AttachmentId"));
export type AttachmentId = typeof AttachmentId.Type;

export const AttachmentIdFromString = Schema.NumberFromString.pipe(
  Schema.compose(AttachmentId)
);

export type Blob = Schema.Schema.Type<typeof BlobSchema>;
export const BlobSchema = Schema.parseJson(
  Schema.Struct({
    tag: Schema.String,
    mimeType: Schema.String,
    data: Schema.String,
  })
);

export const Latitude = Schema.Number.pipe(Schema.brand("Latitude"));
export const Longitude = Schema.Number.pipe(Schema.brand("Longitude"));

export type Position = Schema.Schema.Type<typeof PositionSchema>;
export const PositionSchema = Schema.Struct({
  lat: Latitude,
  long: Longitude,
});

export type Attachment = Schema.Schema.Type<typeof AttachmentSchema>;
export const AttachmentSchema = Schema.Struct({
  id: AttachmentId,
  position: PositionSchema,
  object: BlobSchema,
});

export class MapAttachmentModel extends Model.Class<MapAttachmentModel>(
  "MapAttachment"
)({
  id: Model.Generated(AttachmentId),
  latitude: Latitude,
  longitude: Longitude,
  data: BlobSchema,
  createdAt: Model.DateTimeInsert,
  updatedAt: Model.DateTimeUpdate,
}) {
  static toAttachmentSchema = (row: MapAttachmentModel) =>
    AttachmentSchema.make({
      id: row.id,
      position: { lat: row.latitude, long: row.longitude },
      object: row.data,
    });
}

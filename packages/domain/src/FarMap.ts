import { HttpApi, HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Effect, Schema } from "effect";

export const AttachmentId = Schema.Number.pipe(Schema.brand("AttachmentId"));

export type AttachmentId = typeof AttachmentId.Type;

export const AttachmentIdFromString = Schema.NumberFromString.pipe(
  Schema.compose(AttachmentId)
);

export const PositionSchema = Schema.parseJson(
  Schema.Struct({
    lat: Schema.String,
    long: Schema.String,
  })
);

export type Position = Schema.Schema.Type<typeof PositionSchema>;

export const BlobSchema = Schema.parseJson(
  Schema.Struct({
    type: Schema.String,
    mimeType: Schema.String,
    data: Schema.String,
  })
);

export type Blob = Schema.Schema.Type<typeof BlobSchema>;

export const AttachmentSchema = Schema.parseJson(
  Schema.Struct({
    id: AttachmentId,
    position: PositionSchema,
    object: BlobSchema,
  })
);

export type Attachment = Schema.Schema.Type<typeof AttachmentSchema>;

export class InputError extends Schema.TaggedError<InputError>()("InputError", {
  message: Schema.String,
}) {}

export class MapAttachmentsApi extends HttpApiGroup.make("MapAttachments")
  .add(
    HttpApiEndpoint.get("getById", "/attachments/:id")
      .addSuccess(AttachmentSchema)
      .setPath(Schema.Struct({ id: AttachmentIdFromString }))
  )
  .add(
    HttpApiEndpoint.get("getAll", "/attachments").addSuccess(
      Schema.Array(AttachmentSchema)
    )
  )
  .add(
    HttpApiEndpoint.post("attachPhoto", "/attachments")
      .setPayload(
        Schema.Struct({
          position: PositionSchema,
          data: Schema.String,
        })
      )
      .addSuccess(Schema.Struct({ id: AttachmentId }))
      .addError(InputError, { status: 400 })
  ) {}

export class FarMapApi extends HttpApi.make("api").add(MapAttachmentsApi) {}

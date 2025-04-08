import { HttpApi, HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema } from "effect";
import {
  AttachmentId,
  AttachmentIdFromString,
  AttachmentSchema,
  PositionSchema,
  BlobSchema,
} from "./MapAttachments.js";

export class InputError extends Schema.TaggedError<InputError>()("InputError", {
  message: Schema.String,
}) {}

export class AttachmentNotFound extends Schema.TaggedError<AttachmentNotFound>()(
  "AttachmentNotFound",
  {
    id: AttachmentId,
  }
) {}

export class MapAttachmentsApi extends HttpApiGroup.make("MapAttachments")
  .add(
    HttpApiEndpoint.get("getById", "/attachments/:id")
      .addSuccess(AttachmentSchema)
      .addError(AttachmentNotFound, { status: 404 })
      .setPath(Schema.Struct({ id: AttachmentIdFromString }))
  )
  .add(
    HttpApiEndpoint.post("attachPhoto", "/attachments")
      .setPayload(
        Schema.Struct({
          position: PositionSchema,
          blob: BlobSchema,
        })
      )
      .addSuccess(Schema.Struct({ id: AttachmentId }))
      .addError(InputError, { status: 400 })
  ) {}

export class FarMapApi extends HttpApi.make("api").add(MapAttachmentsApi) {}

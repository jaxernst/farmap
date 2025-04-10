import {
  HttpApi,
  HttpApiEndpoint,
  HttpApiGroup,
  HttpApiMiddleware,
  HttpApiSecurity,
} from "@effect/platform";
import { Schema } from "effect";
import {
  AttachmentId,
  AttachmentIdFromString,
  AttachmentSchema,
  PositionSchema,
} from "./MapAttachments.js";
import { AttachmentUrlParams, AttachmentPage } from "./Query.js";
import { UserNotFound, UserModel, User } from "./Users.js";
import {
  FileTypeSchema,
  FileUploadRequestSchema,
  FileId,
  FileUrl,
  FileNotFound,
} from "./FileStorage.js";
import {
  FarcasterCredential,
  SessionToken,
  SessionNotFound,
  SessionExpired,
} from "./Auth.js";

export class InputError extends Schema.TaggedError<InputError>()("InputError", {
  message: Schema.String,
}) {}

export class AttachmentNotFound extends Schema.TaggedError<AttachmentNotFound>()(
  "AttachmentNotFound",
  {
    id: AttachmentId,
  }
) {}

export class Authentication extends HttpApiMiddleware.Tag<Authentication>()(
  "Auth",
  {
    provides: User,
    failure: Schema.Union(SessionNotFound, SessionExpired),
    security: {
      cookie: HttpApiSecurity.apiKey({
        in: "cookie",
        key: "session",
      }),
    },
  }
) {}

export class AuthApi extends HttpApiGroup.make("Auth")
  .prefix("/auth")
  .add(
    HttpApiEndpoint.post("signInWithFarcaster", "/siwf")
      .setPayload(FarcasterCredential)
      .addSuccess(SessionToken)
  )
  .add(
    HttpApiEndpoint.post("signOut", "/signout")
      .setPayload(Schema.Struct({ token: SessionToken }))
      .addSuccess(Schema.Struct({}))
  ) {}

export class UsersApi extends HttpApiGroup.make("Users").add(
  HttpApiEndpoint.get("getById", "/users/:id")
    .addSuccess(UserModel)
    .addError(UserNotFound, { status: 404 })
  // .setPath(Schema.Struct({ id: UserId.pipe(Schema.encodeURIComponent) }))
) {}

export class MapAttachmentsApi extends HttpApiGroup.make("MapAttachments")
  .add(
    HttpApiEndpoint.post("createUploadUrl", "/attachments/file")
      .setPayload(FileUploadRequestSchema)
      .addSuccess(Schema.Struct({ signedUrl: FileUrl, fileId: FileId }))
      .addError(InputError, { status: 400 })
      .addError(FileNotFound, { status: 400 })
  )
  .add(
    HttpApiEndpoint.post("attachPhoto", "/attachments")
      .setPayload(
        Schema.Struct({
          position: PositionSchema,
          fileId: FileId,
          fileType: FileTypeSchema,
        })
      )
      .addSuccess(Schema.Struct({ id: AttachmentId }))
      .addError(InputError, { status: 400 })
      .addError(FileNotFound, { status: 400 })
  )
  .add(
    HttpApiEndpoint.get("myAttachments", "/attachments/my").addSuccess(
      AttachmentPage
    )
  )
  .middlewareEndpoints(Authentication)
  // unauthenticated
  .add(
    HttpApiEndpoint.get("getById", "/attachments/:id")
      .addSuccess(AttachmentSchema)
      .addError(AttachmentNotFound, { status: 404 })
      .setPath(Schema.Struct({ id: AttachmentIdFromString }))
  )
  .add(
    HttpApiEndpoint.get("getByIds", "/attachments/ids")
      .setUrlParams(
        Schema.Struct({ ids: Schema.Array(AttachmentIdFromString) })
      )
      .addSuccess(AttachmentPage)
      .addError(InputError, { status: 400 })
  )
  .add(
    HttpApiEndpoint.get("getSocialPreview", "/attachments/social-preview/:id")
      .setPath(Schema.Struct({ id: AttachmentIdFromString }))
      .addSuccess(Schema.Struct({ url: FileUrl, attachment: AttachmentSchema }))
      .addError(AttachmentNotFound, { status: 404 })
  )
  .add(
    HttpApiEndpoint.get("query", "/attachments/query")
      .setUrlParams(AttachmentUrlParams)
      .addSuccess(AttachmentPage)
      .addError(InputError, { status: 400 })
  ) {}

export class FarMapApi extends HttpApi.make("api")
  .add(MapAttachmentsApi)
  .add(AuthApi) {}

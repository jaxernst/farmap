import { HttpApi, HttpApiEndpoint, HttpApiGroup, HttpApiMiddleware, HttpApiSecurity } from "@effect/platform"
import { Unauthorized } from "@effect/platform/HttpApiError"
import { Schema } from "effect"
import { FarcasterCredential, SessionExpired, SessionNotFound } from "./Auth.js"
import { FileId, FileNotFound, FileTypeSchema, FileUploadRequestSchema, FileUrl } from "./FileStorage.js"
import { AttachmentId, AttachmentIdFromString, AttachmentSchema, PositionSchema } from "./MapAttachments.js"
import { AttachmentPage, AttachmentUrlParams, AttachmentWithCreator } from "./Query.js"
import { User, UserModel, UserNotFound, UserPreview } from "./Users.js"

export class InputError extends Schema.TaggedError<InputError>()("InputError", {
  message: Schema.String
}) {}

export class AttachmentNotFound extends Schema.TaggedError<AttachmentNotFound>()(
  "AttachmentNotFound",
  {
    id: AttachmentId
  }
) {}

export class Authentication extends HttpApiMiddleware.Tag<Authentication>()(
  "Auth",
  {
    provides: User,
    failure: Unauthorized,
    security: {
      cookie: HttpApiSecurity.apiKey({
        in: "cookie",
        key: "session"
      })
    }
  }
) {}

export class AuthApi extends HttpApiGroup.make("Auth")
  .prefix("/auth")
  .add(
    HttpApiEndpoint.get("getCurrentUser", "/me")
      .addSuccess(UserPreview)
      .addError(Schema.Union(SessionNotFound, SessionExpired))
  )
  .add(
    HttpApiEndpoint.post("signOut", "/signout").addSuccess(Schema.Struct({}))
  )
  .middlewareEndpoints(Authentication)
  // unauthenticated
  .add(HttpApiEndpoint.get("nonce", "/nonce").addSuccess(Schema.String))
  .add(
    HttpApiEndpoint.post("signInWithFarcaster", "/siwf")
      .setPayload(FarcasterCredential)
      .addSuccess(UserPreview)
      .addError(InputError)
  )
{}

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
          fileType: FileTypeSchema
        })
      )
      .addSuccess(Schema.Struct({ id: AttachmentId }))
      .addError(InputError, { status: 400 })
      .addError(FileNotFound, { status: 400 })
  )
  .add(
    HttpApiEndpoint.get("myAttachments", "/attachments/me").addSuccess(
      AttachmentPage
    )
  )
  .add(
    HttpApiEndpoint.del("deleteAttachment", "/attachments/:id")
      .addSuccess(Schema.Struct({ ok: Schema.Boolean }), { status: 201 })
      .setPath(Schema.Struct({ id: AttachmentIdFromString }))
      .addError(AttachmentNotFound, { status: 404 })
      .addError(Unauthorized, { status: 401 })
  )
  .middlewareEndpoints(Authentication)
  // unauthenticated
  .add(
    HttpApiEndpoint.get("getById", "/attachments/:id")
      .addSuccess(Schema.Struct({ attachment: AttachmentSchema, creator: UserPreview }))
      .addError(AttachmentNotFound, { status: 404 })
      .setPath(Schema.Struct({ id: AttachmentIdFromString }))
  )
  .add(
    HttpApiEndpoint.get("getAll", "/attachments/all")
      .addSuccess(Schema.Array(AttachmentWithCreator))
  )
  .add(
    HttpApiEndpoint.get("getSocialPreview", "/attachments/social-preview/:id")
      .setPath(Schema.Struct({ id: AttachmentIdFromString }))
      .addSuccess(Schema.Struct({ url: FileUrl, attachment: AttachmentSchema, creator: UserPreview }))
      .addError(AttachmentNotFound, { status: 404 })
  )
  .add(
    HttpApiEndpoint.get("query", "/attachments/query")
      .setUrlParams(AttachmentUrlParams)
      .addSuccess(AttachmentPage)
      .addError(InputError, { status: 400 })
  )
{}

export class FarMapApi extends HttpApi.make("api")
  .add(MapAttachmentsApi)
  .add(AuthApi)
{}

import { Model, SqlClient, SqlSchema } from "@effect/sql"
import { SessionModel } from "@farmap/domain/Auth"
import type { FileUrl } from "@farmap/domain/FileStorage"
import type { Position } from "@farmap/domain/MapAttachments"
import { AttachmentId, AttachmentSchema, MapAttachmentModel } from "@farmap/domain/MapAttachments"
import { UserId, UserModel } from "@farmap/domain/Users"
import { DateTime, Effect, pipe, Schema } from "effect"
import { InputError } from "../../domain/src/Api.js"

export class AttachmentsRepo extends Effect.Service<AttachmentsRepo>()(
  "repo/MapAttachments",
  {
    effect: Effect.gen(function*() {
      const sql = yield* SqlClient.SqlClient

      const repo = yield* Model.makeRepository(MapAttachmentModel, {
        tableName: "attachments",
        spanPrefix: "MapAttachments",
        idColumn: "id"
      })

      const findByIds = (ids: ReadonlyArray<AttachmentId>) =>
        SqlSchema.findAll({
          Request: Schema.Array(AttachmentId),
          Result: AttachmentSchema,
          execute: (ids) => sql`SELECT * FROM attachments WHERE (${sql.in(ids)})`
        })(ids).pipe(Effect.orDie)

      const findByUserId = (userId: UserId) =>
        SqlSchema.findAll({
          Request: UserId,
          Result: AttachmentSchema,
          execute: (userId) =>
            pipe(
              sql`SELECT * FROM attachments WHERE userId = ${userId}`,
              Effect.andThen((rows) =>
                (rows as unknown as Array<MapAttachmentModel>).map((row) => MapAttachmentModel.toAttachmentSchema(row))
              )
            )
        })(userId).pipe(Effect.orDie)

      const findByLocationSquare = (_location: Position, _distance: number) => new Error("Not Implemented")

      const updatePreviewUrl = (id: AttachmentId, previewUrl: FileUrl) =>
        sql`UPDATE attachments SET previewUrl = ${previewUrl} WHERE id = ${id}`.pipe(
          Effect.orDie
        )

      return {
        ...repo,
        findByIds,
        findByLocationSquare,
        findByUserId,
        updatePreviewUrl
      }
    })
  }
) {}

export class UsersRepo extends Effect.Service<UsersRepo>()("repo/Users", {
  effect: Effect.gen(function*() {
    const sql = yield* SqlClient.SqlClient

    const repo = yield* Model.makeRepository(UserModel, {
      tableName: "users",
      spanPrefix: "Users",
      idColumn: "id"
    })

    const getByFarcasterId = (fid: number) =>
      SqlSchema.findAll({
        Request: Schema.Number,
        Result: UserModel,
        execute: (fid) => sql`SELECT * FROM users WHERE fid = ${fid}`
      })(fid).pipe(Effect.orDie)

    return {
      ...repo,
      getByFarcasterId
    }
  })
}) {}

export class SessionsRepo extends Effect.Service<SessionsRepo>()(
  "repo/Sessions",
  {
    effect: Effect.gen(function*() {
      const sql = yield* SqlClient.SqlClient

      const repo = yield* Model.makeRepository(SessionModel, {
        tableName: "sessions",
        spanPrefix: "Sessions",
        idColumn: "token"
      })

      const deleteByUserId = (userId: UserId) => sql`DELETE FROM sessions WHERE userId = ${userId}`.pipe(Effect.orDie)

      return {
        ...repo,
        deleteByUserId
      }
    })
  }
) {}

export class NoncesRepo extends Effect.Service<NoncesRepo>()("repo/Nonces", {
  effect: Effect.gen(function*() {
    const sql = yield* SqlClient.SqlClient

    const createNonce = (expiresAt: DateTime.DateTime) =>
      Effect.gen(function*() {
        const nonce = Math.random().toString(36).substring(2, 10)
        yield* sql`INSERT INTO nonces (nonce, expiresAt) VALUES (${nonce}, ${expiresAt.epochMillis})`
        return nonce
      }).pipe(Effect.orDie)

    const verifyNonce = (nonce: string) =>
      Effect.gen(function*() {
        const now = yield* DateTime.now
        const result = yield* sql`SELECT * FROM nonces WHERE nonce = ${nonce} AND expiresAt > ${now.epochMillis}`

        if (result.length === 0) {
          return yield* new InputError({ message: "Invalid or expired nonce" })
        }

        // Delete the nonce after verification
        yield* sql`DELETE FROM nonces WHERE nonce = ${nonce}`
        return true
      }).pipe(Effect.catchTag("SqlError", (e) => Effect.die(e)))

    return {
      createNonce,
      verifyNonce
    }
  })
}) {}

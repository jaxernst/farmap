import { SqlClient, SqlSchema } from "@effect/sql"
import { AttachmentWithCreator } from "@farmap/domain/Query"
import { Effect, Schema } from "effect"

export class MapQueryService extends Effect.Service<MapQueryService>()(
  "MapQueryService",
  {
    effect: Effect.gen(function*() {
      const sql = yield* SqlClient.SqlClient

      // Sql result for a attachments join with users
      const SqlResultSchema = Schema.Struct({
        // Attachment fields
        id: Schema.Number,
        latitude: Schema.Number,
        longitude: Schema.Number,
        fileUrl: Schema.String,
        fileType: Schema.String,
        previewUrl: Schema.NullOr(Schema.String),
        userId: Schema.Number,
        // User fields
        user_id: Schema.Number,
        fid: Schema.Number,
        displayName: Schema.NullOr(Schema.String),
        displayImage: Schema.NullOr(Schema.String)
      })

      const getPublicAttachments = () =>
        SqlSchema.findAll({
          Request: Schema.Void,
          Result: Schema.transform(
            SqlResultSchema,
            AttachmentWithCreator,
            {
              strict: false,
              decode: (sqlResult) => ({
                attachment: {
                  id: sqlResult.id,
                  position: { lat: sqlResult.latitude, long: sqlResult.longitude },
                  fileUrl: sqlResult.fileUrl,
                  fileType: sqlResult.fileType,
                  previewUrl: sqlResult.previewUrl ?? undefined,
                  creatorId: sqlResult.userId
                },
                creator: {
                  userId: sqlResult.user_id,
                  fid: sqlResult.fid,
                  displayName: sqlResult.displayName,
                  displayImage: sqlResult.displayImage
                }
              }),
              encode: (_result) => {
                throw new Error("Encoding not implemented")
              }
            }
          ),
          execute: () =>
            sql`
          SELECT
            a.id,
            a.latitude,
            a.longitude,
            a.fileUrl,
            a.fileType,
            a.previewUrl,
            a.userId,
            u.id as user_id,
            u.fid,
            u.displayName,
            u.displayImage
          FROM attachments a
          JOIN users u ON a.userId = u.id
        `
        })().pipe(Effect.orDie)

      return {
        getPublicAttachments
      }
    })
  }
) {}

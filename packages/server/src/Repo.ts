import { DateTime, Effect, Schema } from "effect";
import { Model, SqlClient, SqlSchema } from "@effect/sql";
import {
  AttachmentId,
  MapAttachmentModel,
  Position,
  PositionSchema,
} from "@farmap/domain/MapAttachments";
import { UserId, UserModel } from "@farmap/domain/Users";
import { AttachmentPreviewSchema } from "@farmap/domain/Query";
import { SessionModel } from "@farmap/domain/Auth";

export class AttachmentsRepo extends Effect.Service<AttachmentsRepo>()(
  "repo/MapAttachments",
  {
    effect: Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;

      const repo = yield* Model.makeRepository(MapAttachmentModel, {
        tableName: "attachments",
        spanPrefix: "MapAttachments",
        idColumn: "id",
      });

      const findByIds = (ids: readonly AttachmentId[]) =>
        SqlSchema.findAll({
          Request: Schema.Array(AttachmentId),
          Result: Schema.Struct({
            id: AttachmentId,
            position: PositionSchema,
            userId: UserId,
            timestamp: Schema.Date,
          }),
          execute: (ids) =>
            sql`SELECT (id, latitude, longitude, userId, createdAt) FROM attachments WHERE (${sql.in(ids)})`,
        })(ids).pipe(Effect.orDie);

      const findByUserId = (userId: UserId) =>
        SqlSchema.findAll({
          Request: UserId,
          Result: AttachmentPreviewSchema,
          execute: (userId) =>
            Effect.gen(function* () {
              const rows =
                (yield* sql`SELECT (id, latitude, longitude, userId, createdAt) FROM attachments WHERE userId = ${userId}`) as unknown as MapAttachmentModel[];

              return rows.map((row) =>
                AttachmentPreviewSchema.make({
                  id: row.id,
                  position: { lat: row.latitude, long: row.longitude },
                  userId: row.userId,
                  timestamp: DateTime.toDate(row.createdAt),
                })
              );
            }),
        })(userId).pipe(Effect.orDie);

      const findByLocationSquare = (location: Position, distance: number) =>
        new Error("Not Implemented");

      return {
        ...repo,
        findByIds,
        findByLocationSquare,
        findByUserId,
      };
    }),
  }
) {}

export class UsersRepo extends Effect.Service<UsersRepo>()("repo/Users", {
  effect: Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;

    const repo = yield* Model.makeRepository(UserModel, {
      tableName: "users",
      spanPrefix: "Users",
      idColumn: "id",
    });

    const getByFarcasterId = (fid: number) =>
      SqlSchema.findAll({
        Request: Schema.Number,
        Result: UserModel,
        execute: (fid) => sql`SELECT * FROM users WHERE fid = ${fid}`,
      })(fid).pipe(Effect.orDie);

    return {
      ...repo,
      getByFarcasterId,
    };
  }),
}) {}

export class SessionsRepo extends Effect.Service<SessionsRepo>()(
  "repo/Sessions",
  {
    effect: Effect.gen(function* () {
      const repo = yield* Model.makeRepository(SessionModel, {
        tableName: "sessions",
        spanPrefix: "Sessions",
        idColumn: "token",
      });

      return {
        ...repo,
      };
    }),
  }
) {}

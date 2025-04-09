import { Effect, pipe, Schema } from "effect";
import { Model, SqlClient, SqlSchema } from "@effect/sql";
import {
  AttachmentId,
  MapAttachmentModel,
  Position,
} from "@farmap/domain/MapAttachments";
import { UserId, UserModel } from "@farmap/domain/Users";
import { AttachmentSchema } from "@farmap/domain/MapAttachments";
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
          Result: AttachmentSchema,
          execute: (ids) =>
            sql`SELECT * FROM attachments WHERE (${sql.in(ids)})`,
        })(ids).pipe(Effect.orDie);

      const findByUserId = (userId: UserId) =>
        SqlSchema.findAll({
          Request: UserId,
          Result: AttachmentSchema,
          execute: (userId) =>
            pipe(
              sql`SELECT * FROM attachments WHERE userId = ${userId}`,
              Effect.andThen((rows) =>
                (rows as unknown as MapAttachmentModel[]).map((row) =>
                  MapAttachmentModel.toAttachmentSchema(row)
                )
              )
            ),
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

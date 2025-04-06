import { Effect, Schema } from "effect";
import { Model, SqlClient, SqlSchema } from "@effect/sql";
import {
  AttachmentId,
  MapAttachmentModel,
  Position,
} from "@farmap/domain/MapAttachments";

export class AttachmentsRepo extends Effect.Service<AttachmentsRepo>()(
  "api/MapAttachments",
  {
    effect: Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;

      const repo = yield* Model.makeRepository(MapAttachmentModel, {
        tableName: "attachments",
        spanPrefix: "MapAttachments",
        idColumn: "id",
      });

      const findByIds = (ids: AttachmentId[]) =>
        SqlSchema.findAll({
          Request: Schema.Array(AttachmentId),
          Result: MapAttachmentModel,
          execute: (ids) =>
            sql`SELECT * FROM attachments WHERE (${sql.in(ids)})`,
        })(ids).pipe(Effect.orDie);

      const findByLocationSquare = (location: Position, distance: number) =>
        new Error("Not Implemented");

      return {
        ...repo,
        findByIds,
        findByLocationSquare,
      };
    }),
  }
) {}

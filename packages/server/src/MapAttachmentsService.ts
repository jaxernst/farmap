import {
  Position,
  BlobSchema,
  PositionSchema,
  AttachmentSchema,
} from "@farmap/domain/FarMap";
import { Attachment, AttachmentId, Blob } from "@farmap/domain/FarMap";
import { Effect, pipe, Schema } from "effect";
import { SqliteClient } from "@effect/sql-sqlite-node";
import { dbLive } from "./lib/sqlite-client.js";

export class AttachmentNotFound extends Schema.TaggedError<AttachmentNotFound>()(
  "AttachmentNotFound",
  {
    id: AttachmentId,
  }
) {}

export class MapAttachmentService extends Effect.Service<MapAttachmentService>()(
  "api/MapAttachment",
  {
    effect: Effect.gen(function* () {
      const sql = yield* SqliteClient.SqliteClient;

      const attachToMap = (position: Position, item: Blob) =>
        Effect.gen(function* () {
          const encoded = yield* Schema.encode(BlobSchema)(item);
          const encodedPosition = yield* Schema.encode(PositionSchema)(
            position
          );

          const row = yield* sql`
            INSERT INTO blobs (position, data)
            VALUES (${encodedPosition}, ${encoded})
            RETURNING id;
          `;

          return {
            id: AttachmentId.make(row[0].id as number),
          };
        }).pipe(Effect.catchTag("SqlError", (e) => Effect.die(e)));

      const getAll = () =>
        Effect.gen(function* () {
          const rows = yield* sql`SELECT * from blobs;`;

          return yield* Effect.all(
            rows.map((row) => Schema.decodeUnknown(AttachmentSchema)(row))
          );
        }).pipe(
          Effect.catchTags({
            SqlError: (e) => Effect.die(e),
            ParseError: (e) => Effect.die(e),
          })
        );

      const getById = (id: AttachmentId) =>
        Effect.gen(function* () {
          const row = yield* sql`SELECT * from blobs WHERE id = ${id};`;
          if (row.length === 0) {
            throw new AttachmentNotFound({ id });
          }

          return yield* Schema.decodeUnknown(AttachmentSchema)(row);
        }).pipe(
          Effect.catchTags({
            SqlError: (e) => Effect.die(e),
            ParseError: (e) => Effect.die(e),
          })
        );

      return {
        attachToMap,
        getAll,
        getById,
      };
    }),
    dependencies: [dbLive],
  }
) {}

const test = Effect.gen(function* () {
  const map = yield* MapAttachmentService;

  console.log(
    yield* map.attachToMap(
      { lat: "1", long: "2" },
      { type: "photo", mimeType: "image/png", data: "test" }
    )
  );
}).pipe(Effect.provide(MapAttachmentService.Default));

Effect.runPromise(Effect.scoped(test));

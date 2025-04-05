import { Context, Effect, Layer } from "effect";
import { SqliteClient } from "@effect/sql-sqlite-node";

export const dbLive = SqliteClient.layer({
  filename: "./db/db.dev.sql",
});

const dbInit = Effect.gen(function* () {
  const sql = yield* SqliteClient.SqliteClient;

  yield* sql`
    CREATE TABLE IF NOT EXISTS blobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uid INTEGER NOT NULL,
      position TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
});

export class DatabaseInitialization extends Context.Tag("DbSetup")<
  DatabaseInitialization,
  Effect.Effect.Success<typeof dbInit>
>() {
  static readonly Live = Layer.effect(this, dbInit);
}

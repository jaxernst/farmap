import { Effect } from "effect";
import { Context, Layer } from "effect";
import { SqliteClient } from "@effect/sql-sqlite-node";
import { SqlClient } from "@effect/sql";

const sqliteClient = SqliteClient.layer({
  filename: "./db/db.dev.sql",
});

const sqliteClientTest = SqliteClient.layer({
  filename: "./db/db.test.sql",
});

const sqlInit = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  yield* sql`
    CREATE TABLE IF NOT EXISTS blobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uid INTEGER NOT NULL,
      position TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

  return sql;
});

// prettier-ignore
export class Db extends Context.Tag("InitializedDatabase")<
  Db,
  Effect.Effect.Success<typeof sqlInit>
>() {
  static readonly Live = Layer.effect(SqlClient.SqlClient, sqlInit).pipe(
    Layer.provide(sqliteClient)
  );

  static readonly Test = Layer.effect(SqlClient.SqlClient, sqlInit).pipe(
    Layer.provide(sqliteClientTest)
  );
}

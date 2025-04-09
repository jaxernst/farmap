import { Effect } from "effect";
import { Context, Layer } from "effect";
import { SqliteClient } from "@effect/sql-sqlite-bun";
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
    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      data TEXT NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  yield* sql`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT NOT NULL,
      userId INTEGER NOT NULL,
      expiresAt TIMESTAMP NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  yield* sql`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fid INTEGER NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  console.log("Migrations ran");

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

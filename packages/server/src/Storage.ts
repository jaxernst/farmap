import { Effect, Context, Layer } from "effect";
import { SqliteClient } from "@effect/sql-sqlite-bun";
import { SqlClient } from "@effect/sql";

const sqliteClient = SqliteClient.layer({
  filename: "./db/db.dev.sql",
});

const sqliteClientTest = SqliteClient.layer({
  filename: "./db/db.test.sql",
});

// Create a structured migration effect
const migrations = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  // Create the users table
  yield* sql`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fid INTEGER NOT NULL,
      displayName TEXT,
      displayImage TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(fid)
    )
  `;

  // Create the sessions table
  yield* sql`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      userId INTEGER NOT NULL,
      expiresAt TIMESTAMP NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id)
    )
  `;

  // Create the attachments table
  yield* sql`
    CREATE TABLE IF NOT EXISTS mapAttachment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      fileUrl TEXT NOT NULL,
      fileType TEXT NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id)
    )
  `;

  console.log("Migrations completed successfully");
  return sql;
});

export class Db extends Context.Tag("InitializedDatabase")<
  Db,
  Effect.Effect.Success<typeof migrations>
>() {
  static readonly Live = Layer.effect(Db, migrations).pipe(
    Layer.provide(sqliteClient)
  );

  static readonly Test = Layer.effect(Db, migrations).pipe(
    Layer.provide(sqliteClientTest)
  );
}

import { Context, Layer } from "effect";
import { SqliteClient, SqliteMigrator } from "@effect/sql-sqlite-node";
import { SqlClient } from "@effect/sql";
import { fileURLToPath } from "url";

const sqliteClientLive = SqliteClient.layer({
  filename: "./db/db.dev.sql",
});

const sqliteClientTest = SqliteClient.layer({
  filename: "./db/db.test.sql",
});

const MigratorLive = SqliteMigrator.layer({
  loader: SqliteMigrator.fromFileSystem(
    fileURLToPath(new URL("./migrations", import.meta.url))
  ),
});

// prettier-ignore
export class Db extends Context.Tag("InitializedDatabase")<
  Db,
  SqlClient.SqlClient
>() {
  static readonly SqliteLive = Layer.provideMerge(MigratorLive, sqliteClientLive);
  static readonly Test = Layer.provideMerge(MigratorLive, sqliteClientTest);
}

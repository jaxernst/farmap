import type { SqlClient } from "@effect/sql";
import { SqliteClient, SqliteMigrator } from "@effect/sql-sqlite-node";
import type { Context, Layer } from "effect";

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// Make a db directory if one doesn't exist
const dbDir = path.join(process.cwd(), "db");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

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
  static readonly SqliteLive = Layer.provideMerge(MigratorLive, sqliteClientLive)
  static readonly Test = Layer.provideMerge(MigratorLive, sqliteClientTest)
}

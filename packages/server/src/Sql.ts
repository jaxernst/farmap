import type { SqlClient } from "@effect/sql"
import { SqliteClient, SqliteMigrator } from "@effect/sql-sqlite-node"
import { Context, Layer } from "effect"
import { fileURLToPath } from "url"

const sqliteClientLive = SqliteClient.layer({
  filename: "./db/db.sql"
})

const sqliteClientTest = SqliteClient.layer({
  filename: "./db/db.test.sql"
})

const MigratorLive = SqliteMigrator.layer({
  loader: SqliteMigrator.fromFileSystem(
    fileURLToPath(new URL("./migrations", import.meta.url))
  )
})

export class Db extends Context.Tag("InitializedDatabase")<
  Db,
  SqlClient.SqlClient
>() {
  static readonly SqliteLive = Layer.provideMerge(MigratorLive, sqliteClientLive)
  static readonly Test = Layer.provideMerge(MigratorLive, sqliteClientTest)
}

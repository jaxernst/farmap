import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient

  yield* sql`
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT NOT NULL,
    userId INTEGER NOT NULL,
    expiresAt TIMESTAMP NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`

  yield* Effect.logInfo("00003_create_sessions migration applied")
})

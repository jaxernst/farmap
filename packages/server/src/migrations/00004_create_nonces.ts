import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient

  yield* sql`
  CREATE TABLE IF NOT EXISTS nonces (
    nonce TEXT PRIMARY KEY,
    expiresAt TIMESTAMP NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`

  yield* Effect.logInfo("00004_create_nonces migration applied")
})

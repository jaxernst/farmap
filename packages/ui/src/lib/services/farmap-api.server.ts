import { PUBLIC_API_URL } from "$env/static/public"
import { NodeHttpClient } from "@effect/platform-node"
import { makeFarmapClient } from "./farmap-api"

if (!PUBLIC_API_URL) {
  throw new Error("PUBLIC_API_URL is not set")
}

export const makeServerClient = () => {
  return makeFarmapClient(PUBLIC_API_URL, NodeHttpClient.layer)
}

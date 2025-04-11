import { makeFarmapClient } from "./farmap-api";
import { NodeHttpClient } from "@effect/platform-node";
import { PUBLIC_API_URL } from "$env/static/public";

if (!PUBLIC_API_URL) {
  throw new Error("PUBLIC_API_URL is not set");
}

export const makeServerClient = () => {
  return makeFarmapClient(PUBLIC_API_URL, NodeHttpClient.layer);
};

import { makeFarmapClient } from "./farmap-api";
import { NodeHttpClient } from "@effect/platform-node";
const baseUrl = process.env.NEXT_PUBLIC_FARMAP_API_URL;

if (!baseUrl) {
  throw new Error("NEXT_PUBLIC_FARMAP_API_URL is not set");
}

export const makeServerClient = () => {
  return makeFarmapClient(baseUrl, NodeHttpClient.layer);
};

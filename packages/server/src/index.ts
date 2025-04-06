import { HttpApiBuilder, HttpMiddleware } from "@effect/platform";
import { Layer } from "effect";
import { ApiLive } from "./Api.js";
import { MapAttachmentService } from "./MapAttachmentsService.js";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { createServer } from "http";
import { Db } from "./Storage.js";

// const HttpLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
//   Layer.provide(ApiLive),
//   Layer.provide(TodosRepository.Default),
//   Layer.provide(NodeHttpServer.layer(createServer, { port: 3000 }))
// );

// Layer.launch(HttpLive).pipe(NodeRuntime.runMain);

const ServerLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  Layer.provide(ApiLive),
  Layer.provide(MapAttachmentService.Default),
  Layer.provide(Db.Live),
  Layer.provide(NodeHttpServer.layer(createServer, { port: 3000 }))
);

Layer.launch(ServerLive).pipe(NodeRuntime.runMain);

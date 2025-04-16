import * as dotenv from "dotenv";
dotenv.config();

import { HttpApiBuilder, HttpMiddleware, HttpServer } from "@effect/platform";
import { Layer, Logger, LogLevel } from "effect";
import { ApiLive } from "./api/ApiGroup.js";
import { MapAttachmentService } from "./services/MapAttachmentsService.js";
import { NodeHttpServer, NodeRuntime, NodeSocket } from "@effect/platform-node";
import { Db } from "./Sql.js";
import { AuthMiddlewareLive } from "./AuthMiddleware.js";
import { UserService } from "./services/UserService.js";
import { AuthService } from "./services/AuthService.js";
import { FileStoreService } from "./services/FileStoreService.js";
import { SocialPreviewService } from "./services/SocialPreviewService.js";
import { DevTools } from "@effect/experimental";
import { FarcasterService } from "./services/FarcasterService.js";
import { createServer } from "http";

const DevToolsLive = DevTools.layerWebSocket().pipe(
  Layer.provide(NodeSocket.layerWebSocketConstructor)
);

const ServerLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  Layer.provide(ApiLive),
  Layer.provide(AuthMiddlewareLive),
  Layer.provide(AuthService.Default),
  Layer.provide(UserService.Default),
  Layer.provide(MapAttachmentService.Default),
  Layer.provide(SocialPreviewService.Default),
  Layer.provide(FileStoreService.S3Live),
  Layer.provide(FarcasterService.PinataLive),
  Layer.provide(Db.SqliteLive),
  HttpServer.withLogAddress,
  Layer.provide(NodeHttpServer.layer(createServer, { port: 3001 })),
  Layer.provide(Logger.minimumLogLevel(LogLevel.Debug)),
  Layer.provide(DevToolsLive)
);

Layer.launch(ServerLive).pipe(NodeRuntime.runMain);

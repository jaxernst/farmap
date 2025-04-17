import * as dotenv from "dotenv";

import { DevTools } from "@effect/experimental";
import { HttpApiBuilder, HttpMiddleware, HttpServer } from "@effect/platform";
import { NodeHttpServer, NodeRuntime, NodeSocket } from "@effect/platform-node";
import { Layer, Logger, LogLevel } from "effect";
import { createServer } from "http";
import { ApiLive } from "./api/ApiGroup.js";
import { AuthMiddlewareLive } from "./AuthMiddleware.js";
import { AuthService } from "./services/AuthService.js";
import { FarcasterService } from "./services/FarcasterService.js";
import { FileStoreService } from "./services/FileStoreService.js";
import { MapAttachmentService } from "./services/MapAttachmentsService.js";
import { SocialPreviewService } from "./services/SocialPreviewService.js";
import { UserService } from "./services/UserService.js";
import { Db } from "./Sql.js";

dotenv.config();

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
  Layer.provide(DevToolsLive),
  HttpApiBuilder.middlewareCors({
    allowedOrigins: ["http://localhost:5173", "https://farmap.vercel.app"],
    allowedMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Length"],
    credentials: true,
    maxAge: 86400,
  })
);

Layer.launch(ServerLive).pipe(NodeRuntime.runMain);

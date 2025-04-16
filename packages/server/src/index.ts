import { HttpApiBuilder, HttpMiddleware, HttpServer } from "@effect/platform";
import { Layer, Logger, LogLevel } from "effect";
import { ApiLive } from "./api/ApiGroup.js";
import { MapAttachmentService } from "./services/MapAttachmentsService.js";
import { BunHttpServer, BunRuntime, BunSocket } from "@effect/platform-bun";
import { Db } from "./Sql.js";
import { AuthMiddlewareLive } from "./AuthMiddleware.js";
import { UserService } from "./services/UserService.js";
import { AuthService } from "./services/AuthService.js";
import { S3FileStoreServiceLive } from "./services/S3FileStoreService.js";
import { SocialPreviewService } from "./services/SocialPreviewService.js";
import { DevTools } from "@effect/experimental";
import { FarcasterServiceLive } from "./services/PinataFarcasterService.js";

const DevToolsLive = DevTools.layerWebSocket().pipe(
  Layer.provide(BunSocket.layerWebSocketConstructor)
);

const ServerLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  Layer.provide(ApiLive),
  Layer.provide(AuthMiddlewareLive),
  Layer.provide(AuthService.Default),
  Layer.provide(UserService.Default),
  Layer.provide(MapAttachmentService.Default),
  Layer.provide(SocialPreviewService.Default),
  Layer.provide(S3FileStoreServiceLive),
  Layer.provide(FarcasterServiceLive),
  Layer.provide(Db.Live),
  HttpServer.withLogAddress,
  Layer.provide(BunHttpServer.layer({ port: 3001 })),
  Layer.provide(Logger.minimumLogLevel(LogLevel.Debug)),
  Layer.provide(DevToolsLive)
);

Layer.launch(ServerLive).pipe(BunRuntime.runMain);

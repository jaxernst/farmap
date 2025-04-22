import * as dotenv from "dotenv"

import { DevTools } from "@effect/experimental"
import { HttpApiBuilder, HttpMiddleware, HttpServer } from "@effect/platform"
import { NodeHttpServer, NodeRuntime, NodeSocket } from "@effect/platform-node"
import { Layer } from "effect"
import { createServer } from "http"
import { ApiLive } from "./api/ApiGroup.js"
import { AuthMiddlewareLive } from "./AuthMiddleware.js"
import { AuthService } from "./services/AuthService.js"
import { FarcasterService } from "./services/FarcasterService.js"
import { FileStoreService } from "./services/FileStoreService.js"
import { MapAttachmentService } from "./services/MapAttachmentsService.js"
import { MapQueryService } from "./services/MapQueryService.js"
import { SocialPreviewService } from "./services/SocialPreviewService.js"
import { UserService } from "./services/UserService.js"
import { Db } from "./Sql.js"

dotenv.config()

const DevToolsLive = DevTools.layerWebSocket().pipe(
  Layer.provide(NodeSocket.layerWebSocketConstructor)
)

const corsMiddleware = HttpApiBuilder.middlewareCors()

const ServerLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  // App Api
  Layer.provide(corsMiddleware),
  Layer.provide(ApiLive),
  Layer.provide(AuthMiddlewareLive),
  // Api services
  Layer.provide(AuthService.Default),
  Layer.provide(UserService.Default),
  Layer.provide(MapAttachmentService.Default),
  Layer.provide(MapQueryService.Default),
  Layer.provide(SocialPreviewService.Default),
  Layer.provide(FileStoreService.S3Live),
  Layer.provide(FarcasterService.PinataLive),
  Layer.provide(Db.SqliteLive),
  // App server
  HttpServer.withLogAddress,
  Layer.provide(NodeHttpServer.layer(createServer, { port: 3001 })),
  Layer.provide(DevToolsLive)
)

Layer.launch(ServerLive).pipe(NodeRuntime.runMain)

import { HttpApiBuilder, HttpMiddleware } from "@effect/platform";
import { Effect, Layer } from "effect";
import { ApiLive } from "./api/ApiGroup.js";
import { MapAttachmentService } from "./services/MapAttachmentsService.js";
import { BunHttpServer, BunRuntime } from "@effect/platform-bun";
import { Db } from "./Storage.js";
import { AuthMiddlewareLive } from "./AuthMiddleware.js";
import { UserService } from "./services/UserService.js";
import { AuthService } from "./services/AuthService.js";
import { S3FileStoreService } from "./services/S3FileStoreService.js";

const ServerLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  Layer.provide(ApiLive),
  Layer.provide(AuthMiddlewareLive),
  Layer.provide(AuthService.Default),
  Layer.provide(UserService.Default),
  Layer.provide(MapAttachmentService.Default),
  Layer.provide(S3FileStoreService.Default),
  Layer.provide(Db.Live),
  Layer.provide(BunHttpServer.layer({ port: 3001 }))
);

Layer.launch(ServerLive).pipe(
  Effect.tap(() => console.log("Server started on port 3001")),
  BunRuntime.runMain
);

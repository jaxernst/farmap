import { HttpApiBuilder, HttpMiddleware } from "@effect/platform";
import { Effect, Layer } from "effect";
import { ApiLive } from "./ApiLive.js";
import { MapAttachmentService } from "./MapAttachmentsService.js";
import { BunHttpServer, BunRuntime } from "@effect/platform-bun";
import { Db } from "./Storage.js";
import { AuthLive, AuthService } from "./AuthService.js";
import { UserService } from "./UserService.js";

const ServerLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  Layer.provide(ApiLive),
  Layer.provide(AuthLive),
  Layer.provide(AuthService.Default),
  Layer.provide(UserService.Default),
  Layer.provide(MapAttachmentService.Default),
  Layer.provide(Db.Live),
  Layer.provide(BunHttpServer.layer({ port: 3001 }))
);

Layer.launch(ServerLive).pipe(
  Effect.tap(() => console.log("Server started on port 3001")),
  BunRuntime.runMain
);

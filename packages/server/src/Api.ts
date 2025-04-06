import { HttpApiBuilder } from "@effect/platform";
import { Effect, Layer } from "effect";
import { MapAttachmentService } from "./MapAttachmentsService.js";
import { FarMapApi } from "@farmap/domain/Api";

// const TodosApiLive = HttpApiBuilder.group(TodosApi, "todos", (handlers) =>
//   Effect.gen(function* () {
//     const todos = yield* TodosRepository;
//     return handlers
//       .handle("getAllTodos", () => todos.getAll)
//       .handle("getTodoById", ({ path: { id } }) => todos.getById(id))
//       .handle("createTodo", ({ payload: { text } }) => todos.create(text))
//       .handle("completeTodo", ({ path: { id } }) => todos.complete(id))
//       .handle("removeTodo", ({ path: { id } }) => todos.remove(id));
//   })
// );

const MapAttachmentsApiLive = HttpApiBuilder.group(
  FarMapApi,
  "MapAttachments",
  (handlers) =>
    Effect.gen(function* () {
      const map = yield* MapAttachmentService;

      return handlers
        .handle("attachPhoto", ({ payload: { position, data } }) =>
          map.attachToMap(position, {
            tag: "photo",
            mimeType: "image/png",
            data,
          })
        )
        .handle("getById", ({ path: { id } }) => map.getById(id));
    })
);

export const ApiLive = HttpApiBuilder.api(FarMapApi).pipe(
  Layer.provide(MapAttachmentsApiLive)
);

import { HttpApiBuilder } from "@effect/platform";
import { TodosApi } from "@farmap/domain/TodosApi";
import { Effect, Layer } from "effect";
import { TodosRepository } from "./TodosRepository.js";
import { FarMapApi, InputError } from "@farmap/domain/FarMap";
import { MapAttachmentService } from "./MapAttachmentsService.js";

const TodosApiLive = HttpApiBuilder.group(TodosApi, "todos", (handlers) =>
  Effect.gen(function* () {
    const todos = yield* TodosRepository;
    return handlers
      .handle("getAllTodos", () => todos.getAll)
      .handle("getTodoById", ({ path: { id } }) => todos.getById(id))
      .handle("createTodo", ({ payload: { text } }) => todos.create(text))
      .handle("completeTodo", ({ path: { id } }) => todos.complete(id))
      .handle("removeTodo", ({ path: { id } }) => todos.remove(id));
  })
);

const MapAttachmentsApiLive = HttpApiBuilder.group(
  FarMapApi,
  "MapAttachments",
  (handlers) =>
    Effect.gen(function* () {
      const map = yield* MapAttachmentService;

      return handlers
        .handle("attachPhoto", ({ payload: { position, data } }) =>
          map
            .attachToMap(position, {
              type: "photo",
              mimeType: "image/png",
              data,
            })
            .pipe(
              Effect.catchTag("ParseError", (_parseError) =>
                InputError.make({ message: "Invalid payload" })
              )
            )
        )
        .handle("getAll", () => map.getAll())
        .handle("getById", ({ path: { id } }) => map.getById(id));
    })
);

export const ApiLive = HttpApiBuilder.api(TodosApi).pipe(
  Layer.provide(MapAttachmentsApiLive)
);

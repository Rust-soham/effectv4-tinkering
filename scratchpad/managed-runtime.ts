import { Effect, Layer, Ref, Schema, Context } from "effect";
import { Hono } from "hono";

class Todo extends Schema.Class<Todo>("Todo")({
  id: Schema.Number,
  title: Schema.String,
  completed: Schema.Boolean,
}) {}

class CreateTodoPayload extends Schema.Class<CreateTodoPayload>(
  "CreateTodoPayload",
)({
  title: Schema.String,
}) {}

class TodoNotFound extends Schema.TaggedErrorClass<TodoNotFound>()(
  "TodoNotFound",
  {
    id: Schema.Number,
  },
) {}

export class TodoRepo extends Context.Service<
  TodoRepo,
  {
    readonly getAll: Effect.Effect<ReadonlyArray<Todo>>;
    getById(id: number): Effect.Effect<Todo, TodoNotFound>;
    create(payload: CreateTodoPayload): Effect.Effect<Todo>;
  }
>()("app/TodoRepo") {
  static readonly layer = Layer.effect(
    TodoRepo,
    Effect.gen(function* () {
      const store = new Map<number, Todo>();
      const nextId = yield* Ref.make(1);

      const getAll = Effect.gen(function* () {
        return Array.from(store.values());
      }).pipe(Effect.withSpan("TodoRepo.getAll"));

      const getById = Effect.fn("TodoRepo.getById")(function* (id: number) {
        const todo = store.get(id);

        if (todo === undefined) {
          return yield* new TodoNotFound({ id });
        }
        return todo;
      });

      const create = Effect.fn("TodoRepo.create")(function* (
        payload: CreateTodoPayload,
      ) {
        const id = yield* Ref.getAndUpdate(nextId, (current) => current + 1);
        const todo = new Todo({ id, title: payload.title, completed: false });

        store.set(id, todo);

        return todo;
      });

      return TodoRepo.of({ getAll, getById, create });
    }),
  );
}

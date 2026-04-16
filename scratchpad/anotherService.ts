import { Effect, Layer, Context } from "effect";

class Database extends Context.Service<
  Database,
  {
    readonly query: (sql: string) => Effect.Effect<string>;
  }
>()("Database") {}

class Logger extends Context.Service<
  Logger,
  {
    readonly log: (msg: string) => Effect.Effect<void>;
  }
>()("Logger") {}

const dbLayer = Layer.succeed(Database)({
  query: Effect.fn("Database.query")((sql: string) => Effect.succeed("result")),
});
const loggerLayer = Layer.succeed(Logger)({
  log: Effect.fn("Logger.log")((msg: string) =>
    Effect.sync(() => console.log(msg)),
  ),
});

const mergedLayer = Layer.merge(loggerLayer, dbLayer);

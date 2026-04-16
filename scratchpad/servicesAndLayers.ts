import { Effect, Context, Layer } from "effect";
// Define service interface separately to avoid namespace confusion
interface LoggerService {
  readonly log: (msg: string) => Effect.Effect<void>;
}
interface DatabaseService {
  readonly query: (sql: string) => Effect.Effect<string>;
}
interface ConfigService {
  readonly port: number;
}

// Define services using the interface
class Logger extends Context.Service<Logger, LoggerService>()("Logger") {}
class Database extends Context.Service<Database, DatabaseService>()(
  "Database",
) {}
class Config extends Context.Service<Config, ConfigService>()("Config") {}

// Create layers
const ConfigLayer = Layer.succeed(Config, { port: 8080 });
const LoggerLayer = Layer.sync(Logger, () => ({
  log: (msg: string) => Effect.sync(() => console.log(`[LOG] ${msg}`)),
}));
// DatabaseLayer needs Config - use Layer.provide to inject it
const DatabaseLayerWithOutDeps = Layer.effect(
  Database,
  Effect.gen(function* () {
    const config = yield* Effect.service(Config);
    return {
      query: (sql: string) =>
        Effect.gen(function* () {
          yield* Effect.log(`Executing: ${sql}`);
          return `[DB:${config.port}] ${sql}`;
        }),
    };
  }),
);

const DatabaseLayer = DatabaseLayerWithOutDeps.pipe(Layer.provide(ConfigLayer));

// Merge all layers
const AppLayer = LoggerLayer.pipe(Layer.provideMerge(DatabaseLayer));

// Program
const program = Effect.gen(function* () {
  const logger = yield* Effect.service(Logger);
  const db = yield* Effect.service(Database);

  yield* logger.log("Starting...");
  const result = yield* db.query("SELECT * FROM users");

  return result;
});

// Run
Effect.runPromise(program.pipe(Effect.provide(AppLayer)))
  .then(console.log)
  .catch(console.error);

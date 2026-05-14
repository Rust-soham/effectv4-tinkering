import { Context, Effect, Layer, LayerMap, Schema } from "effect";

class DatabaseQueryError extends Schema.TaggedErrorClass<DatabaseQueryError>()(
  "DatabaseQueryError",
  {
    tenantId: Schema.String,
    cause: Schema.Defect,
  },
) {}

type UserRecord = {
  readonly id: number;
  readonly email: string;
};

let nextConnectionId = 0;

export class DatabasePool extends Context.Service<
  DatabasePool,
  {
    readonly tenantId: string;
    readonly connectionId: number;
    readonly query: (
      sql: string,
    ) => Effect.Effect<ReadonlyArray<UserRecord>, DatabaseQueryError>;
  }
>()("app/DatabasePool") {
  static readonly layer = (tenantId: string) =>
    Layer.effect(
      DatabasePool,
      Effect.acquireRelease(
        Effect.sync(() => {
          const connectionId = ++nextConnectionId;

          return DatabasePool.of({
            tenantId,
            connectionId,
            query: Effect.fn("DatabasePool.query")((_sql: string) =>
              Effect.succeed([
                { id: 1, email: `admin@${tenantId}.example.com` },
                { id: 2, email: `ops@${tenantId}.example.com` },
              ]),
            ),
          });
        }),
        (pool) =>
          Effect.logInfo(
            `Closing tenant pool ${pool.tenantId}#${pool.connectionId}`,
          ),
      ),
    );
}

export class PoolMap extends LayerMap.Service<PoolMap>()("app/PoolMap", {
  lookup: (tenantId: string) => DatabasePool.layer(tenantId),
  idleTimeToLive: "1 minute",
}) {}

const queryUsersForCurrentTenant = Effect.gen(function* () {
  const pool = yield* DatabasePool;

  return yield* pool.query("SELECT id, email FROM users ORDER BY id");
});

export const program = Effect.gen(function* () {
  yield* queryUsersForCurrentTenant.pipe(Effect.provide(PoolMap.get("me")));

  yield* PoolMap.invalidate("acme");
}).pipe(Effect.provide(PoolMap.layer));

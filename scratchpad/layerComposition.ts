import { PgClient } from "@effect/sql-pg";
import {
  Array,
  Config,
  Context,
  Effect,
  Layer,
  type Option,
  Schema,
} from "effect";
import { SqlClient, SqlError } from "effect/unstable/sql";

export const SqlClientLayer: Layer.Layer<
  PgClient.PgClient | SqlClient.SqlClient,
  Config.ConfigError | SqlError.SqlError
> = PgClient.layerConfig({
  url: Config.redacted("DATABASE_URL"),
});

export class UserRepositoryError extends Schema.TaggedErrorClass<UserRepositoryError>()(
  "UserRepositoryError",
  {
    reason: SqlError.SqlError,
  },
) {}

export class UserRepository extends Context.Service<
  UserRepository,
  {
    findById(
      id: string,
    ): Effect.Effect<
      Option.Option<{ readonly id: string; readonly name: string }>,
      UserRepositoryError
    >;
  }
>()("myapp/UserRepository") {
  static readonly layerNoDeps: Layer.Layer<
    UserRepository,
    never,
    SqlClient.SqlClient
  > = Layer.effect(
    UserRepository,
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;

      const findById = Effect.fn("UserRepository.findById")(
        function* (id: string) {
          const results = yield* sql<{
            readonly id: string;
            readonly name: string;
          }>`SELECT * FROM users WHERE id = '${id}'`;

          return Array.head(results);
        },
        Effect.mapError((reason) => new UserRepositoryError({ reason })),
      );

      return UserRepository.of({ findById });
    }),
  );

  static readonly layer = this.layerNoDeps.pipe(Layer.provide(SqlClientLayer));

  static readonly layerWithSqlClient = this.layerNoDeps.pipe(
    Layer.provideMerge(SqlClientLayer),
  );
}

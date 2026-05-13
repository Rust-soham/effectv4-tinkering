import { Context, Effect, Layer, Ref } from "effect";
import { User, userId } from "../domain/User.ts";
import {
  SearchQueryTooShort,
  UserNotFound,
  UsersError,
} from "../domain/UserErrors.ts";

export class Users extends Context.Service<
  Users,
  {
    list(search: string | undefined): Effect.Effect<Array<User>, UsersError>;
    getById(id: userId): Effect.Effect<User, UsersError>;
    create(input: {
      readonly name: string;
      readonly email: string;
    }): Effect.Effect<User, UsersError>;
  }
>()("acme/Users") {
  static readonly layer = Layer.effect(
    Users,
    Effect.gen(function* () {
      const users = new Map<number, User>([
        [
          1,
          new User({
            id: userId.make(1),
            name: "Admin",
            email: "admin@acme.dev",
          }),
        ],
      ]);

      const nextId = yield* Ref.make(2);

      const list = Effect.fn("UsersRepo.list")(function* (
        search: string | undefined,
      ) {
        const allUsers = Array.from(users.values());

        // early returns
        if (search === undefined || search.length === 0) {
          return allUsers;
        } else if (search.length < SearchQueryTooShort.minimumLength) {
          return yield* new UsersError({
            reason: new SearchQueryTooShort(),
          });
        }

        yield* Effect.annotateCurrentSpan({ search });

        const normalized = search.toLowerCase();

        return allUsers.filter(
          (user) =>
            user.name.toLowerCase().includes(normalized) ||
            user.email.toLowerCase().includes(normalized),
        );
      });

      const getById = Effect.fn("UsersRepo.getById")(function* (id: userId) {
        yield* Effect.annotateCurrentSpan({ id });

        const user = users.get(id);

        if (user === undefined) {
          return yield* new UsersError({
            reason: new UserNotFound(),
          });
        }

        return user;
      });

      const create = Effect.fn("UsersRepo.create")(function* (input: {
        readonly name: string;
        readonly email: string;
      }) {
        const id = yield* Ref.getAndUpdate(nextId, (current) => current + 1);
        const user = new User({
          id: userId.make(id),
          ...input,
        });

        users.set(user.id, user);

        return user;
      });

      return Users.of({ list, getById, create });
    }),
  );
}

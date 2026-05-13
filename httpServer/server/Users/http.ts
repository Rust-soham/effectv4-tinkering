import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi";
import { Api } from "../../api/Api";
import { Effect, Layer } from "effect";
import { Users } from "../Users";
import { CurrentUser } from "../../api/Authorization";
import { AuthorizationLayer } from "../Authorization";

export const UsersApiHandlers = HttpApiBuilder.group(
  Api,
  "users",
  Effect.fn(function* (handlers) {
    const users = yield* Users;

    return handlers
      .handle("list", ({ query }) =>
        users.list(query.search).pipe(Effect.orDie),
      )
      .handle(
        "search",
        Effect.fn(function* ({ payload }) {
          if (payload.search === "bad-request") {
            return yield* new HttpApiError.RequestTimeout();
          }
          return yield* users
            .list(payload.search)
            .pipe(
              Effect.catchReason(
                "UsersError",
                "SearchQueryTooShort",
                Effect.fail,
                Effect.die,
              ),
            );
        }),
      )
      .handle("getById", ({ params }) =>
        users.getById(params.id).pipe(
          Effect.catchReasons(
            "UsersError",
            {
              UserNotFound: (e) => Effect.fail(e),
            },
            Effect.die,
          ),
        ),
      )
      .handle("create", ({ payload }) =>
        users.create(payload).pipe(Effect.orDie),
      )
      .handle("me", () => Effect.service(CurrentUser));
  }),
).pipe(Layer.provide([Users.layer, AuthorizationLayer]));

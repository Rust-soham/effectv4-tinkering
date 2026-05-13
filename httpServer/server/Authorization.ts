import { Effect, Layer, Redacted } from "effect";
import { Authorization, CurrentUser, UnAuthorized } from "../api/Authorization";
import { User, userId } from "../domain/User";

export const AuthorizationLayer = Layer.effect(
  Authorization,
  Effect.gen(function* () {
    yield* Effect.logInfo("Starting Authorization middleware");

    return Authorization.of({
      bearer: Effect.fn(function* (httpEffect, { credential }) {
        const token = Redacted.value(credential);

        if (token !== "dev-token") {
          return yield* new UnAuthorized({
            message: "Missing or invalid bearer token",
          });
        }

        return yield* Effect.provideService(
          httpEffect,
          CurrentUser,
          new User({
            id: userId.make(1),
            name: "Dev User",
            email: "dev@acme.com",
          }),
        );
      }),
    });
  }),
);

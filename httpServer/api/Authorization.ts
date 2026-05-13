import { Context, Schema } from "effect";
import { User } from "../domain/User";
import { HttpApiMiddleware, HttpApiSecurity } from "effect/unstable/httpapi";

export class CurrentUser extends Context.Service<CurrentUser, User>()(
  "acme/HttpApi/Authorization/CurrentUser",
) {}

export class UnAuthorized extends Schema.TaggedErrorClass<UnAuthorized>()(
  "UnAuthorized",
  {
    message: Schema.String,
  },
  { httpApiStatus: 401 },
) {}

export class Authorization extends HttpApiMiddleware.Service<
  Authorization,
  {
    provides: CurrentUser;
    requires: never;
  }
>()("something", {
  requiredForClient: true,

  security: {
    bearer: HttpApiSecurity.bearer,
  },

  error: UnAuthorized,
}) {}

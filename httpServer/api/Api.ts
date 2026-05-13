import { HttpApi, OpenApi } from "effect/unstable/httpapi";
import { UsersApiGroup } from "./Users";
import { SystemApi } from "./System";

export class Api extends HttpApi.make("users-api")
  .add(UsersApiGroup)
  .add(SystemApi)
  .annotateMerge(
    OpenApi.annotations({
      title: "Acme User API",
    }),
  ) {}

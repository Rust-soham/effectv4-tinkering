import { Schema } from "effect";
import {
  HttpApiEndpoint,
  HttpApiError,
  HttpApiGroup,
  HttpApiSchema,
  OpenApi,
} from "effect/unstable/httpapi";
import { User, userId } from "../domain/User";
import { SearchQueryTooShort, UserNotFound } from "../domain/UserErrors";
import { Authorization } from "./Authorization";

export class UsersApiGroup extends HttpApiGroup.make("users")
  .add(
    HttpApiEndpoint.get("list", "/", {
      query: {
        search: Schema.optional(Schema.String),
      },
      success: Schema.Array(User),
    }),
    HttpApiEndpoint.get("search", "/search", {
      payload: {
        search: Schema.String,
      },
      success: [
        Schema.Array(User),
        Schema.String.pipe(
          HttpApiSchema.asText({
            contentType: "text/csv",
          }),
        ),
      ],
      error: [
        SearchQueryTooShort.pipe(
          HttpApiSchema.asNoContent({
            decode: () => new SearchQueryTooShort(),
          }),
        ),
        HttpApiError.RequestTimeoutNoContent,
      ],
    }),
    HttpApiEndpoint.get("getById", "/:id", {
      params: {
        id: Schema.FiniteFromString.pipe(Schema.decodeTo(userId)),
      },
      success: User,
      error: UserNotFound.pipe(
        HttpApiSchema.asNoContent({
          decode: () => new UserNotFound(),
        }),
      ),
    }),
    HttpApiEndpoint.post("create", "/", {
      payload: Schema.Struct({
        name: Schema.String,
        email: Schema.String,
      }),
      success: User,
    }),
    HttpApiEndpoint.get("me", "/me", {
      success: User,
      error: UserNotFound.pipe(HttpApiSchema.status(404)),
    }),
  )
  .middleware(Authorization)
  .prefix("/users")
  .annotateMerge(
    OpenApi.annotations({
      title: "Users",
      description: "User management endpoints",
    }),
  ) {}

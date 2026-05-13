import { Schema } from "effect";

export class UserNotFound extends Schema.TaggedErrorClass<UserNotFound>()(
  "UserNotFound",
  {},
  { httpApiStatus: 404 },
) {}

export class SearchQueryTooShort extends Schema.TaggedErrorClass<SearchQueryTooShort>()(
  "SearchQueryTooShort",
  {},
  { httpApiStatus: 422 },
) {
  static readonly minimumLength = 2;
}

export class UsersError extends Schema.TaggedErrorClass<UsersError>()(
  "UsersError",
  {
    reason: Schema.Union([UserNotFound, SearchQueryTooShort]),
  },
) {}

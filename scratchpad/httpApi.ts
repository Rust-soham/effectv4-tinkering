import { Schema } from "effect";
import { HttpApiEndpoint } from "effect/unstable/httpapi";

const User = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
});

HttpApiEndpoint.patch("updateUser", "/user/:id", {
  params: {
    id: Schema.String,
  },
  query: {
    mode: Schema.Literals(["merge", "replace"]),
  },

  // optional headers
  headers: {
    "x-api-key": Schema.String,
    "x-request-id": Schema.String,
  },
  // The request payload can be a single schema or an array of schemas.
  // - Default encoding is JSON.
  // - Default status for success is 200.
  // For GET requests, the payload must be a record of schemas.
  payload: [
    // JSON payload (default encoding).
    Schema.Struct({
      name: Schema.String,
    }),
    // text/plain payload.
    Schema.String.pipe(HttpApiSchema.asText()),
  ],
});

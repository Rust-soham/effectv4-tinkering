import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { Effect, Layer, Schema } from "effect";
import { HttpRouter } from "effect/unstable/http";
import {
  HttpApi,
  HttpApiBuilder,
  HttpApiEndpoint,
  HttpApiGroup,
  HttpApiScalar,
} from "effect/unstable/httpapi";
import { createServer } from "node:http";

// Definition
const Api = HttpApi.make("MyApi").add(
  // Define the API group
  HttpApiGroup.make("Greetings").add(
    // Define the endpoint
    HttpApiEndpoint.get("hello", "/", {
      // Define the success schema
      success: Schema.String,
    }),
  ),
);

// Implementation
const GroupLive = HttpApiBuilder.group(
  Api,
  "Greetings", // The name of the group to handle
  (handlers) =>
    handlers.handle(
      "hello", // The name of the endpoint to handle
      () => Effect.succeed("Hello, World!"), // The handler function
    ),
);

// Server
const ApiLive = HttpApiBuilder.layer(Api).pipe(
  Layer.provide(GroupLive),
  Layer.provide(HttpApiScalar.layer(Api)),
  HttpRouter.serve,
  Layer.provide(NodeHttpServer.layer(createServer, { port: 3000 })),
);

// Launch
Layer.launch(ApiLive).pipe(NodeRuntime.runMain);

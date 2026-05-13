import { Context, Effect, flow, Layer, Schedule } from "effect";
import {
  HttpApiBuilder,
  HttpApiClient,
  HttpApiMiddleware,
  HttpApiScalar,
} from "effect/unstable/httpapi";
import { Api } from "./api/Api";
import { UsersApiHandlers } from "./server/Users/http";
import {
  FetchHttpClient,
  HttpClient,
  HttpClientRequest,
  HttpRouter,
  HttpServer,
} from "effect/unstable/http";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { createServer } from "node:http";
import { Authorization } from "./api/Authorization";

const systemApiHandlers = HttpApiBuilder.group(
  Api,
  "system",
  Effect.fn(function* (handlers) {
    return handlers.handle("health", () => Effect.void);
  }),
);

const ApiRoutes = HttpApiBuilder.layer(Api, {
  openapiPath: "/openapi.json",
}).pipe(Layer.provide([systemApiHandlers, UsersApiHandlers]));

const docsRoute = HttpApiScalar.layer(Api, { path: "/docs" });

const AllRoutes = Layer.mergeAll(ApiRoutes, docsRoute);

export const HttpServerLayer = HttpRouter.serve(AllRoutes).pipe(
  Layer.provide(NodeHttpServer.layer(createServer, { port: 3000 })),
);

// run the server baby
Layer.launch(HttpServerLayer).pipe(NodeRuntime.runMain);

// or create a web handler, which serves in a serverless env
export const { handler, dispose } = HttpRouter.toWebHandler(
  AllRoutes.pipe(Layer.provide(HttpServer.layerServices)),
);

// -----------------
// Client side setup
// -----------------

export const AuthorizationClient = HttpApiMiddleware.layerClient(
  Authorization,
  Effect.fn(function* ({ next, request }) {
    return yield* next(HttpClientRequest.bearerToken(request, "dev-token"));
  }),
);

export class ApiClient extends Context.Service<
  ApiClient,
  HttpApiClient.ForApi<typeof Api>
>()("acme/ApiClient") {
  static readonly layer = Layer.effect(
    ApiClient,
    HttpApiClient.make(Api, {
      transformClient: (client) =>
        client.pipe(
          HttpClient.mapRequest(
            flow(HttpClientRequest.prependUrl("http://localhost:3000")),
          ),
          HttpClient.retryTransient({
            schedule: Schedule.exponential(100),
            times: 3,
          }),
        ),
    }),
  ).pipe(
    Layer.provide(AuthorizationClient),
    Layer.provide(FetchHttpClient.layer),
  );
}

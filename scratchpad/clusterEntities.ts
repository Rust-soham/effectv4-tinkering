import { NodeClusterSocket, NodeRuntime } from "@effect/platform-node";
import { Effect, Layer, Ref, Schema } from "effect";
import { ClusterSchema, Entity, TestRunner } from "effect/unstable/cluster";
import { Rpc } from "effect/unstable/rpc";
import type { SqlClient } from "effect/unstable/sql";

export const Increment = Rpc.make("Increment", {
  payload: { amount: Schema.Number },
  success: Schema.Number,
});

export const GetCount = Rpc.make("GetCount", {
  success: Schema.Number,
}).annotate(ClusterSchema.Persisted, true);

export const Counter = Entity.make("Counter", [Increment, GetCount]);

export const CounterEntityLayer = Counter.toLayer(
  Effect.gen(function* () {
    const count = yield* Ref.make(0);

    return Counter.of({
      Increment: ({ payload }) =>
        Ref.updateAndGet(count, (current) => current + payload.amount),
      GetCount: () => Ref.get(count).pipe(Rpc.fork),
    });
  }),
  {
    maxIdleTime: "5 minutes",
  },
);

export const useCounter = Effect.gen(function* () {
  const clientFor = yield* Counter.client;
  const counter = clientFor("counter-123");

  const afterIncrement = yield* counter.Increment({ amount: 1 });
  const currentCount = yield* counter.GetCount();

  console.log(
    `Count after increment: ${afterIncrement}, current count: ${currentCount}`,
  );
});

declare const SqlClientLayer: Layer.Layer<SqlClient.SqlClient>;

const ClusterLayer = NodeClusterSocket.layer().pipe(
  Layer.provide(SqlClientLayer),
);

const ClusterLayerTest = TestRunner.layer;

const EntitiesLayer = Layer.mergeAll(CounterEntityLayer);

const productionLayer = EntitiesLayer.pipe(Layer.provide(ClusterLayer));

export const TestLayer = EntitiesLayer.pipe(
  Layer.provideMerge(ClusterLayerTest),
);

Layer.launch(productionLayer).pipe(NodeRuntime.runMain);

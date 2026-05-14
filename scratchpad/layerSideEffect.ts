import { Effect, Layer } from "effect";
import { NodeRuntime } from "@effect/platform-node";

const backgroundTask = Layer.effectDiscard(
  Effect.gen(function* () {
    yield* Effect.logInfo("Starting background task....");

    yield* Effect.gen(function* () {
      while (true) {
        yield* Effect.sleep("5 seconds");
        yield* Effect.logInfo("Background task running...");
      }
    }).pipe(
      Effect.onInterrupt(() =>
        Effect.logInfo("Background task interrupted: layer scope closed"),
      ),
      Effect.forkScoped,
    );
  }),
);

backgroundTask.pipe(Layer.launch, NodeRuntime.runMain);

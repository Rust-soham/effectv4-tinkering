import { NodeStream } from "@effect/platform-node";
import { Array, Effect, Queue, Schedule, Schema, Stream, Option } from "effect";
import { Readable } from "node:stream";

const _ = NodeStream.fromReadable({
  evaluate: () => Readable.from([1, 2, 3, 4, 5]),
});

export const numbers = Stream.fromIterable<number>([1, 2, 3, 4, 5]);

export const samples = Stream.fromEffectSchedule(
  Effect.succeed(3),
  Schedule.spaced("2 seconds"),
).pipe(Stream.take(3));

export const fetchJobsPage = Stream.paginate(
  0,
  Effect.fn(function* (page) {
    // simulate n/w latency
    yield* Effect.sleep("50 millis");

    const results = Array.range(0, 100).map((i) => `Job ${i + 1 + page * 100}`);

    // only returns 10 pages of results
    const nextPage = page <= 10 ? Option.some(page + 1) : Option.none();

    return [results, nextPage] as const;
  }),
);

class LetterError extends Schema.TaggedErrorClass<LetterError>()(
  "LetterError",
  {
    cause: Schema.Defect,
  },
) {}

async function* asyncIterable() {
  yield* "a";
  yield* "b";
  yield* "c";
}

export const letters = Stream.fromAsyncIterable(
  asyncIterable(),
  (cause) => new LetterError({ cause }),
);

const button = document.getElementById("my-button")!;

export const events = Stream.fromEventListener<PointerEvent>(button, "click");

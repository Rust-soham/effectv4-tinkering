import { assert, describe, it } from "@effect/vitest";
import { Effect, Fiber, Schema } from "effect";
import { TestClock } from "effect/testing";

const stringSchema: Schema.Schema<string> = Schema.String;

describe("@effect/vitest basics", () => {
  it.effect("runs Effect code with assert helpers", () =>
    Effect.gen(function* () {
      const upper = ["ada", "lin"].map((name) => name.toUpperCase());
      assert.deepStrictEqual(upper, ["ADA", "LIN"]);
      assert.strictEqual(upper.length, 2);
      assert.isTrue(upper.includes("ADA"));
    }),
  );

  it.effect.each([
    { input: " Ada ", expected: "ada" },
    { input: " Lin ", expected: "lin" },
    { input: " Nia ", expected: "nia" },
  ])("parameterized normalization %#", ({ input, expected }) =>
    Effect.gen(function* () {
      assert.strictEqual(input.trim().toLowerCase(), expected);
    }),
  );

  it.effect("controls time with testClock", () =>
    Effect.gen(function* () {
      const fiber = yield* Effect.forkChild(
        Effect.sleep(60_000).pipe(Effect.as("done" as const)),
      );

      // move virtual time forward
      yield* TestClock.adjust(60_000);

      const val = yield* Fiber.join(fiber);

      assert.strictEqual(val, "done");
    }),
  );

  it.live("uses real runtime service", () =>
    Effect.gen(function* () {
      const startedAt = Date.now();

      yield* Effect.sleep(1);

      assert.isTrue(Date.now() >= startedAt);
    }),
  );

  // it.effect.prop(
  //   "reversing twice is identity",
  //   { value: stringSchema },
  //   ({ value }) =>
  //     Effect.gen(function* () {
  //       const reversedTwice = value.split("").reverse().reverse().join("");

  //       assert.strictEqual(reversedTwice, value);
  //     }),
  // );
});

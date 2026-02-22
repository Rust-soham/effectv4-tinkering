import { Effect, ServiceMap } from "effect";

export class demoI0 extends ServiceMap.Service<
  demoI0,
  {
    name: string;
  }
>()("demoIO") {}

const tryBitch = Effect.gen(function* () {
  const a = yield* demoI0;

  return a;
});

import { NodeServices } from "@effect/platform-node";
import {
  Console,
  Effect,
  Layer,
  Schema,
  ServiceMap,
  Stream,
  String,
} from "effect";

import { ChildProcess, ChildProcessSpawner } from "effect/unstable/process";

export class DevToolsError extends Schema.TaggedErrorClass<DevToolsError>()(
  "DevToolsError",
  {
    cause: Schema.Defect,
  },
) {}

export class DevTools extends ServiceMap.Service<
  DevTools,
  {
    readonly nodeVersion: Effect.Effect<string, DevToolsError>;
    readonly recentCommitSubjects: Effect.Effect<
      ReadonlyArray<string>,
      DevToolsError
    >;
    readonly runLintFix: Effect.Effect<void, DevToolsError>;
    changedTypeScriptFiles(
      baseRef: string,
    ): Effect.Effect<ReadonlyArray<string>, DevToolsError>;
  }
>()("docs/DevTools") {
  static readonly layer = Layer.effect(
    DevTools,
    Effect.gen(function* () {
      const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;

      const nodeVersion = spawner
        .string(ChildProcess.make("node", ["--version"]))
        .pipe(
          Effect.map(String.trim),
          Effect.mapError((cause) => new DevToolsError({ cause })),
        );

      const changedTypeScriptFiles = Effect.fn(
        "DevTools.changedTypeScriptFiles",
      )(function* (baseRef: string) {
        yield* Effect.annotateCurrentSpan({ baseRef });

        // `spawner.lines` is a convenience helper for line-oriented command
        // output.
        const files = yield* spawner
          .lines(
            ChildProcess.make("git", [
              "diff",
              "--name-only",
              `${baseRef}...HEAD`,
            ]),
          )
          .pipe(Effect.mapError((cause) => new DevToolsError({ cause })));

        return files.filter((file) => file.endsWith(".ts"));
      });

      const recentCommitSubjects = spawner
        .lines(
          ChildProcess.make("git", [
            "log",
            "--pretty=format:%s",
            "-n",
            "20",
          ]).pipe(ChildProcess.pipeTo(ChildProcess.make("head", ["-n", "5"]))),
        )
        .pipe(Effect.mapError((cause) => new DevToolsError({ cause })));

      const runLintFix = Effect.gen(function* () {
        const handle = yield* spawner
          .spawn(
            ChildProcess.make("pnpm", ["lint-fix"], {
              env: { FORCE_COLOR: "1" },
              extendEnv: true,
            }),
          )
          .pipe(Effect.mapError((cause) => new DevToolsError({ cause })));

        yield* handle.all.pipe(
          Stream.decodeText(),
          Stream.splitLines,
          Stream.runForEach((line) => Console.log(`[lint-fix] ${line}`)),
          Effect.mapError((cause) => new DevToolsError({ cause })),
        );

        const exitCode = yield* handle.exitCode.pipe(
          Effect.mapError((cause) => new DevToolsError({ cause })),
        );

        if (exitCode !== ChildProcessSpawner.ExitCode(0)) {
          return yield* new DevToolsError({
            cause: new Error(`pnpm lint-fix failed with exit code ${exitCode}`),
          });
        }
      }).pipe(Effect.scoped);

      return DevTools.of({
        nodeVersion,
        changedTypeScriptFiles,
        recentCommitSubjects,
        runLintFix,
      });
    }),
  ).pipe(Layer.provide(NodeServices.layer));
}

export const program = Effect.gen(function* () {
  const tools = yield* DevTools;

  const version = yield* tools.nodeVersion;

  yield* Effect.log(`node=${version}`);
}).pipe(Effect.provide(DevTools.layer));

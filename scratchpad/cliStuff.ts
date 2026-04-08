import { NodeRuntime, NodeServices } from "@effect/platform-node";
import { Console, Effect } from "effect";
import { Argument, Command, Flag } from "effect/unstable/cli";

const workspace = Flag.string("workspace").pipe(
  Flag.withAlias("w"),
  Flag.withDescription("workspace to operation on"),
  Flag.withDefault("personal"),
);

const tasks = Command.make("tasks").pipe(
  Command.withSharedFlags({
    workspace,
    verbose: Flag.boolean("verbose").pipe(
      Flag.withAlias("v"),
      Flag.withDescription("Print diagnostic output"),
    ),
  }),
  Command.withDescription("Track and manage tasks"),
);

const create = Command.make(
  "create",
  {
    title: Argument.string("title").pipe(
      Argument.withDescription("Task Title"),
    ),
    priority: Flag.choice("priority", ["low", "normal", "high"]).pipe(
      Flag.withDescription("Priority for the new task"),
      Flag.withDefault("normal"),
    ),
  },
  Effect.fn(function* ({ title, priority }) {
    const root = yield* tasks;

    if (root.verbose) {
      yield* Console.log(`workspace=${root.workspace} action=create`);
    }

    yield* Console.log(
      `Created "${title}" in ${root.workspace} with ${priority} priority`,
    );
  }),
).pipe(
  Command.withDescription("create a task"),
  Command.withExamples([
    {
      command: 'tasks create "Ship 4.0" --priority high',
      description: "Create a high-priority task",
    },
  ]),
);

const list = Command.make(
  "list",
  {
    status: Flag.choice("status", ["open", "done", "all"]).pipe(
      Flag.withDescription("Filter tasks by status"),
      Flag.withDefault("open"),
    ),
    json: Flag.boolean("json").pipe(
      Flag.withDescription("Print machine-readable o/p"),
    ),
  },
  Effect.fn(function* ({ status, json }) {
    const root = yield* tasks;

    const item = [
      { title: "Ship 4.0", status: "open" },
      { title: "Update onboarding guide", status: "done" },
    ] as const;

    const filtered =
      status === "all" ? item : item.filter((i) => i.status === status);

    if (root.verbose) {
      yield* Console.log(`workspace=${root.workspace} action=list`);
    }

    if (json) {
      yield* Console.log(
        JSON.stringify(
          {
            workspace: root.workspace,
            status,
            tasks: filtered,
          },
          null,
          2,
        ),
      );
      return;
    }

    yield* Console.log(`Listing ${status} tasks in ${root.workspace}`);

    if (filtered.length === 0) {
      yield* Console.log("No tasks found");
      return;
    }

    for (const item of filtered) {
      yield* Console.log(`- ${item.title}`);
    }
  }),
).pipe(
  Command.withDescription("List tasks"),
  Command.withAlias("ls"),
  Command.withExamples([
    {
      command: "tasks --workspace team-a list --status open",
      description: "List open tasks in a specific workspace",
    },
    {
      command: "tasks --workspace team-b ls --status open",
      description: "List open tasks in another workspace",
    },
  ]),
);

tasks.pipe(
  Command.withSubcommands([create, list]),
  Command.run({
    version: "1.0.0",
  }),
  Effect.provide(NodeServices.layer),
  NodeRuntime.runMain,
);

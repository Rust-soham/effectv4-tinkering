import { Optic } from "effect";

type S = readonly [string];

// Build an optic to access the "a" field
const _a = Optic.id<S>().key(0);

console.log(_a.replace("b", ["a"]));

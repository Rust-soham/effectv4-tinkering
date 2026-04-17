import { Result } from "better-result";

const hi = Result.ok("helloOk");
const hi2 = Result.err("helloError");

const hi3 = Result.ok("helloOk3").map((name) => name.toUpperCase());
console.log(hi);
console.log(hi3);

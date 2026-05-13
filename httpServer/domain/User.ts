import { Schema } from "effect";

export const userId = Schema.Int.pipe(Schema.brand("userId"));

export type userId = typeof userId.Type;

export class User extends Schema.Class<User>("User")({
  id: userId,
  name: Schema.String,
  email: Schema.String,
}) {}

import { Duration, Effect, Random, Schedule, Schema } from "effect";

export class HttpError extends Schema.TaggedErrorClass<HttpError>()(
  "HttpError",
  {
    message: Schema.String,
    status: Schema.Number,
    retryable: Schema.Boolean,
  },
) {}

export const maxRetries = Schedule.recurs(5);
export const spacedPooling = Schedule.spaced("30 seconds");
export const exponentialBackoff = Schedule.exponential("200 millis");

export const retryBackoffWithLimit = Schedule.both(
  Schedule.exponential("250 millis"),
  Schedule.recurs(6),
);

export const keepTryingUntilBothStop = Schedule.either(
  Schedule.spaced("2 seconds"),
  Schedule.recurs(3),
);

export const retryableOnly = Schedule.exponential("200 millis").pipe(
  Schedule.setInputType<HttpError>(),
  Schedule.while(({ input }) => input.retryable),
);

export const instrumentedRetrySchedule = retryableOnly.pipe(
  Schedule.setInputType<HttpError>(),
  Schedule.tapInput((error) =>
    Effect.logDebug(`Retrying after ${error.status}: ${error.message}`),
  ),
  Schedule.tapOutput((delay) =>
    Effect.logDebug(`Next retry in ${Duration.toMillis(delay)}ms`),
  ),
);

export const productionRetrySchedule = Schedule.exponential("250 millis").pipe(
  Schedule.either(Schedule.spaced("10 seconds")),
  Schedule.jittered,
  Schedule.setInputType<HttpError>(),
  Schedule.while(({ input }) => input.retryable),
);

export const fetchUserProfile = Effect.fn("fetchUserProfile")(function* (
  userId: string,
) {
  const random = yield* Random.next;

  const status = random > 0.7 ? 200 : random > 0.3 ? 500 : 401;

  if (status !== 200) {
    return yield* new HttpError({
      message: `Request for ${userId} failed`,
      status,
      retryable: status >= 500,
    });
  }

  return {
    id: userId,
    name: "Soham",
  } as const;
});

export const loadUserWithRetry = fetchUserProfile("user-123").pipe(
  Effect.retry(productionRetrySchedule),
  Effect.orDie,
);

export const loadUserWithInferredInput = fetchUserProfile("user-123").pipe(
  Effect.retry(($) =>
    $(Schedule.spaced("1 seconds")).pipe(
      Schedule.while(({ input }) => input.retryable),
    ),
  ),
  Effect.orDie,
);

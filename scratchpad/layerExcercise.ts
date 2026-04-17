import { Layer } from "effect";

// Base layers used in the exercises
export declare const DatabaseLayer: Layer.Layer<
  "Database",
  "DbError",
  "Config"
>;
export declare const LoggingLayer: Layer.Layer<"Logging", "LogError", "Config">;
export declare const ConfigLayer: Layer.Layer<"Config", "ConfigError", never>;
export declare const CacheLayer: Layer.Layer<"Cache", "CacheError", "Database">;
export declare const AuthLayer: Layer.Layer<
  "Auth",
  "AuthError",
  "Database" | "Config"
>;
export declare const ApiLayer: Layer.Layer<"Api", "ApiError", "Auth" | "Cache">;
export declare const MetricsLayer: Layer.Layer<
  "Metrics",
  "MetricsError",
  "Logging"
>;
export declare const NotificationLayer: Layer.Layer<
  "Notification",
  "NotifyError",
  "Logging" | "Config"
>;

// ===========================
// Exercise 1
// ===========================
// Target: `Layer<"Config" | "Logging", "ConfigError" | "LogError", never>`

export const exercise1 = Layer.provideMerge(LoggingLayer, ConfigLayer);
// Alternative solution:
export const exercise1Alt = Layer.merge(
  ConfigLayer,
  Layer.provide(LoggingLayer, ConfigLayer),
);

// ===========================
// Exercise 2
// ===========================
// Target: Layer<"Database", "DbError" | "ConfigError", never>

export const exercise2 = DatabaseLayer.pipe(Layer.provide(ConfigLayer));

// ===========================
// Exercise 3
// ===========================
// Target: Layer<"Cache", "CacheError" | "DbError" | "ConfigError", never>

export const exercise3 = CacheLayer.pipe(
  Layer.provide(DatabaseLayer),
  Layer.provide(ConfigLayer),
);
// Alternative solution:
export const exercise3Alt = Layer.provide(CacheLayer, exercise2);

// ===========================
// Exercise 4
// ===========================
// Target: Layer<"Auth", "AuthError" | "ConfigError" | "DbError", never>

export const exercise4 = AuthLayer.pipe(
  Layer.provide(DatabaseLayer),
  Layer.provide(ConfigLayer),
);

// Alternative solution:
export const exercise4Alt = AuthLayer.pipe(
  Layer.provide(Layer.merge(ConfigLayer, exercise2)),
);

// ===========================
// Exercise 5
// ===========================
// Target: Layer<"Api", "ApiError" | "AuthError" | "CacheError" | "DbError" | "ConfigError", never>

export const exercise5 = ApiLayer.pipe(
  Layer.provide(CacheLayer),
  Layer.provide(AuthLayer),
  Layer.provide(DatabaseLayer),
  Layer.provide(ConfigLayer),
);

// Alternative solution:
export const exercise5Alt = ApiLayer.pipe(
  Layer.provide(Layer.merge(exercise3, exercise4)),
);

// ===========================
// Exercise 6
// ===========================
// Target: Layer<"Metrics" | "Logging", "MetricsError" | "LogError" | "ConfigError", never>

export const exercise6 = Layer.provideMerge(
  MetricsLayer,
  Layer.provide(LoggingLayer, ConfigLayer),
);

// ===========================
// Exercise 7
// ===========================
// Target: Layer<"Metrics" | "Notification", "MetricsError" | "NotifyError" | "LogError" | "ConfigError", never>

export const exercise7 = MetricsLayer.pipe(
  Layer.merge(NotificationLayer),
  Layer.provide(LoggingLayer),
  Layer.provide(ConfigLayer),
);

// Alternative solution:
const LoggingWithConfig = Layer.provideMerge(LoggingLayer, ConfigLayer);
export const exercise7Alt = Layer.merge(
  Layer.provide(MetricsLayer, LoggingWithConfig),
  Layer.provide(NotificationLayer, LoggingWithConfig),
);

// ===========================
// Exercise 8
// ===========================
// Target: Layer<
//   "Api" | "Metrics" | "Notification",
//   "ApiError" | "AuthError" | "CacheError" | "DbError" | "ConfigError" | "MetricsError" | "NotifyError" | "LogError",
//   never
// >

const DatabaseWithConfig = Layer.provideMerge(DatabaseLayer, ConfigLayer);
const CacheWithDatabase = Layer.provideMerge(CacheLayer, DatabaseWithConfig);
const AuthWithCacheAndDatabase = Layer.provideMerge(
  AuthLayer,
  CacheWithDatabase,
);

const Api = Layer.provide(ApiLayer, AuthWithCacheAndDatabase);
const Metrics = Layer.provide(MetricsLayer, LoggingWithConfig);
const Notifications = Layer.provide(NotificationLayer, LoggingWithConfig);

export const exercise8 = Layer.mergeAll(Api, Metrics, Notifications);

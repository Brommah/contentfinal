/**
 * Structured Logger
 * Provides consistent logging across the application.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Get minimum log level from environment
function getMinLogLevel(): LogLevel {
  const envLevel = process.env.LOG_LEVEL?.toLowerCase();
  if (envLevel && envLevel in LOG_LEVELS) {
    return envLevel as LogLevel;
  }
  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

const minLevel = getMinLogLevel();

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[minLevel];
}

function formatLog(entry: LogEntry): string {
  if (process.env.NODE_ENV === "production") {
    // JSON format for production (easier to parse)
    return JSON.stringify(entry);
  }

  // Pretty format for development
  const { level, message, timestamp, context, error } = entry;
  const levelEmoji = {
    debug: "🔍",
    info: "ℹ️",
    warn: "⚠️",
    error: "❌",
  }[level];

  let output = `${levelEmoji} [${timestamp}] ${level.toUpperCase()}: ${message}`;

  if (context && Object.keys(context).length > 0) {
    output += `\n   Context: ${JSON.stringify(context, null, 2)}`;
  }

  if (error) {
    output += `\n   Error: ${error.name}: ${error.message}`;
    if (error.stack) {
      output += `\n   Stack: ${error.stack}`;
    }
  }

  return output;
}

function log(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
  error?: Error
) {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
  };

  if (error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  const formatted = formatLog(entry);

  switch (level) {
    case "debug":
    case "info":
      console.log(formatted);
      break;
    case "warn":
      console.warn(formatted);
      break;
    case "error":
      console.error(formatted);
      break;
  }
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) =>
    log("debug", message, context),

  info: (message: string, context?: Record<string, unknown>) =>
    log("info", message, context),

  warn: (message: string, context?: Record<string, unknown>, error?: Error) =>
    log("warn", message, context, error),

  error: (message: string, error?: Error, context?: Record<string, unknown>) =>
    log("error", message, context, error),

  /**
   * Log an API request.
   */
  request: (
    method: string,
    path: string,
    statusCode: number,
    durationMs: number,
    context?: Record<string, unknown>
  ) => {
    const level: LogLevel = statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";
    log(level, `${method} ${path} ${statusCode} ${durationMs}ms`, {
      ...context,
      method,
      path,
      statusCode,
      durationMs,
    });
  },
};

export default logger;



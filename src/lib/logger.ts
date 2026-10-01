type LogLevel = "debug" | "info" | "warn" | "error";

interface LogPayload {
  message: string;
  module?: string;
  action?: string;
  userId?: string;
  transactionId?: string;
  data?: unknown;
  error?: unknown;
}

export function log(level: LogLevel, payload: LogPayload) {
  const timestamp = new Date().toISOString();
  const entry = {
    timestamp,
    level,
    ...payload,
  };

  if (process.env.NODE_ENV === "test") {
    // Keep test logs clean unless it's an error
    if (level === "error") {
      console.error(JSON.stringify(entry));
    }
    return;
  }

  switch (level) {
    case "error":
      console.error(JSON.stringify(entry));
      break;
    case "warn":
      console.warn(JSON.stringify(entry));
      break;
    case "info":
      console.info(JSON.stringify(entry));
      break;
    case "debug":
      if (process.env.NODE_ENV === "development") {
        console.debug(JSON.stringify(entry));
      }
      break;
  }
}

export const logger = {
  debug: (payload: LogPayload) => log("debug", payload),
  info: (payload: LogPayload) => log("info", payload),
  warn: (payload: LogPayload) => log("warn", payload),
  error: (payload: LogPayload) => log("error", payload),
};

/**
 * RemitSplit Observability & Structured Diagnostics Logger
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  level: LogLevel;
  timestamp: string;
  context: string;
  message: string;
  data?: Record<string, unknown> | Error | unknown;
}

class ObservabilityLogger {
  private logs: LogEntry[] = [];
  private maxLogs: number = 200;

  private format(level: LogLevel, context: string, message: string, data?: unknown): LogEntry {
    const entry: LogEntry = {
      level,
      timestamp: new Date().toISOString(),
      context,
      message,
      data: data instanceof Error ? { error: data.message, stack: data.stack } : (data as Record<string, unknown>),
    };

    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    return entry;
  }

  debug(context: string, message: string, data?: unknown) {
    const entry = this.format("debug", context, message, data);
    if (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test" && !process.env.VITEST) {
      console.debug(`[${entry.timestamp}] [DEBUG] [${context}] ${message}`, data || "");
    }
  }

  info(context: string, message: string, data?: unknown) {
    const entry = this.format("info", context, message, data);
    if (process.env.NODE_ENV !== "test" && !process.env.VITEST) {
      console.info(`[${entry.timestamp}] [INFO] [${context}] ${message}`, data || "");
    }
  }

  warn(context: string, message: string, data?: unknown) {
    const entry = this.format("warn", context, message, data);
    if (process.env.NODE_ENV !== "test" && !process.env.VITEST) {
      console.warn(`[${entry.timestamp}] [WARN] [${context}] ${message}`, data || "");
    }
  }

  error(context: string, message: string, error?: unknown) {
    const entry = this.format("error", context, message, error);
    if (process.env.NODE_ENV !== "test" && !process.env.VITEST) {
      console.error(`[${entry.timestamp}] [ERROR] [${context}] ${message}`, error || "");
    }
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }
}

export const logger = new ObservabilityLogger();

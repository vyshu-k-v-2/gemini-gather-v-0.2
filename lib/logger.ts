/**
 * @file logger.ts
 * @description Safe structured logger that masks secrets and suppresses
 * sensitive internal stack traces in production environments.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogPayload {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

const SENSITIVE_KEY_PATTERNS = [/api[_-]?key/i, /token/i, /secret/i, /auth/i, /password/i];

function maskSensitiveData(obj: unknown): unknown {
  if (typeof obj !== "object" || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(maskSensitiveData);

  const clean: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (SENSITIVE_KEY_PATTERNS.some((p) => p.test(key))) {
      clean[key] = "********";
    } else if (typeof val === "object" && val !== null) {
      clean[key] = maskSensitiveData(val);
    } else {
      clean[key] = val;
    }
  }
  return clean;
}

class AppLogger {
  private isProduction = process.env.NODE_ENV === "production";

  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    const payload: LogPayload = {
      level,
      message,
      context: context ? (maskSensitiveData(context) as Record<string, unknown>) : undefined,
      timestamp: new Date().toISOString(),
    };

    if (level === "error") {
      console.error(`[${payload.timestamp}] [ERROR] ${payload.message}`, payload.context || "");
    } else if (level === "warn") {
      console.warn(`[${payload.timestamp}] [WARN] ${payload.message}`, payload.context || "");
    } else if (!this.isProduction || level === "info") {
      console.info(`[${payload.timestamp}] [${level.toUpperCase()}] ${payload.message}`, payload.context || "");
    }
  }

  public debug(message: string, context?: Record<string, unknown>): void {
    if (!this.isProduction) this.log("debug", message, context);
  }

  public info(message: string, context?: Record<string, unknown>): void {
    this.log("info", message, context);
  }

  public warn(message: string, context?: Record<string, unknown>): void {
    this.log("warn", message, context);
  }

  public error(message: string, context?: Record<string, unknown>): void {
    this.log("error", message, context);
  }
}

export const logger = new AppLogger();

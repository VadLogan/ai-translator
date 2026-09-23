/**
 * Where log lines go, behind an interface so the sink can be swapped without touching a caller.
 * `info` serializes its data; `error` passes the error through untouched, because
 * `JSON.stringify(new Error(...))` is `{}` and the stack would be lost.
 */
export interface Logger {
  info(message: string, data?: unknown): void;
  error(message: string, error: unknown): void;
}

export const consoleLogger: Logger = {
  info: (message, data) =>
    data === undefined ? console.info(message) : console.info(message, JSON.stringify(data, null, 2)),
  error: (message, error) => console.error(message, error),
};

/** The sink in use. Swapping this one binding redirects every line in the API. */
export const logger: Logger = consoleLogger;

/** Prefixes every line with `[tag id]`, so a log line and the row it was saved as can be matched up. */
export function scopedLogger(tag: string, id: string, sink: Logger = logger): Logger {
  return {
    info: (message, data) => sink.info(`[${tag} ${id}] ${message}`, data),
    error: (message, error) => sink.error(`[${tag} ${id}] ${message}`, error),
  };
}

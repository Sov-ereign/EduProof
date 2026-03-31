import pino from "pino";

const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug");

export const logger = pino({
  level,
  base: {
    service: "eduproof-api",
    env: process.env.NODE_ENV || "development",
  },
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "password",
      "secret",
      "token",
      "signature",
    ],
    remove: true,
  },
});

export function withReqContext(request: Request) {
  return logger.child({
    method: request.method,
    path: new URL(request.url).pathname,
  });
}

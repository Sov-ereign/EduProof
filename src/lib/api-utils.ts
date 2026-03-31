import { NextResponse } from "next/server";
import { ZodError, ZodType } from "zod";

import { logger } from "@/lib/logger";

export function apiError(message: string, status: number, code?: string, details?: unknown) {
  return NextResponse.json(
    {
      ok: false,
      error: {
        message,
        code: code || "UNKNOWN_ERROR",
        ...(details ? { details } : {}),
      },
    },
    { status },
  );
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(
    {
      ok: true,
      data,
    },
    { status },
  );
}

export async function parseJsonBody<T>(request: Request, schema: ZodType<T>): Promise<T> {
  const body = await request.json().catch(() => {
    throw new Error("Invalid JSON body");
  });
  return schema.parse(body);
}

export function parseQuery<T>(request: Request, schema: ZodType<T>): T {
  const url = new URL(request.url);
  const queryObject = Object.fromEntries(url.searchParams.entries());
  return schema.parse(queryObject);
}

export function getRequestIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

export function toErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof ZodError) {
    return apiError("Validation failed", 400, "VALIDATION_ERROR", error.issues);
  }

  const message = error instanceof Error ? error.message : fallbackMessage;
  logger.error({ err: error }, message);
  return apiError(message, 500, "INTERNAL_ERROR");
}

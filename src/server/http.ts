// Shared helpers for the API route handlers.
import { NextResponse } from "next/server";
import { isAdmin } from "./auth";

export const MAX_BODY_BYTES = 200_000;

export function error(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

/** Mutating requests must come from this site (blocks cross-site form posts). */
export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function readJsonBody(req: Request): Promise<unknown> {
  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) throw new Error("too large");
  const body = await req.text();
  if (body.length > MAX_BODY_BYTES) throw new Error("too large");
  return JSON.parse(body);
}

export function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
}

const buckets = new Map<string, { count: number; reset: number }>();

/** Fixed-window in-memory limiter; returns false once `limit` is used up. */
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.reset <= now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}

/** Returns an error response unless the request is a same-origin admin request. */
export async function requireAdmin(req: Request, mutating: boolean) {
  if (mutating && !sameOrigin(req)) return error(403, "Cross-site request refused");
  if (!(await isAdmin())) return error(401, "Please log in again");
  return null;
}

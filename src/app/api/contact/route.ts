import { NextResponse } from "next/server";
import { addMessage } from "@/server/store";
import { clientIp, error, rateLimit, readJsonBody, sameOrigin } from "@/server/http";
import { sanitizeMessage } from "@/server/validate";

/** Contact form submissions, stored for the admin inbox. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return error(403, "Cross-site request refused");
  if (!rateLimit(`contact:${clientIp(req)}`, 5, 10 * 60_000)) {
    return error(429, "Too many messages. Please try again in a few minutes.");
  }
  let body: unknown;
  try {
    body = await readJsonBody(req);
  } catch {
    return error(400, "Invalid request");
  }
  // Honeypot: a hidden field real visitors leave empty. Pretend success for bots.
  if (body && typeof body === "object" && (body as Record<string, unknown>).website) {
    return NextResponse.json({ ok: true });
  }
  const result = sanitizeMessage(body);
  if (!result.ok) return error(400, result.error);
  await addMessage(result.value);
  return NextResponse.json({ ok: true });
}

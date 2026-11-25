import { NextResponse } from "next/server";
import { adminConfigured, checkPassword, setSessionCookie } from "@/server/auth";
import { clientIp, error, rateLimit, readJsonBody, sameOrigin } from "@/server/http";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return error(403, "Cross-site request refused");
  if (!adminConfigured()) {
    return error(503, "Admin login is not set up. Add ADMIN_PASSWORD and SESSION_SECRET to .env.local.");
  }
  if (!rateLimit(`login:${clientIp(req)}`, 5, 15 * 60_000)) {
    return error(429, "Too many attempts. Try again in 15 minutes.");
  }
  let password = "";
  try {
    const body = (await readJsonBody(req)) as { password?: unknown } | null;
    if (typeof body?.password === "string") password = body.password;
  } catch {
    return error(400, "Invalid request");
  }
  if (!checkPassword(password)) return error(401, "Wrong password");
  const res = NextResponse.json({ ok: true });
  setSessionCookie(res);
  return res;
}

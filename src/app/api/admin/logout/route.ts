import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/server/auth";
import { error, sameOrigin } from "@/server/http";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return error(403, "Cross-site request refused");
  const res = NextResponse.json({ ok: true });
  clearSessionCookie(res);
  return res;
}

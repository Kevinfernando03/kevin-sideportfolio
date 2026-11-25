import { NextResponse } from "next/server";
import { readContent, writeContent } from "@/server/store";
import { error, readJsonBody, requireAdmin } from "@/server/http";
import { sanitizeContent } from "@/server/validate";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = await requireAdmin(req, false);
  if (denied) return denied;
  return NextResponse.json(await readContent());
}

export async function PUT(req: Request) {
  const denied = await requireAdmin(req, true);
  if (denied) return denied;
  let body: unknown;
  try {
    body = await readJsonBody(req);
  } catch {
    return error(400, "Invalid request");
  }
  const result = sanitizeContent(body);
  if (!result.ok) return error(400, result.error);
  await writeContent(result.value);
  return NextResponse.json({ ok: true, content: result.value });
}

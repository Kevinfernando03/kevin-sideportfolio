import { NextResponse } from "next/server";
import { deleteMessage, listMessages } from "@/server/store";
import { error, requireAdmin } from "@/server/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = await requireAdmin(req, false);
  if (denied) return denied;
  return NextResponse.json(await listMessages());
}

export async function DELETE(req: Request) {
  const denied = await requireAdmin(req, true);
  if (denied) return denied;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return error(400, "Missing message id");
  if (!(await deleteMessage(id))) return error(404, "Message not found");
  return NextResponse.json({ ok: true });
}

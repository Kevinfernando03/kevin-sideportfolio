import { NextResponse } from "next/server";
import { readContent } from "@/server/store";

export const dynamic = "force-dynamic";

/** Public site content (brand, copy, projects, contact details). */
export async function GET() {
  return NextResponse.json(await readContent());
}

import type { Metadata } from "next";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminPanel from "@/components/admin/AdminPanel";
import { adminConfigured, isAdmin } from "@/server/auth";
import { listMessages, readContent } from "@/server/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminPage() {
  if (!(await isAdmin())) return <AdminLogin configured={adminConfigured()} />;
  const [content, messages] = await Promise.all([readContent(), listMessages()]);
  return <AdminPanel initialContent={content} initialMessages={messages} />;
}

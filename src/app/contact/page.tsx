import type { Metadata } from "next";
import ContactPage from "@/components/site/ContactPage";
import { readContent } from "@/server/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Contact" };

export default async function Contact() {
  return <ContactPage content={await readContent()} />;
}

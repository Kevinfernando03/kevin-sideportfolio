import SiteHome from "@/components/site/SiteHome";
import { readContent } from "@/server/store";

// Content is edited at runtime from /admin, so render on every request.
export const dynamic = "force-dynamic";

export default async function Home() {
  return <SiteHome content={await readContent()} />;
}

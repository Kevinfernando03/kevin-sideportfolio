"use client";

import { createContext, useContext } from "react";
import type { SiteContent } from "./content";

const SiteContext = createContext<SiteContent | null>(null);

export function SiteProvider({ content, children }: { content: SiteContent; children: React.ReactNode }) {
  return <SiteContext.Provider value={content}>{children}</SiteContext.Provider>;
}

export function useSite() {
  const content = useContext(SiteContext);
  if (!content) throw new Error("useSite() must be used inside <SiteProvider>");
  return content;
}

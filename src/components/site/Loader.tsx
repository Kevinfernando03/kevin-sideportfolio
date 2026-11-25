"use client";

import { useEffect, useState } from "react";
import { Monogram } from "./icons";
import { useSite } from "./SiteContext";

/** Dark intro: pulsing dot, the brand monogram, then a dot-grid burst that wipes to the page. */
export default function Loader({ onDone }: { onDone: () => void }) {
  const { brand } = useSite();
  const [phase, setPhase] = useState<"loading" | "leaving" | "done">("loading");

  useEffect(() => {
    let cancelled = false;
    const minTime = new Promise((r) => setTimeout(r, 2300));
    const fonts = document.fonts?.ready ?? Promise.resolve();
    Promise.all([minTime, fonts]).then(() => {
      if (cancelled) return;
      setPhase("leaving");
      setTimeout(onDone, 700);
      setTimeout(() => !cancelled && setPhase("done"), 1500);
    });
    return () => {
      cancelled = true;
    };
  }, [onDone]);

  if (phase === "done") return null;
  return (
    <div className={`kj-loader${phase === "leaving" ? " is-leaving" : ""}`} aria-hidden="true">
      <div className="kj-loader__grid" />
      <span className="kj-loader__dot" />
      <Monogram text={brand} className="kj-loader__logo" />
    </div>
  );
}

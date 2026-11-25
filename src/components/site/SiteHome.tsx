"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import "./site.css";
import type { SiteContent } from "./content";
import CookieBanner from "./CookieBanner";
import Footer from "./Footer";
import Grid from "./Grid";
import Header from "./Header";
import Hero from "./Hero";
import Loader from "./Loader";
import Reel from "./Reel";
import { scroll } from "./runtime";
import { SiteProvider } from "./SiteContext";

export default function SiteHome({ content }: { content: SiteContent }) {
  const [ready, setReady] = useState(false);
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const onLoaderDone = useCallback(() => setReady(true), []);

  // Smooth scrolling (Lenis), feeding scroll velocity to the shaders.
  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    const lenis = new Lenis({ autoRaf: true, anchors: true });
    lenisRef.current = lenis;
    lenis.on("scroll", (l: Lenis) => {
      scroll.velocity = l.velocity;
    });
    const setVh = () => document.documentElement.style.setProperty("--vh", `${window.innerHeight * 0.01}px`);
    setVh();
    window.addEventListener("resize", setVh);
    return () => {
      lenis.destroy();
      lenisRef.current = null;
      window.removeEventListener("resize", setVh);
    };
  }, []);

  // Arriving from another page via /#works or /#profile: scroll there once the loader is gone.
  useEffect(() => {
    if (!ready || !location.hash) return;
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target) lenisRef.current?.scrollTo(target);
  }, [ready]);

  return (
    <SiteProvider content={content}>
      <Loader onDone={onLoaderDone} />
      <Header />
      <main>
        <Hero ready={ready} video={video} />
        <Reel onVideo={setVideo} />
        <Grid />
        <Footer />
      </main>
      <CookieBanner />
    </SiteProvider>
  );
}

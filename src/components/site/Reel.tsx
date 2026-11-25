"use client";

import { useEffect, useRef } from "react";
import { pointer } from "./runtime";
import { useSite } from "./SiteContext";

/**
 * Showreel. The section is a window onto a viewport-fixed scene: a sharp 16:9 video panel
 * over a blurred copy of the same footage. The panel widens as the section scrolls through.
 */
export default function Reel({ onVideo }: { onVideo: (v: HTMLVideoElement) => void }) {
  const { reelUrl } = useSite();
  const sectionRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const video = videoRef.current!;
    onVideo(video);
    video.play().catch(() => {});
  }, [onVideo]);

  useEffect(() => {
    const section = sectionRef.current!;
    const scene = sceneRef.current!;
    const panel = panelRef.current!;
    const video = videoRef.current!;
    const bg = bgRef.current!;
    const ctx = bg.getContext("2d");
    let raf = 0;
    let shift = 0;

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      if (rect.bottom < 0 || rect.top > vh) return;

      // Keep the scene pinned to the viewport while the section slides over it.
      scene.style.transform = `translate3d(0, ${-rect.top}px, 0)`;

      // 0 as the section enters from below, 1 as it leaves at the top.
      const p = Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)));
      const grow = Math.min(1, Math.max(0, (p - 0.45) / 0.45));
      const eased = grow * grow * (3 - 2 * grow);
      shift += ((pointer.x - 0.5) * -2.4 - shift) * 0.06;
      panel.style.width = `${84 + eased * 12}vw`;
      panel.style.transform = `translate(calc(-50% + ${shift}vw), -50%)`;

      if (ctx && video.readyState >= 2) ctx.drawImage(video, 0, 0, bg.width, bg.height);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section className="kj-reel" ref={sectionRef} aria-label="Showreel">
      <div className="kj-reel__scene" ref={sceneRef}>
        <canvas className="kj-reel__bg" ref={bgRef} width={64} height={36} aria-hidden="true" />
        <div className="kj-reel__panel" ref={panelRef}>
          <video ref={videoRef} src={reelUrl} muted loop playsInline autoPlay preload="auto" />
        </div>
      </div>
    </section>
  );
}

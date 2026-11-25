"use client";

import { useEffect, useRef } from "react";
import type { DeviceName, Quality } from "./data";
import { DeviceRenderer } from "./DeviceRenderer";
import { listenPointer } from "./runtime";

interface Props {
  device: DeviceName;
  quality?: Quality;
  mode?: "images" | "reel";
  video?: HTMLVideoElement | null;
  /** Element whose pointerenter starts the hover ripple; defaults to the canvas. */
  hoverTarget?: React.RefObject<HTMLElement | null>;
  /** Custom screen images (grid mode); empty entries keep the baked ones. */
  screens?: [string, string];
  /** Hold the device hidden (uTransition 0) until true. */
  active?: boolean;
  className?: string;
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeIn = (t: number) => t * t * t;

export default function DeviceCanvas({
  device,
  quality = "medium",
  mode = "images",
  video = null,
  hoverTarget,
  screens,
  active = true,
  className,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(video);
  const rendererRef = useRef<DeviceRenderer | null>(null);
  const tweenRef = useRef<{ from: number; to: number; start: number; duration: number; ease: (t: number) => number } | null>(null);
  const activeRef = useRef(active);
  const shownRef = useRef<DeviceName | null>(null);

  const [screen1 = "", screen2 = ""] = screens ?? [];

  const tweenTo = (to: number, duration: number, ease = easeOut) =>
    new Promise<void>((resolve) => {
      const r = rendererRef.current;
      if (!r) return resolve();
      tweenRef.current = { from: r.transition, to, start: performance.now(), duration, ease };
      setTimeout(resolve, duration);
    });

  // Renderer lifetime + render loop (only while on screen).
  useEffect(() => {
    listenPointer();
    // A fresh canvas per mount: a disposed (lost) WebGL context can't be reacquired.
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "display:block;width:100%;height:100%";
    wrapRef.current!.appendChild(canvas);
    let renderer: DeviceRenderer;
    try {
      renderer = new DeviceRenderer(canvas, { mode, video: videoRef.current });
    } catch {
      canvas.remove();
      return;
    }
    rendererRef.current = renderer;

    let visible = false;
    let raf = 0;
    let last = performance.now();
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    }, { rootMargin: "200px" });
    io.observe(canvas);

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(now - last, 100);
      last = now;
      const tw = tweenRef.current;
      if (tw) {
        const p = Math.min(1, (now - tw.start) / tw.duration);
        renderer.transition = tw.from + (tw.to - tw.from) * tw.ease(p);
        if (p >= 1) tweenRef.current = null;
      }
      if (visible) renderer.render(now, dt);
    };
    raf = requestAnimationFrame(loop);

    const target = hoverTarget?.current ?? canvas;
    const onEnter = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      renderer.hover((e.clientX - rect.left) / rect.width, 1 - (e.clientY - rect.top) / rect.height);
    };
    target.addEventListener("pointerenter", onEnter);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      target.removeEventListener("pointerenter", onEnter);
      renderer.dispose();
      canvas.remove();
      rendererRef.current = null;
      shownRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    videoRef.current = video;
    if (rendererRef.current) rendererRef.current.options.video = video;
  }, [video]);

  // Device swaps: fade the current device out, load the next, fade it in.
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    let cancelled = false;
    (async () => {
      if (shownRef.current && shownRef.current !== device) await tweenTo(0, 700, easeIn);
      if (cancelled) return;
      // Missing media (e.g. public/media not added yet) just leaves the device hidden.
      const ok = await renderer
        .setDevice(device, quality, screen1 || screen2 ? [screen1, screen2] : undefined)
        .catch(() => false);
      if (!ok || cancelled) return;
      shownRef.current = device;
      if (activeRef.current) tweenTo(1, 1800);
    })();
    return () => {
      cancelled = true;
    };
  }, [device, quality, screen1, screen2]);

  useEffect(() => {
    activeRef.current = active;
    if (active && rendererRef.current?.ready) tweenTo(1, 1800);
  }, [active]);

  return <div ref={wrapRef} className={className} aria-hidden="true" />;
}

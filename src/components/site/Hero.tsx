"use client";

import { useEffect, useState } from "react";
import DeviceCanvas from "./DeviceCanvas";
import { HEADER_DEVICES } from "./data";
import { Arrow, Dna } from "./icons";
import { useSite } from "./SiteContext";

const SLIDE_MS = 6000;
const FONT_SIZE = 100;
const TRACKING = -0.03 * FONT_SIZE;

/**
 * The brand name as a full-width wordmark. The viewBox is cropped to the glyphs' ink box
 * (measured on a canvas once the font has loaded) so the word fills the width exactly.
 */
function Wordmark({ text }: { text: string }) {
  const [box, setBox] = useState(() => `0 ${-0.72 * FONT_SIZE} ${Array.from(text).length * 0.6 * FONT_SIZE} ${0.72 * FONT_SIZE}`);

  useEffect(() => {
    let alive = true;
    const family = getComputedStyle(document.documentElement).getPropertyValue("--font-sans").trim() || "sans-serif";
    const font = `600 ${FONT_SIZE}px ${family}`;
    const measure = () => {
      const ctx = document.createElement("canvas").getContext("2d");
      if (!alive || !ctx) return;
      ctx.font = font;
      const m = ctx.measureText(text);
      const left = m.actualBoundingBoxLeft;
      const right = m.actualBoundingBoxRight + (Array.from(text).length - 1) * TRACKING;
      setBox(`${-left} ${-m.actualBoundingBoxAscent} ${left + right} ${m.actualBoundingBoxAscent + m.actualBoundingBoxDescent}`);
    };
    measure();
    document.fonts?.load(font).then(measure, () => undefined);
    return () => {
      alive = false;
    };
  }, [text]);

  return (
    <svg className="kj-hero__logo" viewBox={box} role="img" aria-label={text}>
      <text
        x="0"
        y="0"
        fontSize={FONT_SIZE}
        fontWeight={600}
        letterSpacing={TRACKING}
        fill="currentColor"
        style={{ fontFamily: "var(--font-base)" }}
      >
        {text}
      </text>
    </svg>
  );
}

export default function Hero({ ready, video }: { ready: boolean; video: HTMLVideoElement | null }) {
  const { brand, tagline, headline } = useSite();
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    if (!ready) return;
    const id = setInterval(() => setSlide((s) => (s + 1) % HEADER_DEVICES.length), SLIDE_MS);
    return () => clearInterval(id);
  }, [ready]);

  return (
    <section className={`kj-hero${ready ? " is-ready" : ""}`}>
      <div className="kj-hero__brand">
        <h1 className="kj-intro kj-intro--d1">
          <Wordmark text={brand} />
        </h1>
        {tagline && <p className="kj-hero__tagline kj-intro kj-intro--d2">{tagline}</p>}
      </div>
      <div className="kj-hero__copy kj-intro kj-intro--d2">
        {headline.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
      <DeviceCanvas
        className="kj-hero__device"
        device={HEADER_DEVICES[slide]}
        quality="high"
        mode="reel"
        video={video}
        active={ready}
      />
      <div className="kj-hero__footer kj-intro kj-intro--d3">
        <div>
          <Dna />
        </div>
        <div>
          <Arrow />
        </div>
        <div />
      </div>
    </section>
  );
}

"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import DeviceCanvas from "./DeviceCanvas";
import type { ProjectContent } from "./content";
import { useSite } from "./SiteContext";

function useInView<T extends Element>(rootMargin = "0px") {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);
  return [ref, inView] as const;
}

/**
 * Splits the title into rendered lines so the first line
 * can be right-aligned while the rest wrap naturally at any width.
 */
function HeaderText() {
  const { about } = useSite();
  const [ref, inView] = useInView<HTMLDivElement>("-15% 0px");
  const titleRef = useRef<HTMLParagraphElement>(null);
  const words = about.text.split(/s+/);
  const [lines, setLines] = useState<string[][] | null>(null);

  // While `lines` is null the title renders as plain word spans; group them by offsetTop.
  useLayoutEffect(() => {
    if (lines !== null) return;
    const el = titleRef.current;
    if (!el) return;
    const out: string[][] = [];
    let top = -Infinity;
    el.querySelectorAll<HTMLSpanElement>("[data-word]").forEach((s) => {
      if (Math.abs(s.offsetTop - top) > 2) {
        out.push([]);
        top = s.offsetTop;
      }
      out[out.length - 1].push(s.textContent ?? "");
    });
    if (out.length) setLines(out);
  }, [lines]);

  // Re-split when the font arrives or the width changes.
  useEffect(() => {
    const remeasure = () => setLines(null);
    let width = window.innerWidth;
    const onResize = () => {
      if (window.innerWidth !== width) {
        width = window.innerWidth;
        remeasure();
      }
    };
    window.addEventListener("resize", onResize);
    document.fonts?.ready.then(remeasure);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  let charIndex = 0;
  return (
    <div className={`kj-headertext${inView ? " is-visible" : ""}`} ref={ref}>
      <p className="kj-headertext__subtitle">{about.subtitle}</p>
      <p
        className={`kj-headertext__title${lines ? "" : " is-measuring"}`}
        ref={titleRef}
        aria-label={about.text}
      >
        {lines
          ? lines.map((line, li) => (
              <span className="line" aria-hidden="true" key={li}>
                {line.map((word, wi) => (
                  <span key={wi}>
                    {Array.from(word).map((ch, ci) => (
                      <span className="char" key={ci} style={{ transitionDelay: `${(charIndex++) * 8}ms` }}>
                        {ch}
                      </span>
                    ))}
                    {wi < line.length - 1 ? " " : ""}
                  </span>
                ))}
              </span>
            ))
          : words.map((w, i) => (
              <span key={i}>
                <span data-word>{w}</span>{" "}
              </span>
            ))}
      </p>
    </div>
  );
}

function GridItem({ project }: { project: ProjectContent }) {
  const [ref, inView] = useInView<HTMLAnchorElement>("-10% 0px");
  const marquee = `${project.title} ${project.title}`;

  // The hover circle grows from where the pointer entered.
  const onPointerEnter = (e: React.PointerEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--hx", `${((e.clientX - rect.left) / rect.width) * 100}%`);
    e.currentTarget.style.setProperty("--hy", `${((e.clientY - rect.top) / rect.height) * 100}%`);
  };

  return (
    <div className="kj-grid__item">
      <a
        className="kj-card"
        href={project.url || undefined}
        target={/^https?:/.test(project.url) ? "_blank" : undefined}
        rel={/^https?:/.test(project.url) ? "noreferrer" : undefined}
        aria-label={`${project.title}${project.client ? `, ${project.client}` : ""}`}
        ref={ref}
        onPointerEnter={onPointerEnter}
        style={{ "--primary": project.primary, "--secondary": project.secondary } as React.CSSProperties}
      >
        <div className="kj-card__inner">
          <div className="kj-card__hover kj-card__hover--secondary" aria-hidden="true" />
          <div className="kj-card__hover kj-card__hover--primary" aria-hidden="true">
            <div className="kj-card__marquee">
              <div className="kj-card__marquee-inner">
                <p>{marquee}</p>
                <p>{marquee}</p>
              </div>
            </div>
          </div>
          <div className="kj-card__label">
            <p>
              {project.client || project.title}{" "}
              {project.year && <span className="kj-card__anno">({project.year})</span>}
            </p>
          </div>
          <div className="kj-card__background" />
          <DeviceCanvas
            className="kj-card__device"
            device={project.device}
            screens={[project.screen1, project.screen2]}
            hoverTarget={ref}
            active={inView}
          />
          {/* Client logo as a mask so it can take the hover colour. */}
          {project.icon && (
            <span
              className="kj-card__icon"
              style={{ WebkitMaskImage: `url("${project.icon}")`, maskImage: `url("${project.icon}")` }}
              aria-hidden="true"
            />
          )}
        </div>
      </a>
    </div>
  );
}

export default function Grid() {
  const { projects } = useSite();
  return (
    <section className="kj-grid-section" id="works">
      <div className="kj-copyblock" id="profile">
        <HeaderText />
      </div>
      <div className="kj-grid">
        {projects.map((p) => (
          <GridItem key={p.id} project={p} />
        ))}
      </div>
    </section>
  );
}

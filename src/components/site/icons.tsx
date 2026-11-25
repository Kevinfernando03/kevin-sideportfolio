// Site icons: brand monogram, globe, and small arrow / helix marks with CSS motion.

/** Initials of the brand name ("KevinJR" -> "KJR"), used for the round header mark. */
export function initials(brand: string) {
  const caps = brand.match(/[A-Z0-9]/g);
  return (caps?.length ? caps.join("") : brand.slice(0, 1)).slice(0, 3).toUpperCase();
}

export function Monogram({ text, className = "kj-logo" }: { text: string; className?: string }) {
  const letters = initials(text);
  const size = letters.length === 1 ? 20 : letters.length === 2 ? 15 : 12;
  return (
    <svg className={className} viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="18" cy="18" r="18" fill="currentColor" />
      <text
        x="18"
        y="18.5"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={size}
        fontWeight={600}
        letterSpacing="-0.04em"
        fill="#101010"
        style={{ fontFamily: "var(--font-base)" }}
      >
        {letters}
      </text>
    </svg>
  );
}

/** Wireframe globe: concentric meridians squashed into a wide oval. */
export function Earth() {
  return (
    <svg className="kj-earth" viewBox="0 0 84 36" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true">
      {[40.5, 33.5, 26.5, 19.5, 12, 4.5].map((rx) => (
        <ellipse key={rx} cx="42" cy="18" rx={rx} ry="16.5" />
      ))}
    </svg>
  );
}

/** Small arrow pointing up and to the right, for outbound links. */
export function ArrowUpRight() {
  return (
    <svg className="kj-arrow-up" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 14 14 4M6 4h8v8" />
    </svg>
  );
}

export function Dna() {
  return (
    <svg className="kj-dna" viewBox="0 0 84 36" fill="currentColor" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(${i * 21} 0)`}>
          <path d="M0 0h10.5L21 18h-10.5z" />
          <path d="M0 36h10.5L21 18h-10.5z" />
        </g>
      ))}
    </svg>
  );
}

export function Arrow() {
  return (
    <svg className="kj-arrow" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
      <path d="M18 3v29M5 19l13 13 13-13" />
    </svg>
  );
}

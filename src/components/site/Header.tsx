"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Earth, Monogram } from "./icons";
import { NAV_LINKS } from "./data";
import { useSite } from "./SiteContext";

export default function Header() {
  const { brand } = useSite();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <nav className="kj-header">
        <div className="kj-header__inner">
          <div className="kj-header__logo">
            <Link href="/" aria-label={`${brand} home`}>
              <Monogram text={brand} />
            </Link>
          </div>
          <div className="kj-header__icon">
            <Earth />
          </div>
          <div className="kj-header__links">
            {NAV_LINKS.map((link) => (
              <a key={link.label} className="kj-button" href={link.href}>
                <span>{link.label}</span>
              </a>
            ))}
          </div>
          <button
            type="button"
            className={`kj-header__menu${open ? " is-open" : ""}`}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <span />
            <span />
          </button>
        </div>
      </nav>
      <div className={`kj-menu${open ? " is-open" : ""}`} aria-hidden={!open}>
        {NAV_LINKS.map((link) => (
          <a key={link.label} href={link.href} tabIndex={open ? 0 : -1} onClick={() => setOpen(false)}>
            {link.label}
          </a>
        ))}
      </div>
    </>
  );
}

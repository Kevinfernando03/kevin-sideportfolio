"use client";

import DeviceCanvas from "./DeviceCanvas";
import Link from "next/link";
import { ArrowUpRight } from "./icons";
import { useSite } from "./SiteContext";

export default function Footer() {
  const { brand, email, socials } = useSite();
  return (
    <footer className="kj-footer">
      <div className="kj-footer__center">
        <DeviceCanvas className="kj-footer__device" device="glove" />
        <div className="kj-footer__titlewrapper">
          <p className="kj-footer__title">Reach Out</p>
          {email ? (
            <a className="kj-footer__email" href={`mailto:${email}`}>
              {email}
            </a>
          ) : (
            <Link className="kj-footer__email" href="/contact">
              Send a message
            </Link>
          )}
        </div>
      </div>
      <div className="kj-footer__bottom">
        <p className="kj-footer__rights">
          {brand.toUpperCase()}.
          <br /> ALL RIGHTS RESERVED.
        </p>
        <div className="kj-footer__links">
          {socials.map((link) => (
            <a key={link.label} className="kj-footer__link" href={link.href} target="_blank" rel="noreferrer">
              <p>{link.label}</p>
              <ArrowUpRight />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

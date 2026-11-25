"use client";

import { useEffect, useState } from "react";

const KEY = "kj-cookie-consent";

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      setShow(!localStorage.getItem(KEY));
    } catch {
      setShow(true);
    }
  }, []);

  const answer = (value: "accepted" | "rejected") => {
    try {
      localStorage.setItem(KEY, value);
    } catch {}
    setShow(false);
  };

  if (!show) return null;
  return (
    <div className="kj-cookie" role="region" aria-label="Cookie consent">
      <p>
        We use cookies to enhance your browsing experience and to analyze our traffic. By clicking &quot;Accept&quot;, you
        consent to the use of cookies.
      </p>
      <div className="kj-cookie__buttons">
        <button type="button" onClick={() => answer("accepted")}>
          Accept
        </button>
        <button type="button" onClick={() => answer("rejected")}>
          Reject
        </button>
      </div>
    </div>
  );
}

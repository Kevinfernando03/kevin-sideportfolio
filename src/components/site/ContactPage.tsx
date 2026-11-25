"use client";

import { useState } from "react";
import "./site.css";
import type { SiteContent } from "./content";
import Header from "./Header";
import { SiteProvider } from "./SiteContext";

type Status = { kind: "idle" | "sending" | "sent" } | { kind: "error"; text: string };

function ContactForm() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      form.reset();
      setStatus({ kind: "sent" });
    } catch (err) {
      setStatus({ kind: "error", text: (err as Error).message });
    }
  };

  if (status.kind === "sent") {
    return (
      <div className="kj-contact__done" role="status">
        <p>Thanks, your message is in.</p>
        <button type="button" className="kj-contact__again" onClick={() => setStatus({ kind: "idle" })}>
          Send another
        </button>
      </div>
    );
  }

  return (
    <form className="kj-contact__form" onSubmit={onSubmit}>
      <label className="kj-field">
        <span>Name</span>
        <input name="name" required maxLength={100} autoComplete="name" />
      </label>
      <label className="kj-field">
        <span>Email</span>
        <input name="email" type="email" required maxLength={254} autoComplete="email" />
      </label>
      <label className="kj-field kj-field--wide">
        <span>Message</span>
        <textarea name="message" required maxLength={5000} rows={5} />
      </label>
      {/* Honeypot for bots; hidden from people and assistive tech. */}
      <input className="kj-contact__hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <div className="kj-contact__actions">
        <button className="kj-contact__submit" type="submit" disabled={status.kind === "sending"}>
          {status.kind === "sending" ? "Sending…" : "Send message"}
        </button>
        {status.kind === "error" && (
          <p className="kj-contact__error" role="alert">
            {status.text}
          </p>
        )}
      </div>
    </form>
  );
}

export default function ContactPage({ content }: { content: SiteContent }) {
  return (
    <SiteProvider content={content}>
      <Header />
      <main className="kj-contact">
        <p className="kj-contact__eyebrow">Contact</p>
        <h1 className="kj-contact__title">Reach Out</h1>
        {content.email && (
          <a className="kj-contact__email" href={`mailto:${content.email}`}>
            {content.email}
          </a>
        )}
        <ContactForm />
        {content.socials.length > 0 && (
          <ul className="kj-contact__socials">
            {content.socials.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noreferrer">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </main>
    </SiteProvider>
  );
}

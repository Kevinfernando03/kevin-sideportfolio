"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import "./admin.css";
import { DEVICE_NAMES, type ProjectContent, type SiteContent, type SiteLink } from "@/components/site/content";
import type { Message } from "@/server/store";

type Tab = "profile" | "projects" | "messages";
type Status = { kind: "idle" | "saving" } | { kind: "ok" | "error"; text: string };

function Field({
  label,
  hint,
  value,
  onChange,
  multiline,
  type = "text",
  placeholder,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="adm-field">
      <span>{label}</span>
      {multiline ? (
        <textarea value={value} rows={4} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
      {hint && <small>{hint}</small>}
    </label>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="adm-field">
      <span>{label}</span>
      <span className="adm-color">
        <input type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"} onChange={(e) => onChange(e.target.value)} />
        <input type="text" value={value} maxLength={7} onChange={(e) => onChange(e.target.value)} />
      </span>
    </label>
  );
}

function ProfileTab({ content, set }: { content: SiteContent; set: (c: SiteContent) => void }) {
  const patch = (p: Partial<SiteContent>) => set({ ...content, ...p });
  const setSocial = (i: number, p: Partial<SiteLink>) =>
    patch({ socials: content.socials.map((s, j) => (j === i ? { ...s, ...p } : s)) });

  return (
    <div className="adm-stack">
      <section className="adm-card">
        <h2>Brand</h2>
        <div className="adm-grid">
          <Field label="Name / title" hint="Shown as the big wordmark, the browser tab title and the footer." value={content.brand} onChange={(brand) => patch({ brand })} />
          <Field label="Tagline" hint="Small line under the wordmark." value={content.tagline} onChange={(tagline) => patch({ tagline })} />
        </div>
        <Field label="Description" hint="Used by search engines and link previews." value={content.description} onChange={(description) => patch({ description })} multiline />
        <Field
          label="Phone hero lines"
          hint="One line per row; shown at the bottom of the hero on phones."
          value={content.headline.join("\n")}
          onChange={(v) => patch({ headline: v.split("\n") })}
          multiline
        />
      </section>

      <section className="adm-card">
        <h2>About</h2>
        <Field label="Heading" value={content.about.subtitle} onChange={(subtitle) => patch({ about: { ...content.about, subtitle } })} />
        <Field label="Text" value={content.about.text} onChange={(text) => patch({ about: { ...content.about, text } })} multiline />
      </section>

      <section className="adm-card">
        <h2>Contact</h2>
        <Field
          label="Public email"
          type="email"
          hint="Shown in the footer and on the contact page. Leave empty to show only the contact form."
          placeholder="you@example.com"
          value={content.email}
          onChange={(email) => patch({ email })}
        />
        <div className="adm-subhead">
          <h3>Social links</h3>
          <button
            type="button"
            className="adm-btn"
            disabled={content.socials.length >= 8}
            onClick={() => patch({ socials: [...content.socials, { label: "", href: "" }] })}
          >
            + Add link
          </button>
        </div>
        {content.socials.length === 0 && <p className="adm-muted">No social links yet.</p>}
        {content.socials.map((s, i) => (
          <div className="adm-row" key={i}>
            <Field label="Label" placeholder="IG." value={s.label} onChange={(label) => setSocial(i, { label })} />
            <Field label="URL" placeholder="https://instagram.com/you" value={s.href} onChange={(href) => setSocial(i, { href })} />
            <button
              type="button"
              className="adm-btn adm-btn--danger"
              onClick={() => patch({ socials: content.socials.filter((_, j) => j !== i) })}
            >
              Remove
            </button>
          </div>
        ))}
      </section>

      <section className="adm-card">
        <h2>Showreel</h2>
        <Field
          label="Video URL"
          hint="An MP4 URL, or a path to a file in the public folder (e.g. /videos/reel.mp4)."
          value={content.reelUrl}
          onChange={(reelUrl) => patch({ reelUrl })}
        />
      </section>
    </div>
  );
}

function newProject(): ProjectContent {
  return {
    id: Math.random().toString(36).slice(2, 10),
    title: "New project",
    client: "",
    year: String(new Date().getFullYear()),
    device: "laptop",
    primary: "#ffd600",
    secondary: "#101010",
    url: "",
    icon: "",
    screen1: "",
    screen2: "",
  };
}

function ProjectsTab({ content, set }: { content: SiteContent; set: (c: SiteContent) => void }) {
  const projects = content.projects;
  const setProjects = (next: ProjectContent[]) => set({ ...content, projects: next });
  const update = (i: number, p: Partial<ProjectContent>) => setProjects(projects.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const move = (i: number, d: -1 | 1) => {
    const next = [...projects];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    setProjects(next);
  };

  return (
    <div className="adm-stack">
      <div className="adm-subhead">
        <p className="adm-muted">Cards appear on the home page in this order. Each one shows a 3D device that reacts to the mouse.</p>
        <button type="button" className="adm-btn" disabled={projects.length >= 24} onClick={() => setProjects([...projects, newProject()])}>
          + Add project
        </button>
      </div>
      {projects.map((p, i) => (
        <section className="adm-card adm-project" key={p.id} style={{ borderLeftColor: p.primary }}>
          <div className="adm-subhead">
            <h2>
              {i + 1}. {p.title || "Untitled"}
            </h2>
            <div className="adm-actions">
              <button type="button" className="adm-btn" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">
                ↑
              </button>
              <button type="button" className="adm-btn" disabled={i === projects.length - 1} onClick={() => move(i, 1)} aria-label="Move down">
                ↓
              </button>
              <button
                type="button"
                className="adm-btn adm-btn--danger"
                onClick={() => confirm(`Delete "${p.title}"?`) && setProjects(projects.filter((_, j) => j !== i))}
              >
                Delete
              </button>
            </div>
          </div>
          <div className="adm-grid">
            <Field label="Title" value={p.title} onChange={(title) => update(i, { title })} />
            <Field label="Client" value={p.client} onChange={(client) => update(i, { client })} />
            <Field label="Year" value={p.year} onChange={(year) => update(i, { year })} />
            <label className="adm-field">
              <span>Device</span>
              <select value={p.device} onChange={(e) => update(i, { device: e.target.value as ProjectContent["device"] })}>
                {DEVICE_NAMES.map((d) => (
                  <option key={d} value={d}>
                    {d.replace("-", " ")}
                  </option>
                ))}
              </select>
            </label>
            <ColorField label="Hover colour" value={p.primary} onChange={(primary) => update(i, { primary })} />
            <ColorField label="Accent colour" value={p.secondary} onChange={(secondary) => update(i, { secondary })} />
            <Field label="Link" placeholder="https://… (optional)" value={p.url} onChange={(url) => update(i, { url })} />
            <Field label="Logo image URL" placeholder="https://…/logo.png (optional)" value={p.icon} onChange={(icon) => update(i, { icon })} />
            <Field
              label="Screen image 1"
              hint="Shown on the device screen. Leave empty for the default."
              placeholder="/images/my-work.jpg"
              value={p.screen1}
              onChange={(screen1) => update(i, { screen1 })}
            />
            <Field
              label="Screen image 2"
              hint="The screen crossfades to this one."
              placeholder="(optional)"
              value={p.screen2}
              onChange={(screen2) => update(i, { screen2 })}
            />
          </div>
        </section>
      ))}
    </div>
  );
}

function MessagesTab({ messages, setMessages }: { messages: Message[]; setMessages: (m: Message[]) => void }) {
  const [error, setError] = useState("");

  const refresh = async () => {
    const res = await fetch("/api/admin/messages");
    if (res.status === 401) return location.reload();
    if (res.ok) setMessages(await res.json());
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this message?")) return;
    const res = await fetch(`/api/admin/messages?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (res.status === 401) return location.reload();
    if (res.ok) setMessages(messages.filter((m) => m.id !== id));
    else setError((await res.json().catch(() => ({}))).error || "Could not delete the message");
  };

  return (
    <div className="adm-stack">
      <div className="adm-subhead">
        <p className="adm-muted">
          {messages.length} message{messages.length === 1 ? "" : "s"} from the contact form.
        </p>
        <button type="button" className="adm-btn" onClick={refresh}>
          Refresh
        </button>
      </div>
      {error && <p className="adm-error">{error}</p>}
      {messages.length === 0 && <p className="adm-card adm-muted">No messages yet. They&apos;ll appear here when someone uses the contact page.</p>}
      {messages.map((m) => (
        <article className="adm-card adm-message" key={m.id}>
          <div className="adm-subhead">
            <div>
              <strong>{m.name}</strong> · <a href={`mailto:${m.email}`}>{m.email}</a>
              <p className="adm-muted">{new Date(m.createdAt).toLocaleString()}</p>
            </div>
            <button type="button" className="adm-btn adm-btn--danger" onClick={() => remove(m.id)}>
              Delete
            </button>
          </div>
          <p className="adm-message__body">{m.message}</p>
        </article>
      ))}
    </div>
  );
}

export default function AdminPanel({ initialContent, initialMessages }: { initialContent: SiteContent; initialMessages: Message[] }) {
  const [tab, setTab] = useState<Tab>("profile");
  const [content, setContent] = useState(initialContent);
  const [saved, setSaved] = useState(initialContent);
  const [messages, setMessages] = useState(initialMessages);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const dirty = JSON.stringify(content) !== JSON.stringify(saved);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const save = async () => {
    setStatus({ kind: "saving" });
    try {
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(content),
      });
      if (res.status === 401) return location.reload();
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setStatus({ kind: "error", text: data.error || "Save failed" });
      setContent(data.content);
      setSaved(data.content);
      setStatus({ kind: "ok", text: "Saved. Reload the site to see it." });
    } catch {
      setStatus({ kind: "error", text: "Could not reach the server" });
    }
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    location.reload();
  };

  return (
    <div className="adm-root">
      <header className="adm-top">
        <div className="adm-top__title">
          <strong>{saved.brand}</strong> <span className="adm-muted">admin</span>
        </div>
        <nav className="adm-tabs" aria-label="Sections">
          {(["profile", "projects", "messages"] as Tab[]).map((t) => (
            <button key={t} type="button" className={tab === t ? "is-active" : ""} aria-current={tab === t ? "page" : undefined} onClick={() => setTab(t)}>
              {t === "profile" ? "Profile" : t === "projects" ? `Projects (${content.projects.length})` : `Messages (${messages.length})`}
            </button>
          ))}
        </nav>
        <div className="adm-actions">
          <Link className="adm-btn" href="/" target="_blank">
            View site ↗
          </Link>
          <button type="button" className="adm-btn" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      <main className="adm-main">
        {tab === "profile" && <ProfileTab content={content} set={setContent} />}
        {tab === "projects" && <ProjectsTab content={content} set={setContent} />}
        {tab === "messages" && <MessagesTab messages={messages} setMessages={setMessages} />}
      </main>

      {tab !== "messages" && (
        <footer className={`adm-savebar${dirty ? " is-dirty" : ""}`}>
          <p role="status" className={status.kind === "error" ? "adm-error" : "adm-muted"}>
            {status.kind === "error" ? status.text : dirty ? "Unsaved changes" : status.kind === "ok" ? status.text : "All changes saved"}
          </p>
          <div className="adm-actions">
            <button type="button" className="adm-btn" disabled={!dirty || status.kind === "saving"} onClick={() => setContent(saved)}>
              Discard
            </button>
            <button type="button" className="adm-btn adm-btn--primary" disabled={!dirty || status.kind === "saving"} onClick={save}>
              {status.kind === "saving" ? "Saving…" : "Save changes"}
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}

// Input validation for everything the backend accepts. Anything rendered as a link
// is restricted to http(s), mailto or same-site paths so stored content can't inject
// javascript: URLs.
import { randomUUID } from "crypto";
import { DEVICE_NAMES, type ProjectContent, type SiteContent, type SiteLink } from "@/components/site/content";
import type { DeviceName } from "@/components/site/data";

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

class Invalid extends Error {}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function obj(v: unknown, field: string): Record<string, unknown> {
  if (!v || typeof v !== "object" || Array.isArray(v)) throw new Invalid(`${field} is malformed`);
  return v as Record<string, unknown>;
}

function list(v: unknown, field: string, max: number): unknown[] {
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v)) throw new Invalid(`${field} must be a list`);
  if (v.length > max) throw new Invalid(`${field} can have at most ${max} entries`);
  return v;
}

function text(v: unknown, field: string, max: number, required = false): string {
  if (v === undefined || v === null) v = "";
  if (typeof v !== "string") throw new Invalid(`${field} must be text`);
  const s = v.trim();
  if (required && !s) throw new Invalid(`${field} is required`);
  if (s.length > max) throw new Invalid(`${field} must be at most ${max} characters`);
  return s;
}

function email(v: unknown, field: string, required = false): string {
  const s = text(v, field, 254, required);
  if (s && !EMAIL_RE.test(s)) throw new Invalid(`${field} is not a valid email address`);
  return s;
}

function url(v: unknown, field: string, opts: { relative?: boolean; mailto?: boolean } = {}): string {
  const s = text(v, field, 500);
  if (!s) return "";
  if (opts.relative && s.startsWith("/") && !s.startsWith("//")) return s;
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    throw new Invalid(`${field} must be a full URL (https://…)`);
  }
  const allowed = u.protocol === "http:" || u.protocol === "https:" || (opts.mailto && u.protocol === "mailto:");
  if (!allowed) throw new Invalid(`${field} must start with https://`);
  return u.toString();
}

function color(v: unknown, field: string): string {
  const s = text(v, field, 7, true).toLowerCase();
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(s);
  if (short) return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`;
  if (!/^#[0-9a-f]{6}$/.test(s)) throw new Invalid(`${field} must be a hex colour like #ff6600`);
  return s;
}

function project(v: unknown, i: number, seen: Set<string>): ProjectContent {
  const p = obj(v, `Project ${i + 1}`);
  const at = (f: string) => `Project ${i + 1} ${f}`;
  let id = typeof p.id === "string" && /^[a-z0-9-]{1,40}$/.test(p.id) ? p.id : randomUUID().slice(0, 8);
  if (seen.has(id)) id = randomUUID().slice(0, 8);
  seen.add(id);
  const device = p.device as DeviceName;
  if (!DEVICE_NAMES.includes(device)) throw new Invalid(`${at("device")} is not one of the available devices`);
  return {
    id,
    title: text(p.title, at("title"), 80, true),
    client: text(p.client, at("client"), 60),
    year: text(p.year, at("year"), 12),
    device,
    primary: color(p.primary, at("primary colour")),
    secondary: color(p.secondary, at("secondary colour")),
    url: url(p.url, at("link"), { relative: true }),
    icon: url(p.icon, at("logo"), { relative: true }),
    screen1: url(p.screen1, at("screen image 1"), { relative: true }),
    screen2: url(p.screen2, at("screen image 2"), { relative: true }),
  };
}

function social(v: unknown, i: number): SiteLink {
  const s = obj(v, `Social link ${i + 1}`);
  const label = text(s.label, `Social link ${i + 1} label`, 20, true);
  const href = url(s.href, `Social link ${i + 1} URL`, { mailto: true });
  if (!href) throw new Invalid(`Social link ${i + 1} URL is required`);
  return { label, href };
}

export function sanitizeContent(input: unknown): Result<SiteContent> {
  try {
    const c = obj(input, "Content");
    const about = obj(c.about ?? {}, "About");
    const seen = new Set<string>();
    const headline = list(c.headline, "Headline", 6)
      .map((l, i) => text(l, `Headline line ${i + 1}`, 60))
      .filter(Boolean);
    return {
      ok: true,
      value: {
        brand: text(c.brand, "Brand name", 40, true),
        description: text(c.description, "Description", 300),
        tagline: text(c.tagline, "Tagline", 90),
        headline,
        about: {
          subtitle: text(about.subtitle, "About heading", 40),
          text: text(about.text, "About text", 400, true),
        },
        email: email(c.email, "Email"),
        socials: list(c.socials, "Social links", 8).map(social),
        reelUrl: url(c.reelUrl, "Showreel video", { relative: true }) || "/media/reel.mp4",
        projects: list(c.projects, "Projects", 24).map((p, i) => project(p, i, seen)),
      },
    };
  } catch (e) {
    if (e instanceof Invalid) return { ok: false, error: e.message };
    throw e;
  }
}

export interface MessageInput {
  name: string;
  email: string;
  message: string;
}

export function sanitizeMessage(input: unknown): Result<MessageInput> {
  try {
    const m = obj(input, "Message");
    return {
      ok: true,
      value: {
        name: text(m.name, "Name", 100, true),
        email: email(m.email, "Email", true),
        message: text(m.message, "Message", 5000, true),
      },
    };
  } catch (e) {
    if (e instanceof Invalid) return { ok: false, error: e.message };
    throw e;
  }
}

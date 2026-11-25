// File-backed store: data/content.json (site content) and data/messages.json (contact
// form submissions). Writes are serialised so concurrent requests can't interleave.
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { DEFAULT_CONTENT, type SiteContent } from "@/components/site/content";
import { sanitizeContent, type MessageInput } from "./validate";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const CONTENT_FILE = path.join(DATA_DIR, "content.json");
const MESSAGES_FILE = path.join(DATA_DIR, "messages.json");
const MAX_MESSAGES = 1000;

export interface Message extends MessageInput {
  id: string;
  createdAt: string;
}

let queue: Promise<unknown> = Promise.resolve();
function serialize<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

async function readJson<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw e;
  }
}

async function writeJson(file: string, value: unknown) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const body = JSON.stringify(value, null, 2) + "\n";
  const tmp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tmp, body, "utf8");
  try {
    await fs.rename(tmp, file);
  } catch {
    // Some sandboxed or network filesystems refuse renames; fall back to a direct write.
    await fs.writeFile(file, body, "utf8");
    await fs.rm(tmp, { force: true });
  }
}

export async function readContent(): Promise<SiteContent> {
  const raw = await readJson<unknown>(CONTENT_FILE);
  if (raw === null) return DEFAULT_CONTENT;
  const result = sanitizeContent(raw);
  if (!result.ok) {
    console.error(`[store] ${CONTENT_FILE} is invalid (${result.error}); serving defaults`);
    return DEFAULT_CONTENT;
  }
  return result.value;
}

export function writeContent(content: SiteContent) {
  return serialize(() => writeJson(CONTENT_FILE, content));
}

export async function listMessages(): Promise<Message[]> {
  return (await readJson<Message[]>(MESSAGES_FILE)) ?? [];
}

export function addMessage(input: MessageInput) {
  return serialize(async () => {
    const message: Message = { id: randomUUID(), createdAt: new Date().toISOString(), ...input };
    const messages = await listMessages();
    await writeJson(MESSAGES_FILE, [message, ...messages].slice(0, MAX_MESSAGES));
    return message;
  });
}

export function deleteMessage(id: string) {
  return serialize(async () => {
    const messages = await listMessages();
    const next = messages.filter((m) => m.id !== id);
    if (next.length !== messages.length) await writeJson(MESSAGES_FILE, next);
    return next.length !== messages.length;
  });
}

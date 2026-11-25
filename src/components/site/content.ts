// Editable site content. The backend stores this in data/content.json and the admin
// panel edits it; DEFAULT_CONTENT is used until the first save.
import { ASSET_BASE, type DeviceName } from "./data";

export const DEVICE_NAMES: DeviceName[] = [
  "headphones",
  "laptop",
  "dashboard",
  "boombox",
  "keycard",
  "gameboy",
  "controller",
  "tablet",
  "magnifying-glass",
];

export interface SiteLink {
  label: string;
  href: string;
}

export interface ProjectContent {
  id: string;
  title: string;
  client: string;
  year: string;
  device: DeviceName;
  /** Hover circle fill, and the marquee / hover-label colour. */
  primary: string;
  secondary: string;
  /** Where the card links to; empty for no link. */
  url: string;
  /** Optional logo (PNG/SVG with transparency), drawn as a mask in the card corner. */
  icon: string;
  /** Optional images shown on the device screen (it crossfades between the two). */
  screen1: string;
  screen2: string;
}

export interface SiteContent {
  brand: string;
  description: string;
  tagline: string;
  /** Hero copy shown on phones, one line per entry. */
  headline: string[];
  about: { subtitle: string; text: string };
  email: string;
  socials: SiteLink[];
  reelUrl: string;
  projects: ProjectContent[];
}

const COLORS: [string, string][] = [
  ["#ff5b49", "#000000"],
  ["#b7ff95", "#5259ff"],
  ["#ff6600", "#000000"],
  ["#101010", "#00b764"],
  ["#d4b4ed", "#8a43ff"],
  ["#fb7a01", "#1c53c8"],
  ["#5793d0", "#283350"],
  ["#a6e1f5", "#0e67fa"],
  ["#efefef", "#0e67fa"],
];

export const DEFAULT_CONTENT: SiteContent = {
  brand: "KevinJR",
  description: "KevinJR: digital design, motion and technology.",
  tagline: "Digital design, motion and technology.",
  headline: ["Digital Design,", "Motion", "And Technology", "By KevinJR."],
  about: {
    subtitle: "Who I am",
    text: "KevinJR is a creative developer who loves crafting smooth digital experiences, mixing design, motion and technology.",
  },
  email: "",
  socials: [],
  reelUrl: `${ASSET_BASE}/reel.mp4`,
  projects: DEVICE_NAMES.map((device, i) => ({
    id: `project-${i + 1}`,
    title: `Project 0${i + 1}`,
    client: "Your client",
    year: "2026",
    device,
    primary: COLORS[i][0],
    secondary: COLORS[i][1],
    url: "",
    icon: "",
    screen1: "",
    screen2: "",
  })),
};

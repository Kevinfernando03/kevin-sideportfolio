// Device configuration for the home page. Editable copy lives in content.ts and the
// backend store.

export const ASSET_BASE = "/media";

export type DeviceName =
  | "headphones"
  | "laptop"
  | "dashboard"
  | "boombox"
  | "keycard"
  | "gameboy"
  | "controller"
  | "tablet"
  | "magnifying-glass"
  | "glove";

export type Quality = "medium" | "high";

export interface DeviceConfig {
  columns: number;
  rows: number;
  displacement: number;
  scaleImage: [number, number];
  offsetImage: [number, number];
  glass?: boolean;
  /** Screen images; defaults to the device's baked mask-0 / mask-1 maps. */
  images?: [string, string];
}

export const DEVICES: Record<DeviceName, DeviceConfig> = {
  headphones: { columns: 4, rows: 4, displacement: 0.65, scaleImage: [0.95, 1.55], offsetImage: [0, -0.45] },
  laptop: {
    columns: 4,
    rows: 4,
    displacement: 0.5,
    scaleImage: [1, 1],
    offsetImage: [0, 0],
    images: [`${ASSET_BASE}/maps/laptop_screen-1.png`, `${ASSET_BASE}/maps/laptop_screen-2.png`],
  },
  dashboard: { columns: 4, rows: 4, displacement: 0.25, scaleImage: [1.25, 1.25], offsetImage: [0, 0] },
  boombox: { columns: 4, rows: 4, displacement: 0.4, scaleImage: [0.55, 0.8], offsetImage: [0.5, -0.35], glass: true },
  keycard: { columns: 4, rows: 4, displacement: 0.45, scaleImage: [0.55, 2.45], offsetImage: [-0.4, 0] },
  gameboy: { columns: 4, rows: 4, displacement: 0.35, scaleImage: [0.95, 1.55], offsetImage: [0, -0.45] },
  controller: { columns: 4, rows: 4, displacement: 0.4, scaleImage: [2.45, 3.6], offsetImage: [-0.05, 0] },
  tablet: { columns: 4, rows: 4, displacement: 0.5, scaleImage: [1.15, 1.6], offsetImage: [0.05, 0.05] },
  "magnifying-glass": {
    columns: 4,
    rows: 4,
    displacement: 0.35,
    scaleImage: [0.55, 1.75],
    offsetImage: [0, -0.15],
    glass: true,
    images: [`${ASSET_BASE}/maps/magnifying-glass_screen-1.jpg`, `${ASSET_BASE}/maps/magnifying-glass_screen-2.jpg`],
  },
  glove: { columns: 8, rows: 4, displacement: 0.1, scaleImage: [0.25, 0.3], offsetImage: [-0.05, 1] },
};

// Maps stored as PNG (the rest are JPG).
const PNG_MAPS = new Set([
  "boombox_data-medium", "boombox_mv-medium", "boombox_position-medium", "boombox_mask-0", "boombox_mask-1",
  "controller_data-medium", "controller_mv-medium", "controller_position-medium", "controller_mask-0", "controller_mask-1",
  "controller_data-high", "controller_mv-high", "controller_position-high",
  "dashboard_data-medium", "dashboard_mv-medium", "dashboard_position-medium", "dashboard_mask-0", "dashboard_mask-1",
  "gameboy_data-medium", "gameboy_position-medium", "gameboy_mask-0", "gameboy_mask-1",
  "gameboy_data-high", "gameboy_position-high",
  "glove_data-medium", "glove_mv-medium", "glove_position-medium", "glove_mask-0", "glove_mask-1",
  "headphones_data-medium", "headphones_mv-medium", "headphones_position-medium",
  "keycard_data-medium", "keycard_mv-medium", "keycard_position-medium", "keycard_mask-0", "keycard_mask-1",
  "laptop_data-medium", "laptop_mv-medium", "laptop_position-medium",
  "magnifying-glass_data-medium", "magnifying-glass_mv-medium", "magnifying-glass_position-medium",
  "magnifying-glass_mask-0", "magnifying-glass_mask-1",
  "tablet_data-medium", "tablet_mv-medium", "tablet_position-medium", "tablet_mask-0", "tablet_mask-1",
  "tablet_data-high", "tablet_mv-high", "tablet_position-high",
]);

export function mapUrl(name: string) {
  return `${ASSET_BASE}/maps/${name}.${PNG_MAPS.has(name) ? "png" : "jpg"}`;
}

export interface DeviceMaps {
  diffuse: string;
  alpha: string;
  motion: string;
  data: string;
  position: string;
  glass?: string;
  image1: string;
  image2: string;
}

export function deviceMaps(device: DeviceName, quality: Quality = "medium"): DeviceMaps {
  const cfg = DEVICES[device];
  const q = (t: string) => mapUrl(`${device}_${t}-${quality}`);
  return {
    diffuse: q("diffuse"),
    alpha: q("alpha"),
    motion: q("mv"),
    data: q("data"),
    position: q("position"),
    glass: cfg.glass ? mapUrl(`${device}_glass-medium`) : undefined,
    image1: cfg.images?.[0] ?? mapUrl(`${device}_mask-0`),
    image2: cfg.images?.[1] ?? mapUrl(`${device}_mask-1`),
  };
}

/** Devices the hero slideshow cycles through. */
export const HEADER_DEVICES: DeviceName[] = ["gameboy", "controller", "tablet"];

export const NAV_LINKS = [
  { label: "Works", href: "/#works" },
  { label: "Profile", href: "/#profile" },
  { label: "Contact", href: "/contact" },
];

// Page-wide input state shared by every device renderer: the pointer position
// normalised to the window, and the current scroll velocity.

export const pointer = { x: 0.5, y: 0.5 };
export const scroll = { velocity: 0 };

let listening = false;

export function listenPointer() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  window.addEventListener(
    "pointermove",
    (e) => {
      pointer.x = e.clientX / window.innerWidth;
      pointer.y = e.clientY / window.innerHeight;
    },
    { passive: true },
  );
}

export const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

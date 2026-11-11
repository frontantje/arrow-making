import type { Container, Graphics, TextStyleOptions } from "pixi.js";

export interface Scene {
  readonly view: Container;
  // dt in seconds
  update(dt: number): void;
  // pixelScale: screen pixels per art pixel
  resize(width: number, height: number, pixelScale: number): void;
}

export const textStyle: TextStyleOptions = {
  fill: 0xffffff,
  fontFamily: "monospace",
  fontSize: 20,
  lineHeight: 26,
  stroke: { color: 0x000000, width: 4 },
};

export function drawLifeBar(
  g: Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  hp: number,
  maxHp: number,
) {
  const share = maxHp > 0 ? Math.min(1, Math.max(0, hp / maxHp)) : 0;
  const color = share > 0.5 ? 0x4caf50 : share > 0.25 ? 0xf5c542 : 0xe53935;
  g.rect(x - 1, y - 1, width + 2, height + 2).fill({
    color: 0x000000,
    alpha: 0.5,
  });
  if (share > 0) g.rect(x, y, width * share, height).fill(color);
}

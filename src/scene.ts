import type { Container, TextStyleOptions } from "pixi.js";

/** One screen of the game (overworld, battle, ...). main.ts shows one at a time. */
export interface Scene {
  readonly view: Container;
  /** Called every frame. `dt` is the number of seconds since the last frame. */
  update(dt: number): void;
  /** Called when the screen size changes. `pixelScale` is how big one art pixel is on screen. */
  resize(width: number, height: number, pixelScale: number): void;
}

export const textStyle: TextStyleOptions = {
  fill: 0xffffff,
  fontFamily: "monospace",
  fontSize: 20,
  lineHeight: 26,
  stroke: { color: 0x000000, width: 4 },
};

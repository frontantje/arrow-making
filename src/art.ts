import { Assets, Graphics, Rectangle, Renderer, Texture } from "pixi.js";

/** Size of one map tile (and one creature) in art pixels. */
export const TILE = 16;

type Shape = "tile" | "grass" | "rock" | "square" | "circle";
type ArtSpec = { file: string } | { color: number; shape: Shape };

/**
 * Every picture in the game lives here.
 *
 * Right now they are all placeholders drawn with code. To use a real drawing,
 * save a 16x16 PNG into public/assets/ and point the entry at it, e.g.
 *   hero1: { file: "assets/hero1.png" },
 */
export const ART = {
  // map tiles
  floor: { color: 0x9bd36a, shape: "tile" },
  tallGrass: { color: 0x3f9b46, shape: "grass" },
  wall: { color: 0x7d6f63, shape: "tile" },
  water: { color: 0x4a90d9, shape: "tile" },
  rock: { color: 0x9a948c, shape: "rock" },

  // heroes
  hero1: { color: 0xe8553e, shape: "square" },
  hero2: { color: 0x3e7be8, shape: "square" },
  hero3: { color: 0xe8c23e, shape: "square" },
  hero4: { color: 0x8e3ee8, shape: "square" },

  // wild creatures
  wild1: { color: 0xa05cd6, shape: "circle" },
} satisfies Record<string, ArtSpec>;

export type ArtName = keyof typeof ART;

const textures = new Map<ArtName, Texture>();

/** Loads (or draws) every picture. Call once before the game starts. */
export async function loadArt(renderer: Renderer) {
  for (const [name, spec] of Object.entries(ART) as [ArtName, ArtSpec][]) {
    const texture =
      "file" in spec
        ? await Assets.load<Texture>(spec.file)
        : drawPlaceholder(renderer, spec.color, spec.shape);
    texture.source.scaleMode = "nearest";
    textures.set(name, texture);
  }
}

export function art(name: ArtName): Texture {
  return textures.get(name) ?? Texture.WHITE;
}

function drawPlaceholder(renderer: Renderer, color: number, shape: Shape) {
  const g = new Graphics();

  if (shape === "square" || shape === "circle") {
    // body: square for heroes, round for wild creatures
    if (shape === "square") g.rect(2, 3, 12, 12).fill(color);
    else g.circle(8, 9, 6.5).fill(color);
    g.rect(4, 6, 3, 3).rect(9, 6, 3, 3).fill(0xffffff); // eyes
    g.rect(5, 7, 2, 2).rect(10, 7, 2, 2).fill(0x000000); // pupils
  } else if (shape === "rock") {
    g.rect(0, 0, TILE, TILE).fill(0x9bd36a); // grass underneath
    g.rect(3, 4, 10, 10).rect(2, 6, 12, 7).fill(color); // boulder
    g.rect(4, 5, 4, 2).fill({ color: 0xffffff, alpha: 0.35 }); // shine
    g.rect(3, 12, 10, 2).fill({ color: 0x000000, alpha: 0.25 }); // shadow
  } else {
    g.rect(0, 0, TILE, TILE).fill(color);
    // faint edge so you can see the grid
    g.rect(0, TILE - 1, TILE, 1)
      .rect(TILE - 1, 0, 1, TILE - 1)
      .fill({ color: 0x000000, alpha: 0.12 });
    if (shape === "grass") {
      for (const [x, y] of [
        [3, 3],
        [10, 2],
        [6, 9],
        [12, 10],
      ]) {
        g.rect(x, y, 1, 3).rect(x + 2, y + 1, 1, 2);
      }
      g.fill(0x2a6e31);
    }
  }

  const texture = renderer.generateTexture({
    target: g,
    frame: new Rectangle(0, 0, TILE, TILE),
    resolution: 1,
    antialias: false,
  });
  g.destroy();
  return texture;
}

import {
  Assets,
  Container,
  Graphics,
  Rectangle,
  Renderer,
  Sprite,
  Texture,
} from "pixi.js";

export const TILE = 16;

type Shape = "tile" | "grass" | "rock" | "square" | "circle";
type Placeholder = { color: number; shape: Shape };

// placeholders, used when there's no src/sprites/<name>.png
export const ART = {
  floor: { color: 0x9bd36a, shape: "tile" },
  tallGrass: { color: 0x3f9b46, shape: "grass" },
  wall: { color: 0x7d6f63, shape: "tile" },
  water: { color: 0x4a90d9, shape: "tile" },
  rock: { color: 0x9a948c, shape: "rock" },

  flippy: { color: 0xe8553e, shape: "square" },
  kaempfer: { color: 0x3e7be8, shape: "square" },
  wanderer: { color: 0xe8c23e, shape: "square" },
  sucher: { color: 0x8e3ee8, shape: "square" },

  monster1: { color: 0xa05cd6, shape: "circle" },
} satisfies Record<string, Placeholder>;

export type ArtName = keyof typeof ART;

const spriteUrls = new Map(
  Object.entries(
    import.meta.glob<string>("./sprites/*.png", {
      eager: true,
      query: "?url",
      import: "default",
    }),
  ).map(([path, url]) => [
    path.slice("./sprites/".length, -".png".length).toLowerCase(),
    url,
  ]),
);

const textures = new Map<ArtName, Texture>();

export async function loadArt(renderer: Renderer) {
  for (const [name, placeholder] of Object.entries(ART) as [
    ArtName,
    Placeholder,
  ][]) {
    const url = spriteUrls.get(name.toLowerCase());
    const texture = url
      ? fitToTile(renderer, await Assets.load<Texture>(url))
      : drawPlaceholder(renderer, placeholder);
    texture.source.scaleMode = "nearest";
    textures.set(name, texture);
  }
}

export function art(name: ArtName): Texture {
  return textures.get(name) ?? Texture.WHITE;
}

// exports at 2x, 10x, ... are shrunk back to one tile
function fitToTile(renderer: Renderer, texture: Texture) {
  if (texture.width === TILE && texture.height === TILE) return texture;
  texture.source.scaleMode = "nearest";
  const scale = TILE / Math.max(texture.width, texture.height);
  const sprite = new Sprite(texture);
  sprite.scale.set(scale);
  sprite.position.set(
    (TILE - texture.width * scale) / 2,
    TILE - texture.height * scale,
  );
  const holder = new Container();
  holder.addChild(sprite);
  return render(renderer, holder);
}

function drawPlaceholder(renderer: Renderer, { color, shape }: Placeholder) {
  const g = new Graphics();

  if (shape === "square" || shape === "circle") {
    if (shape === "square") g.rect(2, 3, 12, 12).fill(color);
    else g.circle(8, 9, 6.5).fill(color);
    g.rect(4, 6, 3, 3).rect(9, 6, 3, 3).fill(0xffffff);
    g.rect(5, 7, 2, 2).rect(10, 7, 2, 2).fill(0x000000);
  } else if (shape === "rock") {
    g.rect(0, 0, TILE, TILE).fill(0x9bd36a);
    g.rect(3, 4, 10, 10).rect(2, 6, 12, 7).fill(color);
    g.rect(4, 5, 4, 2).fill({ color: 0xffffff, alpha: 0.35 });
    g.rect(3, 12, 10, 2).fill({ color: 0x000000, alpha: 0.25 });
  } else {
    g.rect(0, 0, TILE, TILE).fill(color);
    // grid line
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

  return render(renderer, g);
}

function render(renderer: Renderer, target: Container) {
  const texture = renderer.generateTexture({
    target,
    frame: new Rectangle(0, 0, TILE, TILE),
    resolution: 1,
    antialias: false,
  });
  target.destroy({ children: true });
  return texture;
}

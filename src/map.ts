import type { ArtName } from "./art";

/**
 * The world map. Every character is one tile, so you can draw it with your keyboard!
 *
 *   #  wall
 *   .  grass floor
 *   ,  tall grass (wild creatures hide in here)
 *   ~  water
 *   @  where the player starts
 */
export const MAP = [
  "####################",
  "#..................#",
  "#..@.......,,,,,...#",
  "#..........,,,,,...#",
  "#...~~~....,,,,,...#",
  "#...~~~............#",
  "#..........####....#",
  "#..,,,.....#..#....#",
  "#..,,,.............#",
  "#..,,,.......~~~...#",
  "#............~~~...#",
  "####################",
];

type TileInfo = {
  art: ArtName;
  /** You can't walk through it. */
  solid?: boolean;
  /** Wild creatures can appear when you step here. */
  wild?: boolean;
};

/** What each map character means. Add your own! */
export const TILES: Record<string, TileInfo> = {
  "#": { art: "wall", solid: true },
  ".": { art: "floor" },
  "@": { art: "floor" },
  ",": { art: "tallGrass", wild: true },
  "~": { art: "water", solid: true },
};

export function tileAt(x: number, y: number): TileInfo | undefined {
  return TILES[MAP[y]?.[x] ?? ""];
}

export function isWalkable(x: number, y: number) {
  const tile = tileAt(x, y);
  return tile !== undefined && !tile.solid;
}

export function findStart() {
  for (let y = 0; y < MAP.length; y++) {
    const x = MAP[y].indexOf("@");
    if (x >= 0) return { x, y };
  }
  return { x: 1, y: 1 };
}

export const MAP_WIDTH = Math.max(...MAP.map((row) => row.length));
export const MAP_HEIGHT = MAP.length;

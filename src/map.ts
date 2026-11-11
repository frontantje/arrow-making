import type { ArtName } from "./art";
import type { Hero } from "./heroes";
import type { Skill } from "./skills";

/**
 * The world map. Every character is one tile, so you can draw it with your keyboard!
 *
 *   #  wall (nobody gets through)
 *   .  grass floor
 *   ,  tall grass (wild creatures hide in here)
 *   ~  water (only heroes with "Schwimmen")
 *   ^  rocks (only heroes with "Fliegen")
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
  "#..,,,......^^.....#",
  "#..,,,.......~~~...#",
  "#............~~~...#",
  "####################",
];

type TileInfo = {
  art: ArtName;
  /** Nobody can walk through it. */
  solid?: boolean;
  /** Only heroes with this skill can go here. */
  needs?: Skill;
  /** Wild creatures can appear when you step here. */
  wild?: boolean;
};

/** What each map character means. Add your own! */
export const TILES: Record<string, TileInfo> = {
  "#": { art: "wall", solid: true },
  ".": { art: "floor" },
  "@": { art: "floor" },
  ",": { art: "tallGrass", wild: true },
  "~": { art: "water", needs: "Schwimmen" },
  "^": { art: "rock", needs: "Fliegen" },
};

export function tileAt(x: number, y: number): TileInfo | undefined {
  return TILES[MAP[y]?.[x] ?? ""];
}

/** The skill `hero` would need to step onto this tile, if they don't have it. */
export function missingSkill(x: number, y: number, hero: Hero): Skill | null {
  const needs = tileAt(x, y)?.needs;
  return needs && !hero.skills.includes(needs) ? needs : null;
}

/** Can `hero` step onto this tile? */
export function canEnter(x: number, y: number, hero: Hero) {
  const tile = tileAt(x, y);
  return tile !== undefined && !tile.solid && !missingSkill(x, y, hero);
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

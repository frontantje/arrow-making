import type { ArtName } from "./art";
import type { Hero } from "./heroes";
import type { Skill } from "./skills";

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
  solid?: boolean;
  needs?: Skill;
  wild?: boolean;
};

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

export function missingSkill(x: number, y: number, hero: Hero): Skill | null {
  const needs = tileAt(x, y)?.needs;
  return needs && !hero.skills.includes(needs) ? needs : null;
}

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

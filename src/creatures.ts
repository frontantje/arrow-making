import type { ArtName } from "./art";

/** What every hero and every wild creature has: a name and a picture. */
export type Creature = { name: string; art: ArtName };

export type WildCreature = Creature & {
  /** Higher-level creatures give more EP when they're defeated. */
  level: number;
  stats: {
    /** Hit points (LP): how much damage it takes to defeat it. */
    hp: number;
    /** How much damage it would do if it attacked. (It doesn't fight back yet!) */
    strength: number;
  };
};

/**
 * Creatures that can jump out of the tall grass.
 * Their name is used without "der/die/das", e.g. "Wildes ??? erscheint!".
 */
export const wildCreatures: WildCreature[] = [
  {
    name: "Wildes ???",
    art: "wild1",
    level: 1,
    stats: { hp: 10, strength: 2 },
  },
];

/** How many EP every hero who attacked gets for defeating this creature. */
export function xpReward(creature: WildCreature) {
  return Math.max(0, creature.level) * 5;
}

import type { ArtName } from "./art";

export type Creature = { name: string; art: ArtName };

export type WildCreature = Creature & {
  level: number;
  stats: {
    hp: number;
    strength: number;
  };
};

// names are used without an article: "Wildes ??? erscheint!"
export const wildCreatures: WildCreature[] = [
  {
    name: "Wildes ???",
    art: "wild1",
    level: 1,
    stats: { hp: 10, strength: 2 },
  },
];

export function xpReward(creature: WildCreature) {
  return Math.max(0, creature.level) * 5;
}

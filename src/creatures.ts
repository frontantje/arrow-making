import type { ArtName } from "./art";
import type { Terrain } from "./map";

export type Creature = { name: string; art: ArtName };

export type WildCreature = Creature & {
  // where it can appear (the tile also needs wild: true in map.ts)
  terrain: Terrain;
  level: number;
  stats: {
    hp: number;
    strength: number;
  };
};

// names are used without an article: "Wildes ??? erscheint!"
export const wildCreatures: WildCreature[] = [
  {
    name: "Glibber",
    art: "monster1",
    terrain: "grass",
    level: 1,
    stats: { hp: 30, strength: 10 },
  },
  {
    name: "Robo",
    art: "robot1",
    terrain: "grass",
    level: 2,
    stats: { hp: 60, strength: 50 },
  },
  {
    name: "Blubb",
    art: "wassermonster1",
    terrain: "water",
    level: 2,
    stats: { hp: 50, strength: 20 },
  },
];

// every 2 points of luck roll once more; the weakest creature rolled appears
const LUCK_PER_REROLL = 2;

export function pickCreature(
  terrain: Terrain | undefined,
  luck: number,
): WildCreature | null {
  const here = wildCreatures.filter((c) => c.terrain === terrain);
  if (here.length === 0) return null;
  const roll = () => here[Math.floor(Math.random() * here.length)];
  let creature = roll();
  const rerolls = Math.floor(Math.max(0, luck) / LUCK_PER_REROLL);
  for (let i = 0; i < rerolls; i++) {
    const other = roll();
    if (power(other) < power(creature)) creature = other;
  }
  return creature;
}

function power(creature: WildCreature) {
  return creature.stats.hp + creature.stats.strength;
}

export function xpReward(creature: WildCreature) {
  return Math.max(0, creature.level) * 5;
}

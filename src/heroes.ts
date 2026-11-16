import type { Creature } from "./creatures";
import type { Terrain } from "./map";
import type { Skill } from "./skills";

export type Hero = Creature & {
  skills: Skill[];
  level: number;
  // EP towards the next level
  xp: number;
  stats: {
    // full LP; current LP is hpOf(hero)
    hp: number;
    strength: number;
    // tiles per second
    speed: number;
    // per point: 10 % chance of a double-damage hit, fewer and weaker creatures
    luck: number;
    inventorySlots: number;
  };
  // added to the stats while the hero stands on that terrain
  boosts?: Partial<Record<Terrain, Partial<Record<BoostableStat, number>>>>;
};

export type StatName = keyof Hero["stats"];
export type BoostableStat = "strength" | "speed" | "luck";

export const party: Hero[] = [
  {
    name: "Flippy",
    art: "flippy",
    skills: ["Fliegen"],
    level: 1,
    xp: 0,
    stats: { hp: 25, strength: 15, speed: 5, luck: 4, inventorySlots: 6 },
  },
  {
    name: "Kämpfer",
    art: "kaempfer",
    skills: [],
    level: 1,
    xp: 0,
    stats: { hp: 60, strength: 40, speed: 2, luck: 1, inventorySlots: 10 },
  },
  {
    name: "Wanderer",
    art: "wanderer",
    skills: ["Singen"],
    level: 1,
    xp: 0,
    stats: { hp: 30, strength: 25, speed: 4, luck: 3, inventorySlots: 10 },
  },
  {
    name: "Sucher",
    art: "sucher",
    skills: ["Schwimmen", "Tauchen"],
    level: 1,
    xp: 0,
    stats: { hp: 40, strength: 20, speed: 3, luck: 2, inventorySlots: 10 },
    boosts: { water: { strength: 10, speed: 2 } },
  },
];

let activeIndex = 0;

export function activeHero(): Hero {
  return party[activeIndex];
}

export function setActiveHero(index: number) {
  activeIndex = index;
}

export function switchHero() {
  activeIndex = (activeIndex + 1) % party.length;
}

const damageTaken = new Map<Hero, number>();

export function hpOf(hero: Hero) {
  return Math.max(0, hero.stats.hp - (damageTaken.get(hero) ?? 0));
}

export function hurt(hero: Hero, damage: number) {
  damageTaken.set(hero, (damageTaken.get(hero) ?? 0) + Math.max(0, damage));
}

export function heal(hero: Hero) {
  damageTaken.delete(hero);
}

const standingOn = new Map<Hero, Terrain>();

export function standOn(hero: Hero, terrain: Terrain | undefined) {
  if (terrain) standingOn.set(hero, terrain);
  else standingOn.delete(hero);
}

export function terrainOf(hero: Hero): Terrain | undefined {
  return standingOn.get(hero);
}

export function boostOf(hero: Hero, stat: StatName): number {
  const terrain = terrainOf(hero);
  const boosts: Partial<Record<StatName, number>> =
    (terrain && hero.boosts?.[terrain]) || {};
  return boosts[stat] ?? 0;
}

export function statOf(hero: Hero, stat: StatName): number {
  return hero.stats[stat] + boostOf(hero, stat);
}

export function xpForNextLevel(level: number) {
  return Math.max(1, level * 10);
}

export const LEVEL_UP_BONUS: Partial<Record<StatName, number>> = {
  hp: 2,
  strength: 1,
};

// returns the levels reached
export function gainXp(hero: Hero, xp: number): number[] {
  hero.xp += xp;
  const reached: number[] = [];
  while (hero.xp >= xpForNextLevel(hero.level)) {
    hero.xp -= xpForNextLevel(hero.level);
    hero.level += 1;
    for (const [stat, bonus] of Object.entries(LEVEL_UP_BONUS)) {
      hero.stats[stat as StatName] += bonus;
    }
    reached.push(hero.level);
  }
  return reached;
}

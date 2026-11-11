import type { Creature } from "./creatures";
import type { Skill } from "./skills";

export type Hero = Creature & {
  /** What the hero can do. The list of all skills is in skills.ts. */
  skills: Skill[];
  /** Goes up when the hero has collected enough EP (see the bottom of this file). */
  level: number;
  /** Experience points (EP) collected towards the next level. */
  xp: number;
  stats: {
    /** How much damage one attack does. */
    strength: number;
    /** How many tiles per second the hero walks. */
    speed: number;
    /** Chance of a lucky hit that does double damage: 1 = 10 %, 5 = 50 %, 10 = every hit. */
    luck: number;
    /** How many things the hero can carry. (There are no things to pick up yet!) */
    inventorySlots: number;
  };
};

export type StatName = keyof Hero["stats"];

/** Your team. Tap a hero in the corner (or press Q) to switch who's in front. */
export const party: Hero[] = [
  {
    name: "Flippy",
    art: "hero1",
    skills: ["Fliegen"],
    level: 1,
    xp: 0,
    stats: { strength: 1, speed: 8, luck: 4, inventorySlots: 2 },
  },
  {
    name: "Kämpfer",
    art: "hero2",
    skills: [],
    level: 1,
    xp: 0,
    stats: { strength: 10, speed: 5, luck: 1, inventorySlots: 4 },
  },
  {
    name: "Wanderer",
    art: "hero3",
    skills: ["Singen"],
    level: 1,
    xp: 0,
    stats: { strength: 5, speed: 7, luck: 3, inventorySlots: 6 },
  },
  {
    name: "Sucher",
    art: "hero4",
    skills: ["Schwimmen", "Tauchen"],
    level: 1,
    xp: 0,
    stats: { strength: 7, speed: 6, luck: 2, inventorySlots: 5 },
  },
];

// --- who's in front right now ---

let activeIndex = 0;

export function activeHero(): Hero {
  return party[activeIndex];
}

export function setActiveHero(index: number) {
  activeIndex = index;
}

/** Puts the next hero in front. */
export function switchHero() {
  activeIndex = (activeIndex + 1) % party.length;
}

// --- levels ---

/** How many EP a hero needs to get from `level` to the next one: 10, 20, 30, ... */
export function xpForNextLevel(level: number) {
  return Math.max(1, level * 10);
}

/** What a hero gets every time they reach a new level. */
export const LEVEL_UP_BONUS: Partial<Record<StatName, number>> = {
  strength: 1,
};

/** Gives a hero EP. Returns every new level they reached (empty if none). */
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

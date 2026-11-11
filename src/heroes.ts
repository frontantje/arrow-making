import type { Creature } from "./creatures";
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
    // 1 = 10 % chance of a double-damage hit
    luck: number;
    inventorySlots: number;
  };
};

export type StatName = keyof Hero["stats"];

export const party: Hero[] = [
  {
    name: "Flippy",
    art: "flippy",
    skills: ["Fliegen"],
    level: 1,
    xp: 0,
    stats: { hp: 12, strength: 1, speed: 8, luck: 4, inventorySlots: 2 },
  },
  {
    name: "Kämpfer",
    art: "kaempfer",
    skills: [],
    level: 1,
    xp: 0,
    stats: { hp: 25, strength: 10, speed: 5, luck: 1, inventorySlots: 4 },
  },
  {
    name: "Wanderer",
    art: "wanderer",
    skills: ["Singen"],
    level: 1,
    xp: 0,
    stats: { hp: 18, strength: 5, speed: 7, luck: 3, inventorySlots: 6 },
  },
  {
    name: "Sucher",
    art: "sucher",
    skills: ["Schwimmen", "Tauchen"],
    level: 1,
    xp: 0,
    stats: { hp: 20, strength: 7, speed: 6, luck: 2, inventorySlots: 5 },
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

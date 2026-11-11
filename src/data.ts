import type { ArtName } from "./art";

export type Creature = { name: string; art: ArtName };
export type Hero = Creature & { skills: string[] };

/** Your team. Tap a hero in the corner (or press Q) to switch who's in front. */
export const party: Hero[] = [
  { name: "Hero 1", art: "hero1", skills: ["Bonk", "Zoom"] },
  { name: "Hero 2", art: "hero2", skills: ["Splash", "Bubble", "Hide"] },
  { name: "Hero 3", art: "hero3", skills: ["Sing"] },
];

/** Creatures that can jump out of the tall grass. */
export const wildCreatures: Creature[] = [{ name: "Wild ???", art: "wild1" }];

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

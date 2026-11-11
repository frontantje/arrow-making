import type { StatName } from "./heroes";

/** What each hero stat is called in the game. */
const STAT_NAMES: Record<StatName, string> = {
  strength: "Stärke",
  speed: "Tempo",
  luck: "Glück",
  inventorySlots: "Rucksack",
};

/**
 * Every sentence and label the game shows. Names of heroes, creatures and skills
 * live in heroes.ts, creatures.ts and skills.ts.
 * Want to reword something? Change it here.
 */
export const TEXT = {
  // walking around
  cannot: (hero: string, skill: string) =>
    `${hero} kann nicht ${skill.toLowerCase()}!`,

  // party bar
  stat: (stat: StatName, value: number) => `${STAT_NAMES[stat]} ${value}`,
  level: (level: number, xp: number, needed: number) =>
    `Level ${level} · EP ${xp}/${needed}`, // Erfahrungspunkte
  skills: (skills: string[]) => `Fähigkeiten: ${skills.join(", ")}`,

  // battle
  appears: (creature: string) => `${creature} erscheint!`,
  whatWillDo: (hero: string) => `Was soll ${hero} tun?`,
  attackButton: "Angreifen",
  runButton: "Weglaufen",
  attacks: (hero: string, damage: number) =>
    `${hero} greift an: ${damage} Schaden!`,
  luckyHit: (hero: string, damage: number) =>
    `Volltreffer! ${hero} greift an: ${damage} Schaden!`,
  defeated: (creature: string) => `${creature} ist besiegt!`,
  ranAway: "Puh, entkommen!",
  foeStatus: (level: number, hp: number, max: number) =>
    `Level ${level} · LP ${hp}/${max}`, // Lebenspunkte
  gainedXp: (heroes: string[], xp: number) =>
    `${list(heroes)} ${heroes.length === 1 ? "bekommt" : "bekommen"} ${xp} EP!`,
  levelUp: (hero: string, level: number) => `${hero} erreicht Level ${level}!`,
  statBonus: (stat: StatName, amount: number) =>
    `${STAT_NAMES[stat]} +${amount}`,
};

/** "A", "A und B", "A, B und C" */
function list(words: string[]) {
  if (words.length <= 1) return words.join("");
  return `${words.slice(0, -1).join(", ")} und ${words[words.length - 1]}`;
}

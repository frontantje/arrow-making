import type { StatName } from "./heroes";

const STAT_NAMES: Record<StatName, string> = {
  hp: "LP",
  strength: "Stärke",
  speed: "Tempo",
  luck: "Glück",
  inventorySlots: "Rucksack",
};

export const TEXT = {
  cannot: (hero: string, skill: string) =>
    `${hero} kann nicht ${skill.toLowerCase()}!`,

  stat: (stat: StatName, value: number) => `${STAT_NAMES[stat]} ${value}`,
  level: (level: number, xp: number, needed: number) =>
    `Level ${level} · EP ${xp}/${needed}`,
  hp: (hp: number, max: number) => `LP ${hp}/${max}`,
  skills: (skills: string[]) => `Fähigkeiten: ${skills.join(", ")}`,

  appears: (creature: string) => `${creature} erscheint!`,
  whatWillDo: (hero: string) => `Was soll ${hero} tun?`,
  attackButton: "Angreifen",
  runButton: "Weglaufen",
  attacks: (hero: string, damage: number) =>
    `${hero} greift an: ${damage} Schaden!`,
  luckyHit: (hero: string, damage: number) =>
    `Volltreffer! ${hero} greift an: ${damage} Schaden!`,
  hitsBack: (creature: string, hero: string, damage: number) =>
    `${creature} greift ${hero} an: ${damage} Schaden!`,
  defeated: (creature: string) => `${creature} ist besiegt!`,
  knockedOut: (hero: string) => `${hero} kann nicht mehr kämpfen!`,
  backToStart: (hero: string) => `${hero} wacht am Start wieder auf.`,
  ranAway: "Puh, entkommen!",
  status: (level: number, hp: number, max: number) =>
    `Level ${level} · LP ${hp}/${max}`,
  gainedXp: (heroes: string[], xp: number) =>
    `${list(heroes)} ${heroes.length === 1 ? "bekommt" : "bekommen"} ${xp} EP!`,
  levelUp: (hero: string, level: number) => `${hero} erreicht Level ${level}!`,
  statBonus: (stat: StatName, amount: number) =>
    `${STAT_NAMES[stat]} +${amount}`,
};

// "A", "A und B", "A, B und C"
function list(words: string[]) {
  if (words.length <= 1) return words.join("");
  return `${words.slice(0, -1).join(", ")} und ${words[words.length - 1]}`;
}

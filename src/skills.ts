/**
 * Every skill and what it means. Add a new skill here first, then give it to a hero
 * in heroes.ts. (Which tiles need which skill is set in map.ts.)
 *
 * Skill names are shown in the game, so they're in German. Use the verb form
 * (e.g. "Schwimmen"): messages say "Kämpfer kann nicht schwimmen!".
 */
export const SKILLS = {
  Fliegen: "kann über Felsen fliegen",
  Schwimmen: "kann durchs Wasser schwimmen",
  Singen: "macht noch nichts",
  Tauchen: "macht noch nichts",
};

export type Skill = keyof typeof SKILLS;

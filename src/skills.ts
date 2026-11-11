// shown in the game: use German verbs, as in "Kämpfer kann nicht schwimmen!"
export const SKILLS = {
  Fliegen: "kann über Felsen fliegen",
  Schwimmen: "kann durchs Wasser schwimmen",
  Singen: "macht noch nichts",
  Tauchen: "macht noch nichts",
};

export type Skill = keyof typeof SKILLS;

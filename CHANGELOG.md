# Changelog

Everything that changes in the game gets written down here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and version
numbers follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- New heroes: Flippy, Kämpfer, Wanderer and Sucher.
- Skills mean something now: heroes with **Fliegen** cross rocks, heroes with **Schwimmen** cross water.
- Rocks (`^` on the map).
- Hero stats, shown in the party bar for the hero in front:
  - **strength** (Stärke): damage per attack
  - **speed** (Tempo): how many tiles per second the hero walks
  - **inventory slots** (Rucksack): how much the hero can carry (there's nothing to pick up yet)
  - **luck** (Glück): chance of a "Volltreffer" that does double damage (1 = 10 %)
- Levels: when a wild creature is defeated, every hero who attacked gets EP. 10 EP reach level 2,
  20 more reach level 3, and so on. Each new level gives Stärke +1.
- Wild creatures have a level, HP (LP) and strength (they don't fight back yet), and are drawn
  as circles so they don't look like heroes. Higher-level creatures give more EP.
- In battles you can **Angreifen**: each hit takes the hero's strength off the creature's HP.
- A message when a hero can't go somewhere, e.g. "Kämpfer kann nicht schwimmen!"
- `npm run dev:wifi` to play on a tablet on the same Wi-Fi.

### Changed

- All text in the game is in German now, including the skill names. All wording lives in `src/text.ts`.
- Heroes, wild creatures and skills each have their own file: `heroes.ts`, `creatures.ts`, `skills.ts`.
- You can't switch to a hero who can't stand where you are (e.g. a non-swimmer in the middle of the lake).
- Battles offer Angreifen and Weglaufen instead of a list of skills.

## [0.1.0] - 2026-11-11

### Added

- A small map, drawn with keyboard characters in `src/map.ts`.
- Walking: tap a tile, drag your finger, or use the arrow keys / WASD.
- A party of three placeholder heroes. Tap one in the corner (or press Q) to switch.
- Wild creatures in tall grass start a placeholder battle: pick a skill or run away.
- Placeholder pictures drawn in code, ready to be swapped for real drawings.
- The version number in the bottom-right corner.
- Publishing to GitHub Pages, started by hand from the Actions tab.

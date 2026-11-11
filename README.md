# Arrow Making

A tiny creature-adventure RPG made with [PixiJS](https://pixijs.com). Everything is a
placeholder for now: the heroes, names, skills, creatures and map are all waiting to be invented.

## Run it

```bash
npm install
npm run dev
```

To play on a phone or tablet on the same Wi-Fi, run `npm run dev:wifi` and open the
"Network" address it prints.

## Controls

|              | Touch / mouse                                      | Keyboard          |
| ------------ | -------------------------------------------------- | ----------------- |
| Walk         | Tap where to go, or hold and drag to lead the hero | Arrows / WASD     |
| Pick a hero  | Tap them on the map or in the top corner           | Q / Tab           |
| Attack       | Tap "Angreifen"                                    | Up/Down, then Z   |
| Run away     | Tap "Weglaufen"                                    | X / Esc           |
| Next message | Tap anywhere                                       | Z / Enter / Space |

## Publishing (GitHub Pages)

Publishing only happens when you start it: on GitHub, open the **Actions** tab, pick
**Build and publish**, and click **Run workflow**. It checks the game (lint, type-check,
build) and, if you ran it on `main`, publishes it at `https://<user>.github.io/<repo>/`.
Running it on another branch only does the checks. See `.github/workflows/pages.yml`.

One-time setup: on GitHub, open **Settings → Pages** and set **Source** to **GitHub Actions**.

## Versions and the changelog

The version number shows in the bottom-right corner of the game, so you can tell
whether a tablet has loaded the newest build.

1. As you go, write down what changed under `## [Unreleased]` in [CHANGELOG.md](CHANGELOG.md).
2. When it's time for a new version, commit everything, then run
   `npm version minor` (new things) or `npm version patch` (only fixes).
   This moves the notes into a section for the new version, updates `package.json`,
   and makes a commit and a `vX.Y.Z` tag.
3. `git push --follow-tags`

## Make it yours

| To change...                                        | Edit                                                                                                                                     |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| The map                                             | `src/map.ts`. Draw it with letters!                                                                                                      |
| Heroes, their skills and stats                      | `src/heroes.ts`                                                                                                                          |
| How levels work (EP needed, what a new level gives) | bottom of `src/heroes.ts`                                                                                                                |
| Wild creatures                                      | `src/creatures.ts`                                                                                                                       |
| What each skill means                               | `src/skills.ts`, and which tiles need which skill (`needs: "Schwimmen"`) in `src/map.ts`                                                 |
| Pictures and colours                                | `src/art.ts`. Or draw a 16×16 PNG (e.g. in [Piskel](https://www.piskelapp.com/)), save it in `public/assets/` and point the entry at it. |
| How often creatures appear                          | top of `src/overworld.ts`                                                                                                                |
| What happens in a battle                            | `src/battle.ts`                                                                                                                          |
| Wording of messages and buttons                     | `src/text.ts`                                                                                                                            |

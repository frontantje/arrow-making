// Runs during `npm version`: turns the notes under "Unreleased" in CHANGELOG.md
// into a section for the new version, dated today.
import { readFileSync, writeFileSync } from "node:fs";

const { version } = JSON.parse(readFileSync("package.json", "utf8"));
const date = new Date().toISOString().slice(0, 10);
const heading = "## [Unreleased]";

const changelog = readFileSync("CHANGELOG.md", "utf8");
if (!changelog.includes(heading)) {
  throw new Error(`CHANGELOG.md needs a "${heading}" heading`);
}
writeFileSync(
  "CHANGELOG.md",
  changelog.replace(heading, `${heading}\n\n## [${version}] - ${date}`),
);
console.log(`CHANGELOG.md: added section for ${version}`);

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
} from "node:fs";
import { join } from "node:path";
import type { Plugin } from "vite";

// "Flippy 2.png" -> "flippy", "Kämpfer.png" -> "kaempfer"
function spriteName(file: string) {
  const ascii = file
    .toLowerCase()
    .replaceAll("ä", "ae")
    .replaceAll("ö", "oe")
    .replaceAll("ü", "ue")
    .replaceAll("ß", "ss");
  return ascii.match(/^[a-z][a-z0-9]*/)?.[0];
}

const pngs = (dir: string) =>
  readdirSync(dir).filter((file) => file.toLowerCase().endsWith(".png"));
const modified = (path: string) => statSync(path).mtimeMs;

// while the dev server runs, keeps src/sprites in sync with a shared folder (e.g. in iCloud Drive)
export function spriteInbox(inbox: string | undefined): Plugin {
  return {
    name: "sprite-inbox",
    apply: "serve",
    configureServer(server) {
      if (!inbox) return;
      const sprites = join(server.config.root, "src/sprites");
      mkdirSync(inbox, { recursive: true });
      for (const file of pngs(sprites)) {
        if (!existsSync(join(inbox, file))) {
          copyFileSync(join(sprites, file), join(inbox, file));
        }
      }

      const pull = () => {
        const newest = new Map<string, string>();
        for (const file of pngs(inbox)) {
          const name = spriteName(file);
          const path = join(inbox, file);
          const current = name && newest.get(name);
          if (name && (!current || modified(path) > modified(current))) {
            newest.set(name, path);
          }
        }
        for (const [name, from] of newest) {
          const to = join(sprites, `${name}.png`);
          const changed =
            !existsSync(to) ||
            (modified(from) > modified(to) &&
              !readFileSync(from).equals(readFileSync(to)));
          if (changed) {
            copyFileSync(from, to);
            server.config.logger.info(`sprite updated: ${name}.png`);
          }
        }
      };

      server.config.logger.info(`sprite inbox: ${inbox}`);
      const timer = setInterval(() => {
        try {
          pull();
        } catch (error) {
          server.config.logger.warn(`sprite inbox: ${error}`);
        }
      }, 1500);
      server.httpServer?.on("close", () => clearInterval(timer));
    },
  };
}

import { defineConfig, loadEnv } from "vite";
import { version } from "./package.json";
import { spriteInbox } from "./scripts/spriteInbox";

const commit = process.env.GITHUB_SHA?.slice(0, 7);

export default defineConfig(({ mode }) => ({
  // relative paths, so it works in any folder (e.g. GitHub Pages)
  base: "./",
  define: {
    __VERSION__: JSON.stringify(
      commit ? `v${version} (${commit})` : `v${version}`,
    ),
  },
  plugins: [
    spriteInbox(loadEnv(mode, process.cwd(), "SPRITES_").SPRITES_INBOX),
  ],
  server: {
    port: 8080,
    open: true,
  },
}));

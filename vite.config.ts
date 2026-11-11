import { defineConfig } from "vite";
import { version } from "./package.json";

// On GitHub, show which commit a build came from as well.
const commit = process.env.GITHUB_SHA?.slice(0, 7);

// https://vite.dev/config/
export default defineConfig({
  // Relative paths, so the game works from any folder,
  // e.g. https://<user>.github.io/<repo>/ on GitHub Pages.
  base: "./",
  define: {
    __VERSION__: JSON.stringify(
      commit ? `v${version} (${commit})` : `v${version}`,
    ),
  },
  server: {
    port: 8080,
    open: true,
  },
});

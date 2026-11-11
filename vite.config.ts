import { defineConfig } from "vite";
import { version } from "./package.json";

const commit = process.env.GITHUB_SHA?.slice(0, 7);

export default defineConfig({
  // relative paths, so it works in any folder (e.g. GitHub Pages)
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

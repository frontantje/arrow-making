import { Application, Container, Text, TextureSource } from "pixi.js";
import { loadArt } from "./art";
import { Battle } from "./battle";
import { Input } from "./input";
import { Overworld } from "./overworld";
import type { Scene } from "./scene";

// Pixel art: keep pixels sharp instead of blurry when they're scaled up.
TextureSource.defaultOptions.scaleMode = "nearest";

/** The shorter side of the screen shows at least this many art pixels (160 = 10 tiles). */
const MIN_VIEW = 160;

(async () => {
  const app = new Application();
  await app.init({
    background: "#1b1b24",
    resizeTo: window,
    antialias: false,
    roundPixels: true,
    resolution: window.devicePixelRatio,
    autoDensity: true,
  });
  document.getElementById("pixi-container")!.appendChild(app.canvas);
  // no "save image" menu when a finger is held down
  app.canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  await loadArt(app.renderer);

  const input = new Input();
  const sceneLayer = new Container();
  // which version is running, so you can tell if a tablet has the newest one
  const versionLabel = new Text({
    text: __VERSION__,
    style: { fill: 0xffffff, fontFamily: "monospace", fontSize: 12 },
  });
  versionLabel.alpha = 0.6;
  versionLabel.anchor.set(1, 1);
  app.stage.addChild(sceneLayer, versionLabel);

  let scene: Scene;
  let size = { width: 0, height: 0 };

  function layout() {
    const { width, height } = app.screen;
    size = { width, height };
    // Scale art by whole numbers only, so every pixel stays the same size.
    const pixelScale = Math.max(
      1,
      Math.floor(Math.min(width, height) / MIN_VIEW),
    );
    scene.resize(width, height, pixelScale);
    versionLabel.position.set(width - 6, height - 4);
  }

  function showScene(next: Scene) {
    sceneLayer.removeChildren();
    sceneLayer.addChild(next.view);
    scene = next;
    layout();
  }

  const overworld = new Overworld(input, (wild) => {
    const battle = new Battle(input, wild, () => {
      showScene(overworld);
      battle.view.destroy({ children: true });
    });
    showScene(battle);
  });
  showScene(overworld);

  app.ticker.add((ticker) => {
    if (app.screen.width !== size.width || app.screen.height !== size.height) {
      layout();
    }
    scene.update(Math.min(ticker.deltaMS / 1000, 0.1));
    input.endFrame();
  });
})();

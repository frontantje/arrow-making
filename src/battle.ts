import { Container, Graphics, Rectangle, Sprite, Text } from "pixi.js";
import { art } from "./art";
import { activeHero, switchHero, type Creature, type Hero } from "./data";
import type { Input } from "./input";
import { PartyBar } from "./partyBar";
import { textStyle, type Scene } from "./scene";

const BUTTON_HEIGHT = 40;
const BUTTON_GAP = 8;

/**
 * A placeholder battle: pick a skill, see a message, done.
 * There's no HP or damage yet. How battles work is still to be invented!
 *
 * Touch: tap a skill button, tap anywhere to continue.
 * Keyboard: up/down + Z to pick, X to run.
 */
export class Battle implements Scene {
  readonly view = new Container();
  private background = new Graphics();
  private foe: Sprite;
  private hero = new Sprite();
  private partyBar = new PartyBar();
  private message = new Text({ text: "", style: textStyle });
  private menu = new Container();
  private buttons: Graphics[] = [];
  private buttonWidth = 300;

  private step: "intro" | "choose" | "outcome" = "intro";
  private cursor = 0;
  private shownHero: Hero | null = null;
  /** Taps are remembered here and dealt with in update(). */
  private tapped: number | "screen" | null = null;

  constructor(
    private input: Input,
    wild: Creature,
    private onDone: () => void,
  ) {
    this.foe = new Sprite(art(wild.art));
    this.foe.anchor.set(0.5, 1);
    this.hero.anchor.set(0.5, 1);
    this.view.addChild(
      this.background,
      this.foe,
      this.hero,
      this.message,
      this.menu,
      this.partyBar,
    );
    this.view.eventMode = "static";
    this.view.on("pointerdown", () => (this.tapped ??= "screen"));

    this.message.text = `A ${wild.name} appeared!`;
    this.menu.visible = false;
    this.showHero();
  }

  update() {
    const { input } = this;
    const tapped = this.tapped;
    this.tapped = null;

    if (input.wasPressed("switch")) switchHero();
    if (activeHero() !== this.shownHero) this.showHero();

    switch (this.step) {
      case "intro":
        if (tapped !== null || input.wasPressed("confirm")) {
          this.step = "choose";
          this.message.text = `What will ${activeHero().name} do?`;
          this.menu.visible = true;
        }
        break;

      case "choose": {
        const count = this.buttons.length;
        const before = this.cursor;
        if (input.wasPressed("up"))
          this.cursor = (this.cursor + count - 1) % count;
        if (input.wasPressed("down")) this.cursor = (this.cursor + 1) % count;
        if (this.cursor !== before) this.drawButtons();

        if (typeof tapped === "number") this.choose(tapped);
        else if (input.wasPressed("confirm")) this.choose(this.cursor);
        else if (input.wasPressed("back")) this.choose(count - 1); // run
        break;
      }

      case "outcome":
        if (
          tapped !== null ||
          input.wasPressed("confirm") ||
          input.wasPressed("back")
        ) {
          this.onDone();
        }
        break;
    }
  }

  resize(width: number, height: number, pixelScale: number) {
    this.view.hitArea = new Rectangle(0, 0, width, height);
    this.partyBar.position.set(12, 12);
    this.partyBar.layout(pixelScale);

    // The "field" is where the creatures stand, the "panel" holds words and buttons.
    // Side by side on wide screens, one above the other on tall ones.
    const wide = width > height;
    const field = wide
      ? { x: 0, y: 0, w: width * 0.55, h: height }
      : { x: 0, y: 0, w: width, h: height * 0.5 };
    const panel = wide
      ? { x: field.w, y: 0, w: width - field.w, h: height }
      : { x: 0, y: field.h, w: width, h: height - field.h };

    this.background
      .clear()
      .rect(0, 0, width, height)
      .fill(0x87c8e8) // sky
      .rect(field.x, field.y + field.h * 0.5, field.w, field.h * 0.5)
      .fill(0x9bd36a) // ground
      .rect(panel.x, panel.y, panel.w, panel.h)
      .fill(0x2b2b3a);

    const creatureScale = pixelScale * 2;
    this.foe.scale.set(creatureScale);
    this.foe.position.set(field.x + field.w * 0.7, field.y + field.h * 0.55);
    this.hero.scale.set(creatureScale);
    this.hero.position.set(field.x + field.w * 0.3, field.y + field.h * 0.85);

    this.buttonWidth = Math.min(panel.w - 32, 420);
    const left = panel.x + (panel.w - this.buttonWidth) / 2;
    const top = wide
      ? panel.y + Math.max(16, (panel.h - 300) / 2)
      : panel.y + 16;
    this.message.position.set(left, top);
    this.message.style.wordWrap = true;
    this.message.style.wordWrapWidth = this.buttonWidth;
    this.menu.position.set(left, top + 64);
    this.drawButtons();
  }

  private choose(index: number) {
    const hero = activeHero();
    const skill = hero.skills[index];
    this.message.text = skill
      ? `${hero.name} used ${skill}!`
      : "Got away safely!";
    this.menu.visible = false;
    this.step = "outcome";
  }

  /** Shows the hero in front, and a button for each of their skills. */
  private showHero() {
    const hero = activeHero();
    this.shownHero = hero;
    this.hero.texture = art(hero.art);
    this.partyBar.refresh();
    if (this.step === "choose")
      this.message.text = `What will ${hero.name} do?`;

    for (const old of this.menu.removeChildren())
      old.destroy({ children: true });
    this.cursor = 0;
    this.buttons = [...hero.skills, "Run away"].map((label, i) => {
      const background = new Graphics();
      const text = new Text({ text: label, style: textStyle });
      text.position.set(14, 7);
      const button = new Container();
      button.addChild(background, text);
      button.y = i * (BUTTON_HEIGHT + BUTTON_GAP);
      button.eventMode = "static";
      button.cursor = "pointer";
      button.on("pointerdown", (e) => {
        e.stopPropagation();
        this.tapped = i;
      });
      this.menu.addChild(button);
      return background;
    });
    this.drawButtons();
  }

  private drawButtons() {
    this.buttons.forEach((background, i) => {
      const selected = i === this.cursor;
      background
        .clear()
        .roundRect(0, 0, this.buttonWidth, BUTTON_HEIGHT, 8)
        .fill({ color: 0xffffff, alpha: selected ? 0.25 : 0.1 });
      if (selected) background.stroke({ color: 0xffffff, width: 2 });
    });
  }
}

import { Container, Graphics, Rectangle, Sprite, Text } from "pixi.js";
import { art, TILE } from "./art";
import { xpReward, type WildCreature } from "./creatures";
import {
  activeHero,
  gainXp,
  LEVEL_UP_BONUS,
  switchHero,
  type Hero,
  type StatName,
} from "./heroes";
import type { Input } from "./input";
import { PartyBar } from "./partyBar";
import { textStyle, type Scene } from "./scene";
import { TEXT } from "./text";

const ACTIONS = [
  { id: "attack", label: TEXT.attackButton },
  { id: "run", label: TEXT.runButton },
] as const;
const BUTTON_HEIGHT = 40;
const BUTTON_GAP = 8;

/**
 * A simple battle: attack until the wild creature has no HP left, or run away.
 * Each attack takes the hero's strength away from the creature's HP,
 * so strong heroes win faster. Lucky heroes sometimes hit twice as hard.
 * Switch heroes any time with the party bar.
 * After a win, every hero who attacked gets EP and may reach a new level.
 * The creature doesn't fight back yet. That's still to be invented!
 *
 * Touch: tap a button, tap anywhere to continue.
 * Keyboard: up/down + Z to pick, X to run.
 */
export class Battle implements Scene {
  readonly view = new Container();
  private background = new Graphics();
  private foe: Sprite;
  private hero = new Sprite();
  private hpBar = new Graphics();
  private hpText = new Text({
    text: "",
    style: { ...textStyle, fontSize: 14 },
  });
  private hpBarArea = { x: 0, y: 0, width: 0 };
  private partyBar = new PartyBar();
  private message = new Text({ text: "", style: textStyle });
  private menu = new Container();
  private buttons: Graphics[];
  private buttonWidth = 300;

  private step: "intro" | "choose" | "outcome" = "intro";
  private cursor = 0;
  private hp: number;
  private maxHp: number;
  private shownHero: Hero | null = null;
  /** Every hero who attacked in this battle. They all get EP if we win. */
  private fighters = new Set<Hero>();
  /** Messages still to show after the battle, one per tap. */
  private afterBattle: string[] = [];
  /** Taps are remembered here and dealt with in update(). */
  private tapped: number | "screen" | null = null;

  constructor(
    private input: Input,
    private wild: WildCreature,
    private onDone: () => void,
  ) {
    this.maxHp = Math.max(1, wild.stats.hp);
    this.hp = this.maxHp;
    this.foe = new Sprite(art(wild.art));
    this.foe.anchor.set(0.5, 1);
    this.hero.anchor.set(0.5, 1);
    this.hpText.anchor.set(0.5, 1);
    this.view.addChild(
      this.background,
      this.foe,
      this.hero,
      this.hpBar,
      this.hpText,
      this.message,
      this.menu,
      this.partyBar,
    );
    this.view.eventMode = "static";
    this.view.on("pointerdown", () => (this.tapped ??= "screen"));

    this.buttons = ACTIONS.map(({ label }, i) => {
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

    this.message.text = TEXT.appears(wild.name);
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
          this.message.text = TEXT.whatWillDo(activeHero().name);
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
        else if (input.wasPressed("back")) this.choose(1); // run
        break;
      }

      case "outcome":
        if (
          tapped !== null ||
          input.wasPressed("confirm") ||
          input.wasPressed("back")
        ) {
          const next = this.afterBattle.shift();
          if (next) this.message.text = next;
          else this.onDone();
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
    const creatureSize = TILE * creatureScale;
    this.foe.scale.set(creatureScale);
    this.foe.position.set(field.x + field.w * 0.7, field.y + field.h * 0.55);
    this.hero.scale.set(creatureScale);
    this.hero.position.set(field.x + field.w * 0.3, field.y + field.h * 0.85);
    this.hpBarArea = {
      x: this.foe.x - creatureSize / 2,
      y: this.foe.y - creatureSize - 14,
      width: creatureSize,
    };
    this.drawHpBar();

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
    if (ACTIONS[index]?.id === "attack") {
      this.attack();
    } else {
      this.message.text = TEXT.ranAway;
      this.finish();
    }
  }

  private attack() {
    const hero = activeHero();
    this.fighters.add(hero);
    const lucky = Math.random() < hero.stats.luck / 10;
    const damage = Math.max(0, hero.stats.strength) * (lucky ? 2 : 1);
    this.hp = Math.max(0, this.hp - damage);
    this.drawHpBar();
    this.message.text = lucky
      ? TEXT.luckyHit(hero.name, damage)
      : TEXT.attacks(hero.name, damage);
    if (this.hp === 0) {
      this.message.text += `\n${TEXT.defeated(this.wild.name)}`;
      this.foe.alpha = 0.3;
      this.giveXp();
      this.finish();
    }
  }

  /** Every hero who attacked gets EP, and maybe a new level. */
  private giveXp() {
    const xp = xpReward(this.wild);
    if (xp <= 0) return;
    const fighters = [...this.fighters];
    this.afterBattle.push(
      TEXT.gainedXp(
        fighters.map((hero) => hero.name),
        xp,
      ),
    );
    const bonus = Object.entries(LEVEL_UP_BONUS)
      .map(([stat, amount]) => TEXT.statBonus(stat as StatName, amount))
      .join(", ");
    for (const hero of fighters) {
      for (const level of gainXp(hero, xp)) {
        this.afterBattle.push(`${TEXT.levelUp(hero.name, level)}\n${bonus}`);
      }
    }
    this.partyBar.refresh();
  }

  private finish() {
    this.menu.visible = false;
    this.step = "outcome";
  }

  private showHero() {
    const hero = activeHero();
    this.shownHero = hero;
    this.hero.texture = art(hero.art);
    this.partyBar.refresh();
    if (this.step === "choose") this.message.text = TEXT.whatWillDo(hero.name);
  }

  private drawHpBar() {
    const { x, y, width } = this.hpBarArea;
    const share = this.hp / this.maxHp;
    const color = share > 0.5 ? 0x4caf50 : share > 0.25 ? 0xf5c542 : 0xe53935;
    this.hpBar
      .clear()
      .rect(x - 2, y - 2, width + 4, 12)
      .fill({ color: 0x000000, alpha: 0.5 })
      .rect(x, y, width * share, 8)
      .fill(color);
    this.hpText.text = TEXT.foeStatus(this.wild.level, this.hp, this.maxHp);
    this.hpText.position.set(x + width / 2, y - 4);
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

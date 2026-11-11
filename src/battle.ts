import { Container, Graphics, Rectangle, Sprite, Text } from "pixi.js";
import { art, TILE } from "./art";
import { xpReward, type WildCreature } from "./creatures";
import {
  gainXp,
  hpOf,
  hurt,
  LEVEL_UP_BONUS,
  type Hero,
  type StatName,
} from "./heroes";
import type { Input } from "./input";
import { PartyBar } from "./partyBar";
import { drawLifeBar, textStyle, type Scene } from "./scene";
import { TEXT } from "./text";

export type BattleResult = "won" | "ran" | "knockedOut";

const ACTIONS = [
  { id: "attack", label: TEXT.attackButton },
  { id: "run", label: TEXT.runButton },
] as const;
const BUTTON_HEIGHT = 40;
const BUTTON_GAP = 8;
const MESSAGE_HEIGHT = 120;

type BarArea = { x: number; y: number; width: number };

export class Battle implements Scene {
  readonly view = new Container();
  private background = new Graphics();
  private foe: Sprite;
  private heroSprite: Sprite;
  private bars = new Graphics();
  private foeStatus = new Text({
    text: "",
    style: { ...textStyle, fontSize: 14 },
  });
  private heroStatus = new Text({
    text: "",
    style: { ...textStyle, fontSize: 14 },
  });
  private foeBar: BarArea = { x: 0, y: 0, width: 0 };
  private heroBar: BarArea = { x: 0, y: 0, width: 0 };
  private partyBar = new PartyBar(false);
  private message = new Text({ text: "", style: textStyle });
  private menu = new Container();
  private buttons: Graphics[];
  private buttonWidth = 300;

  private step: "intro" | "choose" | "outcome" = "intro";
  private result: BattleResult = "won";
  private cursor = 0;
  private foeHp: number;
  private foeMaxHp: number;
  private afterBattle: string[] = [];
  // handled in update(), so the scene is never destroyed mid-event
  private tapped: number | "screen" | null = null;

  constructor(
    private input: Input,
    private hero: Hero,
    private wild: WildCreature,
    private onDone: (result: BattleResult) => void,
  ) {
    this.foeMaxHp = Math.max(1, wild.stats.hp);
    this.foeHp = this.foeMaxHp;
    this.foe = new Sprite(art(wild.art));
    this.heroSprite = new Sprite(art(hero.art));
    for (const thing of [this.foe, this.heroSprite]) thing.anchor.set(0.5, 1);
    for (const status of [this.foeStatus, this.heroStatus])
      status.anchor.set(0.5, 1);
    this.view.addChild(
      this.background,
      this.foe,
      this.heroSprite,
      this.bars,
      this.foeStatus,
      this.heroStatus,
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
  }

  update() {
    const { input } = this;
    const tapped = this.tapped;
    this.tapped = null;
    const next = tapped !== null || input.wasPressed("confirm");

    switch (this.step) {
      case "intro":
        if (next) {
          this.step = "choose";
          this.message.text = TEXT.whatWillDo(this.hero.name);
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
        else if (input.wasPressed("back")) this.choose(1);
        break;
      }

      case "outcome":
        if (next || input.wasPressed("back")) {
          const text = this.afterBattle.shift();
          if (text) this.message.text = text;
          else this.onDone(this.result);
        }
        break;
    }
  }

  resize(width: number, height: number, pixelScale: number) {
    this.view.hitArea = new Rectangle(0, 0, width, height);
    this.partyBar.position.set(12, 12);
    this.partyBar.layout(pixelScale);

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
      .fill(0x87c8e8)
      .rect(field.x, field.y + field.h * 0.5, field.w, field.h * 0.5)
      .fill(0x9bd36a)
      .rect(panel.x, panel.y, panel.w, panel.h)
      .fill(0x2b2b3a);

    const scale = pixelScale * 2;
    const size = TILE * scale;
    this.foe.scale.set(scale);
    this.foe.position.set(field.x + field.w * 0.7, field.y + field.h * 0.55);
    this.heroSprite.scale.set(scale);
    this.heroSprite.position.set(
      field.x + field.w * 0.3,
      field.y + field.h * 0.85,
    );
    const above = (s: Sprite): BarArea => ({
      x: s.x - size / 2,
      y: s.y - size - 14,
      width: size,
    });
    this.foeBar = above(this.foe);
    this.heroBar = above(this.heroSprite);
    this.drawBars();

    this.buttonWidth = Math.min(panel.w - 32, 420);
    const left = panel.x + (panel.w - this.buttonWidth) / 2;
    const top = wide
      ? panel.y + Math.max(16, (panel.h - 300) / 2)
      : panel.y + 16;
    this.message.position.set(left, top);
    this.message.style.wordWrap = true;
    this.message.style.wordWrapWidth = this.buttonWidth;
    this.menu.position.set(left, top + MESSAGE_HEIGHT);
    this.drawButtons();
  }

  private choose(index: number) {
    if (ACTIONS[index]?.id === "attack") {
      this.attack();
    } else {
      this.message.text = TEXT.ranAway;
      this.end("ran");
    }
  }

  private attack() {
    const { hero, wild } = this;
    const lucky = Math.random() < hero.stats.luck / 10;
    const damage = Math.max(0, hero.stats.strength) * (lucky ? 2 : 1);
    this.foeHp = Math.max(0, this.foeHp - damage);
    const lines = [
      lucky
        ? TEXT.luckyHit(hero.name, damage)
        : TEXT.attacks(hero.name, damage),
    ];

    if (this.foeHp === 0) {
      lines.push(TEXT.defeated(wild.name));
      this.foe.alpha = 0.3;
      this.giveXp();
      this.end("won");
    } else {
      const hit = Math.max(0, wild.stats.strength);
      hurt(hero, hit);
      lines.push(TEXT.hitsBack(wild.name, hero.name, hit));
      if (hpOf(hero) === 0) {
        lines.push(TEXT.knockedOut(hero.name));
        this.heroSprite.alpha = 0.3;
        this.afterBattle.push(TEXT.backToStart(hero.name));
        this.end("knockedOut");
      }
    }

    this.message.text = lines.join("\n");
    this.drawBars();
    this.partyBar.refresh();
  }

  private giveXp() {
    const { hero } = this;
    const xp = xpReward(this.wild);
    if (xp <= 0) return;
    this.afterBattle.push(TEXT.gainedXp([hero.name], xp));
    const bonus = Object.entries(LEVEL_UP_BONUS)
      .map(([stat, amount]) => TEXT.statBonus(stat as StatName, amount))
      .join(", ");
    for (const level of gainXp(hero, xp)) {
      this.afterBattle.push(`${TEXT.levelUp(hero.name, level)}\n${bonus}`);
    }
  }

  private end(result: BattleResult) {
    this.result = result;
    this.menu.visible = false;
    this.step = "outcome";
  }

  private drawBars() {
    const { hero, wild } = this;
    this.bars.clear();
    const bar = (
      area: BarArea,
      label: Text,
      level: number,
      hp: number,
      max: number,
    ) => {
      drawLifeBar(this.bars, area.x, area.y, area.width, 8, hp, max);
      label.text = TEXT.status(level, hp, max);
      label.position.set(area.x + area.width / 2, area.y - 4);
    };
    bar(this.foeBar, this.foeStatus, wild.level, this.foeHp, this.foeMaxHp);
    bar(this.heroBar, this.heroStatus, hero.level, hpOf(hero), hero.stats.hp);
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

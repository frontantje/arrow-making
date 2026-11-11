import { Container, Graphics, Sprite, Text } from "pixi.js";
import { art, TILE } from "./art";
import {
  activeHero,
  hpOf,
  party,
  setActiveHero,
  xpForNextLevel,
} from "./heroes";
import { drawLifeBar, textStyle } from "./scene";
import { TEXT } from "./text";

export class PartyBar extends Container {
  private highlight = new Graphics();
  private lifeBars = new Graphics();
  private icons: Sprite[];
  private nameText = new Text({ text: "", style: textStyle });
  private statsText = new Text({
    text: "",
    style: { ...textStyle, fontSize: 14, lineHeight: 18 },
  });

  constructor(selectable: boolean) {
    super();
    this.addChild(this.highlight, this.lifeBars);
    this.icons = party.map((hero, i) => {
      const icon = new Sprite(art(hero.art));
      if (selectable) {
        icon.eventMode = "static";
        icon.cursor = "pointer";
        icon.on("pointerdown", (e) => {
          e.stopPropagation(); // the map behind shouldn't get this tap
          setActiveHero(i);
        });
      }
      return this.addChild(icon);
    });
    this.addChild(this.nameText, this.statsText);
  }

  layout(pixelScale: number) {
    const scale = Math.max(3, pixelScale); // big enough for small fingers
    const gap = 8;
    this.icons.forEach((icon, i) => {
      icon.scale.set(scale);
      icon.position.set(i * (TILE * scale + gap), 0);
    });
    this.nameText.position.set(0, TILE * scale + 12);
    this.statsText.position.set(0, TILE * scale + 38);
    this.refresh();
  }

  refresh() {
    const hero = activeHero();
    const active = party.indexOf(hero);
    this.icons.forEach((icon, i) => (icon.alpha = i === active ? 1 : 0.5));
    const icon = this.icons[active];
    this.highlight
      .clear()
      .roundRect(icon.x - 4, icon.y - 4, icon.width + 8, icon.height + 8, 6)
      .fill({ color: 0xffffff, alpha: 0.4 });

    this.lifeBars.clear();
    party.forEach((member, i) => {
      const { x, y, width, height } = this.icons[i];
      drawLifeBar(
        this.lifeBars,
        x,
        y + height + 4,
        width,
        4,
        hpOf(member),
        member.stats.hp,
      );
    });

    this.nameText.text = hero.name;
    const { hp, strength, speed, luck, inventorySlots } = hero.stats;
    this.statsText.text = [
      TEXT.level(hero.level, hero.xp, xpForNextLevel(hero.level)),
      `${TEXT.hp(hpOf(hero), hp)} · ${TEXT.stat("strength", strength)}`,
      [
        TEXT.stat("luck", luck),
        TEXT.stat("speed", speed),
        TEXT.stat("inventorySlots", inventorySlots),
      ].join(" · "),
      hero.skills.length > 0 ? TEXT.skills(hero.skills) : "",
    ]
      .filter(Boolean)
      .join("\n");
  }
}

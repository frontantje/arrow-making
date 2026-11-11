import { Container, Graphics, Sprite, Text } from "pixi.js";
import { art, TILE } from "./art";
import { activeHero, party, setActiveHero, xpForNextLevel } from "./heroes";
import { textStyle } from "./scene";
import { TEXT } from "./text";

/** Your team, shown in the corner. Tap (or click) a hero to put them in front. */
export class PartyBar extends Container {
  private highlight = new Graphics();
  private icons: Sprite[];
  private nameText = new Text({ text: "", style: textStyle });
  private statsText = new Text({
    text: "",
    style: { ...textStyle, fontSize: 14, lineHeight: 18 },
  });

  constructor() {
    super();
    this.addChild(this.highlight);
    this.icons = party.map((hero, i) => {
      const icon = new Sprite(art(hero.art));
      icon.eventMode = "static";
      icon.cursor = "pointer";
      icon.on("pointerdown", (e) => {
        e.stopPropagation(); // so the tap doesn't also count for the screen behind
        setActiveHero(i);
      });
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
    this.nameText.position.set(0, TILE * scale + 4);
    this.statsText.position.set(0, TILE * scale + 30);
    this.refresh();
  }

  /** Call after the active hero changes. */
  refresh() {
    const active = party.indexOf(activeHero());
    this.icons.forEach((icon, i) => (icon.alpha = i === active ? 1 : 0.5));
    const icon = this.icons[active];
    this.highlight
      .clear()
      .roundRect(icon.x - 4, icon.y - 4, icon.width + 8, icon.height + 8, 6)
      .fill({ color: 0xffffff, alpha: 0.4 });
    const hero = activeHero();
    this.nameText.text = hero.name;
    const { strength, speed, luck, inventorySlots } = hero.stats;
    this.statsText.text = [
      TEXT.level(hero.level, hero.xp, xpForNextLevel(hero.level)),
      `${TEXT.stat("strength", strength)} · ${TEXT.stat("luck", luck)}`,
      `${TEXT.stat("speed", speed)} · ${TEXT.stat("inventorySlots", inventorySlots)}`,
      hero.skills.length > 0 ? TEXT.skills(hero.skills) : "",
    ]
      .filter(Boolean)
      .join("\n");
  }
}

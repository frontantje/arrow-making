import { Container, Graphics, Sprite, Text } from "pixi.js";
import { art, TILE } from "./art";
import { activeHero, party, setActiveHero } from "./data";
import { textStyle } from "./scene";

/** Your team, shown in the corner. Tap (or click) a hero to put them in front. */
export class PartyBar extends Container {
  private highlight = new Graphics();
  private icons: Sprite[];
  private nameText = new Text({ text: "", style: textStyle });

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
    this.addChild(this.nameText);
  }

  layout(pixelScale: number) {
    const scale = Math.max(3, pixelScale); // big enough for small fingers
    const gap = 8;
    this.icons.forEach((icon, i) => {
      icon.scale.set(scale);
      icon.position.set(i * (TILE * scale + gap), 0);
    });
    this.nameText.position.set(0, TILE * scale + 4);
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
    this.nameText.text = activeHero().name;
  }
}

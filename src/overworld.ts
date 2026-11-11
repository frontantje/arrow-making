import {
  Container,
  FederatedPointerEvent,
  Graphics,
  Rectangle,
  Sprite,
  Text,
} from "pixi.js";
import { art, TILE } from "./art";
import { wildCreatures, type WildCreature } from "./creatures";
import {
  activeHero,
  heal,
  party,
  setActiveHero,
  switchHero,
  type Hero,
} from "./heroes";
import type { Direction, Input } from "./input";
import {
  canEnter,
  findStart,
  MAP,
  MAP_HEIGHT,
  MAP_WIDTH,
  missingSkill,
  tileAt,
} from "./map";
import { PartyBar } from "./partyBar";
import { textStyle, type Scene } from "./scene";
import { TEXT } from "./text";

// per step in tall grass
const ENCOUNTER_CHANCE = 0.12;
const MESSAGE_SECONDS = 2;
const CAMERA_SPEED = 8;

const STEP: Record<Direction, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

type Point = { x: number; y: number };

type Walker = {
  hero: Hero;
  sprite: Sprite;
  tile: Point;
  // t goes from 0 to 1 during a step
  walking: { dx: number; dy: number; t: number } | null;
};

export class Overworld implements Scene {
  readonly view = new Container();
  private world = new Container();
  private walkers: Walker[] = [];
  private marker = new Graphics();
  private arrow = new Graphics();
  private partyBar = new PartyBar(true);
  private message = new Text({ text: "", style: textStyle });
  private messageTime = 0;
  private time = 0;
  private shownHero: Hero | null = null;

  private target: Point | null = null;
  private steeringPointer: number | null = null;
  private screen = { width: 0, height: 0, scale: 1 };
  // top-left corner of the view, in art pixels
  private camera: Point | null = null;

  constructor(
    private input: Input,
    private onEncounter: (wild: WildCreature) => void,
  ) {
    MAP.forEach((row, y) =>
      [...row].forEach((_, x) => {
        const info = tileAt(x, y);
        if (!info) return;
        const sprite = new Sprite(art(info.art));
        sprite.position.set(x * TILE, y * TILE);
        this.world.addChild(sprite);
      }),
    );
    this.marker.rect(1, 1, TILE - 2, TILE - 2).stroke({
      color: 0xffffff,
      alpha: 0.8,
      width: 1,
    });
    this.world.addChild(this.marker);

    for (const hero of party) {
      const walker: Walker = {
        hero,
        sprite: new Sprite(art(hero.art)),
        tile: { x: -1, y: -1 },
        walking: null,
      };
      this.walkers.push(walker);
      walker.tile = this.freeSpotNearStart(walker);
      this.world.addChild(walker.sprite);
    }

    this.arrow.poly([-3, -4, 3, -4, 0, -1]).fill(0xffffff);
    this.world.addChild(this.arrow);

    this.partyBar.position.set(12, 12);
    this.message.anchor.set(0.5, 1);
    this.view.addChild(this.world, this.partyBar, this.message);

    this.view.eventMode = "static";
    this.view.on("pointerdown", (e) => this.onTap(e));
    this.view.on("globalpointermove", (e) => {
      if (e.pointerId === this.steeringPointer) this.aimAt(e, false);
    });
    const release = (e: FederatedPointerEvent) => {
      if (e.pointerId === this.steeringPointer) this.steeringPointer = null;
    };
    this.view.on("pointerup", release).on("pointerupoutside", release);
  }

  update(dt: number) {
    this.time += dt;
    if (this.input.wasPressed("switch")) switchHero();
    if (activeHero() !== this.shownHero) this.showHero();

    // everyone finishes their step, but only the active hero starts new ones
    for (const walker of this.walkers) {
      if (!walker.walking) continue;
      walker.walking.t += dt * Math.max(1, walker.hero.stats.speed);
      if (walker.walking.t < 1) continue;
      walker.tile.x += walker.walking.dx;
      walker.tile.y += walker.walking.dy;
      walker.walking = null;
      if (
        walker === this.me &&
        tileAt(walker.tile.x, walker.tile.y)?.wild &&
        Math.random() < ENCOUNTER_CHANCE
      ) {
        this.target = null;
        this.steeringPointer = null;
        this.place(dt);
        this.onEncounter(
          wildCreatures[Math.floor(Math.random() * wildCreatures.length)],
        );
        return;
      }
    }

    const me = this.me;
    if (!me.walking) {
      const keyDir = this.input.direction;
      if (keyDir) this.target = null;
      const dir = keyDir ?? this.nextStepToTarget();
      if (dir) {
        const [dx, dy] = STEP[dir];
        const x = me.tile.x + dx;
        const y = me.tile.y + dy;
        if (this.canStep(me, x, y)) me.walking = { dx, dy, t: 0 };
        else this.explainBlocked(x, y);
      }
    }

    this.messageTime = Math.max(0, this.messageTime - dt);
    this.message.alpha = Math.min(1, this.messageTime / 0.3);
    this.place(dt);
  }

  resize(width: number, height: number, pixelScale: number) {
    this.screen = { width, height, scale: pixelScale };
    this.view.hitArea = new Rectangle(0, 0, width, height);
    this.world.scale.set(pixelScale);
    this.partyBar.layout(pixelScale);
    this.message.position.set(width / 2, height - 24);
    this.camera = null; // snap instead of glide
    this.place(0);
  }

  respawn(hero: Hero) {
    const walker = this.walkers.find((w) => w.hero === hero);
    if (!walker) return;
    walker.walking = null;
    walker.tile = this.freeSpotNearStart(walker);
    heal(hero);
    setActiveHero(party.indexOf(hero));
    this.target = null;
    this.steeringPointer = null;
  }

  private get me(): Walker {
    return this.walkers[party.indexOf(activeHero())];
  }

  private showHero() {
    this.shownHero = activeHero();
    this.target = null;
    this.steeringPointer = null;
    this.partyBar.refresh();
  }

  private onTap(e: FederatedPointerEvent) {
    const { x, y } = this.tileUnder(e);
    const other = this.heroAt(x, y, this.me);
    if (other) {
      setActiveHero(party.indexOf(other.hero));
      return;
    }
    this.steeringPointer = e.pointerId;
    this.aimAt(e, true);
  }

  private aimAt(e: FederatedPointerEvent, isTap: boolean) {
    const { x, y } = this.tileUnder(e);
    if (this.canStep(this.me, x, y)) this.target = { x, y };
    else if (isTap) this.explainBlocked(x, y);
  }

  private tileUnder(e: FederatedPointerEvent): Point {
    const p = this.world.toLocal(e.global);
    return { x: Math.floor(p.x / TILE), y: Math.floor(p.y / TILE) };
  }

  // standing on, or stepping onto, the tile
  private heroAt(x: number, y: number, except?: Walker) {
    return this.walkers.find((w) => {
      if (w === except) return false;
      if (w.tile.x === x && w.tile.y === y) return true;
      return (
        w.walking !== null &&
        w.tile.x + w.walking.dx === x &&
        w.tile.y + w.walking.dy === y
      );
    });
  }

  private canStep(walker: Walker, x: number, y: number) {
    return canEnter(x, y, walker.hero) && !this.heroAt(x, y, walker);
  }

  private say(text: string) {
    this.message.text = text;
    this.messageTime = MESSAGE_SECONDS;
  }

  private explainBlocked(x: number, y: number) {
    const hero = activeHero();
    const missing = missingSkill(x, y, hero);
    if (missing) this.say(TEXT.cannot(hero.name, missing));
  }

  private nextStepToTarget(): Direction | null {
    const { target, me } = this;
    if (!target) return null;
    const dir = firstStep(me.tile, target, (x, y) => this.canStep(me, x, y));
    if (!dir) this.target = null; // arrived, or no way there
    return dir;
  }

  private freeSpotNearStart(walker: Walker): Point {
    const start = findStart();
    const queue = [start];
    const seen = new Set([`${start.x},${start.y}`]);
    for (const spot of queue) {
      if (
        canEnter(spot.x, spot.y, walker.hero) &&
        !this.heroAt(spot.x, spot.y, walker)
      ) {
        return spot;
      }
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const next = { x: spot.x + dx, y: spot.y + dy };
        const tile = tileAt(next.x, next.y);
        if (!tile || tile.solid || seen.has(`${next.x},${next.y}`)) continue;
        seen.add(`${next.x},${next.y}`);
        queue.push(next);
      }
    }
    return start;
  }

  private place(dt: number) {
    for (const walker of this.walkers) {
      const t = walker.walking?.t ?? 0;
      walker.sprite.position.set(
        (walker.tile.x + (walker.walking?.dx ?? 0) * t) * TILE,
        (walker.tile.y + (walker.walking?.dy ?? 0) * t) * TILE,
      );
    }
    const me = this.me.sprite;
    const bob = Math.round(Math.sin(this.time * 6));
    this.arrow.position.set(me.x + TILE / 2, me.y + 1 + bob);

    this.marker.visible = this.target !== null;
    if (this.target) {
      this.marker.position.set(this.target.x * TILE, this.target.y * TILE);
    }

    const { width, height, scale } = this.screen;
    const goal = {
      x: follow(me.x, width / scale, MAP_WIDTH * TILE),
      y: follow(me.y, height / scale, MAP_HEIGHT * TILE),
    };
    if (!this.camera) {
      this.camera = goal;
    } else {
      const k = Math.min(1, dt * CAMERA_SPEED);
      this.camera.x += (goal.x - this.camera.x) * k;
      this.camera.y += (goal.y - this.camera.y) * k;
    }
    this.world.position.set(
      -Math.round(this.camera.x * scale),
      -Math.round(this.camera.y * scale),
    );
  }
}

function follow(hero: number, view: number, mapSize: number) {
  if (mapSize <= view) return (mapSize - view) / 2;
  const centered = hero + TILE / 2 - view / 2;
  return Math.min(Math.max(centered, 0), mapSize - view);
}

// first step of the shortest path; null if already there or there's no way
function firstStep(
  from: Point,
  to: Point,
  canGo: (x: number, y: number) => boolean,
): Direction | null {
  const queue = [{ x: from.x, y: from.y, first: null as Direction | null }];
  const seen = new Set([`${from.x},${from.y}`]);
  for (const here of queue) {
    if (here.x === to.x && here.y === to.y) return here.first;
    for (const [dir, [dx, dy]] of Object.entries(STEP)) {
      const x = here.x + dx;
      const y = here.y + dy;
      if (seen.has(`${x},${y}`) || !canGo(x, y)) continue;
      seen.add(`${x},${y}`);
      queue.push({ x, y, first: here.first ?? (dir as Direction) });
    }
  }
  return null;
}

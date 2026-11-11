import {
  Container,
  FederatedPointerEvent,
  Graphics,
  Rectangle,
  Sprite,
} from "pixi.js";
import { art, TILE } from "./art";
import {
  activeHero,
  switchHero,
  wildCreatures,
  type Creature,
  type Hero,
} from "./data";
import type { Direction, Input } from "./input";
import {
  findStart,
  isWalkable,
  MAP,
  MAP_HEIGHT,
  MAP_WIDTH,
  tileAt,
} from "./map";
import { PartyBar } from "./partyBar";
import type { Scene } from "./scene";

/** How many tiles the player walks per second. */
const WALK_SPEED = 6;
/** Chance (0 to 1) of meeting a wild creature on each step in tall grass. */
const ENCOUNTER_CHANCE = 0.12;

const STEP: Record<Direction, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

type Point = { x: number; y: number };

/**
 * Walking around the map.
 * Tap a tile to walk there, or keep your finger down and the hero follows it.
 * Arrow keys / WASD work too.
 */
export class Overworld implements Scene {
  readonly view = new Container();
  private world = new Container();
  private player = new Sprite();
  private marker = new Graphics();
  private partyBar = new PartyBar();
  private shownHero: Hero | null = null;

  /** Where the player stands, in tiles. */
  private tile = findStart();
  /** The step the player is walking right now (t goes from 0 to 1). */
  private walking: { dx: number; dy: number; t: number } | null = null;
  /** The tile the player was told to walk to. */
  private target: Point | null = null;
  /** The finger (or mouse) that is steering the player right now. */
  private steeringPointer: number | null = null;
  private screen = { width: 0, height: 0, scale: 1 };

  constructor(
    private input: Input,
    private onEncounter: (wild: Creature) => void,
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
    this.world.addChild(this.marker, this.player);
    this.partyBar.position.set(12, 12);
    this.view.addChild(this.world, this.partyBar);

    this.view.eventMode = "static";
    this.view.on("pointerdown", (e) => {
      this.steeringPointer = e.pointerId;
      this.aimAt(e);
    });
    this.view.on("globalpointermove", (e) => {
      if (e.pointerId === this.steeringPointer) this.aimAt(e);
    });
    const release = (e: FederatedPointerEvent) => {
      if (e.pointerId === this.steeringPointer) this.steeringPointer = null;
    };
    this.view.on("pointerup", release).on("pointerupoutside", release);
  }

  update(dt: number) {
    if (this.input.wasPressed("switch")) switchHero();
    if (activeHero() !== this.shownHero) this.showHero();

    if (this.walking) {
      this.walking.t += dt * WALK_SPEED;
      if (this.walking.t >= 1) {
        this.tile.x += this.walking.dx;
        this.tile.y += this.walking.dy;
        this.walking = null;
        if (
          tileAt(this.tile.x, this.tile.y)?.wild &&
          Math.random() < ENCOUNTER_CHANCE
        ) {
          this.target = null;
          this.steeringPointer = null;
          this.placePlayer();
          this.onEncounter(
            wildCreatures[Math.floor(Math.random() * wildCreatures.length)],
          );
          return;
        }
      }
    }

    if (!this.walking) {
      const keyDir = this.input.direction;
      if (keyDir) this.target = null; // keys take over from taps
      const dir = keyDir ?? this.nextStepToTarget();
      if (dir) {
        const [dx, dy] = STEP[dir];
        if (isWalkable(this.tile.x + dx, this.tile.y + dy)) {
          this.walking = { dx, dy, t: 0 };
        }
      }
    }

    this.placePlayer();
  }

  resize(width: number, height: number, pixelScale: number) {
    this.screen = { width, height, scale: pixelScale };
    this.view.hitArea = new Rectangle(0, 0, width, height);
    this.world.scale.set(pixelScale);
    this.partyBar.layout(pixelScale);
    this.placePlayer();
  }

  private showHero() {
    this.shownHero = activeHero();
    this.player.texture = art(this.shownHero.art);
    this.partyBar.refresh();
  }

  /** Sets the walk target to the tile under the finger (if you can stand there). */
  private aimAt(e: FederatedPointerEvent) {
    const p = this.world.toLocal(e.global);
    const x = Math.floor(p.x / TILE);
    const y = Math.floor(p.y / TILE);
    if (isWalkable(x, y)) this.target = { x, y };
  }

  private nextStepToTarget(): Direction | null {
    const { target, tile } = this;
    if (!target) return null;
    const dir = firstStep(tile, target);
    if (!dir) this.target = null; // arrived, or can't get there
    return dir;
  }

  /** Moves the player sprite and keeps the camera on them. */
  private placePlayer() {
    const t = this.walking?.t ?? 0;
    const x = (this.tile.x + (this.walking?.dx ?? 0) * t) * TILE;
    const y = (this.tile.y + (this.walking?.dy ?? 0) * t) * TILE;
    this.player.position.set(x, y);

    this.marker.visible = this.target !== null;
    if (this.target) {
      this.marker.position.set(this.target.x * TILE, this.target.y * TILE);
    }

    const { width, height, scale } = this.screen;
    const camX = follow(x, width / scale, MAP_WIDTH * TILE);
    const camY = follow(y, height / scale, MAP_HEIGHT * TILE);
    this.world.position.set(
      -Math.round(camX * scale),
      -Math.round(camY * scale),
    );
  }
}

/** Camera position along one axis: centered on the player, but never past the map edge. */
function follow(player: number, view: number, mapSize: number) {
  if (mapSize <= view) return (mapSize - view) / 2;
  const centered = player + TILE / 2 - view / 2;
  return Math.min(Math.max(centered, 0), mapSize - view);
}

/**
 * The first step of the shortest walk from `from` to `to`, going around walls.
 * Returns null if you're already there or there's no way through.
 */
function firstStep(from: Point, to: Point): Direction | null {
  const queue = [{ x: from.x, y: from.y, first: null as Direction | null }];
  const seen = new Set([`${from.x},${from.y}`]);
  for (const here of queue) {
    if (here.x === to.x && here.y === to.y) return here.first;
    for (const [dir, [dx, dy]] of Object.entries(STEP)) {
      const x = here.x + dx;
      const y = here.y + dy;
      if (seen.has(`${x},${y}`) || !isWalkable(x, y)) continue;
      seen.add(`${x},${y}`);
      queue.push({ x, y, first: here.first ?? (dir as Direction) });
    }
  }
  return null;
}

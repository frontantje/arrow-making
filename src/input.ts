export type Direction = "up" | "down" | "left" | "right";
export type Action = Direction | "confirm" | "back" | "switch";

const KEYS: Record<string, Action> = {
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
  KeyZ: "confirm",
  Enter: "confirm",
  Space: "confirm",
  KeyX: "back",
  Escape: "back",
  KeyQ: "switch",
  Tab: "switch",
};

const DIRECTIONS = new Set<Action>(["up", "down", "left", "right"]);
const isDirection = (action: Action): action is Direction =>
  DIRECTIONS.has(action);

export class Input {
  private keys = new Set<string>();
  private pressed = new Set<Action>();
  private dirOrder: Direction[] = [];

  constructor() {
    window.addEventListener("keydown", (e) => {
      const action = KEYS[e.code];
      if (!action) return;
      e.preventDefault();
      this.keys.add(e.code);
      if (!e.repeat) this.press(action);
    });
    window.addEventListener("keyup", (e) => this.keys.delete(e.code));
    window.addEventListener("blur", () => this.keys.clear());
  }

  isDown(action: Action): boolean {
    for (const code of this.keys) if (KEYS[code] === action) return true;
    return false;
  }

  wasPressed(action: Action): boolean {
    return this.pressed.has(action);
  }

  // if several are held, the newest wins
  get direction(): Direction | null {
    for (let i = this.dirOrder.length - 1; i >= 0; i--) {
      if (this.isDown(this.dirOrder[i])) return this.dirOrder[i];
    }
    return null;
  }

  endFrame() {
    this.pressed.clear();
  }

  private press(action: Action) {
    this.pressed.add(action);
    if (isDirection(action)) {
      this.dirOrder = this.dirOrder.filter((d) => d !== action);
      this.dirOrder.push(action);
    }
  }
}

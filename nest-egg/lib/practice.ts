import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { seedState } from "./seed";
import type { DbState } from "./store";

const file = path.join(process.cwd(), "data", "practice.json");

let state: DbState | null = null;

export function practiceFile(): string {
  return file;
}

export function getState(): DbState {
  if (state) return state;
  if (process.env.DATA_BOUNDARY === "live" || process.env.DATA_BOUNDARY === "preview") {
    throw new Error("Refusing to open a live or preview database from the lab app");
  }
  if (existsSync(file)) state = JSON.parse(readFileSync(file, "utf8")) as DbState;
  else {
    state = seedState();
    persist();
  }
  return state;
}

export function persist(): void {
  if (!state) return;
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(state));
}

export function resetPractice(): void {
  state = seedState();
  persist();
}

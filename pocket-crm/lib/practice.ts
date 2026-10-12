import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { seed } from "./seed";
import type { Db } from "./model";

const file = path.join(process.cwd(), "data", "practice.json");
let db: Db | null = null;

export function getDb(): Db {
  if (db) return db;
  if (existsSync(file)) db = JSON.parse(readFileSync(file, "utf8")) as Db;
  else {
    db = seed();
    save();
  }
  return db;
}

export function save() {
  if (!db) return;
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(db));
}

export function login(email: string, password: string) {
  return getDb().users.find((user) => user.email === email && user.password === password) ?? null;
}

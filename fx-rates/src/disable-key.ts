import { existsSync, readFileSync, writeFileSync } from "node:fs";
import type { ApiKeyRecord } from "./types.ts";

const name = process.argv[2];
if (!name) {
  console.error("usage: npm run disable-key -- <name>");
  process.exit(1);
}
const file = process.env.KEYS_FILE ?? "data/keys.json";
if (!existsSync(file)) {
  console.error("no keys file");
  process.exit(1);
}
const current = JSON.parse(readFileSync(file, "utf8")) as ApiKeyRecord[];
const found = current.find((record) => record.name === name);
if (!found) {
  console.error("no key with that name");
  process.exit(1);
}
found.disabled = true;
writeFileSync(file, JSON.stringify(current, null, 2));
console.log(`disabled ${name}`);

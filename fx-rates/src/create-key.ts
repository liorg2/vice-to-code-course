import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { hashKey, newApiKey } from "./memory-store.ts";
import type { ApiKeyRecord } from "./types.ts";

const name = process.argv[2];
const quota = Number(process.argv[3] ?? "1000");
if (!name || !Number.isFinite(quota) || quota < 1) {
  console.error("usage: npm run create-key -- <name> [dailyQuota]");
  process.exit(1);
}
const file = process.env.KEYS_FILE ?? "data/keys.json";
const current: ApiKeyRecord[] = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) as ApiKeyRecord[] : [];
const key = newApiKey();
current.push({ name, hash: hashKey(key), dailyQuota: quota, disabled: false });
mkdirSync("data", { recursive: true });
writeFileSync(file, JSON.stringify(current, null, 2));
console.log(`Key for ${name} (shown once): ${key}`);
console.log("Only the hash was stored.");

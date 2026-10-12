import { createHash, randomBytes } from "node:crypto";
import type { ApiKeyRecord, KeyStore, RatesCache, StoredRates } from "./types.ts";

export function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function newApiKey(): string {
  return `fx_${randomBytes(24).toString("base64url")}`;
}

export function createMemoryCache(): RatesCache & { docs: Map<string, StoredRates> } {
  const docs = new Map<string, StoredRates>();
  return {
    docs,
    async read(base) {
      return docs.get(base) ?? null;
    },
    async write(doc) {
      docs.set(doc.base, doc);
    },
  };
}

export function createMemoryKeys(): KeyStore & { keys: ApiKeyRecord[]; usage: Map<string, number> } {
  const keys: ApiKeyRecord[] = [];
  const usage = new Map<string, number>();
  return {
    keys,
    usage,
    async findByHash(hash) {
      return keys.find((k) => k.hash === hash) ?? null;
    },
    async put(record) {
      const index = keys.findIndex((k) => k.name === record.name);
      if (index >= 0) keys[index] = record;
      else keys.push(record);
    },
    async disable(name) {
      const found = keys.find((k) => k.name === name);
      if (!found) return false;
      found.disabled = true;
      return true;
    },
    async incrementUsage(hash, day) {
      const id = `${hash}:${day}`;
      const next = (usage.get(id) ?? 0) + 1;
      usage.set(id, next);
      return next;
    },
  };
}

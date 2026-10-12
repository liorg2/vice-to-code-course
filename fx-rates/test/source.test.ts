import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createFrankfurterSource } from "../src/frankfurter.ts";
import { refreshRates } from "../src/refresh.ts";
import { createMemoryCache } from "../src/memory-store.ts";

describe("frankfurter parser", () => {
  it("reads a v1 latest document", async () => {
    const source = createFrankfurterSource("https://example.test/latest", async () =>
      new Response(JSON.stringify({ base: "USD", date: "2026-10-09", rates: { EUR: 0.89 } }), { status: 200 }),
    );
    const doc = await source("USD", ["EUR"]);
    assert.equal(doc.rates.EUR, 0.89);
  });

  it("fails on a non-200 and on a bad body", async () => {
    const down = createFrankfurterSource("https://example.test/latest", async () => new Response("no", { status: 503 }));
    await assert.rejects(() => down("USD", ["EUR"]));
    const bad = createFrankfurterSource("https://example.test/latest", async () =>
      new Response(JSON.stringify({ nope: true }), { status: 200 }),
    );
    await assert.rejects(() => bad("USD", ["EUR"]));
  });
});

describe("refresh", () => {
  it("writes one document per base and sets a 7 day ttl", async () => {
    const cache = createMemoryCache();
    const now = new Date("2026-10-12T00:00:00.000Z");
    const written = await refreshRates(
      async (base) => ({ base, date: "2026-10-09", rates: { EUR: 0.89 }, fetchedAt: now.toISOString() }),
      cache,
      ["USD"],
      ["EUR"],
      now,
    );
    assert.equal(written, 1);
    const saved = await cache.read("USD");
    assert.equal(saved?.ttl, Math.floor(now.getTime() / 1000) + 7 * 24 * 60 * 60);
  });
});

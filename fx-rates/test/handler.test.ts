import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { handleRequest, type HandlerDeps } from "../src/handler.ts";
import { createMemoryCache, createMemoryKeys, hashKey, newApiKey } from "../src/memory-store.ts";
import { roundMoney } from "../src/round.ts";
import type { RatesDocument } from "../src/types.ts";

const now = new Date("2026-10-12T12:00:00.000Z");

function sourceOk(doc?: Partial<RatesDocument>): HandlerDeps["source"] {
  return async (base, symbols) => ({
    base,
    date: "2026-10-09",
    rates: Object.fromEntries(symbols.map((code) => [code, code === "ILS" ? 3.05 : 0.89])),
    fetchedAt: now.toISOString(),
    ...doc,
  });
}

function deps(extra: Partial<HandlerDeps> = {}): HandlerDeps {
  return { source: sourceOk(), now: () => now, ...extra };
}

describe("roundMoney", () => {
  it("rounds half away from zero to cents", () => {
    assert.equal(roundMoney(1.005), 1.01);
    assert.equal(roundMoney(10 * 3.057), 30.57);
  });
});

describe("handler", () => {
  it("returns rates", async () => {
    const result = await handleRequest(
      { method: "GET", path: "/v1/rates", query: { base: "USD", symbols: "EUR,ILS" }, now },
      deps(),
    );
    assert.equal(result.status, 200);
    assert.deepEqual(result.body, {
      base: "USD",
      date: "2026-10-09",
      rates: { EUR: 0.89, ILS: 3.05 },
      stale: false,
    });
  });

  it("converts and rounds", async () => {
    const result = await handleRequest(
      { method: "GET", path: "/v1/convert", query: { from: "USD", to: "ILS", amount: "100" }, now },
      deps(),
    );
    assert.equal(result.status, 200);
    assert.equal((result.body as { result: number }).result, 305);
  });

  it("rejects bad input with one error shape", async () => {
    const cases = [
      { path: "/v1/rates", query: { base: "usd", symbols: "EUR" } },
      { path: "/v1/rates", query: { base: "USD", symbols: "EUR", extra: "1" } },
      { path: "/v1/convert", query: { from: "USD", to: "ILS", amount: "-1" } },
      { path: "/v1/convert", query: { from: "USD", to: "ILS", amount: "1000000000" } },
    ];
    for (const item of cases) {
      const result = await handleRequest({ method: "GET", path: item.path, query: item.query, now }, deps());
      assert.equal(result.status, 400);
      const body = result.body as { error: { code: string; message: string } };
      assert.equal(typeof body.error.code, "string");
      assert.equal(typeof body.error.message, "string");
      assert.equal(JSON.stringify(body).includes("usd"), false);
    }
  });

  it("uses 404, 405 and 502", async () => {
    const missing = await handleRequest({ method: "GET", path: "/v1/nope", query: {}, now }, deps());
    assert.equal(missing.status, 404);
    const method = await handleRequest({ method: "POST", path: "/v1/rates", query: {}, now }, deps());
    assert.equal(method.status, 405);
    const down = await handleRequest(
      { method: "GET", path: "/v1/health", query: {}, now },
      deps(),
    );
    assert.equal(down.status, 200);
    const failed = await handleRequest(
      { method: "GET", path: "/v1/rates", query: { base: "USD", symbols: "EUR" }, now },
      deps({ source: async () => { throw new Error("down"); } }),
    );
    assert.equal(failed.status, 502);
    assert.equal(JSON.stringify(failed.body).includes("down"), false);
  });

  it("serves cached rates as stale when the source is down", async () => {
    const cache = createMemoryCache();
    await cache.write({
      base: "USD",
      date: "2026-10-01",
      rates: { EUR: 0.9 },
      fetchedAt: "2026-10-01T00:00:00.000Z",
      ttl: 1,
    });
    const result = await handleRequest(
      { method: "GET", path: "/v1/rates", query: { base: "USD", symbols: "EUR" }, now },
      deps({
        cache,
        source: async () => {
          throw new Error("down");
        },
      }),
    );
    assert.equal(result.status, 200);
    assert.equal((result.body as { stale: boolean }).stale, true);
  });

  it("requires a key and enforces the daily quota", async () => {
    const keys = createMemoryKeys();
    const secret = newApiKey();
    await keys.put({ name: "lab", hash: hashKey(secret), dailyQuota: 1, disabled: false });
    const call = (apiKey?: string) =>
      handleRequest(
        {
          method: "GET",
          path: "/v1/rates",
          query: { base: "USD", symbols: "EUR" },
          headers: apiKey ? { "x-api-key": apiKey } : {},
          now,
        },
        deps({ keys }),
      );
    assert.equal((await call()).status, 401);
    assert.equal((await call(secret)).status, 200);
    const limited = await call(secret);
    assert.equal(limited.status, 429);
    assert.equal(limited.headers["retry-after"], "86400");
    const stored = JSON.stringify(keys.keys);
    assert.equal(stored.includes(secret), false);
  });
});

describe("openapi", () => {
  it("describes every field the handler returns", async () => {
    const doc = readFileSync(new URL("../openapi.yaml", import.meta.url), "utf8");
    const samples = [
      await handleRequest({ method: "GET", path: "/v1/rates", query: { base: "USD", symbols: "EUR" }, now }, deps()),
      await handleRequest({ method: "GET", path: "/v1/convert", query: { from: "USD", to: "EUR", amount: "2" }, now }, deps()),
      await handleRequest({ method: "GET", path: "/v1/health", query: {}, now }, deps()),
      await handleRequest({ method: "GET", path: "/missing", query: {}, now }, deps()),
    ];
    for (const sample of samples) {
      const body = sample.body as Record<string, unknown>;
      const fields = body.error ? ["error", "code", "message"] : Object.keys(body);
      for (const field of fields) assert.match(doc, new RegExp(`\\b${field}\\b`));
    }
    for (const path of ["/v1/rates", "/v1/convert", "/v1/health"]) assert.match(doc, new RegExp(path));
  });
});

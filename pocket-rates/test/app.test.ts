import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { convert, parseAmount } from "../src/lib/convert";
import { colorsFor, palette } from "../src/lib/colors";
import { fetchRates } from "../src/lib/ratesApi";
import { loadFavorites, loadSavedRates, saveFavorites, saveRates, type Kv } from "../src/lib/storage";

function memoryKv(): Kv & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    async getItem(key) { return data.get(key) ?? null; },
    async setItem(key, value) { data.set(key, value); },
    async removeItem(key) { data.delete(key); },
  };
}

describe("convert", () => {
  it("covers zero, a large amount, and an empty field", () => {
    assert.equal(convert(0, 3.5), 0);
    assert.equal(convert(1_000_000, 2), 2_000_000);
    assert.equal(parseAmount(""), null);
    assert.equal(convert(100, 3.057), 305.7);
  });
});

describe("rates api", () => {
  it("reads a v2 quote list", async () => {
    const book = await fetchRates("USD", async () => new Response(JSON.stringify([
      { date: "2026-10-09", base: "USD", quote: "EUR", rate: 0.89 },
    ]), { status: 200 }), "https://example.test/v2");
    assert.equal(book.rates.EUR, 0.89);
  });

  it("fails on a non-200, malformed data, and a timeout", async () => {
    await assert.rejects(() => fetchRates("USD", async () => new Response("no", { status: 503 }), "https://example.test/v2"));
    await assert.rejects(() => fetchRates("USD", async () => new Response(JSON.stringify([{ nope: true }]), { status: 200 }), "https://example.test/v2"));
    await assert.rejects(() => fetchRates("USD", (_url, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
    }), "https://example.test/v2", 10));
  });
});

describe("storage", () => {
  it("saves, loads, and ignores corrupt data", async () => {
    const kv = memoryKv();
    assert.deepEqual(await loadFavorites(kv), []);
    await saveFavorites(kv, [{ from: "USD", to: "EUR" }]);
    assert.equal((await loadFavorites(kv)).length, 1);
    await saveRates(kv, { fetchedAt: "2026-10-12T12:00:00.000Z", books: { USD: { date: "2026-10-09", rates: { EUR: 0.89 } } } });
    assert.equal((await loadSavedRates(kv))?.books.USD?.rates.EUR, 0.89);
    kv.data.set("pocket-rates.favorites", "{");
    assert.deepEqual(await loadFavorites(kv), []);
  });
});

describe("colors", () => {
  it("has readable light and dark text", () => {
    assert.notEqual(palette.light.text, palette.light.background);
    assert.notEqual(palette.dark.text, palette.dark.background);
    assert.equal(colorsFor("dark").background, palette.dark.background);
  });
});

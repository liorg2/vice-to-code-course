import { TTL_SECONDS, type RateSource, type RatesCache } from "./types.ts";

export async function refreshRates(
  source: RateSource,
  cache: RatesCache,
  bases: string[],
  symbols: string[],
  now = new Date(),
): Promise<number> {
  let written = 0;
  for (const base of bases) {
    const quotes = symbols.filter((code) => code !== base);
    const doc = await source(base, quotes);
    if (!doc.date || Object.keys(doc.rates).length === 0) {
      throw new Error("refresh refused an empty rate document");
    }
    await cache.write({
      ...doc,
      ttl: Math.floor(now.getTime() / 1000) + TTL_SECONDS,
    });
    written += 1;
  }
  return written;
}

import type { RateSource, RatesDocument } from "./types.ts";

const DEFAULT_URL = "https://api.frankfurter.dev/v1/latest";

type LatestBody = {
  base?: string;
  date?: string;
  rates?: Record<string, number>;
};

export function createFrankfurterSource(
  baseUrl = DEFAULT_URL,
  fetchImpl: typeof fetch = fetch,
): RateSource {
  return async (base, symbols) => {
    const url = new URL(baseUrl);
    url.searchParams.set("base", base);
    if (symbols.length > 0) url.searchParams.set("symbols", symbols.join(","));
    const response = await fetchImpl(url);
    if (!response.ok) {
      throw new Error(`upstream status ${response.status}`);
    }
    const body = (await response.json()) as LatestBody;
    if (!body.date || !body.rates || typeof body.rates !== "object") {
      throw new Error("upstream body was not a rates document");
    }
    const rates: Record<string, number> = {};
    for (const [code, rate] of Object.entries(body.rates)) {
      if (typeof rate !== "number" || !Number.isFinite(rate)) {
        throw new Error("upstream rate was not a number");
      }
      rates[code] = rate;
    }
    const doc: RatesDocument = {
      base,
      date: body.date,
      rates,
      fetchedAt: new Date().toISOString(),
    };
    return doc;
  };
}

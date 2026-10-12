export const TIMEOUT_MS = 8000;

export type RateBook = { date: string; rates: Record<string, number> };

type QuoteRow = { date?: string; quote?: string; rate?: number };

export async function fetchRates(
  base: string,
  fetchImpl: typeof fetch,
  baseUrl: string,
  timeoutMs = TIMEOUT_MS,
): Promise<RateBook> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(`${baseUrl}/rates?base=${encodeURIComponent(base)}`, { signal: controller.signal });
    if (!response.ok) throw new Error(`status ${response.status}`);
    const body = (await response.json()) as QuoteRow[] | { rates?: Record<string, number>; date?: string };
    if (Array.isArray(body)) {
      const rates: Record<string, number> = {};
      let date = "";
      for (const row of body) {
        if (!row.quote || typeof row.rate !== "number") throw new Error("malformed");
        rates[row.quote] = row.rate;
        if (row.date) date = row.date;
      }
      if (!date) throw new Error("malformed");
      return { date, rates };
    }
    if (!body.rates || !body.date) throw new Error("malformed");
    return { date: body.date, rates: body.rates };
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchCurrencies(fetchImpl: typeof fetch, baseUrl: string): Promise<string[]> {
  const response = await fetchImpl(`${baseUrl}/currencies`);
  if (!response.ok) return ["USD", "EUR", "ILS", "GBP", "JPY"];
  const body = (await response.json()) as Record<string, string> | string[];
  const codes = Array.isArray(body) ? body : Object.keys(body);
  return codes.filter((code) => /^[A-Z]{3}$/.test(code)).slice(0, 40);
}

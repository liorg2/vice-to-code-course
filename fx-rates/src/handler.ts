import { roundMoney } from "./round.ts";
import { STALE_AFTER_MS, type KeyStore, type RateSource, type RatesCache } from "./types.ts";

export type RequestInput = {
  method: string;
  path: string;
  query: Record<string, string | undefined>;
  headers?: Record<string, string | undefined>;
  now?: Date;
};

export type HandlerResult = {
  status: number;
  headers: Record<string, string>;
  body: unknown;
};

export type HandlerDeps = {
  source: RateSource;
  cache?: RatesCache;
  keys?: KeyStore;
  now?: () => Date;
};

const CODE = /^[A-Z]{3}$/;
const KNOWN = new Set(["base", "symbols", "from", "to", "amount"]);

function error(status: number, code: string, message: string): HandlerResult {
  return {
    status,
    headers: cors({ "content-type": "application/json" }),
    body: { error: { code, message } },
  };
}

function json(status: number, body: unknown, extra: Record<string, string> = {}): HandlerResult {
  return {
    status,
    headers: cors({ "content-type": "application/json", ...extra }),
    body,
  };
}

function cors(headers: Record<string, string>): Record<string, string> {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type,x-api-key",
    "access-control-allow-methods": "GET,OPTIONS",
    ...headers,
  };
}

function currency(value: string | undefined, field: string): string | HandlerResult {
  if (!value || !CODE.test(value)) {
    return error(400, "invalid_currency", `${field} must be three capital letters`);
  }
  return value;
}

function unknownQuery(query: Record<string, string | undefined>, allowed: string[]): HandlerResult | null {
  for (const name of Object.keys(query)) {
    if (!allowed.includes(name) || !KNOWN.has(name)) {
      return error(400, "unknown_query", "query contains an unknown parameter");
    }
  }
  return null;
}

function isError(value: string | HandlerResult): value is HandlerResult {
  return typeof value !== "string";
}

function header(headers: Record<string, string | undefined> | undefined, name: string): string | undefined {
  if (!headers) return undefined;
  const found = Object.entries(headers).find(([key]) => key.toLowerCase() === name);
  return found?.[1];
}

async function authorize(input: RequestInput, keys: KeyStore | undefined, now: Date): Promise<HandlerResult | null> {
  if (!keys) return null;
  const presented = header(input.headers, "x-api-key");
  if (!presented) return error(401, "missing_key", "send an x-api-key header");
  const { hashKey } = await import("./memory-store.ts");
  const hash = hashKey(presented);
  const record = await keys.findByHash(hash);
  if (!record || record.disabled) return error(401, "invalid_key", "that key is not valid");
  const day = now.toISOString().slice(0, 10);
  const used = await keys.incrementUsage(hash, day);
  if (used > record.dailyQuota) {
    return {
      status: 429,
      headers: cors({
        "content-type": "application/json",
        "retry-after": "86400",
      }),
      body: { error: { code: "quota_exceeded", message: "daily quota is used up" } },
    };
  }
  return null;
}

function staleFlag(fetchedAt: string, now: Date): boolean {
  return now.getTime() - Date.parse(fetchedAt) > STALE_AFTER_MS;
}

export async function handleRequest(input: RequestInput, deps: HandlerDeps): Promise<HandlerResult> {
  const method = input.method.toUpperCase();
  const path = input.path.replace(/\/$/, "") || "/";
  if (method === "OPTIONS") return json(204, null);
  if (method !== "GET") return error(405, "method_not_allowed", "only GET is supported");

  if (path === "/v1/health") return json(200, { status: "ok" });

  const now = input.now ?? deps.now?.() ?? new Date();
  if (path === "/v1/rates" || path === "/v1/convert") {
    const denied = await authorize(input, deps.keys, now);
    if (denied) return denied;
  } else {
    return error(404, "not_found", "no such path");
  }

  if (path === "/v1/rates") {
    const bad = unknownQuery(input.query, ["base", "symbols"]);
    if (bad) return bad;
    const base = currency(input.query.base ?? "USD", "base");
    if (isError(base)) return base;
    const symbolsRaw = input.query.symbols;
    if (!symbolsRaw) return error(400, "invalid_currency", "symbols must list at least one code");
    const symbols = symbolsRaw.split(",");
    if (symbols.length > 10) return error(400, "too_many_symbols", "symbols allows at most 10 codes");
    for (const code of symbols) {
      const checked = currency(code, "symbols");
      if (isError(checked)) return checked;
    }
    try {
      const doc = await readRates(base, symbols, deps, now);
      const rates: Record<string, number> = {};
      for (const code of symbols) {
        const rate = doc.rates[code];
        if (rate === undefined) return error(404, "unknown_symbol", "one of the symbols is not in the rate set");
        rates[code] = rate;
      }
      return json(200, { base: doc.base, date: doc.date, rates, stale: staleFlag(doc.fetchedAt, now) });
    } catch {
      return error(502, "upstream_failed", "the rate source did not answer");
    }
  }

  const bad = unknownQuery(input.query, ["from", "to", "amount"]);
  if (bad) return bad;
  const from = currency(input.query.from, "from");
  if (isError(from)) return from;
  const to = currency(input.query.to, "to");
  if (isError(to)) return to;
  const amountRaw = input.query.amount;
  const amount = Number(amountRaw);
  if (!amountRaw || !Number.isFinite(amount) || amount <= 0 || amount >= 1_000_000_000) {
    return error(400, "invalid_amount", "amount must be a positive number below one billion");
  }
  try {
    const doc = await readRates(from, [to], deps, now);
    const rate = from === to ? 1 : doc.rates[to];
    if (rate === undefined) return error(404, "unknown_symbol", "that currency pair is not available");
    return json(200, {
      from,
      to,
      amount,
      rate,
      result: roundMoney(amount * rate),
      date: doc.date,
    });
  } catch {
    return error(502, "upstream_failed", "the rate source did not answer");
  }
}

async function readRates(base: string, symbols: string[], deps: HandlerDeps, now: Date) {
  if (deps.cache) {
    const cached = await deps.cache.read(base);
    if (cached) {
      const missing = symbols.some((code) => cached.rates[code] === undefined);
      if (!missing) return cached;
    }
  }
  const fresh = await deps.source(base, symbols);
  if (deps.cache) {
    await deps.cache.write({
      ...fresh,
      ttl: Math.floor(now.getTime() / 1000) + 7 * 24 * 60 * 60,
    });
  }
  return fresh;
}

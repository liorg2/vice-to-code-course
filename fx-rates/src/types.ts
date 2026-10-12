export type RatesDocument = {
  base: string;
  date: string;
  rates: Record<string, number>;
  fetchedAt: string;
};

export type RateSource = (
  base: string,
  symbols: string[],
) => Promise<RatesDocument>;

export type StoredRates = RatesDocument & { ttl: number };

export type ApiKeyRecord = {
  name: string;
  hash: string;
  dailyQuota: number;
  disabled: boolean;
};

export type KeyStore = {
  findByHash(hash: string): Promise<ApiKeyRecord | null>;
  put(record: ApiKeyRecord): Promise<void>;
  disable(name: string): Promise<boolean>;
  incrementUsage(hash: string, day: string): Promise<number>;
};

export type RatesCache = {
  read(base: string): Promise<StoredRates | null>;
  write(doc: StoredRates): Promise<void>;
};

export const STALE_AFTER_MS = 36 * 60 * 60 * 1000;
export const TTL_SECONDS = 7 * 24 * 60 * 60;
export const DEFAULT_BASES = ["USD", "EUR"];
export const DEFAULT_SYMBOLS = ["EUR", "USD", "ILS", "GBP", "JPY"];

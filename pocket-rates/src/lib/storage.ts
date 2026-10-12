export type Pair = { from: string; to: string };
export type SavedRates = { fetchedAt: string; books: Record<string, { date: string; rates: Record<string, number> }> };

export type Kv = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

const FAVORITES = "pocket-rates.favorites";
const RATES = "pocket-rates.rates";

function read<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function loadFavorites(kv: Kv): Promise<Pair[]> {
  const rows = read<Pair[]>(await kv.getItem(FAVORITES), []);
  return Array.isArray(rows) ? rows.filter((row) => row && typeof row.from === "string" && typeof row.to === "string") : [];
}

export async function saveFavorites(kv: Kv, pairs: Pair[]) {
  await kv.setItem(FAVORITES, JSON.stringify(pairs));
}

export async function loadSavedRates(kv: Kv): Promise<SavedRates | null> {
  const saved = read<SavedRates | null>(await kv.getItem(RATES), null);
  if (!saved || typeof saved.fetchedAt !== "string" || !saved.books) return null;
  return saved;
}

export async function saveRates(kv: Kv, saved: SavedRates) {
  await kv.setItem(RATES, JSON.stringify(saved));
}

export async function clearSaved(kv: Kv) {
  await kv.removeItem(FAVORITES);
  await kv.removeItem(RATES);
}

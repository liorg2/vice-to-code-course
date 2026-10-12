import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FRANKFURTER_URL } from "@/config/api";
import { convert, parseAmount } from "@/lib/convert";
import { fetchCurrencies, fetchRates } from "@/lib/ratesApi";
import { clearSaved, loadFavorites, loadSavedRates, saveFavorites, saveRates, type Pair } from "@/lib/storage";

type Status = "loading" | "ready" | "error" | "offline";

type Model = {
  currencies: string[];
  from: string;
  to: string;
  amount: string;
  setFrom: (value: string) => void;
  setTo: (value: string) => void;
  setAmount: (value: string) => void;
  swap: () => void;
  result: number | null;
  status: Status;
  note: string;
  slow: boolean;
  favorites: Pair[];
  savePair: () => void;
  retry: () => void;
  clear: () => Promise<void>;
};

const Ctx = createContext<Model | null>(null);

export function RatesProvider({ children }: { children: ReactNode }) {
  const [currencies, setCurrencies] = useState(["USD", "EUR", "ILS", "GBP", "JPY"]);
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("EUR");
  const [amount, setAmount] = useState("100");
  const [rate, setRate] = useState<number | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [note, setNote] = useState("");
  const [slow, setSlow] = useState(false);
  const [favorites, setFavorites] = useState<Pair[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let gone = false;
    void (async () => {
      const [savedFavorites, savedRates] = await Promise.all([loadFavorites(AsyncStorage), loadSavedRates(AsyncStorage)]);
      if (gone) return;
      setFavorites(savedFavorites);
      const slowTimer = setTimeout(() => setSlow(true), 3000);
      try {
        const [codes, book] = await Promise.all([
          fetchCurrencies(fetch, FRANKFURTER_URL),
          fetchRates(from, fetch, FRANKFURTER_URL),
        ]);
        if (gone) return;
        setCurrencies(codes.length > 0 ? codes : currencies);
        const next = book.rates[to] ?? (from === to ? 1 : null);
        setRate(next);
        setStatus("ready");
        setNote(`Rates from ${book.date}`);
        const books = { ...(savedRates?.books ?? {}), [from]: book };
        await saveRates(AsyncStorage, { fetchedAt: new Date().toISOString(), books });
      } catch {
        if (gone) return;
        const cached = savedRates?.books[from];
        if (cached?.rates[to] !== undefined) {
          setRate(cached.rates[to] ?? null);
          setStatus("offline");
          setNote(`Offline. Rates from ${new Date(savedRates!.fetchedAt).toLocaleString()}`);
        } else if (from === to) {
          setRate(1);
          setStatus("ready");
        } else {
          setRate(null);
          setStatus(savedRates ? "offline" : "error");
          setNote(savedRates ? "Offline. No saved rate for this pair yet." : "Could not load rates.");
        }
      } finally {
        clearTimeout(slowTimer);
        if (!gone) setSlow(false);
      }
    })();
    return () => {
      gone = true;
    };
  }, [from, to, tick]);

  const result = useMemo(() => {
    const parsed = parseAmount(amount);
    if (parsed === null || rate === null) return null;
    return convert(parsed, rate);
  }, [amount, rate]);

  const model: Model = {
    currencies,
    from,
    to,
    amount,
    setFrom,
    setTo,
    setAmount,
    swap: () => {
      setFrom(to);
      setTo(from);
    },
    result,
    status,
    note,
    slow,
    favorites,
    savePair: () => {
      const next = favorites.some((pair) => pair.from === from && pair.to === to) ? favorites : [...favorites, { from, to }];
      setFavorites(next);
      void saveFavorites(AsyncStorage, next);
    },
    retry: () => setTick((value) => value + 1),
    clear: async () => {
      await clearSaved(AsyncStorage);
      setFavorites([]);
    },
  };

  return <Ctx.Provider value={model}>{children}</Ctx.Provider>;
}

export function useRates() {
  const value = useContext(Ctx);
  if (!value) throw new Error("useRates outside provider");
  return value;
}

export function convert(amount: number, rate: number): number | null {
  if (!Number.isFinite(amount) || !Number.isFinite(rate)) return null;
  if (amount === 0) return 0;
  return Math.round(amount * rate * 100) / 100;
}

export function parseAmount(text: string): number | null {
  if (text.trim() === "") return null;
  const value = Number(text);
  if (!Number.isFinite(value) || value < 0) return null;
  return value;
}

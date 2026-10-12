/**
 * Money is rounded half away from zero to 2 decimal places.
 * 1.005 -> 1.01, -1.005 -> -1.01. Rates themselves are not rounded.
 */
export function roundMoney(value: number): number {
  const sign = value < 0 ? -1 : 1;
  const scaled = Math.round(Number((Math.abs(value) * 100).toFixed(8)));
  return (sign * scaled) / 100;
}

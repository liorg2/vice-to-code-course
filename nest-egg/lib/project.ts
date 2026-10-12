import { isAsset, type Account, type Household, type Kid, type Person, type Plan, type Snapshot } from "./model";

export type ProjectionRow = {
  date: string;
  ages: Record<string, number>;
  netWorthCents: number;
};

function addMonths(ym: string, count: number): string {
  const year = Number(ym.slice(0, 4));
  const month = Number(ym.slice(5));
  const total = year * 12 + (month - 1) + count;
  const y = Math.floor(total / 12);
  const m = (total % 12) + 1;
  return `${y}-${String(m).padStart(2, "0")}`;
}

export function latestBalance(snapshots: Snapshot[], accountId: string): number {
  const rows = snapshots.filter((s) => s.accountId === accountId).sort((a, b) => a.month.localeCompare(b.month));
  return rows.at(-1)?.balanceCents ?? 0;
}

export function netWorthCents(accounts: Account[], snapshots: Snapshot[], month?: string): number {
  return accounts.reduce((sum, account) => {
    const rows = snapshots.filter((s) => s.accountId === account.id && (month === undefined || s.month === month));
    const balance = month === undefined ? latestBalance(snapshots, account.id) : rows[0]?.balanceCents ?? 0;
    if (month !== undefined && rows.length === 0) return sum;
    return sum + (isAsset(account.type) ? balance : -balance);
  }, 0);
}

export function project(household: Pick<Household, "people" | "accounts" | "snapshots">, plan: Plan, months = 12 * 50, start?: string): ProjectionRow[] {
  const latest = household.snapshots.map((s) => s.month).sort().at(-1);
  const startMonth = start ?? (latest ? addMonths(latest, 1) : `${new Date().getFullYear()}-01`);
  let net = netWorthCents(household.accounts, household.snapshots);
  let spend = plan.monthlySpendCents;
  const rows: ProjectionRow[] = [];
  for (let i = 0; i < months; i += 1) {
    const date = addMonths(startMonth, i);
    const year = Number(date.slice(0, 4));
    const ages: Record<string, number> = {};
    for (const person of household.people) ages[person.id] = year - person.birthYear;
    const retired = household.people.every((person) => ages[person.id]! >= (plan.retirementAges[person.id] ?? 65));
    const monthlyRate = plan.yearlyReturnPercent / 100 / 12;
    net = Math.round(net * (1 + monthlyRate));
    if (!retired) net += plan.monthlySavingCents;
    else {
      net -= spend;
      spend = Math.round(spend * (1 + plan.yearlyInflationPercent / 100 / 12));
    }
    for (const event of plan.events) if (event.month === date) net += event.amountCents;
    rows.push({ date, ages, netWorthCents: net });
  }
  return rows;
}

export function moneyLastsUntil(rows: ProjectionRow[], people: Person[]): number | null {
  const first = people[0];
  if (!first) return null;
  let last: number | null = null;
  for (const row of rows) {
    if (row.netWorthCents > 0) last = row.ages[first.id] ?? null;
  }
  return last;
}

export function kidCurve(kid: Kid, nowYear = new Date().getFullYear()): { age: number; cents: number }[] {
  const currentAge = nowYear - kid.birthYear;
  const years = Math.max(1, kid.targetAge - currentAge);
  const monthlyRate = kid.yearlyReturnPercent / 100 / 12;
  const points: { age: number; cents: number }[] = [];
  let total = 0;
  for (let year = 1; year <= years; year += 1) {
    for (let month = 0; month < 12; month += 1) {
      total = monthlyRate === 0 ? total + kid.monthlyDepositCents : Math.round((total + kid.monthlyDepositCents) * (1 + monthlyRate));
    }
    points.push({ age: currentAge + year, cents: total });
  }
  return points;
}

export function ageInYear(person: Person, year: number): number {
  return year - person.birthYear;
}

import { hashPassword, type DbState } from "./store";
import type { Account, Household, Plan, Snapshot } from "./model";

function monthsEnding(count: number, now = new Date()): string[] {
  const rows: string[] = [];
  for (let i = count; i >= 1; i -= 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    rows.push(`${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return rows;
}

export function sampleHousehold(): Household {
  const people = [
    { id: "p-alex", name: "Alex", birthYear: 1980 },
    { id: "p-sam", name: "Sam", birthYear: 1982 },
  ];
  const accounts: Account[] = [
    { id: "a-cash", name: "Checking", type: "cash", ownerId: "p-alex" },
    { id: "a-broker", name: "Brokerage", type: "brokerage", ownerId: "p-alex" },
    { id: "a-401k", name: "Alex 401k", type: "retirement", ownerId: "p-alex" },
    { id: "a-ira", name: "Sam IRA", type: "retirement", ownerId: "p-sam" },
    { id: "a-home", name: "Home", type: "home", ownerId: "p-alex" },
    { id: "a-mort", name: "Mortgage", type: "mortgage", ownerId: "p-alex" },
    { id: "a-car", name: "Car loan", type: "other_debt", ownerId: "p-sam" },
    { id: "a-hysa", name: "Savings", type: "cash", ownerId: "p-sam" },
  ];
  const base: Record<string, number> = {
    "a-cash": 420000,
    "a-broker": 8500000,
    "a-401k": 12000000,
    "a-ira": 6400000,
    "a-home": 48000000,
    "a-mort": 31000000,
    "a-car": 800000,
    "a-hysa": 1500000,
  };
  const snapshots: Snapshot[] = [];
  monthsEnding(24).forEach((month, index) => {
    for (const account of accounts) {
      const drift = (index - 12) * (account.type === "mortgage" || account.type === "other_debt" ? -15000 : 20000);
      snapshots.push({ id: `s-${account.id}-${month}`, accountId: account.id, month, balanceCents: (base[account.id] ?? 0) + drift });
    }
  });
  const plans: Plan[] = [
    {
      id: "plan-base",
      name: "Base",
      retirementAges: { "p-alex": 65, "p-sam": 65 },
      monthlySavingCents: 200000,
      monthlySpendCents: 700000,
      yearlyReturnPercent: 5,
      yearlyInflationPercent: 2,
      events: [],
    },
    {
      id: "plan-later",
      name: "Retire later",
      retirementAges: { "p-alex": 70, "p-sam": 70 },
      monthlySavingCents: 250000,
      monthlySpendCents: 650000,
      yearlyReturnPercent: 5,
      yearlyInflationPercent: 2,
      events: [],
    },
  ];
  return {
    id: "home-a",
    name: "Sample household",
    pro: false,
    people,
    accounts,
    snapshots,
    plans,
    kids: [
      { id: "k-riley", name: "Riley", birthYear: 2016, monthlyDepositCents: 20000, targetAge: 18, yearlyReturnPercent: 5 },
      { id: "k-jordan", name: "Jordan", birthYear: 2018, monthlyDepositCents: 15000, targetAge: 18, yearlyReturnPercent: 5 },
    ],
  };
}

export function seedState(): DbState {
  const other: Household = {
    id: "home-b",
    name: "Other household",
    pro: false,
    people: [{ id: "p-blair", name: "Blair", birthYear: 1990 }],
    accounts: [{ id: "a-blair", name: "Blair cash", type: "cash", ownerId: "p-blair" }],
    snapshots: [],
    plans: [],
    kids: [],
  };
  const a = hashPassword("nest-a");
  const b = hashPassword("nest-b");
  const c = hashPassword("nest-c");
  return {
    users: [
      { id: "user-a", email: "a@example.test", householdId: "home-a", role: "owner", ...a },
      { id: "user-b", email: "b@example.test", householdId: "home-b", role: "owner", ...b },
      { id: "user-c", email: "c@example.test", householdId: "home-a", role: "viewer", ...c },
    ],
    households: [sampleHousehold(), other],
    processedPayments: [],
  };
}

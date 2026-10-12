export const ACCOUNT_TYPES = [
  "cash",
  "brokerage",
  "retirement",
  "home",
  "other_asset",
  "mortgage",
  "other_debt",
] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const ASSET_TYPES: AccountType[] = ["cash", "brokerage", "retirement", "home", "other_asset"];

export type Role = "owner" | "editor" | "viewer";

export type Person = { id: string; name: string; birthYear: number };
export type Account = { id: string; name: string; type: AccountType; ownerId: string };
export type Snapshot = { id: string; accountId: string; month: string; balanceCents: number };
export type PlanEvent = { month: string; label: string; amountCents: number };
export type Plan = {
  id: string;
  name: string;
  retirementAges: Record<string, number>;
  monthlySavingCents: number;
  monthlySpendCents: number;
  yearlyReturnPercent: number;
  yearlyInflationPercent: number;
  events: PlanEvent[];
};
export type Kid = {
  id: string;
  name: string;
  birthYear: number;
  monthlyDepositCents: number;
  targetAge: number;
  yearlyReturnPercent: number;
};

export type Household = {
  id: string;
  name: string;
  pro: boolean;
  people: Person[];
  accounts: Account[];
  snapshots: Snapshot[];
  plans: Plan[];
  kids: Kid[];
};

export type User = {
  id: string;
  email: string;
  passwordSalt: string;
  passwordHash: string;
  householdId: string;
  role: Role;
};

export type FieldErrors = Record<string, string>;

export function isAsset(type: AccountType): boolean {
  return ASSET_TYPES.includes(type);
}

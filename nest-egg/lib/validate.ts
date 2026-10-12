import { ACCOUNT_TYPES, type Account, type AccountType, type FieldErrors, type Kid, type Person, type Plan, type Snapshot } from "./model";

export type Ok<T> = { ok: true; value: T };
export type Bad = { ok: false; errors: FieldErrors };

const thisYear = () => new Date().getFullYear();

function text(value: unknown, field: string, errors: FieldErrors, max = 100): string | undefined {
  if (typeof value !== "string" || value.trim().length === 0) {
    errors[field] = "Enter a name";
    return;
  }
  if (value.trim().length > max) {
    errors[field] = `Use at most ${max} characters`;
    return;
  }
  return value.trim();
}

function year(value: unknown, field: string, errors: FieldErrors): number | undefined {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(n) || n < 1920 || n > thisYear()) {
    errors[field] = `Use a year from 1920 to ${thisYear()}`;
    return;
  }
  return n;
}

function cents(value: unknown, field: string, errors: FieldErrors): number | undefined {
  if (typeof value === "number" && !Number.isInteger(value)) {
    errors[field] = "Use whole cents, not a fraction";
    return;
  }
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(n)) {
    errors[field] = "Use whole cents";
    return;
  }
  return n;
}

function percent(value: unknown, field: string, errors: FieldErrors): number | undefined {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < -10 || n > 20) {
    errors[field] = "Use a rate from -10% to 20%";
    return;
  }
  return n;
}

export function monthOk(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}$/.test(value)) return false;
  const month = Number(value.slice(5));
  return month >= 1 && month <= 12;
}

export function validatePerson(input: unknown, id: string): Ok<Person> | Bad {
  const errors: FieldErrors = {};
  const raw = (input ?? {}) as Record<string, unknown>;
  const name = text(raw.name, "name", errors);
  const birthYear = year(raw.birthYear, "birthYear", errors);
  if (Object.keys(errors).length || name === undefined || birthYear === undefined) return { ok: false, errors };
  return { ok: true, value: { id, name, birthYear } };
}

export function validateAccount(input: unknown, id: string, people: Person[]): Ok<Account> | Bad {
  const errors: FieldErrors = {};
  const raw = (input ?? {}) as Record<string, unknown>;
  const name = text(raw.name, "name", errors);
  const type = raw.type;
  if (typeof type !== "string" || !ACCOUNT_TYPES.includes(type as AccountType)) {
    errors.type = "Choose a type from the list";
  }
  const ownerId = raw.ownerId;
  if (typeof ownerId !== "string" || !people.some((p) => p.id === ownerId)) {
    errors.ownerId = "Choose an owner";
  }
  if (Object.keys(errors).length || name === undefined || typeof type !== "string" || typeof ownerId !== "string") {
    return { ok: false, errors };
  }
  return { ok: true, value: { id, name, type: type as AccountType, ownerId } };
}

export function validateSnapshot(input: unknown, id: string, accounts: Account[]): Ok<Snapshot> | Bad {
  const errors: FieldErrors = {};
  const raw = (input ?? {}) as Record<string, unknown>;
  const accountId = raw.accountId;
  if (typeof accountId !== "string" || !accounts.some((a) => a.id === accountId)) {
    errors.accountId = "That account does not exist";
  }
  if (!monthOk(raw.month)) errors.month = "Use a real month, like 2026-03";
  const balanceCents = cents(raw.balanceCents, "balanceCents", errors);
  if (Object.keys(errors).length || typeof accountId !== "string" || typeof raw.month !== "string" || balanceCents === undefined) {
    return { ok: false, errors };
  }
  return { ok: true, value: { id, accountId, month: raw.month, balanceCents } };
}

export function validatePlan(input: unknown, id: string): Ok<Plan> | Bad {
  const errors: FieldErrors = {};
  const raw = (input ?? {}) as Record<string, unknown>;
  const name = text(raw.name, "name", errors);
  const monthlySavingCents = cents(raw.monthlySavingCents, "monthlySavingCents", errors);
  const monthlySpendCents = cents(raw.monthlySpendCents, "monthlySpendCents", errors);
  const yearlyReturnPercent = percent(raw.yearlyReturnPercent, "yearlyReturnPercent", errors);
  const yearlyInflationPercent = percent(raw.yearlyInflationPercent, "yearlyInflationPercent", errors);
  const retirementAges = raw.retirementAges;
  if (retirementAges === null || typeof retirementAges !== "object") errors.retirementAges = "Set a retirement age";
  const events = Array.isArray(raw.events) ? raw.events : [];
  if (Object.keys(errors).length || name === undefined || monthlySavingCents === undefined || monthlySpendCents === undefined || yearlyReturnPercent === undefined || yearlyInflationPercent === undefined) {
    return { ok: false, errors };
  }
  return {
    ok: true,
    value: {
      id,
      name,
      retirementAges: retirementAges as Record<string, number>,
      monthlySavingCents,
      monthlySpendCents,
      yearlyReturnPercent,
      yearlyInflationPercent,
      events: events as Plan["events"],
    },
  };
}

export function validateKid(input: unknown, id: string): Ok<Kid> | Bad {
  const errors: FieldErrors = {};
  const raw = (input ?? {}) as Record<string, unknown>;
  const name = text(raw.name, "name", errors);
  const birthYear = year(raw.birthYear, "birthYear", errors);
  const monthlyDepositCents = cents(raw.monthlyDepositCents, "monthlyDepositCents", errors);
  const targetAge = yearLikeAge(raw.targetAge, errors);
  const yearlyReturnPercent = percent(raw.yearlyReturnPercent, "yearlyReturnPercent", errors);
  if (Object.keys(errors).length || name === undefined || birthYear === undefined || monthlyDepositCents === undefined || targetAge === undefined || yearlyReturnPercent === undefined) {
    return { ok: false, errors };
  }
  return { ok: true, value: { id, name, birthYear, monthlyDepositCents, targetAge, yearlyReturnPercent } };
}

function yearLikeAge(value: unknown, errors: FieldErrors): number | undefined {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 30) {
    errors.targetAge = "Use a target age from 1 to 30";
    return;
  }
  return n;
}

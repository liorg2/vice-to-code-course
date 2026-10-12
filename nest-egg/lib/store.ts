import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { Account, Household, Kid, Person, Plan, Snapshot, User } from "./model";
import { isAsset } from "./model";
import { netWorthCents, project } from "./project";
import { validateAccount, validateKid, validatePerson, validatePlan, validateSnapshot } from "./validate";

export type DbState = { users: User[]; households: Household[]; processedPayments: string[] };

export type Result = { status: number; body: unknown };

const ASSET = isAsset;

export function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const passwordHash = scryptSync(password, salt, 32).toString("hex");
  return { passwordSalt: salt, passwordHash };
}

export function passwordOk(user: User, password: string): boolean {
  const next = scryptSync(password, user.passwordSalt, 32);
  const prev = Buffer.from(user.passwordHash, "hex");
  return next.length === prev.length && timingSafeEqual(next, prev);
}

function id(): string {
  return randomBytes(8).toString("hex");
}

export function createDb(seed?: Partial<DbState>): DbState {
  return { users: seed?.users ?? [], households: seed?.households ?? [], processedPayments: seed?.processedPayments ?? [] };
}

function householdOf(state: DbState, householdId: string): Household | undefined {
  return state.households.find((h) => h.id === householdId);
}

function canWrite(role: string): boolean {
  return role === "owner" || role === "editor";
}

export function publicHousehold(home: Household) {
  return {
    id: home.id,
    name: home.name,
    pro: home.pro,
    people: home.people,
    accounts: home.accounts,
    snapshots: home.snapshots,
    plans: home.pro ? home.plans : home.plans.slice(0, 2),
    kids: home.pro ? home.kids : [],
    netWorthCents: netWorthCents(home.accounts, home.snapshots),
  };
}

export function login(state: DbState, email: string, password: string): User | null {
  const user = state.users.find((u) => u.email === email.toLowerCase());
  if (!user || !passwordOk(user, password)) return null;
  return user;
}

function notFound(): Result {
  return { status: 404, body: { error: "Not found" } };
}

export function mutate(state: DbState, householdId: string, role: string, method: string, path: string, body: unknown): Result {
  const home = householdOf(state, householdId);
  if (!home) return notFound();
  const parts = path.split("/").filter(Boolean);
  const kind = parts[0];
  const itemId = parts[1];
  if (method === "GET" && kind === "net-worth") {
    const byMonth = new Map<string, number>();
    for (const snap of home.snapshots) {
      byMonth.set(snap.month, (byMonth.get(snap.month) ?? 0) + signed(home, snap));
    }
    const months = [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, cents]) => ({ month, cents }));
    return { status: 200, body: { months, totalCents: netWorthCents(home.accounts, home.snapshots) } };
  }
  if (method === "GET" && kind === "projection") {
    const planId = itemId;
    const plan = home.plans.find((p) => p.id === planId);
    if (!plan) return notFound();
    if (!home.pro && home.plans.indexOf(plan) > 1) return { status: 403, body: { error: "Pro plan required" } };
    return { status: 200, body: { rows: project(home, plan) } };
  }
  if (!kind || !["people", "accounts", "snapshots", "plans", "kids"].includes(kind)) {
    return { status: 405, body: { error: "Method or path is not supported" } };
  }
  if (method === "GET" && !itemId) {
    const list = collection(home, kind);
    return { status: 200, body: { items: list } };
  }
  if (method === "POST" && !itemId) {
    if (!canWrite(role)) return { status: 403, body: { error: "Viewers cannot change records" } };
    if (kind === "kids" && !home.pro) return { status: 403, body: { error: "Pro plan required" } };
    if (kind === "plans" && !home.pro && home.plans.length >= 2) return { status: 403, body: { error: "Pro plan required" } };
    return createItem(home, kind, body);
  }
  if (!itemId) return { status: 405, body: { error: "Method or path is not supported" } };
  if (method === "PATCH") {
    if (!canWrite(role)) return { status: 403, body: { error: "Viewers cannot change records" } };
    return updateItem(home, kind, itemId, body);
  }
  if (method === "DELETE") {
    if (!canWrite(role)) return { status: 403, body: { error: "Viewers cannot change records" } };
    return deleteItem(home, kind, itemId);
  }
  return { status: 405, body: { error: "Method or path is not supported" } };
}

function signed(home: Household, snap: Snapshot): number {
  const account = home.accounts.find((a) => a.id === snap.accountId);
  if (!account) return 0;
  return ASSET(account.type) ? snap.balanceCents : -snap.balanceCents;
}

function collection(home: Household, kind: string): unknown[] {
  if (kind === "people") return home.people;
  if (kind === "accounts") return home.accounts;
  if (kind === "snapshots") return home.snapshots;
  if (kind === "plans") return home.pro ? home.plans : home.plans.slice(0, 2);
  return home.pro ? home.kids : [];
}

function createItem(home: Household, kind: string, body: unknown): Result {
  const newId = id();
  if (kind === "people") {
    const parsed = validatePerson(body, newId);
    if (!parsed.ok) return { status: 400, body: { errors: parsed.errors } };
    home.people.push(parsed.value);
    return { status: 201, body: parsed.value };
  }
  if (kind === "accounts") {
    const parsed = validateAccount(body, newId, home.people);
    if (!parsed.ok) return { status: 400, body: { errors: parsed.errors } };
    home.accounts.push(parsed.value);
    return { status: 201, body: parsed.value };
  }
  if (kind === "snapshots") {
    const raw = (body ?? {}) as { accountId?: string };
    if (typeof raw.accountId === "string" && !home.accounts.some((a) => a.id === raw.accountId)) {
      return { status: 422, body: { errors: { accountId: "That account does not exist" } } };
    }
    const parsed = validateSnapshot(body, newId, home.accounts);
    if (!parsed.ok) return { status: 400, body: { errors: parsed.errors } };
    if (home.snapshots.some((s) => s.accountId === parsed.value.accountId && s.month === parsed.value.month)) {
      return { status: 409, body: { error: "That account already has a snapshot for this month" } };
    }
    home.snapshots.push(parsed.value);
    return { status: 201, body: parsed.value };
  }
  if (kind === "plans") {
    const parsed = validatePlan(body, newId);
    if (!parsed.ok) return { status: 400, body: { errors: parsed.errors } };
    home.plans.push(parsed.value);
    return { status: 201, body: parsed.value };
  }
  const parsed = validateKid(body, newId);
  if (!parsed.ok) return { status: 400, body: { errors: parsed.errors } };
  home.kids.push(parsed.value);
  return { status: 201, body: parsed.value };
}

function updateItem(home: Household, kind: string, itemId: string, body: unknown): Result {
  if (kind === "people") return replace(home.people, itemId, (current) => validatePerson({ ...current, ...(body as object) }, itemId));
  if (kind === "accounts") return replace(home.accounts, itemId, (current) => validateAccount({ ...current, ...(body as object) }, itemId, home.people));
  if (kind === "snapshots") {
    const current = home.snapshots.find((s) => s.id === itemId);
    if (!current) return notFound();
    const parsed = validateSnapshot({ ...current, ...(body as object) }, itemId, home.accounts);
    if (!parsed.ok) return { status: 400, body: { errors: parsed.errors } };
    const clash = home.snapshots.some((s) => s.id !== itemId && s.accountId === parsed.value.accountId && s.month === parsed.value.month);
    if (clash) return { status: 409, body: { error: "That account already has a snapshot for this month" } };
    Object.assign(current, parsed.value);
    return { status: 200, body: current };
  }
  if (kind === "plans") return replace(home.plans, itemId, (current) => validatePlan({ ...current, ...(body as object) }, itemId));
  return replace(home.kids, itemId, (current) => validateKid({ ...current, ...(body as object) }, itemId));
}

function replace<T extends { id: string }>(list: T[], itemId: string, parse: (current: T) => { ok: true; value: T } | { ok: false; errors: Record<string, string> }): Result {
  const index = list.findIndex((item) => item.id === itemId);
  const current = list[index];
  if (!current) return notFound();
  const parsed = parse(current);
  if (!parsed.ok) return { status: 400, body: { errors: parsed.errors } };
  list[index] = parsed.value;
  return { status: 200, body: parsed.value };
}

function deleteItem(home: Household, kind: string, itemId: string): Result {
  if (kind === "people") return drop(home.people, itemId, () => {
    const owned = home.accounts.filter((a) => a.ownerId === itemId).map((a) => a.id);
    home.accounts = home.accounts.filter((a) => a.ownerId !== itemId);
    home.snapshots = home.snapshots.filter((s) => !owned.includes(s.accountId));
  });
  if (kind === "accounts") return drop(home.accounts, itemId, () => {
    home.snapshots = home.snapshots.filter((s) => s.accountId !== itemId);
  });
  if (kind === "snapshots") return drop(home.snapshots, itemId);
  if (kind === "plans") return drop(home.plans, itemId);
  return drop(home.kids, itemId);
}

function drop<T extends { id: string }>(list: T[], itemId: string, after?: () => void): Result {
  const index = list.findIndex((item) => item.id === itemId);
  if (index < 0) return notFound();
  list.splice(index, 1);
  after?.();
  return { status: 204, body: null };
}

export function applyPayment(state: DbState, householdId: string, event: { id: string; type: "paid" | "refund" }): Result {
  if (state.processedPayments.includes(event.id)) return { status: 200, body: { duplicate: true } };
  const home = householdOf(state, householdId);
  if (!home) return notFound();
  state.processedPayments.push(event.id);
  home.pro = event.type === "paid";
  return { status: 200, body: { pro: home.pro } };
}

export type { Person, Account, Snapshot, Plan, Kid };

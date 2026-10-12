import { randomBytes } from "node:crypto";
import { STAGES, type Activity, type Contact, type Db, type Deal, type Stage } from "./model";

export type Result = { status: number; body: unknown };

function id() {
  return randomBytes(8).toString("hex");
}

function own<T extends { id: string; userId: string }>(rows: T[], userId: string, itemId: string) {
  return rows.find((row) => row.id === itemId && row.userId === userId);
}

export function visible(db: Db, userId: string) {
  return {
    contacts: db.contacts.filter((row) => row.userId === userId),
    deals: db.deals.filter((row) => row.userId === userId),
    activities: db.activities.filter((row) => row.userId === userId),
  };
}

export function mutate(db: Db, userId: string, method: string, path: string, body: unknown): Result {
  const [kind, itemId] = path.split("/").filter(Boolean);
  if (method === "GET" && !itemId) return { status: 200, body: visible(db, userId) };
  if (method === "POST" && kind === "contacts") return createContact(db, userId, body);
  if (method === "POST" && kind === "deals") return createDeal(db, userId, body);
  if (method === "POST" && kind === "activities") return createActivity(db, userId, body);
  if (method === "PATCH" && kind === "contacts" && itemId) return patchContact(db, userId, itemId, body);
  if (method === "PATCH" && kind === "deals" && itemId) return patchDeal(db, userId, itemId, body);
  if (method === "PATCH" && kind === "activities" && itemId) return patchActivity(db, userId, itemId, body);
  if (method === "DELETE" && itemId) return remove(db, userId, kind ?? "", itemId);
  return { status: 405, body: { error: "Not supported" } };
}

function requireName(body: unknown): string | Result {
  const name = (body as { name?: unknown })?.name;
  if (typeof name !== "string" || name.trim() === "") return { status: 400, body: { errors: { name: "Enter a name" } } };
  return name.trim();
}

function createContact(db: Db, userId: string, body: unknown): Result {
  const name = requireName(body);
  if (typeof name !== "string") return name;
  const raw = body as Partial<Contact>;
  const contact: Contact = {
    id: id(),
    userId,
    name,
    email: String(raw.email ?? ""),
    phone: String(raw.phone ?? ""),
    company: String(raw.company ?? ""),
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
  };
  db.contacts.push(contact);
  return { status: 201, body: contact };
}

function createDeal(db: Db, userId: string, body: unknown): Result {
  const raw = body as Partial<Deal> & { title?: string };
  if (!raw.title?.trim()) return { status: 400, body: { errors: { title: "Enter a title" } } };
  if (!own(db.contacts, userId, String(raw.contactId))) return { status: 400, body: { errors: { contactId: "Choose your own contact" } } };
  if (!STAGES.includes(raw.stage as Stage)) return { status: 400, body: { errors: { stage: "Choose a stage" } } };
  const value = Number(raw.valueCents);
  if (!Number.isInteger(value)) return { status: 400, body: { errors: { valueCents: "Use whole cents" } } };
  const deal: Deal = { id: id(), userId, title: raw.title.trim(), contactId: String(raw.contactId), valueCents: value, stage: raw.stage as Stage };
  db.deals.push(deal);
  return { status: 201, body: deal };
}

function createActivity(db: Db, userId: string, body: unknown): Result {
  const raw = body as Partial<Activity>;
  if (!own(db.contacts, userId, String(raw.contactId))) return { status: 400, body: { errors: { contactId: "Choose your own contact" } } };
  if (!raw.body?.trim()) return { status: 400, body: { errors: { body: "Write a note" } } };
  const activity: Activity = {
    id: id(),
    userId,
    contactId: String(raw.contactId),
    kind: raw.kind ?? "note",
    body: raw.body.trim(),
    done: false,
  };
  db.activities.push(activity);
  return { status: 201, body: activity };
}

function patchContact(db: Db, userId: string, itemId: string, body: unknown): Result {
  const current = own(db.contacts, userId, itemId);
  if (!current) return { status: 404, body: { error: "Not found" } };
  Object.assign(current, body, { id: current.id, userId: current.userId });
  return { status: 200, body: current };
}

function patchDeal(db: Db, userId: string, itemId: string, body: unknown): Result {
  const current = own(db.deals, userId, itemId);
  if (!current) return { status: 404, body: { error: "Not found" } };
  const next = { ...current, ...(body as object), id: current.id, userId: current.userId };
  if (!STAGES.includes(next.stage)) return { status: 400, body: { errors: { stage: "Choose a stage" } } };
  Object.assign(current, next);
  return { status: 200, body: current };
}

function patchActivity(db: Db, userId: string, itemId: string, body: unknown): Result {
  const current = own(db.activities, userId, itemId);
  if (!current) return { status: 404, body: { error: "Not found" } };
  Object.assign(current, body, { id: current.id, userId: current.userId });
  return { status: 200, body: current };
}

function remove(db: Db, userId: string, kind: string, itemId: string): Result {
  if (kind === "contacts") {
    const current = own(db.contacts, userId, itemId);
    if (!current) return { status: 404, body: { error: "Not found" } };
    db.contacts = db.contacts.filter((row) => row.id !== itemId);
    db.deals = db.deals.filter((row) => row.contactId !== itemId);
    db.activities = db.activities.filter((row) => row.contactId !== itemId);
    return { status: 204, body: null };
  }
  const list: Array<{ id: string; userId: string }> = kind === "deals" ? db.deals : db.activities;
  const current = own(list, userId, itemId);
  if (!current) return { status: 404, body: { error: "Not found" } };
  if (kind === "deals") db.deals = db.deals.filter((row) => row.id !== itemId);
  else db.activities = db.activities.filter((row) => row.id !== itemId);
  return { status: 204, body: null };
}

import { createHmac, timingSafeEqual } from "node:crypto";
import { getState, persist } from "./practice";
import { applyPayment, login, mutate, publicHousehold } from "./store";

const secret = () => process.env.SESSION_SECRET ?? "lab-only-session-secret";

export function signSession(userId: string): string {
  const body = Buffer.from(JSON.stringify({ userId })).toString("base64url");
  const mac = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${mac}`;
}

export function readSession(token: string | undefined): { userId: string } | null {
  if (!token) return null;
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const parsed = JSON.parse(Buffer.from(body, "base64url").toString()) as { userId?: string };
  return parsed.userId ? { userId: parsed.userId } : null;
}

export function sessionUser(token: string | undefined) {
  const session = readSession(token);
  if (!session) return null;
  return getState().users.find((user) => user.id === session.userId) ?? null;
}

export function loginWithPassword(email: string, password: string) {
  const user = login(getState(), email, password);
  if (!user) return null;
  return { token: signSession(user.id), user: { id: user.id, email: user.email, role: user.role, householdId: user.householdId } };
}

export function bundleFor(userId: string) {
  const state = getState();
  const user = state.users.find((item) => item.id === userId);
  if (!user) return null;
  const home = state.households.find((item) => item.id === user.householdId);
  if (!home) return null;
  return { me: { id: user.id, email: user.email, role: user.role }, household: publicHousehold(home) };
}

export function change(userId: string, method: string, path: string, body: unknown) {
  const state = getState();
  const user = state.users.find((item) => item.id === userId);
  if (!user) return { status: 401, body: { error: "Sign in" } };
  const result = mutate(state, user.householdId, user.role, method, path, body);
  if (result.status < 300) persist();
  return result;
}

export function billing(userId: string, raw: string, signature: string | null) {
  const state = getState();
  const user = state.users.find((item) => item.id === userId);
  if (!user || user.role !== "owner") return { status: 403, body: { error: "Only an owner can apply a sample payment" } };
  const key = process.env.BILLING_SECRET ?? "lab-billing-secret";
  const expected = createHmac("sha256", key).update(raw).digest("hex");
  const a = Buffer.from(signature ?? "");
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { status: 400, body: { error: "Bad signature" } };
  const event = JSON.parse(raw) as { id: string; type: "paid" | "refund" };
  const result = applyPayment(state, user.householdId, event);
  persist();
  return result;
}

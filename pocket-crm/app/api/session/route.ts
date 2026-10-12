import { NextResponse } from "next/server";
import { getDb, login, save } from "@/lib/practice";
import { mutate, visible } from "@/lib/store";

function tokenFrom(request: Request) {
  const raw = request.headers.get("cookie") ?? "";
  const hit = raw.split(";").map((part) => part.trim()).find((part) => part.startsWith("crm_user="));
  return hit ? decodeURIComponent(hit.slice("crm_user=".length)) : undefined;
}

function user(request: Request) {
  const id = tokenFrom(request);
  return getDb().users.find((row) => row.id === id) ?? null;
}

export async function GET(request: Request) {
  const current = user(request);
  if (!current) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  return NextResponse.json({ me: { id: current.id, email: current.email, name: current.name }, ...visible(getDb(), current.id) });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };
  const current = login(body.email ?? "", body.password ?? "");
  if (!current) return NextResponse.json({ error: "Those details do not match" }, { status: 401 });
  const response = NextResponse.json({ me: { id: current.id, email: current.email, name: current.name }, ...visible(getDb(), current.id) });
  response.cookies.set("crm_user", current.id, { httpOnly: true, sameSite: "lax", path: "/" });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("crm_user", "", { path: "/", maxAge: 0 });
  return response;
}

export async function PATCH(request: Request) {
  const current = user(request);
  if (!current) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const body = (await request.json()) as { method?: string; path?: string; body?: unknown };
  const result = mutate(getDb(), current.id, body.method ?? "GET", body.path ?? "/", body.body);
  if (result.status < 300) save();
  if (result.status === 204) return new NextResponse(null, { status: 204 });
  return NextResponse.json(result.body, { status: result.status });
}

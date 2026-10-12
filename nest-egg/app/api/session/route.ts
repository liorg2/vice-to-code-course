import { NextResponse } from "next/server";
import { bundleFor, loginWithPassword, sessionUser } from "@/lib/session";

function tokenFrom(request: Request): string | undefined {
  const raw = request.headers.get("cookie") ?? "";
  const hit = raw.split(";").map((part) => part.trim()).find((part) => part.startsWith("nest_session="));
  return hit ? decodeURIComponent(hit.slice("nest_session=".length)) : undefined;
}

export async function GET(request: Request) {
  const user = sessionUser(tokenFrom(request));
  if (!user) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  return NextResponse.json(bundleFor(user.id));
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { email?: string; password?: string };
  const signed = loginWithPassword(body.email ?? "", body.password ?? "");
  if (!signed) return NextResponse.json({ error: "Those details do not match" }, { status: 401 });
  const response = NextResponse.json(bundleFor(signed.user.id));
  response.cookies.set("nest_session", signed.token, { httpOnly: true, sameSite: "lax", path: "/" });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("nest_session", "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}

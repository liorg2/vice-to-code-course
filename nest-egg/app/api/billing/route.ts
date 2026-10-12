import { NextResponse } from "next/server";
import { billing, sessionUser } from "@/lib/session";

function tokenFrom(request: Request): string | undefined {
  const raw = request.headers.get("cookie") ?? "";
  const hit = raw.split(";").map((part) => part.trim()).find((part) => part.startsWith("nest_session="));
  return hit ? decodeURIComponent(hit.slice("nest_session=".length)) : undefined;
}

export async function POST(request: Request) {
  const user = sessionUser(tokenFrom(request));
  if (!user) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const raw = await request.text();
  const result = billing(user.id, raw, request.headers.get("x-signature"));
  return NextResponse.json(result.body, { status: result.status });
}

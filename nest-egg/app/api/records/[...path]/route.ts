import { NextResponse } from "next/server";
import { change, sessionUser } from "@/lib/session";

function tokenFrom(request: Request): string | undefined {
  const raw = request.headers.get("cookie") ?? "";
  const hit = raw.split(";").map((part) => part.trim()).find((part) => part.startsWith("nest_session="));
  return hit ? decodeURIComponent(hit.slice("nest_session=".length)) : undefined;
}

async function run(request: Request, path: string[], method: string) {
  const user = sessionUser(tokenFrom(request));
  if (!user) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const body = method === "GET" || method === "DELETE" ? {} : await request.json().catch(() => ({}));
  const result = change(user.id, method, `/${path.join("/")}`, body);
  if (result.status === 204) return new NextResponse(null, { status: 204 });
  return NextResponse.json(result.body, { status: result.status });
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(request: Request, ctx: Ctx) {
  return run(request, (await ctx.params).path, "GET");
}
export async function POST(request: Request, ctx: Ctx) {
  return run(request, (await ctx.params).path, "POST");
}
export async function PATCH(request: Request, ctx: Ctx) {
  return run(request, (await ctx.params).path, "PATCH");
}
export async function DELETE(request: Request, ctx: Ctx) {
  return run(request, (await ctx.params).path, "DELETE");
}

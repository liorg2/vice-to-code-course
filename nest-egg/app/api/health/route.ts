import { NextResponse } from "next/server";

export async function GET() {
  const body = { status: "ok", timestamp: new Date().toISOString() };
  console.log(`health status ${body.status}`);
  return NextResponse.json(body, { headers: { "cache-control": "no-store" } });
}

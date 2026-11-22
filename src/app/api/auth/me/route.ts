import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const r = await requireUser();
  if ("error" in r) return r.error;
  return NextResponse.json({ user: r.user });
}
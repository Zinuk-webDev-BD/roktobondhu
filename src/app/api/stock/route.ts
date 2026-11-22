import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getStockSummary } from "@/lib/stock";

export async function GET() {
  const r = await requireUser();
  if ("error" in r) return r.error;
  try {
    return NextResponse.json(await getStockSummary());
  } catch (e) {
    console.error("stock failed", e);
    return NextResponse.json({ error: "স্টকের তথ্য আনা যায়নি" }, { status: 500 });
  }
}
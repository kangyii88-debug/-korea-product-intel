import { NextResponse } from "next/server";
import { planDailyCurtainCollection } from "@/lib/collection-workflow";

export async function GET() {
  return NextResponse.json({
    ok: true,
    plan: await planDailyCurtainCollection(),
  });
}

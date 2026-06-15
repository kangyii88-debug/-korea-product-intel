import { NextResponse } from "next/server";
import { mockReviews, products } from "@/lib/mock-data";
import { generateProductDecisionEngine } from "@/lib/product-decision-engine";
import { saveProductDecisionEngineResult } from "@/lib/product-decision-store";

export async function GET() {
  const result = generateProductDecisionEngine(products, mockReviews);
  await saveProductDecisionEngineResult(result);

  return NextResponse.json({
    ok: true,
    result,
  });
}

export async function POST() {
  const result = generateProductDecisionEngine(products, mockReviews);
  await saveProductDecisionEngineResult(result);

  return NextResponse.json({
    ok: true,
    result,
  });
}

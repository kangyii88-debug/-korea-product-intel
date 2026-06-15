import { NextResponse } from "next/server";
import { mockReviews, products } from "@/lib/mock-data";
import { generateMarketIntelligence } from "@/lib/market-intelligence-engine";
import { saveMarketIntelligenceResult } from "@/lib/market-intelligence-store";

export async function GET() {
  const result = generateMarketIntelligence(products, mockReviews);
  await saveMarketIntelligenceResult(result);

  return NextResponse.json({
    ok: true,
    result,
  });
}

export async function POST() {
  const result = generateMarketIntelligence(products, mockReviews);
  await saveMarketIntelligenceResult(result);

  return NextResponse.json({
    ok: true,
    result,
  });
}

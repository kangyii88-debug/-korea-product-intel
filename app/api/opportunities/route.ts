import { NextResponse } from "next/server";
import { mockReviews, products } from "@/lib/mock-data";
import { generateOpportunityCenter } from "@/lib/opportunity-engine";
import { saveOpportunityCenterResult } from "@/lib/opportunity-store";

export async function GET() {
  const result = generateOpportunityCenter(products, mockReviews);
  await saveOpportunityCenterResult(result);

  return NextResponse.json({
    ok: true,
    result,
  });
}

export async function POST() {
  const result = generateOpportunityCenter(products, mockReviews);
  await saveOpportunityCenterResult(result);

  return NextResponse.json({
    ok: true,
    result,
  });
}

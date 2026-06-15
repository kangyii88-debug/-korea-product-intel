import { NextResponse } from "next/server";
import { runProductIntelligenceWorkflow } from "@/lib/intelligence-workflow";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const result = await runProductIntelligenceWorkflow({
    productUrl: body.productUrl,
    product: body.product,
    reviews: body.reviews,
    forceRegenerate: body.forceRegenerate,
  });

  return NextResponse.json({
    ok: true,
    ...result,
  });
}

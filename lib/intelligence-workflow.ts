import type { AiVersionRecord, Product, ProductIntelligenceResult, ProductReview } from "@/lib/types";
import { generateProductIntelligenceResult } from "@/lib/product-intelligence";
import { getNextAnalysisVersion, saveAnalysisRecord } from "@/lib/intelligence-store";
import { saveAgentWorkflowTrace } from "@/lib/ai-agent-workflow";
import { generateProductDecisionProfile } from "@/lib/product-decision-engine";

export type AnalyzeInput = {
  productUrl?: string;
  product?: Product;
  reviews?: ProductReview[];
  forceRegenerate?: boolean;
};

export async function runProductIntelligenceWorkflow(input: AnalyzeInput) {
  if (!input.product) {
    throw new Error("No product payload provided.");
  }

  const startedAtMs = Date.now();
  const startedAt = new Date(startedAtMs).toISOString();
  const product = input.product;
  const reviews = input.reviews?.length ? input.reviews : [];
  const version = await getNextAnalysisVersion(product.id);
  const output = generateProductIntelligenceResult(product, reviews, version, startedAtMs);
  const decisionProfile = generateProductDecisionProfile(product, reviews);
  const finishedAt = new Date().toISOString();

  const record: AiVersionRecord<ProductIntelligenceResult> = {
    id: `${product.id}-analysis-v${version}`,
    productId: product.id,
    version,
    agentCode: "profit_risk",
    inputSnapshot: {
      productUrl: input.productUrl ?? product.url,
      product,
      reviewCount: reviews.length,
      forceRegenerate: input.forceRegenerate ?? false,
    },
    output,
    startedAt,
    finishedAt,
    durationMs: Date.now() - startedAtMs,
  };

  await saveAnalysisRecord(record);
  const agentRecords = await saveAgentWorkflowTrace(product, reviews, output, version);

  return {
    product,
    analysis: output,
    decisionProfile,
    versionRecord: record,
    agentRecords,
    rankings: {
      todayHotProducts: [],
      weeklyHighPotentialProducts: [],
      lowCompetitionHighProfitProducts: [],
      highGrowthProducts: [],
      optimizableNegativeReviewProducts: [],
      chinaSupplyChainFitProducts: [],
      highRiskProducts: [],
    },
  };
}

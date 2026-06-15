import type { AiVersionRecord, Product, ProductIntelligenceResult, ProductReview } from "@/lib/types";
import { mockReviews, products } from "@/lib/mock-data";
import { generateProductIntelligenceResult } from "@/lib/product-intelligence";
import { generateRankingSystem } from "@/lib/rankings";
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
  const startedAtMs = Date.now();
  const startedAt = new Date(startedAtMs).toISOString();
  const product = input.product ?? collectProductFromUrl(input.productUrl);
  const reviews = input.reviews?.length ? input.reviews : mockReviews.filter((review) => review.productId === product.id);
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

  const analyses = products.map((item) =>
    item.id === product.id
      ? output
      : generateProductIntelligenceResult(
          item,
          mockReviews.filter((review) => review.productId === item.id),
          1,
          Date.now(),
        ),
  );

  return {
    product,
    analysis: output,
    decisionProfile,
    versionRecord: record,
    agentRecords,
    rankings: generateRankingSystem(products, analyses),
  };
}

function collectProductFromUrl(productUrl?: string): Product {
  if (!productUrl) return products[0];
  return (
    products.find((product) => product.url === productUrl || productUrl.includes(product.id)) ??
    products.find((product) => productUrl.includes(platformHost(product.platform))) ??
    products[0]
  );
}

function platformHost(platform: Product["platform"]) {
  const hosts: Record<Product["platform"], string> = {
    Coupang: "coupang",
    "Naver Shopping": "naver",
    오늘의집: "ohou",
    "11번가": "11st",
    Gmarket: "gmarket",
    "AliExpress Korea": "aliexpress",
  };
  return hosts[platform];
}

import type { AiAgentCode, AiVersionRecord, Product, ProductIntelligenceResult, ProductReview } from "@/lib/types";
import { saveAgentRecord } from "@/lib/intelligence-store";

type AgentStep = {
  code: AiAgentCode;
  output: unknown;
};

export async function saveAgentWorkflowTrace(
  product: Product,
  reviews: ProductReview[],
  analysis: ProductIntelligenceResult,
  version: number,
) {
  const steps: AgentStep[] = [
    {
      code: "data_collector",
      output: {
        normalizedProduct: product,
        reviewCount: reviews.length,
        message: "商品链接和导入数据已标准化为产品、来源、指标和评论输入。",
      },
    },
    {
      code: "trend_analyzer",
      output: {
        whySellingWell: analysis.whySellingWell,
        whyNotSellingWell: analysis.whyNotSellingWell,
        marketDemandScore: analysis.score.marketDemand,
      },
    },
    {
      code: "review_analyzer",
      output: {
        issues: analysis.reviewIssues,
        biggestNegativeReviewReason: analysis.biggestNegativeReviewReason,
        biggestReturnReason: analysis.biggestReturnReason,
      },
    },
    {
      code: "product_developer",
      output: analysis.developmentPlan,
    },
    {
      code: "profit_risk",
      output: {
        score: analysis.score,
        estimatedMarginRate: analysis.estimatedMarginRate,
        estimatedRiskLevel: analysis.estimatedRiskLevel,
      },
    },
    {
      code: "listing_optimizer",
      output: {
        titleKeywords: product.keywords,
        mainImageAdvice: analysis.reviewIssues
          .filter((issue) => issue.issueType === "size" || issue.issueType === "color" || issue.issueType === "photo_mismatch")
          .flatMap((issue) => issue.optimizationSuggestions),
        detailPageAdvice: analysis.reviewIssues.flatMap((issue) => issue.optimizationSuggestions).slice(0, 8),
      },
    },
  ];

  const records = await Promise.all(
    steps.map((step, index) => {
      const startedAt = new Date().toISOString();
      const finishedAt = new Date().toISOString();
      const record: AiVersionRecord<unknown> = {
        id: `${product.id}-${step.code}-v${version}`,
        productId: product.id,
        version,
        agentCode: step.code,
        inputSnapshot: {
          productId: product.id,
          reviewCount: reviews.length,
          previousStep: index === 0 ? null : steps[index - 1].code,
        },
        output: step.output,
        startedAt,
        finishedAt,
        durationMs: 0,
      };

      return saveAgentRecord(record);
    }),
  );

  return records;
}

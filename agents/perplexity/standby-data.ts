import type { PerplexityCapability, PerplexityReportPayload, PerplexityReportTable } from "@/agents/perplexity/types";

const tableMap: Record<PerplexityCapability, PerplexityReportTable> = {
  "market-research": "market_reports",
  "trend-discovery": "trend_reports",
  "competitor-analysis": "competitor_reports",
  "new-product-discovery": "opportunity_reports",
};

const titleMap: Record<PerplexityCapability, string> = {
  "market-research": "Market Research Standby",
  "trend-discovery": "Trend Discovery Standby",
  "competitor-analysis": "Competitor Analysis Standby",
  "new-product-discovery": "New Product Discovery Standby",
};

export function buildEmptyPerplexityReport(capability: PerplexityCapability): PerplexityReportPayload {
  const generatedAt = new Date().toISOString();

  return {
    id: `perplexity-${capability}-${Date.now()}`,
    capability,
    title: titleMap[capability],
    query: "",
    generatedAt,
    provider: "perplexity-standby",
    model: "pending-live-api",
    summary: "当前没有测试情报数据。等待接入真实 Perplexity API 后再生成报告。",
    highlights: [],
    insights: [],
    nextSteps: [
      "接入真实 Perplexity API Key。",
      "增加真实来源引用和落库逻辑。",
      "把结果同步到商品机会、竞品和趋势工作流。",
    ],
    metadata: {
      outputTable: tableMap[capability],
      sourceMode: "standby",
      futureApiReady: true,
    },
  };
}

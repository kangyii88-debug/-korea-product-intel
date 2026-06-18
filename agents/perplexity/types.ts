export type PerplexityCapability =
  | "market-research"
  | "trend-discovery"
  | "competitor-analysis"
  | "new-product-discovery";

export type PerplexityOutputFormat = "json" | "markdown" | "csv";

export type PerplexityReportTable =
  | "market_reports"
  | "trend_reports"
  | "competitor_reports"
  | "opportunity_reports";

export type PerplexityMockInsight = {
  title: string;
  summary: string;
  evidence: string[];
  confidence: number;
  recommendedAction: string;
};

export type PerplexityReportPayload = {
  id: string;
  capability: PerplexityCapability;
  title: string;
  query: string;
  generatedAt: string;
  provider: "mock-perplexity";
  model: "sonar-pro-placeholder";
  summary: string;
  highlights: string[];
  insights: PerplexityMockInsight[];
  nextSteps: string[];
  metadata: {
    outputTable: PerplexityReportTable;
    sourceMode: "mock";
    futureApiReady: true;
  };
};

export type PerplexityReportBundle = {
  json: PerplexityReportPayload;
  markdown: string;
  csv: string;
};

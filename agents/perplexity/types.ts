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

export type PerplexityInsight = {
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
  provider: "perplexity-standby";
  model: "pending-live-api";
  summary: string;
  highlights: string[];
  insights: PerplexityInsight[];
  nextSteps: string[];
  metadata: {
    outputTable: PerplexityReportTable;
    sourceMode: "standby";
    futureApiReady: true;
  };
};

export type PerplexityReportBundle = {
  json: PerplexityReportPayload;
  markdown: string;
  csv: string;
};

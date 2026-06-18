import type { PerplexityReportBundle, PerplexityReportPayload } from "@/agents/perplexity/types";
import { createClient } from "@/lib/supabase/server";

const memoryReports: Record<string, PerplexityReportPayload[]> = {
  market_reports: [],
  trend_reports: [],
  competitor_reports: [],
  opportunity_reports: [],
};

export async function savePerplexityReport(report: PerplexityReportPayload, bundle: PerplexityReportBundle) {
  memoryReports[report.metadata.outputTable].push(report);

  const supabase = await createClient();
  if (!supabase) {
    return {
      saved: false,
      table: report.metadata.outputTable,
      reason: "supabase_not_configured",
    };
  }

  await supabase.from(report.metadata.outputTable).insert({
    report_key: report.id,
    capability: report.capability,
    title: report.title,
    query: report.query,
    summary: report.summary,
    output_json: bundle.json,
    output_markdown: bundle.markdown,
    output_csv: bundle.csv,
    source_mode: report.metadata.sourceMode,
    provider: report.provider,
    model_name: report.model,
    status: "mock_ready",
    generated_at: report.generatedAt,
  });

  return {
    saved: true,
    table: report.metadata.outputTable,
  };
}

export function getLatestPerplexityReports() {
  return memoryReports;
}

import { buildBundle } from "@/agents/perplexity/formatters";
import { buildEmptyPerplexityReport } from "@/agents/perplexity/standby-data";
import type { PerplexityCapability, PerplexityOutputFormat } from "@/agents/perplexity/types";

export async function runPerplexityCapability(capability: PerplexityCapability, format: PerplexityOutputFormat = "json") {
  const report = buildEmptyPerplexityReport(capability);
  const bundle = buildBundle(report);

  return {
    ok: true,
    capability,
    format,
    mode: "standby",
    persisted: {
      saved: false,
      table: report.metadata.outputTable,
      reason: "standby_mode",
    },
    output: bundle[format],
    bundle,
    report,
    futureIntegration: {
      provider: "perplexity",
      apiKeyEnv: "PERPLEXITY_API_KEY",
      plannedModel: "sonar-pro",
    },
  };
}

import { buildBundle } from "@/agents/perplexity/formatters";
import { buildMockPerplexityReport } from "@/agents/perplexity/mock-data";
import { savePerplexityReport } from "@/agents/perplexity/store";
import type { PerplexityCapability, PerplexityOutputFormat } from "@/agents/perplexity/types";

export async function runPerplexityCapability(capability: PerplexityCapability, format: PerplexityOutputFormat = "json") {
  const report = buildMockPerplexityReport(capability);
  const bundle = buildBundle(report);
  const persisted = await savePerplexityReport(report, bundle);

  return {
    ok: true,
    capability,
    format,
    mode: "mock",
    persisted,
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

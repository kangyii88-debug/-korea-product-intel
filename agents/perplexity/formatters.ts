import type { PerplexityReportBundle, PerplexityReportPayload } from "@/agents/perplexity/types";

function escapeCsv(value: string | number) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
    return `"${text.replaceAll("\"", "\"\"")}"`;
  }
  return text;
}

export function toMarkdown(report: PerplexityReportPayload) {
  const insightLines = report.insights
    .map(
      (item, index) =>
        `## Insight ${index + 1}: ${item.title}\n${item.summary}\n\n- Confidence: ${item.confidence}\n- Recommended Action: ${item.recommendedAction}\n- Evidence: ${item.evidence.join("; ")}`,
    )
    .join("\n\n");

  return [
    `# ${report.title}`,
    ``,
    `- Capability: ${report.capability}`,
    `- Generated At: ${report.generatedAt}`,
    `- Provider: ${report.provider}`,
    `- Query: ${report.query}`,
    ``,
    `## Summary`,
    report.summary,
    ``,
    `## Highlights`,
    ...report.highlights.map((item) => `- ${item}`),
    ``,
    insightLines,
    ``,
    `## Next Steps`,
    ...report.nextSteps.map((item) => `- ${item}`),
  ].join("\n");
}

export function toCsv(report: PerplexityReportPayload) {
  const header = ["capability", "title", "insight_title", "insight_summary", "confidence", "recommended_action", "evidence"];
  const rows = report.insights.map((item) =>
    [
      report.capability,
      report.title,
      item.title,
      item.summary,
      item.confidence,
      item.recommendedAction,
      item.evidence.join(" | "),
    ]
      .map(escapeCsv)
      .join(","),
  );

  return [header.join(","), ...rows].join("\n");
}

export function buildBundle(report: PerplexityReportPayload): PerplexityReportBundle {
  return {
    json: report,
    markdown: toMarkdown(report),
    csv: toCsv(report),
  };
}

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { PerplexityIntelligenceClient } from "@/components/perplexity-intelligence-client";

export default function PerplexityPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Perplexity Intelligence"
        title="Perplexity Intelligence Module"
        description="预留 Perplexity API 接入能力，当前版本使用模拟数据跑通市场研究、趋势发现、竞品分析和新品发现。"
      />
      <PerplexityIntelligenceClient />
    </AppShell>
  );
}

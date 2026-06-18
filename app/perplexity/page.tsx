import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { PerplexityIntelligenceClient } from "@/components/perplexity-intelligence-client";

export default function PerplexityPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Perplexity Intelligence Center"
        title="Perplexity 情报中心"
        description="这里预留未来接入 Perplexity API 后的市场研究、趋势发现、竞品分析和新品机会发现能力。第一版保持空状态或待机状态，不自动生成任何假报告。"
      />
      <PerplexityIntelligenceClient />
    </AppShell>
  );
}

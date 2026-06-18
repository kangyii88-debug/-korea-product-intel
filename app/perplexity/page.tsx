import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { PerplexityIntelligenceClient } from "@/components/perplexity-intelligence-client";

export default function PerplexityPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Perplexity Intelligence Center"
        title="Perplexity 情报中心"
        description="用于补充市场研究、趋势发现、竞品分析和新品机会发现，服务 Rocket Growth 与 PB 项目筛选。"
      />
      <PerplexityIntelligenceClient />
    </AppShell>
  );
}

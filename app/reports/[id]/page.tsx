import { AppShell } from "@/components/app-shell";
import { LocalReportView } from "@/components/local-report-view";
import { PageHeader } from "@/components/page-header";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <AppShell>
      <PageHeader
        eyebrow="AI Product Report"
        title="商品机会决策详情"
        description="查看单个商品的总分、利润安全线、风险红线、RG/PB 分流结果、自动任务和转项目前资料检查。"
      />
      <LocalReportView productId={id} />
    </AppShell>
  );
}

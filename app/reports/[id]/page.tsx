import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { LocalReportView } from "@/components/local-report-view";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <AppShell>
      <PageHeader
        eyebrow="AI Product Report"
        title="单品 AI 情报报告"
        description="基于你录入的真实商品信息、评论和价格数据，生成可执行的选品判断。"
      />
      <LocalReportView productId={id} />
    </AppShell>
  );
}

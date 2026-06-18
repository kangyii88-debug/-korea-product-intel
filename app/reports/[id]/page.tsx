import { AppShell } from "@/components/app-shell";
import { LocalReportView } from "@/components/local-report-view";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <AppShell>
      <LocalReportView productId={id} />
    </AppShell>
  );
}

import { AppShell } from "@/components/app-shell";
import { EmptyModulePage } from "@/components/empty-module-page";

export default function RiskLogisticsPage() {
  return (
    <AppShell>
      <EmptyModulePage pageKey="risks" bullets={[]} />
    </AppShell>
  );
}

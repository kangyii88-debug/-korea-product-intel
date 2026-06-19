import { AppShell } from "@/components/app-shell";
import { BusinessAIModule } from "@/components/business-ai-module";

export default function RiskLogisticsPage() {
  return (
    <AppShell>
      <BusinessAIModule kind="risks" taskType="risk_analysis" />
    </AppShell>
  );
}

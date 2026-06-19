import { AppShell } from "@/components/app-shell";
import { BusinessAIModule } from "@/components/business-ai-module";

export default function PricingProfitPage() {
  return (
    <AppShell>
      <BusinessAIModule kind="pricing" taskType="profit_analysis" />
    </AppShell>
  );
}

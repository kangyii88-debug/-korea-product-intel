import { AppShell } from "@/components/app-shell";
import { EmptyModulePage } from "@/components/empty-module-page";

export default function PricingProfitPage() {
  return (
    <AppShell>
      <EmptyModulePage pageKey="pricing" bullets={[]} />
    </AppShell>
  );
}

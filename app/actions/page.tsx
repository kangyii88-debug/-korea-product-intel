import { AppShell } from "@/components/app-shell";
import { BusinessAIModule } from "@/components/business-ai-module";

export default function ActionsPage() {
  return (
    <AppShell>
      <BusinessAIModule kind="actions" taskType="action_generation" />
    </AppShell>
  );
}

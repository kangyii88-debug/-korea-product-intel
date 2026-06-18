import { AppShell } from "@/components/app-shell";
import { PerplexityIntelligenceClient } from "@/components/perplexity-intelligence-client";

export default function PerplexityPage() {
  return (
    <AppShell>
      <PerplexityIntelligenceClient />
    </AppShell>
  );
}

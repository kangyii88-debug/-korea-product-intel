import { AppShell } from "@/components/app-shell";
import { EmptyModulePage } from "@/components/empty-module-page";

export default function CompetitorsPage() {
  return (
    <AppShell>
      <EmptyModulePage pageKey="competitors" bullets={[]} />
    </AppShell>
  );
}

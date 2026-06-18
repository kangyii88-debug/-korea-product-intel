import { AppShell } from "@/components/app-shell";
import { EmptyModulePage } from "@/components/empty-module-page";

export default function OpportunitiesPage() {
  return (
    <AppShell>
      <EmptyModulePage pageKey="opportunities" bullets={[]} />
    </AppShell>
  );
}

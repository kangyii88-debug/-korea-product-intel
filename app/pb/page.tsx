import { AppShell } from "@/components/app-shell";
import { EmptyModulePage } from "@/components/empty-module-page";

export default function PbPage() {
  return (
    <AppShell>
      <EmptyModulePage pageKey="pb" bullets={[]} />
    </AppShell>
  );
}

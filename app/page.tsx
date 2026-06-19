"use client";

import { AppShell } from "@/components/app-shell";
import { DashboardOpportunityCenter } from "@/components/dashboard-opportunity-center";

export default function Home() {
  return (
    <AppShell>
      <DashboardOpportunityCenter />
    </AppShell>
  );
}


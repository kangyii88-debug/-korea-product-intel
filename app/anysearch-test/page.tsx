import { AppShell } from "@/components/app-shell";
import { AnySearchTestClient } from "@/components/anysearch-test-client";
import { PageHeader } from "@/components/page-header";

export default function AnySearchTestPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="External Search"
        title="AnySearch 接入测试"
        description="这个页面用于验证 AnySearch 是否能作为 AI Agent 的外部搜索数据源正常工作，并展示统一结构化结果。"
        action={null}
      />
      <AnySearchTestClient />
    </AppShell>
  );
}

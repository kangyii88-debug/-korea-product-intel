import { ModulePlaceholderPage } from "@/components/module-placeholder-page";

export default function OpportunitiesPage() {
  return (
    <ModulePlaceholderPage
      eyebrow="Opportunity Pool"
      title="商品机会池"
      description="集中管理来自 Coupang 的成熟和待验证商品机会，用于后续分流到 Rocket Growth 或 PB 项目。"
      bullets={[
        "只保留商品机会，不进入自有品牌管理流程。",
        "按 Rocket Growth、PB、双向候选、继续观察、淘汰进行筛选。",
        "后续可直接接入 AI 决策中心与 Perplexity 情报结果。",
      ]}
    />
  );
}

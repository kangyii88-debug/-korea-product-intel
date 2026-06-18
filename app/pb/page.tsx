import { ModulePlaceholderPage } from "@/components/module-placeholder-page";

export default function PbPage() {
  return (
    <ModulePlaceholderPage
      eyebrow="PB Candidates"
      title="PB 候选品"
      description="存放适合进入 PB 项目管理系统的商品机会，重点看供应链适配、利润空间和差评优化空间。"
      bullets={[
        "只做 PB 项目筛选，不做自有品牌 ERP 管理。",
        "支持从商品机会池和 AI 决策中心转入。",
        "可联动供应商开发任务和竞品报告。",
      ]}
    />
  );
}

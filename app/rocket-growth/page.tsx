import { ModulePlaceholderPage } from "@/components/module-placeholder-page";

export default function RocketGrowthPage() {
  return (
    <ModulePlaceholderPage
      eyebrow="Rocket Growth Candidates"
      title="Rocket Growth 候选品"
      description="存放适合进入 Rocket Growth 项目管理系统的成熟商品机会。"
      bullets={[
        "关注销量潜力、平台适配度和物流执行性。",
        "支持从商品机会池和 AI 决策中心转入。",
        "不包含自有品牌 ERP 管理流程。",
      ]}
    />
  );
}

import { ModulePlaceholderPage } from "@/components/module-placeholder-page";

export default function RiskLogisticsPage() {
  return (
    <ModulePlaceholderPage
      eyebrow="Risk Assessment"
      title="认证 / 物流风险判断"
      description="对认证合规、物流成本、包装稳定性和退货风险做统一判断，避免把高风险商品推进错误项目。"
      bullets={[
        "判断是否适合 Rocket Growth。",
        "判断是否适合 PB 自营品牌供应链。",
        "输出继续观察或淘汰建议。",
      ]}
    />
  );
}

import { EmptyModulePage } from "@/components/empty-module-page";

export default function PricingProfitPage() {
  return (
    <EmptyModulePage
      eyebrow="Pricing & Profit"
      title="价格与供货利润测算"
      description="这里用于基于真实商品机会，测算售价、供货价、物流、手续费、广告费和毛利安全线。"
      bullets={[
        "没有真实商品时，这里不会显示任何示例利润卡片。",
        "录入真实价格与成本后，系统才会判断利润安全是否通过。",
        "后续可以根据利润结果决定是否继续推进 Rocket Growth 或 PB。",
      ]}
    />
  );
}

import { ModulePlaceholderPage } from "@/components/module-placeholder-page";

export default function PricingProfitPage() {
  return (
    <ModulePlaceholderPage
      eyebrow="Pricing & Profit"
      title="价格与供货利润测算"
      description="统一测算平台售价、供货价、佣金、物流和利润空间，为项目分流提供财务依据。"
      bullets={[
        "支持 Rocket Growth 项目利润测算。",
        "支持 PB 项目供货价与毛利评估。",
        "后续可与供应商开发任务联动。",
      ]}
    />
  );
}

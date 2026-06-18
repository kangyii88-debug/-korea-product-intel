import { EmptyModulePage } from "@/components/empty-module-page";

export default function RocketGrowthPage() {
  return (
    <EmptyModulePage
      eyebrow="Rocket Growth Candidates"
      title="Rocket Growth 候选品"
      description="这里汇总适合进入 Rocket Growth 路线的真实商品机会，用于后续提案和项目转入前确认。"
      bullets={[
        "没有真实商品时，这里不会出现任何候选品示例。",
        "系统会根据真实评分、利润和风险结果，把合适商品流转到这里。",
        "资料不完整时，不会允许转入正式项目。",
      ]}
    />
  );
}

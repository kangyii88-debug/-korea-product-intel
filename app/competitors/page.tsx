import { ModulePlaceholderPage } from "@/components/module-placeholder-page";

export default function CompetitorsPage() {
  return (
    <ModulePlaceholderPage
      eyebrow="Competitor Library"
      title="Coupang 竞品采集库"
      description="面向 Coupang 的竞品采集、结构化卖点整理、差评问题归纳和竞品报告输出。"
      bullets={[
        "重点记录竞品价格、评论数、评分、卖点与差评问题。",
        "为 Rocket Growth 和 PB 项目提供竞品证据。",
        "后续可叠加 Perplexity competitor-analysis 结果。",
      ]}
    />
  );
}

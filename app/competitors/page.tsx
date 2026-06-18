import { EmptyModulePage } from "@/components/empty-module-page";

export default function CompetitorsPage() {
  return (
    <EmptyModulePage
      eyebrow="Competitor Library"
      title="Coupang 竞品采集库"
      description="这里用于记录真实竞品链接、价格、卖点、差评问题和可跟进价值，为 Rocket Growth / PB 判断提供依据。"
      bullets={[
        "没有真实竞品时，这里不会自动生成任何示例内容。",
        "录入真实竞品后，可以继续补充价格、评分、评论量和核心差异。",
        "后续也可接入 Perplexity 做更深的竞品分析。",
      ]}
    />
  );
}

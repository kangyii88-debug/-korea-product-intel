import { EmptyModulePage } from "@/components/empty-module-page";

export default function OpportunitiesPage() {
  return (
    <EmptyModulePage
      eyebrow="Opportunity Pool"
      title="商品机会池"
      description="这里用于沉淀已采集的真实 Coupang 商品机会，并继续做评分、风险判断与 Rocket Growth / PB 分流。"
      bullets={[
        "没有真实商品时，这里不会显示任何示例机会。",
        "新增第一条商品后，系统会自动开始计算推荐方向、评分和风险等级。",
        "成熟机会后续可继续流转到 Rocket Growth 或 PB 项目。",
      ]}
    />
  );
}

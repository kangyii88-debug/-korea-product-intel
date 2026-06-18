import { EmptyModulePage } from "@/components/empty-module-page";

export default function RiskLogisticsPage() {
  return (
    <EmptyModulePage
      eyebrow="Risk Assessment"
      title="认证 / 物流风险判断"
      description="这里用于基于真实商品资料，判断 KC 认证、物流体积重量、法规限制和平台风险红线。"
      bullets={[
        "没有真实商品时，这里不会显示任何测试风险记录。",
        "录入真实资料后，系统会提示无红线、轻度风险、中度风险或高风险红线。",
        "高风险商品会影响推荐方向，并触发后续确认任务。",
      ]}
    />
  );
}

import { EmptyModulePage } from "@/components/empty-module-page";

export default function PbPage() {
  return (
    <EmptyModulePage
      eyebrow="PB Candidates"
      title="PB 候选品"
      description="这里汇总适合进入 PB 路线的真实商品机会，用于开发方向梳理、供应链确认和后续项目转入。"
      bullets={[
        "没有真实商品时，这里不会显示任何 PB 示例候选品。",
        "系统会根据真实 PB 适合度、差异化空间和供应链优势判断是否进入这里。",
        "这里只服务 PB 项目筛选，不承担 4locks 自有品牌管理。",
      ]}
    />
  );
}

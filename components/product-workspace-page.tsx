"use client";

import { PageHeader } from "@/components/page-header";
import { useLocale } from "@/components/locale-provider";
import { ProductWorkspace } from "@/components/product-workspace";

const copy = {
  zh: {
    eyebrow: "Testing Database",
    title: "商品测试数据库",
    description: "这里不是普通商品记录表，而是商品机会评分、风险判断、利润测算、RG/PB 分流和下一步任务生成的决策工作台。",
  },
  ko: {
    eyebrow: "Testing Database",
    title: "상품 테스트 데이터베이스",
    description: "단순 상품 기록표가 아니라 상품 기회 점수화, 리스크 판단, 마진 계산, RG/PB 분류, 다음 작업 생성까지 한 번에 보는 의사결정 워크스페이스입니다.",
  },
} as const;

export function ProductWorkspacePage() {
  const { locale } = useLocale();
  const t = copy[locale];

  return (
    <>
      <PageHeader eyebrow={t.eyebrow} title={t.title} description={t.description} />
      <ProductWorkspace />
    </>
  );
}

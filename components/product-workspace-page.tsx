"use client";

import { PageHeader } from "@/components/page-header";
import { useLocale } from "@/components/locale-provider";
import { ProductWorkspace } from "@/components/product-workspace";

const copy = {
  zh: {
    eyebrow: "Product Test Database",
    title: "商品测试数据库",
    description: "汇总测试商品、销量预测、成本测算和开发状态，支持用中文或韩文统一查看与录入。",
  },
  ko: {
    eyebrow: "Product Test Database",
    title: "상품 테스트 데이터베이스",
    description: "테스트 상품, 판매 예측, 원가 계산, 개발 상태를 한곳에서 관리하고 한국어 또는 중국어로 일관되게 확인합니다.",
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

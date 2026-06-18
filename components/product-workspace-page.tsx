"use client";

import { PageHeader } from "@/components/page-header";
import { useLocale } from "@/components/locale-provider";
import { ProductWorkspace } from "@/components/product-workspace";

const copy = {
  zh: {
    eyebrow: "Testing Database",
    title: "商品测试数据库",
    description: "用于验证候选商品的销量、评论、利润、物流和供应链适配度，为 Rocket Growth / PB 项目分流提供基础测试数据。",
  },
  ko: {
    eyebrow: "Testing Database",
    title: "상품 테스트 데이터베이스",
    description: "후보 상품의 판매량, 리뷰, 이익, 물류, 공급망 적합성을 검증하여 Rocket Growth / PB 프로젝트 분류의 기반 데이터를 제공합니다.",
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

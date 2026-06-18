"use client";

import { PageHeader } from "@/components/page-header";
import { useLocale } from "@/components/locale-provider";
import { ProductEntryForm } from "@/components/product-entry-form";

const copy = {
  zh: {
    eyebrow: "Product Test",
    title: "新增测试商品",
    description: "录入测试商品的基础信息、销售预测、成本结构和开发优先级，当前页会跟随语言切换统一显示。",
  },
  ko: {
    eyebrow: "Product Test",
    title: "테스트 상품 추가",
    description: "테스트 상품의 기본 정보, 판매 예측, 원가 구조, 개발 우선순위를 입력하며 현재 페이지는 언어 선택에 맞춰 전체 문구가 함께 변경됩니다.",
  },
} as const;

export function NewProductPageContent() {
  const { locale } = useLocale();
  const t = copy[locale];

  return (
    <>
      <PageHeader eyebrow={t.eyebrow} title={t.title} description={t.description} />
      <div className="mx-auto max-w-5xl px-5 py-6 sm:px-8">
        <ProductEntryForm />
      </div>
    </>
  );
}

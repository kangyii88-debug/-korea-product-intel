"use client";

import { PageHeader } from "@/components/page-header";
import { useLocale } from "@/components/locale-provider";
import { ProductEntryForm } from "@/components/product-entry-form";

const copy = {
  zh: {
    eyebrow: "Product Test",
    title: "新增测试商品",
    description: "录入商品后，系统会自动计算机会评分、风险红线、利润安全线、RG/PB 适合度，并生成下一步任务。",
  },
  ko: {
    eyebrow: "Product Test",
    title: "테스트 상품 추가",
    description: "상품을 등록하면 시스템이 기회 점수, 리스크 레드라인, 마진 안전선, RG/PB 적합도, 다음 작업을 자동 계산합니다.",
  },
} as const;

export function NewProductPageContent() {
  const { locale } = useLocale();
  const t = copy[locale];

  return (
    <>
      <PageHeader eyebrow={t.eyebrow} title={t.title} description={t.description} />
      <div className="mx-auto max-w-6xl px-5 py-6 sm:px-8">
        <ProductEntryForm />
      </div>
    </>
  );
}

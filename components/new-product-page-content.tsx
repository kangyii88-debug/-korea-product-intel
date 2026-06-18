"use client";

import { PageHeader } from "@/components/page-header";
import { useLocale } from "@/components/locale-provider";
import { getDictionary } from "@/lib/i18n";
import { ProductEntryForm } from "@/components/product-entry-form";

export function NewProductPageContent() {
  const { locale } = useLocale();
  const t = getDictionary(locale);

  return (
    <>
      <PageHeader eyebrow={locale === "ko" ? "상품 입력" : "商品录入"} title={t.productForm.newTitle} description={t.productForm.newDescription} />
      <div className="mx-auto w-full max-w-[1240px] px-5 py-8 sm:px-8">
        <ProductEntryForm />
      </div>
    </>
  );
}

"use client";

import { PageHeader } from "@/components/page-header";
import { useLocale } from "@/components/locale-provider";
import { getDictionary } from "@/lib/i18n";
import { ProductWorkspace } from "@/components/product-workspace";

export function ProductWorkspacePage() {
  const { locale } = useLocale();
  const t = getDictionary(locale);

  return (
    <>
      <PageHeader eyebrow={t.pages.testingDb.eyebrow} title={t.pages.testingDb.title} description={t.pages.testingDb.description} />
      <ProductWorkspace />
    </>
  );
}

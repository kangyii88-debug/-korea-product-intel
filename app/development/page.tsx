"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { useLocale } from "@/components/locale-provider";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { getDictionary } from "@/lib/i18n";
import { analyzeProduct, loadLocalProducts, type LocalProduct } from "@/lib/local-products";
import { getDirectionLabel } from "@/lib/presentation";

export default function DevelopmentPage() {
  const { locale } = useLocale();
  const t = getDictionary(locale);
  const [products, setProducts] = useState<LocalProduct[]>([]);

  useEffect(() => {
    setProducts(loadLocalProducts());
  }, []);

  const candidates = useMemo(
    () =>
      products
        .map((product) => ({ product, analysis: analyzeProduct(product) }))
        .filter((item) => item.product.productDevelopmentDirection || item.product.sampleDevelopmentAdvice || item.product.categoryGapNote),
    [products],
  );

  return (
    <AppShell>
      <PageHeader
        eyebrow={t.pages.development.eyebrow}
        title={t.pages.development.title}
        description={t.pages.development.description}
      />
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6 px-5 py-8 sm:px-8">
        {candidates.length === 0 ? (
          <EmptyState
            title={t.pages.development.emptyTitle}
            description={t.pages.development.emptyDescription}
            primaryLabel={t.common.addProduct}
            primaryHref="/products/new"
          />
        ) : (
          <SectionCard title={t.pages.development.listTitle} description={t.pages.development.listDescription}>
            <div className="grid gap-4 lg:grid-cols-2">
              {candidates.map(({ product, analysis }) => (
                <div key={product.id} className="rounded-[18px] border border-slate-200 bg-slate-50/55 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold tracking-[-0.02em] text-slate-950">{locale === "ko" ? product.productNameKo : product.productNameZh}</p>
                    <StatusBadge tone="info">{getDirectionLabel(analysis.direction, locale)}</StatusBadge>
                  </div>
                  <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                    <p>{t.pages.development.productDirection}：{product.productDevelopmentDirection || "-"}</p>
                    <p>{t.pages.development.sampleAdvice}：{product.sampleDevelopmentAdvice || "-"}</p>
                    <p>{t.pages.development.categoryOpportunity}：{product.categoryGapNote || "-"}</p>
                  </div>
                  <Link href={`/reports/${product.id}`} className="mt-5 inline-flex text-sm font-medium text-slate-700 underline-offset-4 hover:text-slate-950 hover:underline">
                    {t.common.viewDetails}
                  </Link>
                </div>
              ))}
            </div>
          </SectionCard>
        )}
      </div>
    </AppShell>
  );
}

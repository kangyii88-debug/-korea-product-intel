"use client";

import { MessageSquareWarning } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { useLocale } from "@/components/locale-provider";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { getDictionary } from "@/lib/i18n";
import { analyzeProduct, loadLocalProducts, type LocalProduct } from "@/lib/local-products";
import { formatNumber } from "@/lib/utils";

export default function ReviewsPage() {
  const { locale } = useLocale();
  const t = getDictionary(locale);
  const [products, setProducts] = useState<LocalProduct[]>([]);

  useEffect(() => {
    setProducts(loadLocalProducts());
  }, []);

  const reviewState = useMemo(() => {
    const analyzed = products.map((product) => ({ product, analysis: analyzeProduct(product) }));
    const totalReviews = analyzed.reduce((sum, item) => sum + item.product.reviewCount, 0);
    const issueRows = analyzed.flatMap((item) =>
      item.analysis.negativeIssues.map((issue) => ({ ...issue, productName: item.product.productNameZh })),
    );
    const uniqueIssues = new Set(issueRows.map((item) => item.label));
    return {
      totalReviews,
      highFrequencyIssues: uniqueIssues.size,
      trackedReasons: issueRows.length,
      optimizable: issueRows.filter((item) => item.count > 0).length,
      issueRows,
    };
  }, [products]);

  return (
    <AppShell>
      <PageHeader
        eyebrow={t.pages.reviews.eyebrow}
        title={t.pages.reviews.title}
        description={t.pages.reviews.description}
      />
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6 px-5 py-8 sm:px-8">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label={t.pages.reviews.metrics.total} value={formatNumber(reviewState.totalReviews)} note={t.pages.reviews.notes.total} />
          <StatCard label={t.pages.reviews.metrics.issues} value={reviewState.highFrequencyIssues} note={t.pages.reviews.notes.issues} tone="warning" />
          <StatCard label={t.pages.reviews.metrics.reasons} value={reviewState.trackedReasons} note={t.pages.reviews.notes.reasons} tone="warning" />
          <StatCard label={t.pages.reviews.metrics.optimizable} value={reviewState.optimizable} note={t.pages.reviews.notes.optimizable} tone="success" />
        </section>

        {products.length === 0 ? (
          <EmptyState
            icon={<MessageSquareWarning className="h-6 w-6" />}
            title={t.pages.reviews.emptyTitle}
            description={t.pages.reviews.emptyDescription}
            primaryLabel={t.common.addProduct}
            primaryHref="/products/new"
          />
        ) : reviewState.issueRows.length === 0 ? (
          <EmptyState
            icon={<MessageSquareWarning className="h-6 w-6" />}
            title={t.pages.reviews.noThemesTitle}
            description={t.pages.reviews.noThemesDescription}
            primaryLabel={t.pages.testingDb.title}
            primaryHref="/testing-db"
            secondaryLabel={t.common.addProduct}
            secondaryHref="/products/new"
          />
        ) : (
          <SectionCard title={t.pages.reviews.listTitle} description={t.pages.reviews.listDescription}>
            <div className="grid gap-4 lg:grid-cols-2">
              {reviewState.issueRows.map((item, index) => (
                <div key={`${item.label}-${index}`} className="rounded-[18px] border border-slate-200 bg-slate-50/55 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold tracking-[-0.02em] text-slate-950">{item.label}</p>
                      <p className="mt-1 text-sm text-slate-500">{item.productName}</p>
                    </div>
                    <StatusBadge tone="warning">{locale === "ko" ? `${item.count}건` : `${item.count} 条`}</StatusBadge>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-500">{item.suggestion}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        )}
      </div>
    </AppShell>
  );
}

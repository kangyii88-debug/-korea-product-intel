"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DecisionPill } from "@/components/decision-pill";
import { EmptyState } from "@/components/empty-state";
import { useLocale } from "@/components/locale-provider";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { getDictionary } from "@/lib/i18n";
import { analyzeProduct, loadLocalProducts, type LocalProduct } from "@/lib/local-products";
import { getCategoryDisplayName, getDirectionLabel, normalizeDirection } from "@/lib/presentation";

export default function DecisionsPage() {
  const { locale } = useLocale();
  const t = getDictionary(locale);
  const [products, setProducts] = useState<LocalProduct[]>([]);

  useEffect(() => {
    setProducts(loadLocalProducts());
  }, []);

  const sorted = useMemo(
    () =>
      products
        .map((product) => ({ product, analysis: analyzeProduct(product) }))
        .sort((a, b) => b.analysis.totalScore - a.analysis.totalScore),
    [products],
  );

  const directions = sorted.map((item) => normalizeDirection(item.analysis.direction));

  return (
    <>
      <PageHeader
        eyebrow={t.pages.decisions.eyebrow}
        title={t.pages.decisions.title}
        description={t.pages.decisions.description}
      />
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6 px-5 py-8 sm:px-8">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard label={getDirectionLabel("Rocket Growth", locale)} value={directions.filter((item) => item === "Rocket Growth").length} note={locale === "ko" ? "RG 프로젝트 우선 후보입니다." : "优先进入 RG 项目池。"} tone="success" />
          <StatCard label={getDirectionLabel("PB", locale)} value={directions.filter((item) => item === "PB").length} note={locale === "ko" ? "PB 방향 검토 후보입니다." : "优先进入 PB 项目池。"} />
          <StatCard label={getDirectionLabel("Rocket Growth + PB", locale)} value={directions.filter((item) => item === "Rocket Growth + PB").length} note={locale === "ko" ? "양방향 검토가 가능한 상품입니다." : "同时适合 RG 与 PB。"} tone="success" />
          <StatCard label={getDirectionLabel("继续观察", locale)} value={directions.filter((item) => item === "继续观察").length} note={locale === "ko" ? "추가 자료 보강이 필요한 상품입니다." : "需要补充资料后再判断。"} tone="warning" />
          <StatCard label={getDirectionLabel("放弃", locale)} value={directions.filter((item) => item === "放弃").length} note={locale === "ko" ? "현재는 추진하지 않는 상품입니다." : "当前不建议继续推进。"} tone="danger" />
        </section>

        {sorted.length === 0 ? (
          <EmptyState
            title={t.pages.decisions.emptyTitle}
            description={t.pages.decisions.emptyDescription}
            primaryLabel={t.common.addProduct}
            primaryHref="/products/new"
          />
        ) : (
          <SectionCard title={t.pages.decisions.listTitle} description={t.pages.decisions.listDescription}>
            <div className="space-y-4">
              {sorted.map(({ product, analysis }) => (
                <Link
                  href={`/reports/${product.id}`}
                  key={product.id}
                  className="grid gap-4 rounded-[18px] border border-slate-200 bg-slate-50/55 p-5 transition-colors hover:bg-slate-50 lg:grid-cols-[minmax(0,1.5fr)_170px_120px_120px_120px_120px_24px] lg:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-base font-semibold tracking-[-0.02em] text-slate-950">{locale === "ko" ? product.productNameKo : product.productNameZh}</p>
                      <StatusBadge tone="neutral">{product.platform}</StatusBadge>
                      <StatusBadge tone="neutral">{getCategoryDisplayName(product.category, locale)}</StatusBadge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {locale === "ko"
                        ? `최대 기회는 ${analysis.biggestOpportunity}, 최대 리스크는 ${analysis.biggestRisk}입니다.`
                        : `最大机会是 ${analysis.biggestOpportunity}，最大风险是 ${analysis.biggestRisk}。`}
                    </p>
                  </div>
                  <DecisionPill decision={analysis.direction} />
                  <Score label={locale === "ko" ? "총점" : "总分"} value={analysis.totalScore} />
                  <Score label="RG" value={analysis.rgScore} />
                  <Score label="PB" value={analysis.pbScore} />
                  <Score label={locale === "ko" ? "마진율" : "利润率"} value={analysis.grossMarginPercent} suffix="%" />
                  <ArrowUpRight className="h-4 w-4 text-slate-400" />
                </Link>
              ))}
            </div>
          </SectionCard>
        )}
      </div>
    </>
  );
}

function Score({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <div className="mt-2 flex items-center gap-3">
        <div className="h-2 w-20 rounded-full bg-slate-200">
          <div className="h-2 rounded-full bg-slate-900" style={{ width: `${Math.min(value, 100)}%` }} />
        </div>
        <span className="text-sm font-semibold text-slate-900">
          {value}
          {suffix}
        </span>
      </div>
    </div>
  );
}

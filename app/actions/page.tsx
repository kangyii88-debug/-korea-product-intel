"use client";

import Link from "next/link";
import { ArrowUpRight, ClipboardList, Factory, FileText, Layers3, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ActionButtonGroup } from "@/components/action-button-group";
import { DecisionPill } from "@/components/decision-pill";
import { EmptyState } from "@/components/empty-state";
import { useLocale } from "@/components/locale-provider";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/lib/i18n";
import { getActionButtons } from "@/lib/business-positioning";
import { analyzeProduct, loadLocalProducts, type LocalProduct } from "@/lib/local-products";
import { getActionLabel, getDirectionLabel } from "@/lib/presentation";

const actionIcons: Record<string, React.ReactNode> = {
  "饔у뀯 Rocket Growth 窈밭쎅": <Layers3 className="h-4 w-4" />,
  "饔у뀯 PB 窈밭쎅": <Factory className="h-4 w-4" />,
  "?잍닇雅㎩뱚?먩죭": <FileText className="h-4 w-4" />,
  "?잍닇堊쎾틪?녶??묇뻣??": <ClipboardList className="h-4 w-4" />,
  "?잍닇塋욃뱚?녷옄?ε몜": <FileText className="h-4 w-4" />,
  "?뉓?訝븀빵瀯?쭆野?": <ClipboardList className="h-4 w-4" />,
  "?뉓?訝뷸퇇黎?": <Trash2 className="h-4 w-4" />,
};

export default function ActionsPage() {
  const { locale } = useLocale();
  const t = getDictionary(locale);
  const [products, setProducts] = useState<LocalProduct[]>([]);

  useEffect(() => {
    setProducts(loadLocalProducts());
  }, []);

  const actionRows = useMemo(
    () =>
      products.map((product) => {
        const analysis = analyzeProduct(product);
        return { product, analysis, actions: getActionButtons(analysis.direction) };
      }),
    [products],
  );

  const allActions = actionRows.flatMap((item) => item.actions);

  return (
    <>
      <PageHeader
        eyebrow={t.pages.actions.eyebrow}
        title={t.pages.actions.title}
        description={t.pages.actions.description}
        action={<Button variant="outline">{t.common.exportReport}</Button>}
      />
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6 px-5 py-8 sm:px-8">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label={t.pages.actions.stats.rg} value={allActions.filter((item) => String(item) === "饔у뀯 Rocket Growth 窈밭쎅").length} note={locale === "ko" ? "확인 대기 중인 RG 전환 액션입니다." : "待确认的 RG 项目转入动作。"} />
          <StatCard label={t.pages.actions.stats.pb} value={allActions.filter((item) => String(item) === "饔у뀯 PB 窈밭쎅").length} note={locale === "ko" ? "확인 대기 중인 PB 전환 액션입니다." : "待确认的 PB 项目转入动作。"} />
          <StatCard label={t.pages.actions.stats.observe} value={allActions.filter((item) => String(item) === "?뉓?訝븀빵瀯?쭆野?").length} note={locale === "ko" ? "추가 정보가 필요한 상품입니다." : "仍需补充资料的商品。"} tone="warning" />
          <StatCard label={t.pages.actions.stats.reject} value={allActions.filter((item) => String(item) === "?뉓?訝뷸퇇黎?").length} note={locale === "ko" ? "더 이상 추진하지 않는 상품입니다." : "不再继续推进的商品。"} tone="danger" />
        </section>

        {actionRows.length === 0 ? (
          <EmptyState
            title={t.pages.actions.emptyTitle}
            description={t.pages.actions.emptyDescription}
            primaryLabel={t.common.addProduct}
            primaryHref="/products/new"
          />
        ) : (
          <SectionCard title={t.pages.actions.listTitle} description={t.pages.actions.listDescription}>
            <div className="space-y-4">
              {actionRows.map(({ product, analysis, actions }) => (
                <div
                  key={product.id}
                  className="grid gap-4 rounded-[18px] border border-slate-200 bg-slate-50/55 p-5 lg:grid-cols-[minmax(0,1.25fr)_180px_minmax(0,1fr)_24px] lg:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-base font-semibold tracking-[-0.02em] text-slate-950">{locale === "ko" ? product.productNameKo : product.productNameZh}</p>
                      <StatusBadge tone="neutral">{product.platform}</StatusBadge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {locale === "ko"
                        ? `총점 ${analysis.totalScore}, 추천 방향은 ${getDirectionLabel(analysis.direction, locale)}이며 현재 다음 액션은 ${analysis.nextAction}입니다.`
                        : `总评分 ${analysis.totalScore}，推荐方向为 ${getDirectionLabel(analysis.direction, locale)}，当前下一步动作是 ${analysis.nextAction}。`}
                    </p>
                  </div>
                  <DecisionPill decision={analysis.direction} />
                  <ActionButtonGroup actions={actions.map((label) => ({ label: getActionLabel(label, locale), icon: actionIcons[label] }))} />
                  <Link href={`/reports/${product.id}`} className="text-slate-400 transition-colors hover:text-slate-950">
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          </SectionCard>
        )}
      </div>
    </>
  );
}

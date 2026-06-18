"use client";

import Link from "next/link";
import { BarChart3, Boxes, CheckCircle2, Clock3, Layers3, ShieldAlert, Target, Workflow } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/lib/i18n";
import { analyzeProduct, loadLocalProducts, type LocalProduct } from "@/lib/local-products";
import { getStatusLabel, normalizeRiskLevel } from "@/lib/presentation";

export default function Home() {
  const { locale } = useLocale();
  const t = getDictionary(locale);
  const [products, setProducts] = useState<LocalProduct[]>([]);

  useEffect(() => {
    setProducts(loadLocalProducts());
  }, []);

  const analyzed = useMemo(() => products.map((product) => ({ product, analysis: analyzeProduct(product) })), [products]);
  const monthKey = new Date().toISOString().slice(0, 7);

  const metrics = [
    {
      label: t.pages.dashboard.metrics.collected,
      value: analyzed.filter((item) => item.product.createdAt.slice(0, 7) === monthKey).length,
      note: t.pages.dashboard.notes.collected,
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      label: t.pages.dashboard.metrics.potential,
      value: analyzed.filter((item) => item.analysis.totalScore >= 85).length,
      note: t.pages.dashboard.notes.potential,
      tone: "success" as const,
      icon: <Target className="h-4 w-4" />,
    },
    {
      label: t.pages.dashboard.metrics.rg,
      value: analyzed.filter((item) => item.analysis.direction === "Rocket Growth").length,
      note: t.pages.dashboard.notes.rg,
      icon: <Layers3 className="h-4 w-4" />,
    },
    {
      label: t.pages.dashboard.metrics.pb,
      value: analyzed.filter((item) => item.analysis.direction === "PB").length,
      note: t.pages.dashboard.notes.pb,
      icon: <Boxes className="h-4 w-4" />,
    },
    {
      label: t.pages.dashboard.metrics.dual,
      value: analyzed.filter((item) => item.analysis.direction === "Rocket Growth + PB").length,
      note: t.pages.dashboard.notes.dual,
      tone: "success" as const,
      icon: <Workflow className="h-4 w-4" />,
    },
    {
      label: t.pages.dashboard.metrics.highRisk,
      value: analyzed.filter((item) => normalizeRiskLevel(item.analysis.riskLevel) === "高").length,
      note: t.pages.dashboard.notes.highRisk,
      tone: "warning" as const,
      icon: <ShieldAlert className="h-4 w-4" />,
    },
    {
      label: t.pages.dashboard.metrics.rejected,
      value: analyzed.filter((item) => getStatusLabel(item.product.status, "zh") === "已淘汰").length,
      note: t.pages.dashboard.notes.rejected,
      tone: "danger" as const,
      icon: <CheckCircle2 className="h-4 w-4" />,
    },
    {
      label: t.pages.dashboard.metrics.tasks,
      value: analyzed.reduce((sum, item) => sum + item.analysis.generatedTasks.length, 0),
      note: t.pages.dashboard.notes.tasks,
      icon: <Clock3 className="h-4 w-4" />,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow={t.pages.dashboard.eyebrow}
        title={t.pages.dashboard.title}
        description={t.pages.dashboard.description}
        action={
          <Link href="/products/new">
            <Button>{t.common.addProduct}</Button>
          </Link>
        }
      />
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6 px-5 py-8 sm:px-8">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((item) => (
            <StatCard key={item.label} {...item} />
          ))}
        </section>

        {analyzed.length === 0 ? (
          <EmptyState
            title={t.pages.dashboard.emptyTitle}
            description={t.pages.dashboard.emptyDescription}
            primaryLabel={t.common.addProduct}
            primaryHref="/products/new"
          />
        ) : (
          <section className="grid gap-6 xl:grid-cols-2">
            <SectionCard title={t.pages.dashboard.positioningTitle} description={t.pages.dashboard.positioningDescription}>
              <div className="space-y-3 text-sm leading-7 text-slate-600">
                {t.pages.dashboard.positioningBody.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </SectionCard>

            <SectionCard title={t.pages.dashboard.scoringTitle} description={t.pages.dashboard.scoringDescription}>
              <div className="space-y-3 text-sm leading-7 text-slate-600">
                {t.pages.dashboard.scoringBody.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </SectionCard>
          </section>
        )}
      </div>
    </>
  );
}

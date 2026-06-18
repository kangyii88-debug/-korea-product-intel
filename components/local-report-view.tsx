"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ExternalLink, FileText, ShieldAlert } from "lucide-react";
import { DecisionPill } from "@/components/decision-pill";
import { useLocale } from "@/components/locale-provider";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/lib/i18n";
import {
  analyzeProduct,
  getProductById,
  REJECTION_REASONS,
  updateLocalProduct,
  type LocalProduct,
  type ProductStatus,
} from "@/lib/local-products";
import {
  getActionLabel,
  getDirectionLabel,
  getRejectionReasonLabel,
  getRiskLabel,
  getStatusLabel,
  getTaskStatusLabel,
  normalizeRiskLevel,
} from "@/lib/presentation";
import { formatCurrency, formatNumber } from "@/lib/utils";

export function LocalReportView({ productId }: { productId: string }) {
  const { locale } = useLocale();
  const t = getDictionary(locale);
  const [product, setProduct] = useState<LocalProduct | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [rejectReason, setRejectReason] = useState(REJECTION_REASONS[0]);

  useEffect(() => {
    setProduct(getProductById(productId));
    setLoaded(true);
  }, [productId]);

  const analysis = useMemo(() => (product ? analyzeProduct(product) : null), [product]);

  if (!loaded) return null;

  if (!product || !analysis) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center shadow-sm">
          <p className="text-lg font-semibold">{t.report.notFoundTitle}</p>
          <p className="mt-3 text-sm text-muted-foreground">{t.report.notFoundDescription}</p>
          <Link href="/testing-db" className="mt-6 inline-flex">
            <Button>{t.report.back}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const updateStatus = (status: ProductStatus) => {
    updateLocalProduct(product.id, (current) => ({
      ...current,
      status,
      rejectionReason: getStatusLabel(status, "zh") === "已淘汰" ? current.rejectionReason : undefined,
    }));
    setProduct(getProductById(product.id));
    setFeedback(`${t.report.messages.updatedStatus} ${getStatusLabel(status, locale)}`);
  };

  const markRejected = () => {
    updateLocalProduct(product.id, (current) => ({
      ...current,
      status: "已淘汰" as ProductStatus,
      rejectionReason: rejectReason as LocalProduct["rejectionReason"],
    }));
    setProduct(getProductById(product.id));
    setFeedback(`${t.report.messages.rejected} ${getRejectionReasonLabel(rejectReason, locale)}`);
  };

  const transferTo = (target: "rg" | "pb") => {
    const check = target === "rg" ? analysis.transferCheckRg : analysis.transferCheckPb;
    const label = target === "rg" ? t.report.actions.transferRg : t.report.actions.transferPb;

    if (!check.ready) {
      setFeedback(`${t.report.messages.transferBlocked} ${check.missing.join(", ")}`);
      return;
    }

    updateLocalProduct(product.id, (current) => ({
      ...current,
      status: "已转入 RG/PB 项目系统" as ProductStatus,
    }));
    setProduct(getProductById(product.id));
    setFeedback(`${label} · ${t.report.messages.transferDone}`);
  };

  const actionButtons = [
    { label: t.report.actions.transferRg, onClick: () => transferTo("rg") },
    { label: t.report.actions.transferPb, onClick: () => transferTo("pb") },
    { label: t.report.actions.generateProposal, onClick: () => setFeedback(t.report.messages.generatedProposal) },
    { label: t.report.actions.generateSupplierTask, onClick: () => setFeedback(t.report.messages.generatedSupplierTask) },
    { label: t.report.actions.generateCompetitorReport, onClick: () => setFeedback(t.report.messages.generatedCompetitorReport) },
    { label: t.report.actions.markObserve, onClick: () => updateStatus("继续观察" as ProductStatus) },
  ];

  const topMetrics = [
    { label: t.report.labels.direction, value: getDirectionLabel(analysis.direction, locale), note: analysis.totalJudgement },
    { label: t.report.labels.totalScore, value: `${analysis.totalScore}`, note: analysis.totalJudgement },
    { label: t.report.labels.rgScore, value: `${analysis.rgScore}`, note: analysis.rgJudgement },
    { label: t.report.labels.pbScore, value: `${analysis.pbScore}`, note: analysis.pbJudgement },
    { label: t.report.labels.risk, value: getRiskLabel(analysis.riskLevel, locale), note: analysis.riskRedlineLevel },
    { label: t.report.labels.status, value: getStatusLabel(product.status, locale), note: analysis.nextAction },
  ];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={t.pages.report.eyebrow} title={t.pages.report.title} description={t.pages.report.description} />
      <div className="mx-auto max-w-7xl space-y-6 px-5 py-6 sm:px-8">
      <Link href="/testing-db" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        {t.report.back}
      </Link>

      {(analysis.riskRedlineLevel === "高风险红线" || analysis.riskRedlineLevel === "禁止推进") && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-rose-800">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">{analysis.riskRedlineLevel}</p>
            <p className="mt-1 text-sm leading-6">{analysis.riskSummary}</p>
          </div>
        </div>
      )}

      {feedback ? <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm">{feedback}</div> : null}

      <section className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <DecisionPill decision={analysis.direction} />
              <Badge>{analysis.totalJudgement}</Badge>
              <Badge>{analysis.riskRedlineLevel}</Badge>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{t.report.labels.nameKo}</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">{product.productNameKo}</h2>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{t.report.labels.nameZh}</p>
              <p className="mt-1 text-lg text-muted-foreground">{product.productNameZh}</p>
            </div>
            {product.competitorUrl ? (
              <a
                href={product.competitorUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-slate-700 underline"
              >
                {t.report.openCompetitor}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {topMetrics.map((item) => (
              <TopMetric key={item.label} {...item} />
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <ActionPanel title={t.report.sections.next} actions={actionButtons} />

        <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm xl:col-span-2">
          <div className="flex flex-wrap gap-2">
            {analysis.statusSuggestions.map((status) => (
              <Button key={status} variant="outline" onClick={() => updateStatus(status)}>
                {getStatusLabel(status, locale)}
              </Button>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center">
            <select
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value as (typeof REJECTION_REASONS)[number])}
              className="h-10 rounded-md border border-rose-200 bg-white px-3 text-sm"
            >
              {REJECTION_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {getRejectionReasonLabel(reason, locale)}
                </option>
              ))}
            </select>
            <Button variant="outline" onClick={markRejected}>
              {t.report.actions.saveReject}
            </Button>
          </div>
        </section>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <InfoCard title={t.report.sections.basic}>
          <Info label={t.report.labels.nameKo} value={product.productNameKo} />
          <Info label={t.report.labels.nameZh} value={product.productNameZh} />
          <Info label={t.report.labels.platform} value={product.platform} />
          <Info label={t.report.labels.brand} value={product.brand || "-"} />
          <Info label={t.report.labels.category} value={product.category || "-"} />
          <Info label={t.report.labels.owner} value={product.owner || "-"} />
          <Info label={t.report.labels.deliveryType} value={product.deliveryType || "-"} />
          <Info label={t.report.labels.sellerType} value={product.sellerType || "-"} />
          <Info label={t.report.labels.sizeWeight} value={`${product.size || "-"} / ${product.weight || "-"}`} />
        </InfoCard>

        <InfoCard title={t.report.sections.competitor}>
          <Info label={locale === "ko" ? "경쟁 판매가" : "竞品售价"} value={formatCurrency(product.competitorSalePriceKrw)} />
          <Info label={locale === "ko" ? "예상 월판매량" : "预计月销量"} value={formatNumber(product.estimatedMonthlySales)} />
          <Info label={locale === "ko" ? "리뷰 수" : "评论数"} value={formatNumber(product.reviewCount)} />
          <Info label={locale === "ko" ? "평점" : "评分"} value={`${product.rating || 0}`} />
          <Info label={locale === "ko" ? "类目排名" : "类目排名"} value={product.rank ? `#${product.rank}` : "-"} />
          <Info label={t.report.labels.opportunity} value={analysis.biggestOpportunity} />
          <Info label={t.report.labels.biggestRisk} value={analysis.biggestRisk} />
        </InfoCard>

        <ScoreCard title={t.report.sections.review} rows={analysis.scoreDimensions} />

        <InfoCard title={t.report.sections.profit}>
          <Info label={locale === "ko" ? "최종 총이익 KRW" : "最终毛利 KRW"} value={formatCurrency(analysis.grossProfitKrw)} />
          <Info label={locale === "ko" ? "최종 마진율 %" : "最终毛利率 %"} value={`${analysis.grossMarginPercent}%`} />
          <Info label={t.report.labels.profitSafety} value={`${analysis.profitSafety} · ${analysis.profitSafetyNote}`} />
          <Info label={t.report.labels.targetSupply} value={formatCurrency(analysis.suggestedTargetSupplyPriceKrw)} />
          <Info label={t.report.labels.minimumSupply} value={formatCurrency(analysis.minimumAcceptableSupplyPriceKrw)} />
        </InfoCard>

        <InfoCard title={t.report.sections.certification}>
          <Info label={locale === "ko" ? "KC 인증 필요" : "需要 KC 认证"} value={product.needsKcCertification ? t.common.confirm : t.common.cancel} />
          <Info label={locale === "ko" ? "KC 자료 준비" : "KC 资料"} value={product.kcDocsReady ? t.common.confirm : t.common.cancel} />
          <Info label={locale === "ko" ? "인증 판단" : "认证判断"} value={analysis.riskSummary} />
        </InfoCard>

        <InfoCard title={t.report.sections.logistics}>
          <Info label={locale === "ko" ? "포장 크기" : "包装尺寸"} value={product.packageSize || "-"} />
          <Info label={locale === "ko" ? "重量" : "重量"} value={product.weight || "-"} />
          <Info label={locale === "ko" ? "韩国本地物流" : "韩国本地物流"} value={formatCurrency(product.koreaShippingKrw)} />
          <Info label={locale === "ko" ? "国际物流" : "国际物流"} value={formatCurrency(product.internationalShippingKrw)} />
          <Info label={locale === "ko" ? "物流风险" : "物流风险"} value={analysis.riskRedlineLevel} />
        </InfoCard>

        <InfoCard title={t.report.sections.supply}>
          <Info label={locale === "ko" ? "供应商报价数" : "供应商报价数"} value={`${product.supplierQuoteCount}`} />
          <Info label={locale === "ko" ? "供应商名称" : "供应商名称"} value={product.supplierNames.join(", ") || "-"} />
          <Info label={locale === "ko" ? "品类机会" : "品类机会"} value={product.categoryGapNote || "-"} />
          <Info label={locale === "ko" ? "开发方向" : "产品开发方向"} value={product.productDevelopmentDirection || "-"} />
        </InfoCard>

        <ScoreCard title={t.report.sections.rg} rows={analysis.rgDimensions} footer={analysis.rgJudgement} />
        <ScoreCard title={t.report.sections.pb} rows={analysis.pbDimensions} footer={analysis.pbJudgement} />

        <InfoCard title={t.report.sections.ai}>
          <Info label={t.report.labels.judgement} value={analysis.totalJudgement} />
          <Info label={t.report.labels.direction} value={getDirectionLabel(analysis.direction, locale)} />
          <Info label={t.report.labels.opportunity} value={analysis.biggestOpportunity} />
          <Info label={t.report.labels.biggestRisk} value={analysis.biggestRisk} />
          <Info label={t.report.labels.nextAction} value={analysis.nextAction} />
        </InfoCard>

        <InfoCard title={t.report.sections.tasks}>
          {analysis.generatedTasks.length ? (
            <div className="space-y-3">
              {analysis.generatedTasks.map((task) => (
                <div key={task.id} className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{getActionLabel(task.title, locale)}</p>
                    <Badge>{getTaskStatusLabel(task.status, locale)}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{task.reason}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {task.owner} · {task.dueLabel}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t.report.noTasks}</p>
          )}
        </InfoCard>

        <InfoCard title={t.report.sections.files}>
          {product.fileReferences.length ? (
            <div className="space-y-3">
              {product.fileReferences.map((file) => (
                <div key={file} className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">{file}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t.report.emptyFiles}</p>
          )}
        </InfoCard>
      </section>
      </div>
    </div>
  );
}

function TopMetric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{note}</p>
    </div>
  );
}

function ActionPanel({
  title,
  actions,
}: {
  title: string;
  actions: { label: string; onClick: () => void }[];
}) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-4 flex flex-col gap-2">
        {actions.map((action) => (
          <Button key={action.label} variant="outline" onClick={action.onClick}>
            {action.label}
          </Button>
        ))}
      </div>
    </section>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-stone-100 bg-stone-50 px-4 py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[60%] text-right font-medium">{value}</span>
    </div>
  );
}

function ScoreCard({
  title,
  rows,
  footer,
}: {
  title: string;
  rows: { label: string; score: number; max: number; note: string }[];
  footer?: string;
}) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-4 space-y-3">
        {rows.map((row) => {
          const percent = row.max ? Math.round((row.score / row.max) * 100) : 0;
          return (
            <div key={row.label} className="rounded-xl border border-stone-100 bg-stone-50 p-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span>{row.label}</span>
                <span className="font-medium">
                  {row.score}/{row.max}
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-stone-200">
                <div className="h-2 rounded-full bg-slate-900" style={{ width: `${percent}%` }} />
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{row.note}</p>
            </div>
          );
        })}
        {footer ? <Badge className="border-slate-200 bg-slate-50 text-slate-700">{footer}</Badge> : null}
      </div>
    </section>
  );
}

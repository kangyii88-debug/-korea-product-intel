"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Download, Filter, Plus, Search } from "lucide-react";
import { DecisionPill } from "@/components/decision-pill";
import { EmptyState } from "@/components/empty-state";
import { useLocale } from "@/components/locale-provider";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { RiskBadge } from "@/components/risk-badge";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/lib/i18n";
import {
  analyzeProduct,
  loadLocalProducts,
  PRODUCT_STATUS_OPTIONS,
  type LocalProduct,
  type ProductAnalysis,
} from "@/lib/local-products";
import {
  getCategoryDisplayName,
  getDirectionLabel,
  getRiskLabel,
  getStatusLabel,
  normalizeDirection,
  normalizeRiskLevel,
} from "@/lib/presentation";
import { formatNumber } from "@/lib/utils";

type ProductRow = {
  product: LocalProduct;
  analysis: ProductAnalysis;
};

const DIRECTION_OPTIONS = ["all", "Rocket Growth", "PB", "Rocket Growth + PB", "继续观察", "放弃"] as const;
const RISK_OPTIONS = ["all", "低", "中", "高"] as const;
const SCORE_OPTIONS = ["all", "85+", "70-84", "60-69", "<60"] as const;

export function ProductWorkspace() {
  const { locale } = useLocale();
  const t = getDictionary(locale);
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [query, setQuery] = useState("");
  const [directionFilter, setDirectionFilter] = useState<(typeof DIRECTION_OPTIONS)[number]>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [riskFilter, setRiskFilter] = useState<(typeof RISK_OPTIONS)[number]>("all");
  const [scoreFilter, setScoreFilter] = useState<(typeof SCORE_OPTIONS)[number]>("all");
  const [onlyHighPotential, setOnlyHighPotential] = useState(false);
  const [onlyHighRisk, setOnlyHighRisk] = useState(false);
  const [includeRejected, setIncludeRejected] = useState(true);
  const [onlyTransferable, setOnlyTransferable] = useState(false);

  useEffect(() => {
    setProducts(loadLocalProducts());
  }, []);

  const analyzed = useMemo<ProductRow[]>(
    () =>
      products.map((product) => ({
        product,
        analysis: analyzeProduct(product),
      })),
    [products],
  );

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return analyzed.filter(({ product, analysis }) => {
      const normalizedDirection = normalizeDirection(analysis.direction);
      const normalizedRisk = normalizeRiskLevel(analysis.riskLevel);
      const searchable = [
        product.productNameKo,
        product.productNameZh,
        product.category,
        product.brand,
        product.owner,
        normalizedDirection,
        analysis.nextAction,
      ]
        .join(" ")
        .toLowerCase();

      const scoreMatch =
        scoreFilter === "all" ||
        (scoreFilter === "85+" && analysis.totalScore >= 85) ||
        (scoreFilter === "70-84" && analysis.totalScore >= 70 && analysis.totalScore <= 84) ||
        (scoreFilter === "60-69" && analysis.totalScore >= 60 && analysis.totalScore <= 69) ||
        (scoreFilter === "<60" && analysis.totalScore < 60);

      const transferable = analysis.transferCheckRg.ready || analysis.transferCheckPb.ready;
      const rejectedLabel = getStatusLabel(product.status, "zh");

      return (
        (!keyword || searchable.includes(keyword)) &&
        (directionFilter === "all" || normalizedDirection === directionFilter) &&
        (statusFilter === "all" || product.status === statusFilter) &&
        (riskFilter === "all" || normalizedRisk === riskFilter) &&
        scoreMatch &&
        (!onlyHighPotential || analysis.totalScore >= 85) &&
        (!onlyHighRisk || normalizedRisk === "高") &&
        (includeRejected || rejectedLabel !== "已淘汰") &&
        (!onlyTransferable || transferable)
      );
    });
  }, [analyzed, directionFilter, includeRejected, onlyHighPotential, onlyHighRisk, onlyTransferable, query, riskFilter, scoreFilter, statusFilter]);

  const monthKey = new Date().toISOString().slice(0, 7);
  const metrics = [
    [t.pages.dashboard.metrics.collected, analyzed.filter((item) => item.product.createdAt.slice(0, 7) === monthKey).length],
    [t.pages.dashboard.metrics.potential, analyzed.filter((item) => item.analysis.totalScore >= 85).length],
    [t.pages.dashboard.metrics.rg, analyzed.filter((item) => normalizeDirection(item.analysis.direction) === "Rocket Growth").length],
    [t.pages.dashboard.metrics.pb, analyzed.filter((item) => normalizeDirection(item.analysis.direction) === "PB").length],
    [t.pages.dashboard.metrics.dual, analyzed.filter((item) => normalizeDirection(item.analysis.direction) === "Rocket Growth + PB").length],
    [t.pages.dashboard.metrics.highRisk, analyzed.filter((item) => normalizeRiskLevel(item.analysis.riskLevel) === "高").length],
    [t.pages.dashboard.metrics.rejected, analyzed.filter((item) => getStatusLabel(item.product.status, "zh") === "已淘汰").length],
    [t.pages.dashboard.metrics.tasks, analyzed.reduce((sum, item) => sum + item.analysis.generatedTasks.length, 0)],
  ];

  return (
    <div className="flex w-full flex-col gap-6 px-5 py-8 sm:px-8 lg:px-10 2xl:px-12">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value]) => (
          <StatCard key={String(label)} label={String(label)} value={formatNumber(Number(value))} note={t.workspace.metricsNote} />
        ))}
      </section>

      <SectionCard title={t.workspace.filterTitle} description={t.workspace.filterDescription}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative max-w-xl flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t.workspace.searchPlaceholder}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-slate-900/10"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Download className="h-4 w-4" />
                {t.workspace.exportButton}
              </Button>
              <Link href="/products/new">
                <Button>
                  <Plus className="h-4 w-4" />
                  {t.common.addProduct}
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-4">
            <SelectFilter
              label={t.workspace.filters.direction}
              value={directionFilter}
              onChange={(value) => setDirectionFilter(value as (typeof DIRECTION_OPTIONS)[number])}
              options={DIRECTION_OPTIONS.map((value) => ({
                value,
                label: value === "all" ? t.common.all : getDirectionLabel(value, locale),
              }))}
            />
            <SelectFilter
              label={t.workspace.filters.status}
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "all", label: t.common.all },
                ...PRODUCT_STATUS_OPTIONS.map((value) => ({ value, label: getStatusLabel(value, locale) })),
              ]}
            />
            <SelectFilter
              label={t.workspace.filters.risk}
              value={riskFilter}
              onChange={(value) => setRiskFilter(value as (typeof RISK_OPTIONS)[number])}
              options={RISK_OPTIONS.map((value) => ({
                value,
                label: value === "all" ? t.common.all : getRiskLabel(value, locale),
              }))}
            />
            <SelectFilter
              label={t.workspace.filters.score}
              value={scoreFilter}
              onChange={(value) => setScoreFilter(value as (typeof SCORE_OPTIONS)[number])}
              options={SCORE_OPTIONS.map((value) => ({
                value,
                label: value === "all" ? t.common.all : value,
              }))}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <ToggleChip label={t.workspace.filters.highPotential} checked={onlyHighPotential} onChange={setOnlyHighPotential} />
            <ToggleChip label={t.workspace.filters.highRisk} checked={onlyHighRisk} onChange={setOnlyHighRisk} />
            <ToggleChip label={t.workspace.filters.rejected} checked={includeRejected} onChange={setIncludeRejected} />
            <ToggleChip label={t.workspace.filters.transferable} checked={onlyTransferable} onChange={setOnlyTransferable} />
          </div>
        </div>
      </SectionCard>

      {products.length === 0 ? (
        <EmptyState
          title={t.pages.dashboard.emptyTitle}
          description={t.pages.dashboard.emptyDescription}
          primaryLabel={t.common.addProduct}
          primaryHref="/products/new"
        />
      ) : (
        <SectionCard title={t.workspace.listTitle} description={t.workspace.listDescription}>
          <div className="space-y-4">
            {filtered.map(({ product, analysis }) => (
              <Link
                href={`/reports/${product.id}`}
                key={product.id}
                className="grid gap-4 rounded-[18px] border border-slate-200 bg-slate-50/55 p-5 transition-colors hover:bg-slate-50 lg:grid-cols-[minmax(0,1.7fr)_170px_140px_120px_120px_120px_140px]"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-base font-semibold tracking-[-0.02em] text-slate-950">
                      {locale === "ko" ? product.productNameKo : product.productNameZh}
                    </p>
                    <StatusBadge tone="neutral">{product.platform}</StatusBadge>
                    <StatusBadge tone="neutral">{getCategoryDisplayName(product.category, locale)}</StatusBadge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusBadge tone="info">{analysis.biggestOpportunity}</StatusBadge>
                    <StatusBadge tone="danger">{analysis.biggestRisk}</StatusBadge>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">{analysis.nextAction}</p>
                </div>
                <MetaBlock label={t.workspace.filters.direction}>
                  <DecisionPill decision={analysis.direction} />
                </MetaBlock>
                <MetaBlock label={t.workspace.labels.score}>
                  <div className="space-y-2 text-sm text-slate-700">
                    <p>{locale === "ko" ? `총점 ${analysis.totalScore}` : `总分 ${analysis.totalScore}`}</p>
                    <p>RG {analysis.rgScore}</p>
                    <p>PB {analysis.pbScore}</p>
                  </div>
                </MetaBlock>
                <MetaBlock label={t.common.risk}>
                  <RiskBadge level={normalizeRiskLevel(analysis.riskLevel)} detail={analysis.riskRedlineLevel} />
                </MetaBlock>
                <MetaBlock label={t.workspace.labels.profitRate}>
                  <p className="text-sm font-semibold text-slate-900">{analysis.grossMarginPercent}%</p>
                </MetaBlock>
                <MetaBlock label={t.common.status}>
                  <StatusBadge tone="neutral">{getStatusLabel(product.status, locale)}</StatusBadge>
                </MetaBlock>
                <MetaBlock label={t.workspace.labels.updatedAt}>
                  <div className="space-y-2 text-sm text-slate-600">
                    <p>{formatDate(product.updatedAt)}</p>
                    <div className="inline-flex items-center gap-1 font-medium text-slate-900">
                      {t.common.viewDetails}
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </MetaBlock>
              </Link>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

function MetaBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function SelectFilter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="text-sm font-medium">
      <span className="mb-2 inline-flex items-center gap-2 text-slate-500">
        <Filter className="h-3.5 w-3.5" />
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-shadow focus:ring-2 focus:ring-slate-900/10"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ToggleChip({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`rounded-full border px-3 py-2 text-sm transition-colors ${
        checked ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}-${`${date.getDate()}`.padStart(2, "0")}`;
}

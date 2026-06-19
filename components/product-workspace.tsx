"use client";

import Link from "next/link";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Download,
  FileSpreadsheet,
  Filter,
  FolderInput,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import * as XLSX from "xlsx";
import { DecisionPill } from "@/components/decision-pill";
import { EmptyState } from "@/components/empty-state";
import { useLocale } from "@/components/locale-provider";
import { RiskBadge } from "@/components/risk-badge";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { createLocalProductOpportunity } from "@/lib/product-opportunities-local";
import {
  analyzeProduct,
  deleteLocalProduct,
  loadLocalProducts,
  PRODUCT_STATUS_OPTIONS,
  saveLocalProducts,
  type LocalProduct,
  type ProductAnalysis,
  type ProductStatus,
  updateLocalProduct,
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

type BannerState = {
  tone: "success" | "danger" | "info";
  message: string;
} | null;

type SampleName =
  | "coupang_hot_products_50"
  | "coupang_test_products_5"
  | "coupang_rocket_growth_test_10";

type BucketKey = "all" | "focus" | "transfer" | "eliminated";

const SAMPLE_OPTIONS: Array<{ name: SampleName; label: string; note: string }> = [
  { name: "coupang_hot_products_50", label: "Coupang 热销 50", note: "完整测试池样例" },
  { name: "coupang_test_products_5", label: "测试样例 5", note: "快速验证流程" },
  { name: "coupang_rocket_growth_test_10", label: "Rocket Growth 10", note: "RG 导向样例" },
];

const DIRECTION_OPTIONS = ["all", "Rocket Growth", "PB", "Rocket Growth + PB", "瀯㎫뺌鰲귛캗", "?얍펱"] as const;
const SCORE_OPTIONS = ["all", "85+", "70-84", "60-69", "<60"] as const;
const RISK_OPTIONS = ["all", "低风险", "中风险", "高风险"] as const;
const PROFIT_OPTIONS = ["all", "35+", "20-34", "<20"] as const;
const PAGE_SIZE = 6;

export function ProductWorkspace() {
  const { locale } = useLocale();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [banner, setBanner] = useState<BannerState>(null);
  const [query, setQuery] = useState("");
  const [bucket, setBucket] = useState<BucketKey>("all");
  const [directionFilter, setDirectionFilter] = useState<(typeof DIRECTION_OPTIONS)[number]>("all");
  const [riskFilter, setRiskFilter] = useState<(typeof RISK_OPTIONS)[number]>("all");
  const [scoreFilter, setScoreFilter] = useState<(typeof SCORE_OPTIONS)[number]>("all");
  const [profitFilter, setProfitFilter] = useState<(typeof PROFIT_OPTIONS)[number]>("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [onlyTransferReady, setOnlyTransferReady] = useState(false);
  const [onlyOwned, setOnlyOwned] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busySample, setBusySample] = useState<SampleName | null>(null);
  const [importingFile, setImportingFile] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [actionNotice, setActionNotice] = useState<BannerState>(null);
  const [page, setPage] = useState(1);

  const copy = locale === "ko" ? KO_COPY : ZH_COPY;

  useEffect(() => {
    refreshProducts();
  }, []);

  const analyzed = useMemo<ProductRow[]>(
    () =>
      products.map((product) => ({
        product,
        analysis: analyzeProduct(product),
      })),
    [products],
  );

  const metrics = useMemo(() => buildMetrics(analyzed), [analyzed]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return analyzed.filter(({ product, analysis }) => {
      const direction = normalizeDirection(analysis.direction);
      const risk = getRiskLabel(analysis.riskLevel, "zh");
      const statusLabel = getStatusLabel(product.status, "zh");
      const transferable = analysis.transferCheckRg.ready || analysis.transferCheckPb.ready;
      const profitRate = analysis.grossMarginPercent;
      const searchable = [
        product.productNameKo,
        product.productNameZh,
        product.brand,
        product.category,
        product.owner,
        product.marketAnalysis,
        product.recommendationReason,
        product.notes,
      ]
        .join(" ")
        .toLowerCase();

      const scoreMatch =
        scoreFilter === "all" ||
        (scoreFilter === "85+" && analysis.totalScore >= 85) ||
        (scoreFilter === "70-84" && analysis.totalScore >= 70 && analysis.totalScore <= 84) ||
        (scoreFilter === "60-69" && analysis.totalScore >= 60 && analysis.totalScore <= 69) ||
        (scoreFilter === "<60" && analysis.totalScore < 60);

      const profitMatch =
        profitFilter === "all" ||
        (profitFilter === "35+" && profitRate >= 35) ||
        (profitFilter === "20-34" && profitRate >= 20 && profitRate < 35) ||
        (profitFilter === "<20" && profitRate < 20);

      const bucketMatch =
        bucket === "all" ||
        (bucket === "focus" && !isEliminated(statusLabel) && (analysis.totalScore >= 70 || analysis.generatedTasks.length > 0)) ||
        (bucket === "transfer" && transferable) ||
        (bucket === "eliminated" && isEliminated(statusLabel));

      return (
        (!keyword || searchable.includes(keyword)) &&
        bucketMatch &&
        (directionFilter === "all" || direction === directionFilter) &&
        (riskFilter === "all" || risk === riskFilter) &&
        (statusFilter === "all" || product.status === statusFilter) &&
        scoreMatch &&
        profitMatch &&
        (!onlyTransferReady || transferable) &&
        (!onlyOwned || Boolean(product.owner))
      );
    });
  }, [
    analyzed,
    bucket,
    directionFilter,
    onlyOwned,
    onlyTransferReady,
    profitFilter,
    query,
    riskFilter,
    scoreFilter,
    statusFilter,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pagedItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  useEffect(() => {
    setPage(1);
  }, [query, bucket, directionFilter, riskFilter, scoreFilter, profitFilter, statusFilter, onlyTransferReady, onlyOwned]);

  useEffect(() => {
    if (!filtered.length) {
      setSelectedId(null);
      return;
    }

    if (!selectedId || !pagedItems.some((item) => item.product.id === selectedId)) {
      setSelectedId(pagedItems[0]?.product.id ?? filtered[0].product.id);
    }
  }, [filtered, pagedItems, selectedId]);

  useEffect(() => {
    setActionNotice(null);
  }, [selectedId]);

  const selected = useMemo(
    () => filtered.find((item) => item.product.id === selectedId) ?? analyzed.find((item) => item.product.id === selectedId) ?? null,
    [analyzed, filtered, selectedId],
  );

  function refreshProducts() {
    startTransition(() => {
      setProducts(loadLocalProducts());
    });
  }

  function pushActionNotice(tone: NonNullable<BannerState>["tone"], message: string) {
    const next = { tone, message } satisfies NonNullable<BannerState>;
    setBanner(next);
    setActionNotice(next);
  }

  async function importSample(name: SampleName) {
    try {
      setBusySample(name);
      setBanner({ tone: "info", message: copy.messages.importing });
      const response = await fetch(`/api/testing-db-samples?name=${name}`, { cache: "no-store" });
      const payload = (await response.json()) as { items?: Record<string, unknown>[]; error?: string };

      if (!response.ok || !payload.items?.length) {
        throw new Error(payload.error || "sample_import_failed");
      }

      const imported = ingestRows(payload.items, `sample:${name}`);
      setBanner({
        tone: "success",
        message: interpolate(copy.messages.importedSuccess, { count: String(imported) }),
      });
    } catch {
      setBanner({ tone: "danger", message: copy.messages.importFailed });
    } finally {
      setBusySample(null);
    }
  }

  function onPickFile() {
    fileInputRef.current?.click();
  }

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImportingFile(true);
      setBanner({ tone: "info", message: copy.messages.importing });
      const rows = await readRowsFromFile(file);
      const imported = ingestRows(rows, `file:${file.name}`);
      setBanner({
        tone: "success",
        message: interpolate(copy.messages.importedSuccess, { count: String(imported) }),
      });
    } catch {
      setBanner({ tone: "danger", message: copy.messages.importFailed });
    } finally {
      setImportingFile(false);
      event.target.value = "";
    }
  }

  function ingestRows(rows: Record<string, unknown>[], sourceLabel: string) {
    const mapped = rows
      .map((row) => mapImportedRow(row, sourceLabel))
      .filter((item): item is LocalProduct => Boolean(item));

    const current = loadLocalProducts();
    const merged = mergeProducts(current, mapped);
    saveLocalProducts(merged);
    setProducts(merged);
    if (mapped[0]) setSelectedId(mapped[0].id);
    return mapped.length;
  }

  function onDeleteSelected() {
    if (!selected) return;
    const next = deleteLocalProduct(selected.product.id);
    setProducts(next);
    pushActionNotice("success", copy.messages.deleted);
  }

  function onExport() {
    try {
      setExporting(true);
      const rows = products.map((product) => exportRow(product, analyzeProduct(product)));
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "testing-db");
      const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      XLSX.writeFile(workbook, `product_test_database_export_${stamp}.xlsx`);
      setBanner({ tone: "success", message: copy.messages.exported });
    } catch {
      setBanner({ tone: "danger", message: copy.messages.exportFailed });
    } finally {
      setExporting(false);
    }
  }

  function onQuickStatus(status: ProductStatus) {
    if (!selected) return;
    const next = updateLocalProduct(selected.product.id, (product) => ({ ...product, status }));
    setProducts(next);
    pushActionNotice("success", `${copy.messages.statusUpdated} ${getStatusLabel(status, locale)}`);
  }

  function onTransfer(kind: "rg" | "pb") {
    if (!selected) return;

    const readiness = kind === "rg" ? selected.analysis.transferCheckRg : selected.analysis.transferCheckPb;
    if (!readiness.ready) {
      pushActionNotice("danger", `${copy.messages.transferBlocked}${readiness.missing.join(" / ")}`);
      return;
    }

    createLocalProductOpportunity(buildOpportunityInput(selected.product, selected.analysis, kind));
    const next = updateLocalProduct(selected.product.id, (product) => ({
      ...product,
      status: PRODUCT_STATUS_OPTIONS[10],
    }));
    setProducts(next);
    pushActionNotice("success", kind === "rg" ? copy.messages.transferRgDone : copy.messages.transferPbDone);
  }

  return (
    <div className="flex w-full flex-col gap-6 px-5 py-8 sm:px-8 lg:px-10 2xl:px-12">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.json,.xlsx,.xls"
        className="hidden"
        onChange={onFileChange}
      />

      <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-[linear-gradient(135deg,#fffaf2_0%,#ffffff_46%,#eef6ff_100%)]">
        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(340px,0.9fr)] lg:px-8 lg:py-7">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/90 px-3 py-1 text-xs font-semibold text-amber-700">
              <Sparkles className="h-3.5 w-3.5" />
              {copy.heroBadge}
            </div>
            <h2 className="mt-4 text-[28px] font-semibold tracking-[-0.04em] text-slate-950">{copy.heroTitle}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{copy.heroDescription}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button onClick={onPickFile} disabled={importingFile}>
                {importingFile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {copy.actions.importFile}
              </Button>
              <Button variant="outline" onClick={onExport} disabled={exporting || products.length === 0}>
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {copy.actions.export}
              </Button>
              <Link href="/products/new">
                <Button variant="outline">
                  <Plus className="h-4 w-4" />
                  {copy.actions.manualAdd}
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {SAMPLE_OPTIONS.map((sample) => (
              <button
                key={sample.name}
                type="button"
                onClick={() => importSample(sample.name)}
                className="rounded-[20px] border border-slate-200 bg-white/90 p-4 text-left transition-colors hover:border-slate-300 hover:bg-white"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{sample.label}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{sample.note}</p>
                  </div>
                  {busySample === sample.name ? (
                    <Loader2 className="mt-0.5 h-4 w-4 animate-spin text-slate-400" />
                  ) : (
                    <FolderInput className="mt-0.5 h-4 w-4 text-slate-400" />
                  )}
                </div>
                <p className="mt-4 text-xs font-medium text-slate-700">{copy.sampleAction}</p>
              </button>
            ))}
            <button
              type="button"
              onClick={refreshProducts}
              className="rounded-[20px] border border-dashed border-slate-300 bg-white/60 p-4 text-left transition-colors hover:border-slate-400"
            >
              <div className="flex items-center gap-3">
                <RefreshCcw className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-sm font-semibold text-slate-950">{copy.actions.refresh}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{copy.refreshNote}</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </section>

      {banner ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            banner.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : banner.tone === "danger"
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-sky-200 bg-sky-50 text-sky-700"
          }`}
        >
          {banner.message}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <StatCard
            key={metric.label}
            label={metric.label}
            value={formatNumber(metric.value)}
            note={metric.note}
            tone={metric.tone}
            icon={metric.icon}
          />
        ))}
      </section>

      <SectionCard title={copy.filters.title} description={copy.filters.description}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative max-w-xl flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={copy.filters.searchPlaceholder}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-slate-900/10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {BUCKETS(copy).map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setBucket(item.value)}
                  className={`rounded-full border px-3 py-2 text-sm transition-colors ${
                    bucket === item.value
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-5">
            <SelectFilter
              label={copy.filters.direction}
              value={directionFilter}
              onChange={(value) => setDirectionFilter(value as (typeof DIRECTION_OPTIONS)[number])}
              options={DIRECTION_OPTIONS.map((value) => ({
                value,
                label: value === "all" ? copy.common.all : getDirectionLabel(value, locale),
              }))}
            />
            <SelectFilter
              label={copy.filters.status}
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "all", label: copy.common.all },
                ...PRODUCT_STATUS_OPTIONS.map((value) => ({ value, label: getStatusLabel(value, locale) })),
              ]}
            />
            <SelectFilter
              label={copy.filters.risk}
              value={riskFilter}
              onChange={(value) => setRiskFilter(value as (typeof RISK_OPTIONS)[number])}
              options={RISK_OPTIONS.map((value) => ({
                value,
                label:
                  value === "all"
                    ? copy.common.all
                    : locale === "ko"
                      ? value === "高风险"
                        ? "높음"
                        : value === "中风险"
                          ? "중간"
                          : "낮음"
                      : value,
              }))}
            />
            <SelectFilter
              label={copy.filters.score}
              value={scoreFilter}
              onChange={(value) => setScoreFilter(value as (typeof SCORE_OPTIONS)[number])}
              options={SCORE_OPTIONS.map((value) => ({
                value,
                label: value === "all" ? copy.common.all : value,
              }))}
            />
            <SelectFilter
              label={copy.filters.profit}
              value={profitFilter}
              onChange={(value) => setProfitFilter(value as (typeof PROFIT_OPTIONS)[number])}
              options={PROFIT_OPTIONS.map((value) => ({
                value,
                label: value === "all" ? copy.common.all : value,
              }))}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <ToggleChip label={copy.filters.transferOnly} checked={onlyTransferReady} onChange={setOnlyTransferReady} />
            <ToggleChip label={copy.filters.ownerOnly} checked={onlyOwned} onChange={setOnlyOwned} />
          </div>
        </div>
      </SectionCard>

      {products.length === 0 ? (
        <EmptyState
          title={copy.empty.title}
          description={copy.empty.description}
          primaryLabel={copy.actions.importFile}
          primaryHref="/products/new"
        />
      ) : (
        <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.25fr)_420px]">
          <SectionCard
            title={copy.list.title}
            description={interpolate(copy.list.description, { count: String(filtered.length), total: String(products.length) })}
            className="min-w-0 overflow-hidden"
          >
            <div className="flex min-h-[820px] flex-col">
              <div className="flex-1 space-y-3 overflow-hidden">
              {pagedItems.map(({ product, analysis }) => {
                const selectedCard = selectedId === product.id;
                const transferReady = analysis.transferCheckRg.ready || analysis.transferCheckPb.ready;

                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => setSelectedId(product.id)}
                    className={`grid min-w-0 w-full gap-4 rounded-[18px] border p-5 text-left transition-colors lg:grid-cols-[minmax(0,1.7fr)_150px_110px_110px_120px] ${
                      selectedCard
                        ? "border-slate-900 bg-slate-950 text-white"
                        : "border-slate-200 bg-slate-50/55 hover:bg-slate-50"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={`truncate text-base font-semibold tracking-[-0.02em] ${selectedCard ? "text-white" : "text-slate-950"}`}>
                          {locale === "ko" ? product.productNameKo : product.productNameZh}
                        </p>
                        <StatusBadge tone="neutral">{product.platform}</StatusBadge>
                        <StatusBadge tone="neutral">{getCategoryDisplayName(product.category, locale)}</StatusBadge>
                      </div>
                      <p className={`mt-2 text-sm ${selectedCard ? "text-slate-200" : "text-slate-500"}`}>
                        {product.brand || copy.common.noBrand} · {product.owner || copy.common.unassigned}
                      </p>
                      <p className={`mt-3 line-clamp-2 text-sm leading-6 ${selectedCard ? "text-slate-300" : "text-slate-500"}`}>
                        {analysis.nextAction}
                      </p>
                    </div>

                    <MetaBlock label={copy.list.direction} inverted={selectedCard}>
                      <DecisionPill decision={analysis.direction} />
                    </MetaBlock>

                    <MetaBlock label={copy.list.score} inverted={selectedCard}>
                      <p className={`text-lg font-semibold ${selectedCard ? "text-white" : "text-slate-950"}`}>{analysis.totalScore}</p>
                      <p className={`text-xs ${selectedCard ? "text-slate-300" : "text-slate-500"}`}>RG {analysis.rgScore} / PB {analysis.pbScore}</p>
                    </MetaBlock>

                    <MetaBlock label={copy.list.profit} inverted={selectedCard}>
                      <p className={`text-lg font-semibold ${selectedCard ? "text-white" : "text-slate-950"}`}>{analysis.grossMarginPercent}%</p>
                      <p className={`text-xs ${selectedCard ? "text-slate-300" : "text-slate-500"}`}>{formatNumber(analysis.grossProfitKrw)} KRW</p>
                    </MetaBlock>

                    <MetaBlock label={copy.list.status} inverted={selectedCard}>
                      <div className="space-y-2">
                        <StatusBadge tone="neutral">{getStatusLabel(product.status, locale)}</StatusBadge>
                        <div className={`text-xs ${selectedCard ? "text-emerald-200" : "text-emerald-600"}`}>
                          {transferReady ? copy.common.transferReady : copy.common.needsCompletion}
                        </div>
                      </div>
                    </MetaBlock>
                  </button>
                );
              })}

              {!filtered.length ? (
                <div className="flex min-h-[320px] items-center justify-center rounded-[18px] border border-dashed border-slate-200 bg-slate-50/70 px-6 text-center text-sm text-slate-500">
                  {locale === "ko" ? "현재 조건에 맞는 테스트 상품이 없습니다." : "当前筛选条件下没有测试商品。"}
                </div>
              ) : null}
              </div>

              {filtered.length > 0 ? (
                <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">
                    {locale === "ko" ? `${page} / ${totalPages} 페이지` : `第 ${page} / ${totalPages} 页`}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                      {locale === "ko" ? "이전 페이지" : "上一页"}
                    </Button>
                    <Button
                      variant="outline"
                      disabled={page >= totalPages}
                      onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    >
                      {locale === "ko" ? "다음 페이지" : "下一页"}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </SectionCard>

          <Card className="sticky top-6 z-20 min-h-[820px] overflow-hidden">
            <CardHeader className="space-y-4">
              {selected ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{copy.detail.eyebrow}</p>
                      <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-950">
                        {locale === "ko" ? selected.product.productNameKo : selected.product.productNameZh}
                      </h3>
                      <p className="mt-2 text-sm text-slate-500">
                        {selected.product.brand || copy.common.noBrand} · {getCategoryDisplayName(selected.product.category, locale)}
                      </p>
                    </div>
                    <Link href={`/reports/${selected.product.id}`}>
                      <Button variant="outline">
                        {copy.detail.openReport}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <MiniStat label={copy.detail.score} value={String(selected.analysis.totalScore)} />
                    <MiniStat label={copy.detail.margin} value={`${selected.analysis.grossMarginPercent}%`} />
                    <MiniStat label={copy.detail.sales} value={formatNumber(selected.product.estimatedMonthlySales)} />
                    <MiniStat label={copy.detail.reviewCount} value={formatNumber(selected.product.reviewCount)} />
                  </div>
                </>
              ) : (
                <div>
                  <p className="text-sm text-slate-500">{copy.detail.empty}</p>
                </div>
              )}
            </CardHeader>

            {selected ? (
              <CardContent className="space-y-6">
                {actionNotice ? (
                  <div
                    className={`rounded-2xl border px-4 py-3 text-sm ${
                      actionNotice.tone === "success"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : actionNotice.tone === "danger"
                          ? "border-rose-200 bg-rose-50 text-rose-700"
                          : "border-sky-200 bg-sky-50 text-sky-700"
                    }`}
                  >
                    {actionNotice.message}
                  </div>
                ) : null}

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-950">{copy.detail.decision}</h4>
                  <div className="flex flex-wrap gap-2">
                    <DecisionPill decision={selected.analysis.direction} />
                    <RiskBadge level={normalizeRiskLevel(selected.analysis.riskLevel)} detail={selected.analysis.riskRedlineLevel} />
                    <StatusBadge tone="neutral">{getStatusLabel(selected.product.status, locale)}</StatusBadge>
                  </div>
                  <p className="text-sm leading-6 text-slate-600">{selected.analysis.riskSummary}</p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-950">{copy.detail.actions}</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => onTransfer("rg")}
                      variant="outline"
                      className="relative z-30"
                    >
                      {copy.actions.transferRg}
                    </Button>
                    <Button
                      onClick={() => onTransfer("pb")}
                      variant="outline"
                      className="relative z-30"
                    >
                      {copy.actions.transferPb}
                    </Button>
                    <Button onClick={onDeleteSelected} variant="outline" className="relative z-30">
                      <Trash2 className="h-4 w-4" />
                      {copy.actions.delete}
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-950">{copy.detail.statusSuggestions}</h4>
                  <div className="flex flex-wrap gap-2">
                    {selected.analysis.statusSuggestions.length ? (
                      selected.analysis.statusSuggestions.map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => onQuickStatus(status)}
                          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition-colors hover:border-slate-300"
                        >
                          {getStatusLabel(status, locale)}
                        </button>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">{copy.detail.noSuggestion}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-950">{copy.detail.transferChecklist}</h4>
                  <ChecklistBlock
                    label="RG"
                    ready={selected.analysis.transferCheckRg.ready}
                    missing={selected.analysis.transferCheckRg.missing}
                    copy={copy}
                  />
                  <ChecklistBlock
                    label="PB"
                    ready={selected.analysis.transferCheckPb.ready}
                    missing={selected.analysis.transferCheckPb.missing}
                    copy={copy}
                  />
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-950">{copy.detail.keyFields}</h4>
                  <div className="grid gap-3">
                    <KeyValue label={copy.detail.owner} value={selected.product.owner || copy.common.unassigned} />
                    <KeyValue label={copy.detail.price} value={`${formatNumber(selected.product.competitorSalePriceKrw)} KRW`} />
                    <KeyValue label={copy.detail.targetSupply} value={`${formatNumber(selected.product.targetSupplyPriceKrw)} KRW`} />
                    <KeyValue label={copy.detail.marketAnalysis} value={selected.product.marketAnalysis || "-"} />
                    <KeyValue label={copy.detail.recommendation} value={selected.product.recommendationReason || "-"} />
                    <KeyValue label={copy.detail.nextAction} value={selected.analysis.nextAction} />
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-950">{copy.detail.generatedTasks}</h4>
                  <div className="space-y-2">
                    {selected.analysis.generatedTasks.length ? (
                      selected.analysis.generatedTasks.slice(0, 4).map((task) => (
                        <div key={task.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <p className="text-sm font-medium text-slate-950">{task.title}</p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {task.owner} · {task.dueLabel}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">{copy.detail.noTasks}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            ) : null}
          </Card>
        </section>
      )}
    </div>
  );
}

function buildMetrics(rows: ProductRow[]) {
  const highPotential = rows.filter((item) => item.analysis.totalScore >= 85).length;
  const transferReady = rows.filter((item) => item.analysis.transferCheckRg.ready || item.analysis.transferCheckPb.ready).length;
  const rgReady = rows.filter((item) => normalizeDirection(item.analysis.direction) === "Rocket Growth").length;
  const pbReady = rows.filter((item) => normalizeDirection(item.analysis.direction) === "PB").length;
  const dualReady = rows.filter((item) => normalizeDirection(item.analysis.direction) === "Rocket Growth + PB").length;
  const highRisk = rows.filter((item) => getRiskLabel(item.analysis.riskLevel, "zh") === "高风险").length;
  const eliminated = rows.filter((item) => isEliminated(getStatusLabel(item.product.status, "zh"))).length;
  const needAction = rows.filter((item) => item.analysis.generatedTasks.length > 0).length;

  return [
    { label: "测试池总量", value: rows.length, note: "当前本地测试数据库中的商品总数", tone: "default" as const, icon: <FileSpreadsheet className="h-4 w-4" /> },
    { label: "高潜力商品", value: highPotential, note: "总分 >= 85，可优先推进", tone: "success" as const, icon: <Sparkles className="h-4 w-4" /> },
    { label: "可转机会池", value: transferReady, note: "RG 或 PB 条件已补齐", tone: "success" as const, icon: <ArrowRight className="h-4 w-4" /> },
    { label: "RG 候选", value: rgReady, note: "更适合走 Rocket Growth 流程", tone: "default" as const, icon: <RefreshCcw className="h-4 w-4" /> },
    { label: "PB 候选", value: pbReady, note: "更适合做 PB 或长期品牌化", tone: "default" as const, icon: <RefreshCcw className="h-4 w-4" /> },
    { label: "双向机会", value: dualReady, note: "RG + PB 都可推进", tone: "success" as const, icon: <Sparkles className="h-4 w-4" /> },
    { label: "高风险商品", value: highRisk, note: "红线或合规风险需要先处理", tone: "danger" as const, icon: <Filter className="h-4 w-4" /> },
    { label: "待动作任务", value: needAction + eliminated, note: "包含待处理任务与淘汰复核项", tone: "warning" as const, icon: <Upload className="h-4 w-4" /> },
  ];
}

async function readRowsFromFile(file: File) {
  const extension = file.name.toLowerCase().split(".").pop();
  const arrayBuffer = await file.arrayBuffer();

  if (extension === "json") {
    const text = new TextDecoder().decode(arrayBuffer);
    const parsed = JSON.parse(text) as unknown;
    if (!Array.isArray(parsed)) throw new Error("invalid_json");
    return parsed as Record<string, unknown>[];
  }

  if (extension === "csv" || extension === "xlsx" || extension === "xls") {
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "" });
    if (!rows.length) throw new Error("empty_rows");
    return rows;
  }

  throw new Error("unsupported_file");
}

function mapImportedRow(row: Record<string, unknown>, sourceLabel: string): LocalProduct | null {
  const productNameKo = textValue(row.product_name_ko ?? row.productNameKo ?? row.name);
  const productNameZh = textValue(row.product_name_zh ?? row.productNameZh ?? row.name ?? productNameKo);
  const brand = textValue(row.brand);
  const coupangUrl = textValue(row.coupang_url ?? row.coupangUrl ?? row.competitorUrl ?? row.url);

  if (!productNameKo && !productNameZh) return null;

  const now = new Date().toISOString();
  const notes = [textValue(row.notes), sourceLabel].filter(Boolean).join(" | ");

  return {
    id: crypto.randomUUID(),
    platform: textValue(row.platform) || "Coupang",
    productNameKo,
    productNameZh,
    brand,
    category: textValue(row.category) || "未分类",
    competitorUrl: coupangUrl,
    sourceUrl: coupangUrl,
    image: textValue(row.image_url ?? row.image),
    owner: textValue(row.owner),
    supplierQuoteCount: numberValue(row.supplier_quote_count ?? row.supplierQuoteCount),
    supplierNames: listValue(row.supplier_name ?? row.supplierNames),
    price: numberValue(row.competitor_price_krw ?? row.price),
    discountPrice: numberValue(row.competitor_price_krw ?? row.discountPrice ?? row.price),
    competitorSalePriceKrw: numberValue(row.competitor_price_krw ?? row.competitorSalePriceKrw ?? row.price),
    targetSupplyPriceKrw: numberValue(row.target_supply_price_krw ?? row.targetSupplyPriceKrw),
    chinaCostRmb: numberValue(row.estimated_china_cost_rmb ?? row.chinaCostRmb),
    internationalShippingKrw: numberValue(row.international_shipping_krw ?? row.internationalShippingKrw),
    koreaShippingKrw: numberValue(row.korea_local_shipping_krw ?? row.koreaShippingKrw),
    coupangFeePercent: numberValue(row.coupang_fee_rate ?? row.coupangFeePercent),
    adCostKrw: numberValue(row.ad_cost_krw ?? row.adCostKrw),
    returnLossKrw: numberValue(row.return_loss_krw ?? row.returnLossKrw),
    otherCostKrw: numberValue(row.other_cost_krw ?? row.otherCostKrw),
    estimatedMonthlySales: numberValue(row.estimated_monthly_sales ?? row.estimatedMonthlySales),
    reviewCount: numberValue(row.review_count ?? row.reviewCount),
    rating: numberValue(row.rating),
    rank: numberValue(row.category_rank ?? row.rank),
    deliveryType: textValue(row.delivery_type ?? row.deliveryType),
    sellerType: textValue(row.seller_type ?? row.sellerType),
    size: textValue(row.size),
    colors: listValue(row.color ?? row.colors),
    material: textValue(row.material),
    weight: textValue(row.weight),
    packageSize: textValue(row.package_size ?? row.packageSize),
    sellingPoints: listValue(row.core_selling_points ?? row.sellingPoints),
    keywords: listValue(row.keywords),
    reviews: [...listValue(row.review_samples), ...listValue(row.bad_review_samples)],
    marketAnalysis: textValue(row.market_analysis ?? row.marketAnalysis),
    priceRange: textValue(row.price_range ?? row.priceRange),
    reviewSummary: textValue(row.review_analysis_summary ?? row.reviewSummary),
    consumerPainPoints: textValue(row.consumer_pain_points ?? row.consumerPainPoints),
    productDevelopmentDirection: textValue(row.product_development_direction ?? row.productDevelopmentDirection),
    recommendationReason: textValue(row.recommendation_reason ?? row.recommendationReason),
    sampleDevelopmentAdvice: textValue(row.sample_development_suggestion ?? row.sampleDevelopmentAdvice),
    categoryGapNote: textValue(row.category_opportunity_note ?? row.categoryGapNote),
    fileReferences: listValue(row.file_materials ?? row.fileReferences),
    notes,
    status: PRODUCT_STATUS_OPTIONS[0],
    rejectionReason: undefined,
    needsKcCertification: booleanValue(row.risk_need_kc),
    kcDocsReady: booleanValue(row.risk_kc_documents_ready),
    childrenProduct: booleanValue(row.risk_children_product),
    foodProduct: booleanValue(row.risk_food),
    electronicsProduct: booleanValue(row.risk_electronics),
    cosmeticsProduct: booleanValue(row.risk_cosmetics),
    medicalProduct: booleanValue(row.risk_medical),
    fragile: booleanValue(row.risk_fragile),
    possibleHighReturn: booleanValue(row.risk_high_return),
    uncertainRegulation: booleanValue(row.risk_korea_regulation_uncertain),
    coupangRestricted: booleanValue(row.risk_coupang_platform_limit ?? row.risk_coupang_pb_or_self_operated),
    createdAt: now,
    updatedAt: now,
  };
}

function mergeProducts(existing: LocalProduct[], incoming: LocalProduct[]) {
  const next = [...existing];

  for (const candidate of incoming) {
    const index = next.findIndex((item) => {
      const sameUrl = candidate.competitorUrl && item.competitorUrl && candidate.competitorUrl === item.competitorUrl;
      const sameIdentity =
        normalizeKey(candidate.productNameKo || candidate.productNameZh) === normalizeKey(item.productNameKo || item.productNameZh) &&
        normalizeKey(candidate.brand) === normalizeKey(item.brand);
      return sameUrl || sameIdentity;
    });

    if (index >= 0) {
      next[index] = {
        ...next[index],
        ...candidate,
        id: next[index].id,
        createdAt: next[index].createdAt,
        updatedAt: new Date().toISOString(),
      };
    } else {
      next.unshift(candidate);
    }
  }

  return next;
}

function buildOpportunityInput(product: LocalProduct, analysis: ProductAnalysis, kind: "rg" | "pb") {
  const competitionLevel: "low" | "medium" | "high" =
    analysis.totalScore >= 85 ? "low" : analysis.totalScore >= 70 ? "medium" : "high";
  const marketHeat: "low" | "medium" | "high" =
    product.estimatedMonthlySales >= 4000 ? "high" : product.estimatedMonthlySales >= 1500 ? "medium" : "low";
  const riskLabel = getRiskLabel(analysis.riskLevel, "zh");
  const riskLevel: "low" | "medium" | "high" =
    riskLabel === "高风险" ? "high" : riskLabel === "中风险" ? "medium" : "low";

  return {
    title: product.productNameZh || product.productNameKo,
    sku: "",
    keyword: product.keywords.join(", "),
    category: "other" as const,
    business_type: kind === "rg" ? "rocket_growth" as const : "pb_supply" as const,
    coupang_url: product.competitorUrl,
    image_url: product.image,
    price: product.competitorSalePriceKrw,
    review_count: product.reviewCount,
    rating: product.rating,
    competitor_count: Math.max(1, product.rank || 1),
    estimated_purchase_cost: product.targetSupplyPriceKrw,
    estimated_shipping_cost: product.internationalShippingKrw,
    estimated_local_delivery_cost: product.koreaShippingKrw,
    platform_fee_rate: product.coupangFeePercent,
    estimated_ad_cost: product.adCostKrw,
    estimated_sale_price: product.competitorSalePriceKrw,
    market_heat: marketHeat,
    competition_level: competitionLevel,
    kc_risk: product.needsKcCertification && !product.kcDocsReady ? "high" as const : "low" as const,
    volume_weight_risk: product.fragile || product.weight ? riskLevel : "low" as const,
    return_risk: product.possibleHighReturn ? "high" as const : "low" as const,
    negative_review_risk: analysis.negativeIssues.length ? "medium" as const : "low" as const,
    price_war_risk: product.rank <= 3 && product.reviewCount >= 1000 ? "high" as const : "medium" as const,
    supply_chain_risk: product.supplierQuoteCount >= 2 ? "low" as const : "medium" as const,
    notes: [product.marketAnalysis, product.recommendationReason, analysis.nextAction].filter(Boolean).join("\n"),
    status: "testable" as const,
    next_action: kind === "rg" ? "prepare_rg_proposal" as const : "prepare_pb_proposal" as const,
    demand_stability: product.estimatedMonthlySales >= 2000 ? "stable" : "testing",
    seasonality: product.notes,
    long_term_fit: kind === "pb" || normalizeDirection(analysis.direction) === "Rocket Growth + PB",
    short_term_test_fit: kind === "rg" || normalizeDirection(analysis.direction) === "Rocket Growth + PB",
    competitor_price_range: product.priceRange,
    top_seller_count: Math.max(1, product.rank || 1),
    review_issue_summary: product.reviewSummary,
    negative_review_keywords: analysis.negativeIssues.map((item) => item.label).join(", "),
    improvement_points: product.productDevelopmentDirection || product.sampleDevelopmentAdvice,
  };
}

function exportRow(product: LocalProduct, analysis: ProductAnalysis) {
  return {
    product_name_ko: product.productNameKo,
    product_name_zh: product.productNameZh,
    brand: product.brand,
    category: product.category,
    owner: product.owner,
    coupang_url: product.competitorUrl,
    score: analysis.totalScore,
    direction: normalizeDirection(analysis.direction),
    risk_level: getRiskLabel(normalizeRiskLevel(analysis.riskLevel), "zh"),
    gross_margin_percent: analysis.grossMarginPercent,
    status: getStatusLabel(product.status, "zh"),
    estimated_monthly_sales: product.estimatedMonthlySales,
    review_count: product.reviewCount,
    rating: product.rating,
    recommendation_reason: product.recommendationReason,
    next_action: analysis.nextAction,
    updated_at: product.updatedAt,
  };
}

function ChecklistBlock({
  label,
  ready,
  missing,
  copy,
}: {
  label: string;
  ready: boolean;
  missing: string[];
  copy: typeof ZH_COPY;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-950">{label}</p>
        <StatusBadge tone={ready ? "success" : "warning"}>{ready ? copy.common.ready : copy.common.missing}</StatusBadge>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{ready ? copy.detail.transferReadyText : missing.join(" / ") || "-"}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{value || "-"}</p>
    </div>
  );
}

function MetaBlock({
  label,
  inverted,
  children,
}: {
  label: string;
  inverted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className={`text-xs font-medium ${inverted ? "text-slate-400" : "text-slate-500"}`}>{label}</p>
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

function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}

function isEliminated(statusLabel: string) {
  return statusLabel === "淘汰" || statusLabel.toLowerCase().includes("drop");
}

function textValue(value: unknown) {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
}

function numberValue(value: unknown) {
  const text = textValue(value).replace(/,/g, "");
  const result = Number(text);
  return Number.isFinite(result) ? result : 0;
}

function booleanValue(value: unknown) {
  const text = textValue(value).toLowerCase();
  return ["true", "1", "yes", "y", "是"].includes(text);
}

function listValue(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => textValue(item)).filter(Boolean);
  return textValue(value)
    .split(/[,\n/|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function interpolate(template: string, params: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_match, key) => params[key] ?? "");
}

function BUCKETS(copy: typeof ZH_COPY) {
  return [
    { value: "all" as const, label: copy.buckets.all },
    { value: "focus" as const, label: copy.buckets.focus },
    { value: "transfer" as const, label: copy.buckets.transfer },
    { value: "eliminated" as const, label: copy.buckets.eliminated },
  ];
}

const ZH_COPY = {
  heroBadge: "长期独立运营测试库",
  heroTitle: "把商品测试数据库做成日常运营主工作台",
  heroDescription:
    "这里不再只是看一眼列表，而是把测试商品的导入、筛选、评估、淘汰、转机会池和导出都集中在一个页面里，适合你长期单独运营。",
  sampleAction: "点击直接导入到本地测试池",
  refreshNote: "重新读取浏览器本地测试数据",
  actions: {
    importFile: "导入 CSV / JSON / Excel",
    export: "导出测试库",
    manualAdd: "手动新增商品",
    refresh: "刷新本地数据",
    transferRg: "转入 RG 机会池",
    transferPb: "转入 PB 机会池",
    delete: "删除商品",
  },
  messages: {
    importing: "正在导入测试商品，请稍候。",
    importedSuccess: "已成功导入 {count} 条测试商品。",
    importFailed: "导入失败，请检查文件格式或样例数据。",
    deleted: "已删除当前商品。",
    exported: "测试数据库已导出。",
    exportFailed: "导出失败，请稍后再试。",
    statusUpdated: "商品状态已更新。",
    transferBlocked: "当前还不能转入机会池，缺少字段：",
    transferRgDone: "已转入本地 RG 机会池。",
    transferPbDone: "已转入本地 PB 机会池。",
  },
  filters: {
    title: "筛选与运营视图",
    description: "按方向、状态、风险、利润和优先桶快速定位今天要处理的商品。",
    searchPlaceholder: "搜索商品名、品牌、类目、负责人、备注",
    direction: "推荐方向",
    status: "当前状态",
    risk: "风险级别",
    score: "综合评分",
    profit: "毛利率",
    transferOnly: "只看可转机会池",
    ownerOnly: "只看已分配负责人",
  },
  buckets: {
    all: "全部商品",
    focus: "今天重点",
    transfer: "可转机会池",
    eliminated: "淘汰复核",
  },
  list: {
    title: "测试商品清单",
    description: "当前显示 {count} / {total} 条商品",
    direction: "方向",
    score: "评分",
    profit: "毛利",
    status: "状态",
  },
  detail: {
    eyebrow: "商品详情与动作",
    empty: "从左侧选择一个商品查看完整动作面板。",
    openReport: "打开完整报告",
    score: "总分",
    margin: "毛利率",
    sales: "月销估算",
    reviewCount: "评论量",
    decision: "决策结论",
    actions: "快速动作",
    statusSuggestions: "建议状态流转",
    noSuggestion: "当前没有额外建议状态。",
    transferChecklist: "转机会池检查项",
    transferReadyText: "字段已补齐，可以直接转入对应机会池。",
    keyFields: "关键字段",
    owner: "负责人",
    price: "竞品售价",
    targetSupply: "目标供货价",
    marketAnalysis: "市场判断",
    recommendation: "推荐理由",
    nextAction: "下一步动作",
    generatedTasks: "生成的待办",
    noTasks: "当前没有额外待办。",
  },
  empty: {
    title: "测试数据库还是空的",
    description: "你可以直接导入项目里的样例数据，或者上传自己的 CSV / JSON / Excel 文件开始运营。",
  },
  common: {
    all: "全部",
    ready: "已满足",
    missing: "待补充",
    transferReady: "可转机会池",
    needsCompletion: "待补字段",
    unassigned: "未分配",
    noBrand: "无品牌",
  },
};

const KO_COPY: typeof ZH_COPY = {
  ...ZH_COPY,
  heroBadge: "장기 운영형 테스트 DB",
  heroTitle: "상품 테스트 데이터베이스를 실제 운영 워크벤치로 전환",
  heroDescription:
    "단순 목록이 아니라 테스트 상품의 가져오기, 선별, 평가, 탈락, 기회보드 전환, 내보내기를 한 화면에 모아 장기 단독 운영에 맞게 구성했습니다.",
  sampleAction: "클릭해서 로컬 테스트 풀에 바로 가져오기",
  refreshNote: "브라우저 로컬 테스트 데이터를 다시 읽어옵니다",
  actions: {
    importFile: "CSV / JSON / Excel 가져오기",
    export: "테스트 DB 내보내기",
    manualAdd: "수동 상품 추가",
    refresh: "로컬 데이터 새로고침",
    transferRg: "RG 기회보드로 전환",
    transferPb: "PB 기회보드로 전환",
    delete: "상품 삭제",
  },
  messages: {
    importing: "테스트 상품을 가져오는 중입니다.",
    importedSuccess: "{count}개 테스트 상품을 가져왔습니다.",
    importFailed: "가져오기에 실패했습니다. 파일 형식 또는 샘플 데이터를 확인해 주세요.",
    deleted: "현재 상품을 삭제했습니다.",
    exported: "테스트 데이터베이스를 내보냈습니다.",
    exportFailed: "내보내기에 실패했습니다.",
    statusUpdated: "상품 상태를 업데이트했습니다.",
    transferBlocked: "기회보드로 아직 전환할 수 없습니다. 누락 필드: ",
    transferRgDone: "로컬 RG 기회보드로 전환했습니다.",
    transferPbDone: "로컬 PB 기회보드로 전환했습니다.",
  },
  filters: {
    title: "필터 및 운영 뷰",
    description: "방향, 상태, 리스크, 이익률, 운영 버킷 기준으로 오늘 처리할 상품을 빠르게 찾습니다.",
    searchPlaceholder: "상품명, 브랜드, 카테고리, 담당자, 메모 검색",
    direction: "추천 방향",
    status: "현재 상태",
    risk: "리스크",
    score: "종합 점수",
    profit: "마진율",
    transferOnly: "전환 가능 상품만",
    ownerOnly: "담당자 지정 상품만",
  },
  buckets: {
    all: "전체 상품",
    focus: "오늘의 우선 처리",
    transfer: "기회보드 전환 가능",
    eliminated: "탈락 재검토",
  },
  list: {
    title: "테스트 상품 목록",
    description: "현재 {count} / {total}개 표시 중",
    direction: "방향",
    score: "점수",
    profit: "마진",
    status: "상태",
  },
  detail: {
    eyebrow: "상품 상세 및 액션",
    empty: "왼쪽에서 상품을 선택하면 상세 운영 패널이 열립니다.",
    openReport: "전체 리포트 열기",
    score: "총점",
    margin: "마진율",
    sales: "월 판매 추정",
    reviewCount: "리뷰 수",
    decision: "판단 결과",
    actions: "빠른 액션",
    statusSuggestions: "추천 상태 전환",
    noSuggestion: "현재 추가 추천 상태가 없습니다.",
    transferChecklist: "기회보드 전환 체크리스트",
    transferReadyText: "필수 필드가 모두 채워져 바로 전환할 수 있습니다.",
    keyFields: "핵심 필드",
    owner: "담당자",
    price: "경쟁가",
    targetSupply: "목표 공급가",
    marketAnalysis: "시장 판단",
    recommendation: "추천 이유",
    nextAction: "다음 액션",
    generatedTasks: "생성된 할 일",
    noTasks: "현재 추가 할 일이 없습니다.",
  },
  empty: {
    title: "테스트 데이터베이스가 비어 있습니다",
    description: "프로젝트 샘플 데이터를 바로 가져오거나 직접 CSV / JSON / Excel 파일을 올려 시작할 수 있습니다.",
  },
  common: {
    all: "전체",
    ready: "충족",
    missing: "보완 필요",
    transferReady: "전환 가능",
    needsCompletion: "필드 보완 필요",
    unassigned: "미지정",
    noBrand: "브랜드 없음",
  },
};

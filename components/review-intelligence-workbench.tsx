"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Download,
  FileSpreadsheet,
  FolderSync,
  Loader2,
  MessageSquareWarning,
  Search,
  Sparkles,
  Upload,
} from "lucide-react";
import * as XLSX from "xlsx";
import { PageHeader } from "@/components/page-header";
import { useLocale } from "@/components/locale-provider";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { loadLocalProducts, type LocalProduct } from "@/lib/local-products";
import { loadLocalProductOpportunities } from "@/lib/product-opportunities-local";
import { type ReviewIssueAnalysis } from "@/lib/types";
import { type ReviewKeywordExtraction, type ReviewSentimentResult } from "@/lib/review-corpus";
import {
  loadLocalReviewInsights,
  replaceLocalReviewInsights,
  type ReviewInsightRecord,
  type ReviewInsightStatus,
} from "@/lib/review-insights-local";

type Banner = { tone: "success" | "danger" | "info"; message: string } | null;

type ImportedCorpus = {
  stats: {
    totalReviews: number;
  };
  issues: ReviewIssueAnalysis[];
  keywords: ReviewKeywordExtraction[];
  sentiments: ReviewSentimentResult[];
};

type Filters = {
  query: string;
  status: "all" | ReviewInsightStatus;
  severity: "all" | "low" | "medium" | "high";
  source: "all" | "testing_db" | "opportunity_board" | "manual_import";
  improvement: "all" | "yes" | "no";
};

const STATUS_OPTIONS: Array<{ value: Filters["status"]; zh: string; ko: string }> = [
  { value: "all", zh: "全部状态", ko: "전체 상태" },
  { value: "new", zh: "新导入", ko: "신규" },
  { value: "ready", zh: "可处理", ko: "처리 가능" },
  { value: "sync_testing_db", zh: "回写测试库", ko: "테스트DB 반영" },
  { value: "sync_opportunity", zh: "转机会池", ko: "기회보드 전환" },
  { value: "observe", zh: "继续观察", ko: "계속 관찰" },
  { value: "dropped", zh: "淘汰", ko: "제외" },
];

const SOURCE_OPTIONS: Array<{ value: Filters["source"]; zh: string; ko: string }> = [
  { value: "all", zh: "全部来源", ko: "전체 출처" },
  { value: "testing_db", zh: "商品测试库", ko: "상품 테스트DB" },
  { value: "opportunity_board", zh: "机会池", ko: "기회보드" },
  { value: "manual_import", zh: "手动导入", ko: "수동 가져오기" },
];

const SEVERITY_OPTIONS: Array<{ value: Filters["severity"]; zh: string; ko: string }> = [
  { value: "all", zh: "全部严重度", ko: "전체 심각도" },
  { value: "high", zh: "高", ko: "높음" },
  { value: "medium", zh: "中", ko: "중간" },
  { value: "low", zh: "低", ko: "낮음" },
];

const IMPROVEMENT_OPTIONS: Array<{ value: Filters["improvement"]; zh: string; ko: string }> = [
  { value: "all", zh: "全部", ko: "전체" },
  { value: "yes", zh: "可改进", ko: "개선 가능" },
  { value: "no", zh: "不建议改", ko: "개선 비권장" },
];

export function ReviewIntelligenceWorkbench() {
  const { locale } = useLocale();
  const t = locale === "ko" ? KO_COPY : ZH_COPY;
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [items, setItems] = useState<ReviewInsightRecord[]>([]);
  const [banner, setBanner] = useState<Banner>(null);
  const [pastedReviews, setPastedReviews] = useState("");
  const [manualMeta, setManualMeta] = useState({
    productNameKo: "",
    productNameZh: "",
    coupangUrl: "",
    category: "",
    brand: "",
    rating: "",
    reviewCount: "",
  });
  const [filters, setFilters] = useState<Filters>({
    query: "",
    status: "all",
    severity: "all",
    source: "all",
    improvement: "all",
  });
  const [submittingPaste, setSubmittingPaste] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const restored = loadLocalReviewInsights().map(refreshInsightNarrative);
    setItems(restored);
    replaceLocalReviewInsights(restored);
  }, []);

  const metrics = useMemo(() => buildMetrics(items, t), [items, t]);

  const filtered = useMemo(() => {
    const keyword = filters.query.trim().toLowerCase();
    return items.filter((item) => {
      const searchable = [
        item.product_name_ko,
        item.product_name_zh,
        item.brand,
        item.category,
        item.top_pain_points.join(" "),
        item.notes,
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!keyword || searchable.includes(keyword)) &&
        (filters.status === "all" || item.status === filters.status) &&
        (filters.severity === "all" || item.severity_level === filters.severity) &&
        (filters.source === "all" || item.source_type === filters.source) &&
        (filters.improvement === "all" ||
          (filters.improvement === "yes" && item.improvement_possible) ||
          (filters.improvement === "no" && !item.improvement_possible))
      );
    });
  }, [filters, items]);

  useEffect(() => {
    if (!filtered.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !filtered.some((item) => item.id === selectedId)) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  const selected = filtered.find((item) => item.id === selectedId) ?? items.find((item) => item.id === selectedId) ?? null;

  function persist(next: ReviewInsightRecord[]) {
    replaceLocalReviewInsights(next);
    setItems(next);
  }

  function importFromTestingDb() {
    const products = loadLocalProducts();
    const imported = products
      .filter((item) => item.reviewSummary || item.reviews.length || item.consumerPainPoints)
      .map((item) => buildInsightFromLocalProduct(item));

    const next = mergeInsightItems(items, imported);
    persist(next);
    setBanner({ tone: "success", message: interpolate(t.messages.syncedTestingDb, { count: String(imported.length) }) });
  }

  function importFromOpportunityBoard() {
    const opportunities = loadLocalProductOpportunities();
    const imported = opportunities
      .filter((item) => item.review_issue_summary || item.negative_review_keywords || item.improvement_points)
      .map((item) => buildInsightFromOpportunity(item));

    const next = mergeInsightItems(items, imported);
    persist(next);
    setBanner({ tone: "success", message: interpolate(t.messages.syncedOpportunity, { count: String(imported.length) }) });
  }

  async function submitPastedReviews() {
    if (!pastedReviews.trim()) {
      setBanner({ tone: "danger", message: t.messages.emptyPaste });
      return;
    }

    setSubmittingPaste(true);
    try {
      const response = await fetch("/api/reviews/import?productId=manual-review-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: "text", content: pastedReviews }),
      });
      const payload = (await response.json()) as { ok?: boolean; corpus?: ImportedCorpus };
      if (!payload.ok || !payload.corpus) throw new Error("import_failed");

      const insight = buildInsightFromCorpus(payload.corpus, {
        id: crypto.randomUUID(),
        source_product_id: "manual-review-import",
        source_type: "manual_import",
        product_name_ko: manualMeta.productNameKo,
        product_name_zh: manualMeta.productNameZh,
        coupang_url: manualMeta.coupangUrl,
        image_url: "",
        brand: manualMeta.brand,
        category: manualMeta.category,
        price_krw: 0,
        rating: Number(manualMeta.rating || 0),
        review_count: Number(manualMeta.reviewCount || payload.corpus.stats.totalReviews),
        monthly_purchase_badge: "",
        delivery_type: "",
        review_samples: pastedReviews
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
          .slice(0, 10),
        bad_review_samples: pastedReviews
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
          .slice(0, 10),
      });

      const next = mergeInsightItems(items, [insight]);
      persist(next);
      setSelectedId(insight.id);
      setBanner({ tone: "success", message: t.messages.pasteImported });
    } catch {
      setBanner({ tone: "danger", message: t.messages.importFailed });
    } finally {
      setSubmittingPaste(false);
    }
  }

  async function onUploadFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/reviews/import?productId=file-review-import", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as { ok?: boolean; corpus?: ImportedCorpus; reviews?: Array<{ text: string }> };
      if (!payload.ok || !payload.corpus) throw new Error("file_import_failed");

      const insight = buildInsightFromCorpus(payload.corpus, {
        id: crypto.randomUUID(),
        source_product_id: "file-review-import",
        source_type: "manual_import",
        product_name_ko: manualMeta.productNameKo,
        product_name_zh: manualMeta.productNameZh,
        coupang_url: manualMeta.coupangUrl,
        image_url: "",
        brand: manualMeta.brand,
        category: manualMeta.category,
        price_krw: 0,
        rating: Number(manualMeta.rating || 0),
        review_count: Number(manualMeta.reviewCount || payload.corpus.stats.totalReviews),
        monthly_purchase_badge: "",
        delivery_type: "",
        review_samples: (payload.reviews ?? []).map((item) => item.text).slice(0, 10),
        bad_review_samples: (payload.reviews ?? []).map((item) => item.text).slice(0, 10),
      });

      const next = mergeInsightItems(items, [insight]);
      persist(next);
      setSelectedId(insight.id);
      setBanner({ tone: "success", message: t.messages.fileImported });
    } catch {
      setBanner({ tone: "danger", message: t.messages.importFailed });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  function exportInsights() {
    const rows = items.map((item) => ({
      product_name_ko: item.product_name_ko,
      product_name_zh: item.product_name_zh,
      source_type: item.source_type,
      category: item.category,
      rating: item.rating,
      review_count: item.review_count,
      top_pain_points: item.top_pain_points.join(" / "),
      severity_level: levelLabel(item.severity_level, t),
      frequency_level: levelLabel(item.frequency_level, t),
      return_risk_level: levelLabel(item.return_risk_level, t),
      rating_impact_level: levelLabel(item.rating_impact_level, t),
      improvement_possible: item.improvement_possible ? t.common.yes : t.common.no,
      final_recommendation: item.final_recommendation,
      next_action: item.next_action,
      status: statusLabel(item.status, t),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "review-insights");
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    XLSX.writeFile(workbook, `review_insights_export_${stamp}.xlsx`);
    setBanner({ tone: "success", message: t.messages.exported });
  }

  return (
    <>
      <PageHeader eyebrow={t.header.eyebrow} title={t.header.title} description={t.header.description} />
      <div className="flex w-full flex-col gap-6 px-5 py-8 sm:px-8 lg:px-10 2xl:px-12">
        <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-[linear-gradient(135deg,#fff8ef_0%,#ffffff_44%,#eef6ff_100%)]">
          <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.95fr)] lg:px-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white/90 px-3 py-1 text-xs font-semibold text-rose-700">
                <MessageSquareWarning className="h-3.5 w-3.5" />
                {t.hero.badge}
              </div>
              <h2 className="mt-4 text-[28px] font-semibold tracking-[-0.04em] text-slate-950">{t.hero.title}</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{t.hero.description}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button onClick={importFromTestingDb}>
                  <FolderSync className="h-4 w-4" />
                  {t.hero.syncTestingDb}
                </Button>
                <Button variant="outline" onClick={importFromOpportunityBoard}>
                  <Sparkles className="h-4 w-4" />
                  {t.hero.syncOpportunity}
                </Button>
                <Button variant="outline" onClick={exportInsights} disabled={!items.length}>
                  <Download className="h-4 w-4" />
                  {t.hero.export}
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {t.hero.focusCards.map((card) => (
                <div key={card.title} className="rounded-[18px] border border-slate-200 bg-white/90 p-4">
                  <p className="text-sm font-semibold text-slate-950">{card.title}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{card.note}</p>
                </div>
              ))}
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
              value={metric.value}
              note={metric.note}
              tone={metric.tone}
              icon={metric.icon}
            />
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_420px]">
          <div className="space-y-6">
            <SectionCard title={t.importPanel.title} description={t.importPanel.description}>
              <div className="grid gap-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <InputField label={t.importPanel.fields.productNameKo} value={manualMeta.productNameKo} onChange={(value) => setManualMeta((current) => ({ ...current, productNameKo: value }))} />
                  <InputField label={t.importPanel.fields.productNameZh} value={manualMeta.productNameZh} onChange={(value) => setManualMeta((current) => ({ ...current, productNameZh: value }))} />
                  <InputField label={t.importPanel.fields.coupangUrl} value={manualMeta.coupangUrl} onChange={(value) => setManualMeta((current) => ({ ...current, coupangUrl: value }))} />
                  <InputField label={t.importPanel.fields.category} value={manualMeta.category} onChange={(value) => setManualMeta((current) => ({ ...current, category: value }))} />
                  <InputField label={t.importPanel.fields.brand} value={manualMeta.brand} onChange={(value) => setManualMeta((current) => ({ ...current, brand: value }))} />
                  <InputField label={t.importPanel.fields.rating} value={manualMeta.rating} onChange={(value) => setManualMeta((current) => ({ ...current, rating: value }))} />
                </div>
                <label className="text-sm font-medium text-slate-700">
                  <span>{t.importPanel.fields.pastedReviews}</span>
                  <textarea
                    value={pastedReviews}
                    onChange={(event) => setPastedReviews(event.target.value)}
                    placeholder={t.importPanel.placeholder}
                    className="mt-2 min-h-40 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition-shadow focus:ring-2 focus:ring-slate-900/10"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => void submitPastedReviews()} disabled={submittingPaste}>
                    {submittingPaste ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquareWarning className="h-4 w-4" />}
                    {t.importPanel.importPaste}
                  </Button>
                  <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={onUploadFile} />
                  <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {t.importPanel.importFile}
                  </Button>
                </div>
              </div>
            </SectionCard>

            <SectionCard title={t.filterPanel.title} description={t.filterPanel.description}>
              <div className="flex flex-col gap-4">
                <div className="relative max-w-xl">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={filters.query}
                    onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
                    placeholder={t.filterPanel.searchPlaceholder}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>
                <div className="grid gap-3 xl:grid-cols-4">
                  <SelectField
                    label={t.filterPanel.status}
                    value={filters.status}
                    onChange={(value) => setFilters((current) => ({ ...current, status: value as Filters["status"] }))}
                    options={STATUS_OPTIONS.map((option) => ({ value: option.value, label: locale === "ko" ? option.ko : option.zh }))}
                  />
                  <SelectField
                    label={t.filterPanel.severity}
                    value={filters.severity}
                    onChange={(value) => setFilters((current) => ({ ...current, severity: value as Filters["severity"] }))}
                    options={SEVERITY_OPTIONS.map((option) => ({ value: option.value, label: locale === "ko" ? option.ko : option.zh }))}
                  />
                  <SelectField
                    label={t.filterPanel.source}
                    value={filters.source}
                    onChange={(value) => setFilters((current) => ({ ...current, source: value as Filters["source"] }))}
                    options={SOURCE_OPTIONS.map((option) => ({ value: option.value, label: locale === "ko" ? option.ko : option.zh }))}
                  />
                  <SelectField
                    label={t.filterPanel.improvement}
                    value={filters.improvement}
                    onChange={(value) => setFilters((current) => ({ ...current, improvement: value as Filters["improvement"] }))}
                    options={IMPROVEMENT_OPTIONS.map((option) => ({ value: option.value, label: locale === "ko" ? option.ko : option.zh }))}
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard title={t.list.title} description={interpolate(t.list.description, { count: String(filtered.length), total: String(items.length) })}>
              <div className="space-y-3">
                {filtered.length ? (
                  filtered.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className={`grid w-full gap-4 rounded-[18px] border p-5 text-left transition-colors lg:grid-cols-[minmax(0,1.5fr)_120px_120px_120px] ${
                        item.id === selectedId ? "border-slate-900 bg-slate-950 text-white" : "border-slate-200 bg-slate-50/55 hover:bg-slate-50"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className={`truncate text-base font-semibold tracking-[-0.02em] ${item.id === selectedId ? "text-white" : "text-slate-950"}`}>
                          {locale === "ko" ? item.product_name_ko : item.product_name_zh || item.product_name_ko}
                        </p>
                        <p className={`mt-2 text-sm ${item.id === selectedId ? "text-slate-300" : "text-slate-500"}`}>
                          {item.brand || t.common.noBrand} · {item.category || "-"}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <StatusBadge tone="warning">{item.top_pain_points.slice(0, 2).join(" / ") || t.common.noIssue}</StatusBadge>
                          <StatusBadge tone="info">{sourceLabel(item.source_type, t)}</StatusBadge>
                        </div>
                      </div>
                      <MetricBlock label={t.list.severity} value={levelLabel(item.severity_level, t)} selected={item.id === selectedId} />
                      <MetricBlock label={t.list.returnRisk} value={levelLabel(item.return_risk_level, t)} selected={item.id === selectedId} />
                      <MetricBlock label={t.list.status} value={statusLabel(item.status, t)} selected={item.id === selectedId} />
                    </button>
                  ))
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">{t.list.empty}</div>
                )}
              </div>
            </SectionCard>
          </div>

          <Card className="h-fit overflow-hidden">
            <CardHeader className="space-y-4">
              {selected ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{t.detail.eyebrow}</p>
                      <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-950">
                        {locale === "ko" ? selected.product_name_ko : selected.product_name_zh || selected.product_name_ko}
                      </h3>
                      <p className="mt-2 text-sm text-slate-500">
                        {selected.brand || t.common.noBrand} · {selected.review_count} {t.detail.reviewCountUnit}
                      </p>
                    </div>
                    <StatusBadge tone={toneForLevel(selected.severity_level)}>{levelLabel(selected.severity_level, t)}</StatusBadge>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <MiniStat label={t.detail.severity} value={levelLabel(selected.severity_level, t)} />
                    <MiniStat label={t.detail.frequency} value={levelLabel(selected.frequency_level, t)} />
                    <MiniStat label={t.detail.returnRisk} value={levelLabel(selected.return_risk_level, t)} />
                    <MiniStat label={t.detail.improvement} value={selected.improvement_possible ? t.common.yes : t.common.no} />
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500">{t.detail.empty}</p>
              )}
            </CardHeader>
            {selected ? (
              <CardContent className="space-y-6">
                <DetailSection title={t.detail.topPainPoints}>
                  <div className="flex flex-wrap gap-2">
                    {selected.top_pain_points.length ? selected.top_pain_points.map((item) => <StatusBadge key={item} tone="warning">{item}</StatusBadge>) : <span className="text-sm text-slate-500">-</span>}
                  </div>
                </DetailSection>

                <DetailSection title={t.detail.categories}>
                  <div className="flex flex-wrap gap-2">
                    {selected.pain_point_categories.length ? selected.pain_point_categories.map((item) => <StatusBadge key={item} tone="neutral">{item}</StatusBadge>) : <span className="text-sm text-slate-500">-</span>}
                  </div>
                </DetailSection>

                <DetailSection title={t.detail.suggestions}>
                  <ul className="space-y-2 text-sm leading-6 text-slate-600">
                    {selected.improvement_suggestions.length ? selected.improvement_suggestions.map((item) => <li key={item}>- {item}</li>) : <li>-</li>}
                  </ul>
                </DetailSection>

                <DetailSection title={t.detail.recommendation}>
                  <p className="text-sm leading-6 text-slate-600">{selected.final_recommendation || "-"}</p>
                </DetailSection>

                <DetailSection title={t.detail.nextAction}>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-sm font-medium text-slate-950">{selected.next_action || "-"}</p>
                  </div>
                </DetailSection>

                <DetailSection title={t.detail.samples}>
                  <div className="space-y-2">
                    {selected.bad_review_samples.slice(0, 5).map((sample, index) => (
                      <div key={`${sample}-${index}`} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-600">
                        {sample}
                      </div>
                    ))}
                    {!selected.bad_review_samples.length ? <p className="text-sm text-slate-500">-</p> : null}
                  </div>
                </DetailSection>
              </CardContent>
            ) : null}
          </Card>
        </section>
      </div>
    </>
  );
}

function buildMetrics(items: ReviewInsightRecord[], t: typeof ZH_COPY) {
  const totalSamples = items.reduce((sum, item) => sum + item.review_count, 0);
  const highSeverity = items.filter((item) => item.severity_level === "high").length;
  const improvable = items.filter((item) => item.improvement_possible).length;
  const syncOpportunity = items.filter((item) => item.sync_to_opportunity_board).length;
  const syncTestingDb = items.filter((item) => item.sync_to_product_test).length;
  const returnRisk = items.filter((item) => item.return_risk_level === "high").length;
  const ratingImpact = items.filter((item) => item.rating_impact_level === "high").length;
  const ready = items.filter((item) => item.status === "ready" || item.status === "sync_opportunity" || item.status === "sync_testing_db").length;

  return [
    { label: t.metrics.totalSamples.label, value: totalSamples, note: t.metrics.totalSamples.note, tone: "default" as const, icon: <FileSpreadsheet className="h-4 w-4" /> },
    { label: t.metrics.highSeverity.label, value: highSeverity, note: t.metrics.highSeverity.note, tone: "danger" as const, icon: <AlertTriangle className="h-4 w-4" /> },
    { label: t.metrics.improvable.label, value: improvable, note: t.metrics.improvable.note, tone: "success" as const, icon: <Sparkles className="h-4 w-4" /> },
    { label: t.metrics.returnRisk.label, value: returnRisk, note: t.metrics.returnRisk.note, tone: "warning" as const, icon: <AlertTriangle className="h-4 w-4" /> },
    { label: t.metrics.ratingImpact.label, value: ratingImpact, note: t.metrics.ratingImpact.note, tone: "warning" as const, icon: <MessageSquareWarning className="h-4 w-4" /> },
    { label: t.metrics.testingDb.label, value: syncTestingDb, note: t.metrics.testingDb.note, tone: "default" as const, icon: <FolderSync className="h-4 w-4" /> },
    { label: t.metrics.opportunity.label, value: syncOpportunity, note: t.metrics.opportunity.note, tone: "success" as const, icon: <ArrowRight className="h-4 w-4" /> },
    { label: t.metrics.ready.label, value: ready, note: t.metrics.ready.note, tone: "default" as const, icon: <Sparkles className="h-4 w-4" /> },
  ];
}

function buildInsightFromLocalProduct(product: LocalProduct): ReviewInsightRecord {
  const insightAnalysis = analyzeReviewText([
    product.reviewSummary,
    product.consumerPainPoints,
    product.productDevelopmentDirection,
    product.recommendationReason,
    ...product.reviews,
  ]);
  const issueCategories = deriveIssueCategories(`${product.reviewSummary}\n${product.consumerPainPoints}\n${product.reviews.join("\n")}`);
  const topPainPoints = issueCategories.slice(0, 3);
  const severity = issueCategories.length >= 4 ? "high" : issueCategories.length >= 2 ? "medium" : "low";
  const frequency = product.reviews.length >= 8 ? "high" : product.reviews.length >= 4 ? "medium" : "low";
  const returnRisk = /退货|반품|返品|return/i.test(`${product.reviewSummary} ${product.reviews.join(" ")}`) ? "high" : severity === "high" ? "medium" : "low";
  const improvementPossible = !/不可改进|不能改|无法解决/i.test(`${product.productDevelopmentDirection} ${product.recommendationReason}`);

  return {
    id: `testing-db-${product.id}`,
    source_product_id: product.id,
    source_type: "testing_db",
    product_name_ko: product.productNameKo,
    product_name_zh: product.productNameZh,
    coupang_url: product.competitorUrl,
    image_url: product.image,
    brand: product.brand,
    category: product.category,
    price_krw: product.competitorSalePriceKrw,
    rating: product.rating,
    review_count: product.reviewCount,
    monthly_purchase_badge: "",
    delivery_type: product.deliveryType,
    review_samples: product.reviews.slice(0, 8),
    bad_review_samples: product.reviews.slice(0, 8),
    negative_keywords: insightAnalysis.negativeKeywords,
    pain_point_categories: insightAnalysis.categories,
    top_pain_points: insightAnalysis.topPainPoints,
    severity_level: insightAnalysis.severity,
    frequency_level: insightAnalysis.frequency,
    return_risk_level: insightAnalysis.returnRisk,
    rating_impact_level: product.rating <= 3.8 ? "high" : product.rating <= 4.3 ? "medium" : "low",
    improvement_possible: insightAnalysis.improvementPossible,
    improvement_suggestions: buildPracticalSuggestionsFromCategories(insightAnalysis.categories),
    development_direction: product.productDevelopmentDirection || product.sampleDevelopmentAdvice,
    final_recommendation: buildRecommendationFromAnalysis(
      insightAnalysis.severity,
      insightAnalysis.improvementPossible,
      insightAnalysis.topPainPoints,
      insightAnalysis.categories,
    ),
    next_action: buildNextActionFromAnalysis(
      insightAnalysis.severity,
      insightAnalysis.improvementPossible,
      insightAnalysis.topPainPoints,
      insightAnalysis.categories,
    ),
    sync_to_product_test: insightAnalysis.severity !== "low",
    sync_to_opportunity_board: insightAnalysis.severity !== "high" && insightAnalysis.improvementPossible,
    notes: [product.reviewSummary, product.consumerPainPoints].filter(Boolean).join(" / "),
    status:
      insightAnalysis.severity === "high"
        ? "sync_testing_db"
        : insightAnalysis.improvementPossible
          ? "sync_opportunity"
          : "observe",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function buildInsightFromOpportunity(item: ReturnType<typeof loadLocalProductOpportunities>[number]): ReviewInsightRecord {
  const insightAnalysis = analyzeReviewText([
    item.review_issue_summary ?? "",
    item.negative_review_keywords ?? "",
    item.improvement_points ?? "",
  ]);
  const issueCategories = deriveIssueCategories(`${item.review_issue_summary ?? ""}\n${item.negative_review_keywords ?? ""}\n${item.improvement_points ?? ""}`);
  const severity = item.negative_review_risk === "high" ? "high" : item.negative_review_risk === "medium" ? "medium" : issueCategories.length >= 3 ? "medium" : "low";
  const improvementPossible = Boolean(item.improvement_points);

  return {
    id: `opportunity-${item.id}`,
    source_product_id: item.id,
    source_type: "opportunity_board",
    product_name_ko: item.title,
    product_name_zh: item.title,
    coupang_url: item.coupang_url ?? "",
    image_url: item.image_url ?? "",
    brand: "",
    category: item.category ?? "",
    price_krw: Number(item.price ?? 0),
    rating: Number(item.rating ?? 0),
    review_count: Number(item.review_count ?? 0),
    monthly_purchase_badge: "",
    delivery_type: "",
    review_samples: item.negative_review_keywords ? [item.negative_review_keywords] : [],
    bad_review_samples: item.review_issue_summary ? [item.review_issue_summary] : [],
    negative_keywords: insightAnalysis.negativeKeywords,
    pain_point_categories: insightAnalysis.categories,
    top_pain_points: insightAnalysis.topPainPoints,
    severity_level: severity,
    frequency_level: Number(item.review_count ?? 0) >= 1000 ? "high" : Number(item.review_count ?? 0) >= 200 ? "medium" : insightAnalysis.frequency,
    return_risk_level: item.return_risk ?? insightAnalysis.returnRisk,
    rating_impact_level: Number(item.rating ?? 0) <= 3.8 ? "high" : Number(item.rating ?? 0) <= 4.3 ? "medium" : "low",
    improvement_possible: improvementPossible || insightAnalysis.improvementPossible,
    improvement_suggestions: item.improvement_points ? [item.improvement_points] : buildPracticalSuggestionsFromCategories(insightAnalysis.categories),
    development_direction: item.improvement_points ?? "",
    final_recommendation: buildRecommendationFromAnalysis(
      severity,
      improvementPossible || insightAnalysis.improvementPossible,
      insightAnalysis.topPainPoints,
      insightAnalysis.categories,
    ),
    next_action: buildNextActionFromAnalysis(
      severity,
      improvementPossible || insightAnalysis.improvementPossible,
      insightAnalysis.topPainPoints,
      insightAnalysis.categories,
    ),
    sync_to_product_test: true,
    sync_to_opportunity_board: improvementPossible || insightAnalysis.improvementPossible,
    notes: [item.review_issue_summary, item.improvement_points].filter(Boolean).join(" / "),
    status: improvementPossible || insightAnalysis.improvementPossible ? "sync_opportunity" : "observe",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function buildInsightFromCorpus(
  corpus: ImportedCorpus,
  base: Pick<
    ReviewInsightRecord,
    | "id"
    | "source_product_id"
    | "source_type"
    | "product_name_ko"
    | "product_name_zh"
    | "coupang_url"
    | "image_url"
    | "brand"
    | "category"
    | "price_krw"
    | "rating"
    | "review_count"
    | "monthly_purchase_badge"
    | "delivery_type"
    | "review_samples"
    | "bad_review_samples"
  >,
): ReviewInsightRecord {
  const insightAnalysis = analyzeReviewText([
    ...corpus.issues.map((issue) => issue.label),
    ...corpus.keywords.map((item) => item.keyword),
    ...corpus.issues.flatMap((issue) => issue.evidence ?? []),
    ...corpus.issues.flatMap((issue) => issue.optimizationSuggestions ?? []),
  ]);
  const issueCategories = corpus.issues.map((issue) => normalizeIssueLabel(issue.label));
  const topPainPoints = corpus.issues.slice(0, 3).map((issue) => normalizeIssueLabel(issue.label));
  const negativeReviews = corpus.sentiments.filter((item) => item.sentiment === "negative").length;
  const severity = corpus.issues.some((item) => item.severity === "高") ? "high" : corpus.issues.some((item) => item.severity === "中") ? "medium" : "low";
  const frequency = negativeReviews >= 5 ? "high" : negativeReviews >= 2 ? "medium" : "low";
  const returnRisk = issueCategories.some((item) => item.includes("退货") || item.includes("反품")) ? "high" : severity === "high" ? "medium" : "low";
  const improvementSuggestions = corpus.issues.flatMap((issue) => issue.optimizationSuggestions).slice(0, 6);
  const improvementPossible = improvementSuggestions.length > 0;

  return {
    ...base,
    negative_keywords:
      corpus.keywords.filter((item) => item.sentiment === "negative").map((item) => item.keyword).slice(0, 12).length > 0
        ? corpus.keywords.filter((item) => item.sentiment === "negative").map((item) => item.keyword).slice(0, 12)
        : insightAnalysis.negativeKeywords,
    pain_point_categories: insightAnalysis.categories,
    top_pain_points: insightAnalysis.topPainPoints,
    severity_level: severity,
    frequency_level: frequency,
    return_risk_level: returnRisk,
    rating_impact_level: base.rating <= 3.8 || negativeReviews >= 5 ? "high" : negativeReviews >= 2 ? "medium" : "low",
    improvement_possible: improvementPossible,
    improvement_suggestions:
      improvementSuggestions.length > 0
        ? improvementSuggestions
        : buildPracticalSuggestionsFromCategories(insightAnalysis.categories),
    development_direction: improvementSuggestions[0] ?? "",
    final_recommendation: buildRecommendationFromAnalysis(
      severity,
      improvementPossible || insightAnalysis.improvementPossible,
      insightAnalysis.topPainPoints,
      insightAnalysis.categories,
    ),
    next_action: buildNextActionFromAnalysis(
      severity,
      improvementPossible || insightAnalysis.improvementPossible,
      insightAnalysis.topPainPoints,
      insightAnalysis.categories,
    ),
    sync_to_product_test: true,
    sync_to_opportunity_board: improvementPossible && severity !== "high",
    notes: insightAnalysis.topPainPoints.join(" / "),
    status: improvementPossible ? "ready" : "observe",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function mergeInsightItems(current: ReviewInsightRecord[], incoming: ReviewInsightRecord[]) {
  const next = [...current];

  for (const item of incoming) {
    const index = next.findIndex(
      (currentItem) =>
        currentItem.id === item.id ||
        (currentItem.source_product_id === item.source_product_id &&
          currentItem.source_type === item.source_type &&
          currentItem.product_name_ko === item.product_name_ko),
    );

    if (index >= 0) {
      next[index] = {
        ...next[index],
        ...item,
        updated_at: new Date().toISOString(),
      };
    } else {
      next.unshift(item);
    }
  }

  return next;
}

function refreshInsightNarrative(item: ReviewInsightRecord): ReviewInsightRecord {
  const insightAnalysis = analyzeReviewText([
    item.notes,
    item.development_direction,
    ...item.review_samples,
    ...item.bad_review_samples,
    ...item.negative_keywords,
    ...item.pain_point_categories,
  ]);

  const nextSeverity = item.severity_level === "high" ? "high" : insightAnalysis.severity;
  const nextFrequency = item.frequency_level === "high" ? "high" : insightAnalysis.frequency;
  const nextReturnRisk = item.return_risk_level === "high" ? "high" : insightAnalysis.returnRisk;
  const nextImprovementPossible = item.improvement_possible || insightAnalysis.improvementPossible;

  return {
    ...item,
    negative_keywords: insightAnalysis.negativeKeywords,
    pain_point_categories: insightAnalysis.categories,
    top_pain_points: insightAnalysis.topPainPoints,
    severity_level: nextSeverity,
    frequency_level: nextFrequency,
    return_risk_level: nextReturnRisk,
    improvement_possible: nextImprovementPossible,
    improvement_suggestions:
      insightAnalysis.categories.length > 0
        ? buildPracticalSuggestionsFromCategories(insightAnalysis.categories)
        : item.improvement_suggestions,
    final_recommendation: buildRecommendationFromAnalysis(
      nextSeverity,
      nextImprovementPossible,
      insightAnalysis.topPainPoints,
      insightAnalysis.categories,
    ),
    next_action: buildNextActionFromAnalysis(
      nextSeverity,
      nextImprovementPossible,
      insightAnalysis.topPainPoints,
      insightAnalysis.categories,
    ),
    updated_at: new Date().toISOString(),
  };
}

function analyzeReviewText(parts: Array<string | null | undefined>): {
  categories: string[];
  topPainPoints: string[];
  negativeKeywords: string[];
  severity: "low" | "medium" | "high";
  frequency: "low" | "medium" | "high";
  returnRisk: "low" | "medium" | "high";
  improvementPossible: boolean;
} {
  const text = parts.filter(Boolean).join("\n");
  const matches = summarizeIssueMatches(text);
  const categories = matches.map((item) => item.label);
  const topPainPoints = matches
    .slice(0, 3)
    .map((item) => (item.evidence ? `${item.label}：${item.evidence}` : item.label));
  const negativeKeywords = extractNegativeKeywords(text, matches);
  const severity: "low" | "medium" | "high" =
    matches.some((item) => item.label === "退货风险" || item.count >= 4) || /退货|退款|换货|return|반품|교환/i.test(text)
      ? "high"
      : matches.length >= 2
        ? "medium"
        : "low";
  const frequency: "low" | "medium" | "high" =
    matches.some((item) => item.count >= 3) || text.split(/\r?\n/).filter((line) => line.trim().length > 0).length >= 8
      ? "high"
      : matches.length >= 2
        ? "medium"
        : "low";
  const returnRisk: "low" | "medium" | "high" =
    /退货|退款|换货|return|반품|교환/i.test(text)
      ? "high"
      : categories.some((item) => ["尺寸问题", "质量问题", "安装问题", "图文不符"].includes(item))
        ? "medium"
        : "low";
  const improvementPossible = matches.some((item) => item.label !== "价格问题");

  return {
    categories,
    topPainPoints,
    negativeKeywords,
    severity,
    frequency,
    returnRisk,
    improvementPossible,
  };
}

function summarizeIssueMatches(text: string) {
  const rules = [
    { label: "尺寸问题", regex: /尺寸|偏小|偏大|太小|太大|size|작아요|커요|길이|宽度|高度|不合适/i },
    { label: "材质问题", regex: /材质|面料|薄|厚|质感|material|소재|재질|냄새|手感/i },
    { label: "安装问题", regex: /安装|不好装|配件|说明书|install|조립|설치|步骤复杂/i },
    { label: "包装问题", regex: /包装|破损|压坏|漏件|box|포장|파손|变形/i },
    { label: "颜色问题", regex: /颜色|色差|不一致|color|컬러|색상/i },
    { label: "物流问题", regex: /物流|配送慢|延迟|发货慢|delivery|배송|到货慢/i },
    { label: "质量问题", regex: /质量|瑕疵|坏了|故障|不耐用|불량|고장|开裂|掉漆/i },
    { label: "价格问题", regex: /价格|不值|贵|性价比|price|가격/i },
    { label: "描述不符", regex: /描述不符|介绍不清|说明不清|与描述不同|설명|상세페이지|详情页不清/i },
    { label: "图文不符", regex: /图文不符|图片不符|实物不一样|photo|image|사진|和图片不一样/i },
    { label: "退货风险", regex: /退货|退款|换货|return|반품|교환/i },
  ];

  return rules
    .map((rule) => {
      const hits = text.match(new RegExp(rule.regex.source, "gi")) ?? [];
      return {
        label: rule.label,
        count: hits.length,
        evidence: extractEvidence(text, rule.regex),
      };
    })
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);
}

function extractEvidence(text: string, regex: RegExp) {
  const segments = text
    .split(/\r?\n|[。！？!?.]/)
    .map((item) => item.trim())
    .filter(Boolean);

  const matched = segments.find((segment) => regex.test(segment));
  if (!matched) return "";
  return matched.length > 28 ? `${matched.slice(0, 28)}...` : matched;
}

function extractNegativeKeywords(
  text: string,
  matches: Array<{ label: string; count: number; evidence: string }>,
) {
  const tokenMatches = text.match(/[\u4e00-\u9fa5A-Za-z]{2,}/g) ?? [];

  return Array.from(
    new Set([
      ...matches.map((item) => item.label),
      ...tokenMatches.filter((token) =>
        /尺寸|材质|安装|包装|颜色|物流|质量|价格|描述|图片|退货|退款|故障|瑕疵|배송|반품|고장/i.test(token),
      ),
    ]),
  ).slice(0, 12);
}

function buildPracticalSuggestionsFromCategories(categories: string[]) {
  const suggestionMap: Record<string, string> = {
    尺寸问题: "补充尺寸对照图、实物测量图和适配说明，减少买家对大小不符的误判。",
    材质问题: "把材质、厚度、触感和耐用性写清楚，避免用户对质感产生预期落差。",
    安装问题: "增加安装步骤图、配件说明和使用视频，降低安装门槛和理解成本。",
    包装问题: "优化包装保护和到货防损方案，重点减少运输中的破损、漏件和变形。",
    颜色问题: "补充自然光和实拍图，明确说明色差范围，降低颜色预期偏差。",
    物流问题: "重新确认发货时效、配送方式和重量体积，避免因物流体验引发差评。",
    质量问题: "优先回查供应链和抽检标准，再决定是否继续卖或先停样修正。",
    价格问题: "如果价格相关抱怨频繁，就要重新评估价格带和赠品、规格的价值感。",
    描述不符: "把详情页描述、参数和实际体验对齐，尤其要明确功能边界和使用场景。",
    图文不符: "补充真实场景图和细节图，不要让主图、详情页与实物存在明显落差。",
    退货风险: "优先处理导致退货的核心问题，再决定是否继续推广或转入测试修正。",
  };

  return categories.map((item) => suggestionMap[item]).filter(Boolean);
}

function buildRecommendationFromAnalysis(
  severity: "low" | "medium" | "high",
  improvementPossible: boolean,
  topPainPoints: string[],
  categories: string[],
) {
  const focus = topPainPoints[0] ?? categories[0] ?? "差评问题";

  if (severity === "high" && !improvementPossible) {
    return `${focus} 已经明显影响购买体验，先不要继续放量，优先回查供应链和产品本体问题。`;
  }

  if (severity === "high") {
    return `${focus} 属于高优先级问题，建议先做一轮产品或详情页修正，再决定是否继续推进。`;
  }

  if (improvementPossible && categories.length >= 2) {
    return `当前差评主要集中在 ${topPainPoints.slice(0, 2).join("、")}，有明确优化入口，适合进入改良测试。`;
  }

  return `当前差评风险可控，继续补样本观察 ${focus} 是否持续放大，再决定下一步动作。`;
}

function buildNextActionFromAnalysis(
  severity: "low" | "medium" | "high",
  improvementPossible: boolean,
  topPainPoints: string[],
  categories: string[],
) {
  const focus = topPainPoints[0] ?? categories[0] ?? "差评问题";

  if (severity === "high" && !improvementPossible) {
    return `先暂停继续推进，围绕“${focus}”补做供应链与产品问题排查。`;
  }

  if (severity === "high") {
    return `先用 3-5 条真实差评复核“${focus}”，再补充对应的产品修正方案。`;
  }

  if (improvementPossible && categories.includes("退货风险")) {
    return `先优先处理导致退货的“${focus}”，再决定是否转入商品测试库继续验证。`;
  }

  if (improvementPossible) {
    return `围绕“${focus}”整理 1 轮改良方案，并继续补充同类差评样本。`;
  }

  return `继续观察“${focus}”是否持续出现，再判断是否需要升级处理。`;
}

function deriveIssueCategories(text: string) {
  const rules = [
    { label: "尺寸问题", regex: /尺寸|偏小|偏大|size|작아요|커요/i },
    { label: "材质问题", regex: /材质|面料|薄|粗糙|material|재질/i },
    { label: "安装问题", regex: /安装|组装|难装|조립|설치/i },
    { label: "包装问题", regex: /包装|破损|盒子|箱|포장/i },
    { label: "颜色问题", regex: /颜色|色差|컬러|색상/i },
    { label: "物流问题", regex: /物流|配送|发货|배달|배송/i },
    { label: "质量问题", regex: /质量|瑕疵|坏|불량|고장/i },
    { label: "价格问题", regex: /价格|贵|性价比|가격/i },
    { label: "说明书问题", regex: /说明|描述|안내|설명/i },
    { label: "图文不符", regex: /图文|图片|实物不符|사진|상세페이지/i },
    { label: "退货风险", regex: /退货|反品|반품|return/i },
  ];

  return rules.filter((rule) => rule.regex.test(text)).map((rule) => rule.label);
}

function buildSuggestionsFromCategories(categories: string[]) {
  const suggestionMap: Record<string, string> = {
    尺寸问题: "补充尺寸对照图、实物测量图和适配说明。",
    材质问题: "升级材质说明，并把厚度、手感、耐用性写清楚。",
    安装问题: "重做安装引导，用分步骤图示降低理解门槛。",
    包装问题: "加强内外包装和防压保护，降低到货破损。",
    颜色问题: "统一主图、详情页和实拍色彩表达。",
    物流问题: "优化发货承诺与到货预期，减少配送落差。",
    质量问题: "优先回查供应链与抽检标准，再决定是否继续卖。",
    价格问题: "重做价格带定位，补充价值感和差异化卖点。",
    说明书问题: "补充说明书、FAQ 和售后引导。",
    图文不符: "重拍详情图，确保实拍与用户到手体验一致。",
    退货风险: "把高退货原因前置验证，必要时先做小批量测试。",
  };

  return categories.map((item) => suggestionMap[item]).filter(Boolean);
}

function buildRecommendation(
  severity: "low" | "medium" | "high",
  improvementPossible: boolean,
  categories: string[],
) {
  if (severity === "high" && !improvementPossible) return "当前差评严重且难以修复，不建议继续推进。";
  if (severity === "high") return "问题集中且影响购买，需要先作为产品修复项目处理。";
  if (improvementPossible && categories.length >= 2) return "差评集中且可改进，适合转成产品升级与差异化机会。";
  return "当前信号可继续观察，先补更多评论样本再决定。";
}

function buildNextAction(
  severity: "low" | "medium" | "high",
  improvementPossible: boolean,
  categories: string[],
) {
  if (severity === "high" && !improvementPossible) return "立即标记高风险并暂停推进，避免进入后续开发。";
  if (severity === "high") return "把高频差评拆成修复清单，先验证供应链能否解决。";
  if (improvementPossible && categories.includes("退货风险")) return "优先验证退货主因，确认是否需要调整产品结构或说明。";
  if (improvementPossible) return "整理 3 条最有价值改进点，转入机会池或产品测试方案。";
  return "继续补评论和竞品样本，观察差评是否持续集中。";
}

function normalizeIssueLabel(label: string) {
  const map: Record<string, string> = {
    "弱뷴???쥦": "尺寸问题",
    "?먫뇽??쥦": "材质问题",
    "若됭즳??쥦": "安装问题",
    "?낁즳??쥦": "包装问题",
    "窯쒑돯??쥦": "颜色问题",
    "?⒵탛??쥦": "物流问题",
    "兀③뇧??쥦": "质量问题",
    "餓룡졏??쥦": "价格问题",
    "瑥닸삇阿?뿮窯?": "说明书问题",
    "?㎫뎴訝띸Е??쥦": "图文不符",
  };
  return map[label] ?? label;
}

function sourceLabel(source: ReviewInsightRecord["source_type"], t: typeof ZH_COPY) {
  if (source === "testing_db") return t.common.sourceTestingDb;
  if (source === "opportunity_board") return t.common.sourceOpportunity;
  return t.common.sourceManual;
}

function statusLabel(status: ReviewInsightStatus, t: typeof ZH_COPY) {
  return t.statusLabels[status];
}

function levelLabel(level: "low" | "medium" | "high", t: typeof ZH_COPY) {
  return t.levelLabels[level];
}

function toneForLevel(level: "low" | "medium" | "high") {
  if (level === "high") return "danger" as const;
  if (level === "medium") return "warning" as const;
  return "success" as const;
}

function interpolate(template: string, params: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_match, key) => params[key] ?? "");
}

function InputField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm font-medium text-slate-700">
      <span>{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-slate-900/10"
      />
    </label>
  );
}

function SelectField({
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
    <label className="text-sm font-medium text-slate-700">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-slate-900/10"
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

function MetricBlock({
  label,
  value,
  selected,
}: {
  label: string;
  value: string;
  selected: boolean;
}) {
  return (
    <div>
      <p className={`text-xs font-medium ${selected ? "text-slate-400" : "text-slate-500"}`}>{label}</p>
      <p className={`mt-3 text-sm font-semibold ${selected ? "text-white" : "text-slate-950"}`}>{value}</p>
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

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-slate-950">{title}</h4>
      {children}
    </div>
  );
}

const ZH_COPY = {
  header: {
    eyebrow: "REVIEW INTELLIGENCE",
    title: "评论差评分析工作台",
    description: "把评论、差评、痛点分类、改进建议和业务动作放到一个真正可运营的页面里，不再只是通用 AI 分析入口。",
  },
  hero: {
    badge: "长期运营型差评洞察中心",
    title: "用真实差评去发现可修复问题、退货风险和产品升级机会",
    description:
      "你可以从商品测试库、机会池或手动评论样本直接沉淀差评洞察，再判断哪些问题要回写测试库，哪些值得推进成机会池或产品升级任务。",
    syncTestingDb: "同步商品测试库",
    syncOpportunity: "同步机会池",
    export: "导出洞察",
    focusCards: [
      { title: "看高频痛点", note: "先抓尺寸、材质、安装、包装、颜色、退货这些重复出现的问题。" },
      { title: "看是否可修复", note: "不是所有差评都值得做，重点看能不能通过产品或内容解决。" },
      { title: "看评分与退货风险", note: "差评如果会直接拖低评分或引发退货，就要优先处理。" },
      { title: "看业务去向", note: "洞察最终要么回写测试库，要么沉淀成机会池和产品升级动作。" },
    ],
  },
  metrics: {
    totalSamples: { label: "评论样本总量", note: "当前洞察中累计纳入的评论数量。" },
    highSeverity: { label: "高严重度问题", note: "问题集中且影响购买决策的洞察数量。" },
    improvable: { label: "可改进洞察", note: "适合继续做产品修复或差异化升级的记录。" },
    returnRisk: { label: "高退货风险", note: "存在明显退货或到手落差风险的商品。" },
    ratingImpact: { label: "高评分冲击", note: "差评已足以拖低星级或拉低购买信任。" },
    testingDb: { label: "回写测试库", note: "适合反馈到商品测试数据库继续跟进。" },
    opportunity: { label: "可转机会池", note: "适合直接转成产品机会或升级动作的数量。" },
    ready: { label: "待处理洞察", note: "已经整理完成，可以进入下一步动作的记录。" },
  },
  importPanel: {
    title: "导入评论与差评样本",
    description: "支持项目内已有业务数据同步，也支持你直接粘贴评论文本或上传 CSV / Excel。",
    importPaste: "分析粘贴评论",
    importFile: "上传评论文件",
    placeholder: "每行一条评论，建议优先贴低星评论、退货相关评论、安装问题、尺寸问题等真实样本。",
    fields: {
      productNameKo: "商品韩文名",
      productNameZh: "商品中文名",
      coupangUrl: "Coupang 链接",
      category: "类目",
      brand: "品牌",
      rating: "评分",
      pastedReviews: "评论 / 差评文本",
    },
  },
  filterPanel: {
    title: "筛选洞察",
    description: "按状态、严重度、来源和是否可改进快速定位今天该处理的评论问题。",
    searchPlaceholder: "搜索商品名、品牌、类目、痛点关键词",
    status: "状态",
    severity: "严重度",
    source: "来源",
    improvement: "可改进性",
  },
  list: {
    title: "差评洞察列表",
    description: "当前显示 {count} / {total} 条洞察",
    severity: "严重度",
    returnRisk: "退货风险",
    status: "状态",
    empty: "当前还没有洞察记录，先同步测试库或粘贴评论样本。",
  },
  detail: {
    eyebrow: "Insight Detail",
    empty: "从左侧选择一条洞察，查看痛点、严重度、建议和业务动作。",
    reviewCountUnit: "条评论",
    severity: "严重度",
    frequency: "频次",
    returnRisk: "退货风险",
    improvement: "可改进性",
    topPainPoints: "Top 痛点",
    categories: "痛点分类",
    suggestions: "改进建议",
    recommendation: "最终建议",
    nextAction: "下一步动作",
    samples: "差评样本",
  },
  messages: {
    syncedTestingDb: "已从商品测试库同步 {count} 条评论洞察。",
    syncedOpportunity: "已从机会池同步 {count} 条评论洞察。",
    emptyPaste: "请先粘贴评论文本。",
    pasteImported: "粘贴评论已分析并沉淀为洞察。",
    fileImported: "评论文件已导入并完成分析。",
    importFailed: "导入失败，请检查文件内容或格式。",
    exported: "评论差评洞察已导出。",
  },
  levelLabels: {
    low: "低",
    medium: "中",
    high: "高",
  },
  statusLabels: {
    new: "新导入",
    analyzing: "分析中",
    ready: "可处理",
    sync_testing_db: "回写测试库",
    sync_opportunity: "转机会池",
    observe: "继续观察",
    dropped: "淘汰",
  },
  common: {
    yes: "是",
    no: "否",
    noBrand: "无品牌",
    noIssue: "待补痛点",
    sourceTestingDb: "商品测试库",
    sourceOpportunity: "机会池",
    sourceManual: "手动导入",
  },
};

const KO_COPY: typeof ZH_COPY = {
  ...ZH_COPY,
  header: {
    eyebrow: "REVIEW INTELLIGENCE",
    title: "리뷰 / 부정 리뷰 분석 워크벤치",
    description: "리뷰, 부정 리뷰, 문제 분류, 개선 제안, 비즈니스 액션을 하나의 실제 운영 화면으로 정리했습니다.",
  },
  hero: {
    badge: "장기 운영형 리뷰 인사이트 센터",
    title: "실제 부정 리뷰로부터 수정 가능한 문제와 제품 업그레이드 기회를 찾습니다",
    description:
      "상품 테스트 DB, 기회보드, 수동 리뷰 샘플에서 바로 인사이트를 만들고 어떤 문제를 테스트 DB로 되돌릴지, 어떤 문제를 기회보드나 업그레이드 작업으로 넘길지 판단할 수 있습니다.",
    syncTestingDb: "상품 테스트DB 동기화",
    syncOpportunity: "기회보드 동기화",
    export: "인사이트 내보내기",
    focusCards: [
      { title: "반복 문제 우선", note: "사이즈, 재질, 설치, 포장, 색상, 반품 관련 반복 문제를 먼저 봅니다." },
      { title: "수정 가능성 판단", note: "모든 부정 리뷰를 고칠 필요는 없고, 제품이나 콘텐츠로 개선 가능한지 봅니다." },
      { title: "평점 / 반품 리스크", note: "평점 하락이나 반품으로 직결되는 문제는 우선 처리합니다." },
      { title: "비즈니스 연결", note: "인사이트는 결국 테스트DB 반영 또는 기회보드 / 업그레이드 액션으로 이어져야 합니다." },
    ],
  },
  metrics: {
    totalSamples: { label: "리뷰 샘플 총량", note: "현재 인사이트에 반영된 리뷰 수입니다." },
    highSeverity: { label: "고심각도 이슈", note: "구매 결정에 직접 영향을 주는 집중 이슈 수입니다." },
    improvable: { label: "개선 가능 인사이트", note: "제품 수정 또는 차별화 업그레이드로 연결 가능한 기록입니다." },
    returnRisk: { label: "고반품 리스크", note: "반품이나 실물 괴리 위험이 높은 상품입니다." },
    ratingImpact: { label: "평점 영향 큼", note: "부정 리뷰가 평점과 구매 신뢰를 낮출 수 있는 경우입니다." },
    testingDb: { label: "테스트DB 반영", note: "상품 테스트 DB로 되돌려 계속 추적할 가치가 있습니다." },
    opportunity: { label: "기회보드 전환 가능", note: "기회보드나 제품 업그레이드 액션으로 넘길 수 있습니다." },
    ready: { label: "처리 대기 인사이트", note: "정리 완료 후 다음 액션으로 바로 넘길 수 있는 상태입니다." },
  },
  importPanel: {
    title: "리뷰 및 부정 리뷰 샘플 가져오기",
    description: "프로젝트 내 기존 데이터 동기화와 직접 붙여넣기 / CSV / Excel 업로드를 모두 지원합니다.",
    importPaste: "붙여넣기 리뷰 분석",
    importFile: "리뷰 파일 업로드",
    placeholder: "한 줄에 리뷰 1개씩 붙여넣으세요. 저평점 리뷰, 반품 리뷰, 설치 문제, 사이즈 문제 샘플을 우선 권장합니다.",
    fields: {
      productNameKo: "상품명 (KO)",
      productNameZh: "상품명 (ZH)",
      coupangUrl: "Coupang 링크",
      category: "카테고리",
      brand: "브랜드",
      rating: "평점",
      pastedReviews: "리뷰 / 부정 리뷰 텍스트",
    },
  },
  filterPanel: {
    title: "인사이트 필터",
    description: "상태, 심각도, 출처, 개선 가능성 기준으로 오늘 처리할 리뷰 문제를 빠르게 찾습니다.",
    searchPlaceholder: "상품명, 브랜드, 카테고리, 문제 키워드 검색",
    status: "상태",
    severity: "심각도",
    source: "출처",
    improvement: "개선 가능성",
  },
  list: {
    title: "부정 리뷰 인사이트 목록",
    description: "현재 {count} / {total}개 인사이트 표시 중",
    severity: "심각도",
    returnRisk: "반품 리스크",
    status: "상태",
    empty: "아직 인사이트가 없습니다. 테스트DB를 동기화하거나 리뷰 샘플을 붙여넣어 주세요.",
  },
  detail: {
    eyebrow: "Insight Detail",
    empty: "왼쪽에서 인사이트를 선택하면 문제점, 심각도, 제안, 액션을 볼 수 있습니다.",
    reviewCountUnit: "개 리뷰",
    severity: "심각도",
    frequency: "빈도",
    returnRisk: "반품 리스크",
    improvement: "개선 가능성",
    topPainPoints: "핵심 문제",
    categories: "문제 분류",
    suggestions: "개선 제안",
    recommendation: "최종 제안",
    nextAction: "다음 액션",
    samples: "부정 리뷰 샘플",
  },
  messages: {
    syncedTestingDb: "상품 테스트DB에서 {count}개 리뷰 인사이트를 가져왔습니다.",
    syncedOpportunity: "기회보드에서 {count}개 리뷰 인사이트를 가져왔습니다.",
    emptyPaste: "먼저 리뷰 텍스트를 붙여넣어 주세요.",
    pasteImported: "붙여넣기 리뷰를 분석해 인사이트로 저장했습니다.",
    fileImported: "리뷰 파일을 가져와 분석을 마쳤습니다.",
    importFailed: "가져오기에 실패했습니다. 파일 형식이나 내용을 확인해 주세요.",
    exported: "리뷰 인사이트를 내보냈습니다.",
  },
  levelLabels: {
    low: "낮음",
    medium: "중간",
    high: "높음",
  },
  statusLabels: {
    new: "신규",
    analyzing: "분석 중",
    ready: "처리 가능",
    sync_testing_db: "테스트DB 반영",
    sync_opportunity: "기회보드 전환",
    observe: "계속 관찰",
    dropped: "제외",
  },
  common: {
    yes: "예",
    no: "아니오",
    noBrand: "브랜드 없음",
    noIssue: "문제 보강 필요",
    sourceTestingDb: "상품 테스트DB",
    sourceOpportunity: "기회보드",
    sourceManual: "수동 가져오기",
  },
};

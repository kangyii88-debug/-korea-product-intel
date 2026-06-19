"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRightLeft,
  CircleAlert,
  ExternalLink,
  Factory,
  FolderSync,
  PackagePlus,
  PackageSearch,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Truck,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useLocale } from "@/components/locale-provider";
import {
  buildHotProductFromSampleRow,
  loadLocalHotProductIntelligence,
  replaceLocalHotProductIntelligence,
  updateHotProductItem,
  type HotProductIntelligenceItem,
} from "@/lib/hot-product-intelligence-local";
import {
  loadLocalCompetitorLibrary,
  mergeCompetitorLibraryItems,
  replaceLocalCompetitorLibrary,
  type CompetitorLibraryItem,
} from "@/lib/competitor-library-local";
import {
  analyzeProduct,
  buildProductFromForm,
  loadLocalProducts,
  upsertLocalProduct,
  type LocalProduct,
} from "@/lib/local-products";
import { createLocalProductOpportunity, loadLocalProductOpportunities } from "@/lib/product-opportunities-local";
import type { ProductOpportunityRecord } from "@/lib/product-opportunities";
import {
  buildProfitCalculationFromLocalProduct,
  buildProfitCalculationFromOpportunity,
  loadLocalProfitCalculations,
  type ProductProfitCalculationRecord,
} from "@/lib/product-profit-local";
import {
  buildRiskAssessmentFromLocalProduct,
  buildRiskAssessmentFromOpportunity,
  loadLocalRiskAssessments,
  type ProductRiskAssessmentRecord,
} from "@/lib/product-risk-local";
import { loadLocalReviewInsights, type ReviewInsightRecord } from "@/lib/review-insights-local";
import { formatNumber } from "@/lib/utils";
import hotProductsSeed from "@/data/coupang_hot_products_50.json";

type SampleRow = Record<string, unknown>;

type DecisionMetricKey =
  | "pending"
  | "continue"
  | "small_test"
  | "rocket_growth"
  | "pb_supply"
  | "own_brand"
  | "high_risk"
  | "abandon";

type FinalDecision = "pending" | "continue" | "small_test" | "pause" | "abandon";
type RecommendedDirection = "rocket_growth" | "pb_supply" | "own_brand" | "general_test" | "pause" | "abandon";
type MarketHeat = "high" | "medium" | "low" | "unknown";
type ProfitLevel = "high" | "medium" | "low" | "missing";
type RiskLevel = "high" | "medium" | "low" | "missing";
type SupplyChainStatus = "not_started" | "sourcing" | "quoted" | "sampled" | "confirmed" | "paused";
type CurrentAction =
  | "find_supplier"
  | "calculate_profit"
  | "review_bad_reviews"
  | "apply_sample"
  | "prepare_rg"
  | "prepare_pb"
  | "observe"
  | "abandon";
type DataSource = "hot" | "competitor" | "testing" | "opportunity" | "manual";
type PainPointTag =
  | "size"
  | "quality"
  | "install"
  | "adhesive"
  | "material"
  | "smell"
  | "color"
  | "package"
  | "delivery"
  | "image"
  | "usability"
  | "value"
  | "return";

type DecisionRecord = {
  id: string;
  key: string;
  hotItemId?: string;
  titleKo: string;
  titleZh: string;
  imageUrl: string;
  coupangUrl: string;
  brand: string;
  category: string;
  source: DataSource;
  sourceLabel: string;
  monthlyPurchaseBadge: string;
  monthlyPurchaseLevel: string;
  monthlyPurchaseBucket: "unknown" | "1000" | "3000" | "5000" | "10000";
  currentPrice: number;
  rating: number;
  reviewCount: number;
  marketHeat: MarketHeat;
  coreSellingPoints: string[];
  badReviewSamples: string[];
  painPoints: string[];
  painPointTags: PainPointTag[];
  improvementPoints: string[];
  profitLevel: ProfitLevel;
  estimatedMarginRate: number | null;
  riskLevel: RiskLevel;
  certificationRisk: RiskLevel;
  logisticsRisk: RiskLevel;
  returnRisk: RiskLevel;
  recommendedDirection: RecommendedDirection;
  finalDecision: FinalDecision;
  decisionReason: string;
  nextAction: CurrentAction;
  nextActionDetail: string;
  owner: string;
  supplierName: string;
  supplierQuoteCount: number;
  supplyChainStatus: SupplyChainStatus;
  notes: string;
  keywords: string[];
  dataCompleteness: number;
  missingFields: string[];
  topOpportunity: string;
  topRisk: string;
  inCompetitorLibrary: boolean;
  inTestingDb: boolean;
  inOpportunityPool: boolean;
  linkedCompetitor?: CompetitorLibraryItem;
  linkedTesting?: LocalProduct;
  linkedOpportunity?: ProductOpportunityRecord;
  linkedProfit?: ProductProfitCalculationRecord;
  linkedRisk?: ProductRiskAssessmentRecord;
  linkedReview?: ReviewInsightRecord;
};

type Filters = {
  query: string;
  finalDecision: "all" | FinalDecision;
  recommendedDirection: "all" | RecommendedDirection;
  source: "all" | DataSource;
  monthlyPurchase: "all" | "1000" | "3000" | "5000" | "10000" | "unknown";
  marketHeat: "all" | MarketHeat;
  profitLevel: "all" | ProfitLevel;
  riskLevel: "all" | RiskLevel;
  painPoint: "all" | PainPointTag;
  supplyChainStatus: "all" | SupplyChainStatus;
  currentAction: "all" | CurrentAction;
};

const DEFAULT_HOT_ITEMS = (hotProductsSeed as SampleRow[]).map(buildHotProductFromSampleRow);

const PAGE_SIZE = 6;

const DEFAULT_FILTERS: Filters = {
  query: "",
  finalDecision: "all",
  recommendedDirection: "all",
  source: "all",
  monthlyPurchase: "all",
  marketHeat: "all",
  profitLevel: "all",
  riskLevel: "all",
  painPoint: "all",
  supplyChainStatus: "all",
  currentAction: "all",
};

export function HotProductsIntelligenceWorkbench() {
  const { locale } = useLocale();
  const t = locale === "ko" ? KO_COPY : ZH_COPY;
  const [hotItems, setHotItems] = useState<HotProductIntelligenceItem[]>(DEFAULT_HOT_ITEMS);
  const [selectedId, setSelectedId] = useState<string | null>(DEFAULT_HOT_ITEMS[0]?.id ?? null);
  const [banner, setBanner] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [metricFocus, setMetricFocus] = useState<DecisionMetricKey | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  useEffect(() => {
    const loaded = loadLocalHotProductIntelligence();
    if (loaded.length) {
      setHotItems(loaded);
      setSelectedId(loaded[0]?.id ?? null);
    }
  }, []);

  useEffect(() => {
    if (hotItems.length > 0) return;
    void seed();
  }, [hotItems.length]);

  async function seed() {
    const mapped = DEFAULT_HOT_ITEMS;
    setHotItems(mapped);
    setSelectedId(mapped[0]?.id ?? null);
    setBanner(t.messages.seeded);
    try {
      replaceLocalHotProductIntelligence(mapped);
    } catch {
      // Some embedded browsers disable localStorage; keep the in-memory dataset usable.
    }
  }

  function persistHot(next: HotProductIntelligenceItem[], message?: string) {
    setHotItems(next);
    try {
      replaceLocalHotProductIntelligence(next);
    } catch {
      // Fall back to in-memory state when persistent browser storage is unavailable.
    }
    if (message) setBanner(message);
  }

  function refreshFromBundle() {
    void seed();
  }

  const competitorItems = useMemo(() => loadLocalCompetitorLibrary(), [hotItems]);
  const testingItems = useMemo(() => loadLocalProducts(), [hotItems]);
  const opportunityItems = useMemo(() => loadLocalProductOpportunities(), [hotItems]);
  const profitRecords = useMemo(() => {
    const saved = loadLocalProfitCalculations();
    const fallbackTesting = testingItems.map(buildProfitCalculationFromLocalProduct);
    const fallbackOpportunity = opportunityItems.map(buildProfitCalculationFromOpportunity);
    return mergeByKey(saved, [...fallbackTesting, ...fallbackOpportunity], (item) => recordKey(item.coupang_url, item.product_name_ko, item.brand));
  }, [hotItems, opportunityItems, testingItems]);
  const riskRecords = useMemo(() => {
    const saved = loadLocalRiskAssessments();
    const fallbackTesting = testingItems.map(buildRiskAssessmentFromLocalProduct);
    const fallbackOpportunity = opportunityItems.map(buildRiskAssessmentFromOpportunity);
    return mergeByKey(saved, [...fallbackTesting, ...fallbackOpportunity], (item) => recordKey(item.coupang_url, item.product_name_ko, item.brand));
  }, [hotItems, opportunityItems, testingItems]);
  const reviewRecords = useMemo(() => loadLocalReviewInsights(), [hotItems]);

  const records = useMemo(
    () =>
      buildDecisionRecords({
        hotItems,
        competitorItems,
        testingItems,
        opportunityItems,
        profitRecords,
        riskRecords,
        reviewRecords,
        locale,
      }),
    [competitorItems, hotItems, locale, opportunityItems, profitRecords, reviewRecords, riskRecords, testingItems],
  );

  const metrics = useMemo(() => buildDecisionMetrics(records, t), [records, t]);
  const filtered = useMemo(() => applyFilters(records, filters, metricFocus), [filters, metricFocus, records]);
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
  }, [filters, metricFocus]);

  useEffect(() => {
    if (!filtered.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !pagedItems.some((item) => item.id === selectedId)) {
      setSelectedId(pagedItems[0]?.id ?? filtered[0].id);
    }
  }, [filtered, pagedItems, selectedId]);

  const selected = filtered.find((item) => item.id === selectedId) ?? records.find((item) => item.id === selectedId) ?? null;
  const groupedDecisions = useMemo(() => groupDecisionBoard(records, t), [records, t]);
  const missingSummary = useMemo(() => buildMissingSummary(records, t), [records, t]);
  const actionSummary = useMemo(() => buildActionSummary(records, t), [records, t]);

  function transferToCompetitor(record: DecisionRecord) {
    try {
      const current = loadLocalCompetitorLibrary();
      const nextLibrary = mergeCompetitorLibraryItems(current, [mapDecisionToCompetitor(record)]);
      replaceLocalCompetitorLibrary(nextLibrary);
    } catch {
      // Keep current page interactions responsive even when browser storage is unavailable.
    }

    if (record.hotItemId) {
      persistHot(
        updateHotProductItem(hotItems, record.hotItemId, (item) => ({
          ...item,
          imported_to_competitor_library: true,
          action_status: "transferred_competitor",
        })),
        t.messages.toCompetitor,
      );
    } else {
      setBanner(t.messages.toCompetitor);
    }
  }

  function transferToTesting(record: DecisionRecord) {
    try {
      upsertLocalProduct(
        buildProductFromForm({
          productNameKo: record.titleKo,
          productNameZh: record.titleZh,
          brand: record.brand,
          category: record.category,
          competitorUrl: record.coupangUrl,
          image: record.imageUrl,
          competitorSalePriceKrw: String(record.currentPrice || 0),
          price: String(record.currentPrice || 0),
          discountPrice: String(record.currentPrice || 0),
          reviewCount: String(record.reviewCount || 0),
          rating: String(record.rating || 0),
          marketAnalysis: record.decisionReason,
          reviewSummary: record.badReviewSamples.join(" / "),
          consumerPainPoints: record.painPoints.join(" / "),
          productDevelopmentDirection: record.improvementPoints.join(" / "),
          recommendationReason: directionLabel(record.recommendedDirection, t),
          sampleDevelopmentAdvice: record.nextActionDetail,
          notes: record.notes,
        }),
      );
    } catch {
      // Keep current page interactions responsive even when browser storage is unavailable.
    }

    if (record.hotItemId) {
      persistHot(
        updateHotProductItem(hotItems, record.hotItemId, (item) => ({
          ...item,
          imported_to_product_test: true,
          action_status: "transferred_testing",
        })),
        t.messages.toTesting,
      );
    } else {
      setBanner(t.messages.toTesting);
    }
  }

  function transferToOpportunity(record: DecisionRecord) {
    try {
      createLocalProductOpportunity({
        title: record.titleZh || record.titleKo,
        sku: "",
        keyword: record.keywords.join(", "),
        category: mapOpportunityCategory(record.category),
        business_type: mapBusinessType(record.recommendedDirection),
        coupang_url: record.coupangUrl,
        image_url: record.imageUrl,
        price: record.currentPrice,
        review_count: record.reviewCount,
        rating: record.rating,
        competitor_count: record.linkedOpportunity?.competitor_count ?? inferCompetitorCount(record),
        estimated_purchase_cost: inferEstimatedPurchaseCost(record),
        estimated_shipping_cost: 3800,
        estimated_local_delivery_cost: 3200,
        platform_fee_rate: 11.9,
        estimated_ad_cost: 600,
        estimated_sale_price: record.currentPrice,
        market_heat: mapOpportunityLevel(record.marketHeat),
        competition_level: mapOpportunityLevel(record.linkedCompetitor?.competition_level ?? inferCompetitionLevel(record)),
        kc_risk: mapOpportunityLevel(record.certificationRisk),
        volume_weight_risk: mapOpportunityLevel(record.logisticsRisk),
        return_risk: mapOpportunityLevel(record.returnRisk),
        negative_review_risk: mapOpportunityLevel(record.riskLevel),
        price_war_risk: mapOpportunityLevel(record.linkedCompetitor?.competition_level ?? inferCompetitionLevel(record)),
        supply_chain_risk: record.supplyChainStatus === "confirmed" ? "low" : record.supplyChainStatus === "paused" ? "high" : "medium",
        notes: [record.decisionReason, record.notes].filter(Boolean).join("\n"),
        status: mapOpportunityStatus(record.finalDecision),
        next_action: mapOpportunityAction(record.nextAction),
        demand_stability: record.monthlyPurchaseBadge,
        seasonality: "",
        long_term_fit: record.recommendedDirection === "own_brand" || record.recommendedDirection === "pb_supply",
        short_term_test_fit: record.finalDecision === "small_test" || record.finalDecision === "continue",
        competitor_price_range: record.linkedProfit?.price_range ?? "",
        top_seller_count: inferTopSellerCount(record),
        review_issue_summary: record.painPoints.join(" / "),
        negative_review_keywords: record.badReviewSamples.join(", "),
        improvement_points: record.improvementPoints.join(" / "),
      });
    } catch {
      // Keep current page interactions responsive even when browser storage is unavailable.
    }

    if (record.hotItemId) {
      persistHot(
        updateHotProductItem(hotItems, record.hotItemId, (item) => ({
          ...item,
          imported_to_opportunity_pool: true,
          action_status: "transferred_opportunity",
        })),
        t.messages.toOpportunity,
      );
    } else {
      setBanner(t.messages.toOpportunity);
    }
  }

  function markIgnored(record: DecisionRecord) {
    if (!record.hotItemId) {
      setBanner(t.messages.ignored);
      return;
    }
    persistHot(
      updateHotProductItem(hotItems, record.hotItemId, (item) => ({
        ...item,
        action_status: "ignored",
        exclude_reason: item.exclude_reason || t.messages.ignoredReason,
      })),
      t.messages.ignored,
    );
  }

  return (
    <>
      <PageHeader eyebrow={t.header.eyebrow} title={t.header.title} description={t.header.description} />
      <div className="flex w-full flex-col gap-6 px-5 py-8 sm:px-8 lg:px-10 2xl:px-12">
        <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_46%,#eef5ff_100%)]">
          <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.95fr)] lg:px-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/90 px-3 py-1 text-xs font-semibold text-orange-700">
                <Target className="h-3.5 w-3.5" />
                {t.hero.badge}
              </div>
              <h2 className="mt-4 text-[28px] font-semibold tracking-[-0.04em] text-slate-950">{t.hero.title}</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{t.hero.description}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button onClick={refreshFromBundle}>
                  <FolderSync className="h-4 w-4" />
                  {t.hero.refresh}
                </Button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {t.hero.cards.map((card) => (
                <div key={card.title} className="rounded-[18px] border border-slate-200 bg-white/90 p-4">
                  <p className="text-sm font-semibold text-slate-950">{card.title}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{card.note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {banner ? <Banner message={banner} /> : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <button
              key={metric.key}
              type="button"
              onClick={() => setMetricFocus((current) => (current === metric.key ? null : metric.key))}
              className="text-left"
            >
              <StatCard
                label={metric.label}
                value={metric.value}
                note={metric.note}
                tone={metricFocus === metric.key ? metric.tone : undefined}
                icon={metric.icon}
              />
            </button>
          ))}
        </section>

        <SectionCard title={t.filters.title} description={t.filters.description}>
          <div className="flex flex-col gap-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-12">
              <div className="xl:col-span-4">
                <FilterInput
                  label={t.filters.search}
                  value={filters.query}
                  onChange={(value) => setFilters((current) => ({ ...current, query: value }))}
                />
              </div>
              <div className="xl:col-span-2">
              <FilterSelect
                label={t.filters.finalDecision}
                value={filters.finalDecision}
                onChange={(value) => setFilters((current) => ({ ...current, finalDecision: value as Filters["finalDecision"] }))}
                options={decisionOptions(t)}
              />
              </div>
              <div className="xl:col-span-2">
              <FilterSelect
                label={t.filters.direction}
                value={filters.recommendedDirection}
                onChange={(value) => setFilters((current) => ({ ...current, recommendedDirection: value as Filters["recommendedDirection"] }))}
                options={directionOptions(t)}
              />
              </div>
              <div className="xl:col-span-2">
              <FilterSelect
                label={t.filters.source}
                value={filters.source}
                onChange={(value) => setFilters((current) => ({ ...current, source: value as Filters["source"] }))}
                options={sourceOptions(t)}
              />
              </div>
              <div className="xl:col-span-2">
              <FilterSelect
                label={t.filters.monthlyPurchase}
                value={filters.monthlyPurchase}
                onChange={(value) => setFilters((current) => ({ ...current, monthlyPurchase: value as Filters["monthlyPurchase"] }))}
                options={monthlyOptions(t)}
              />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-12">
              <div className="xl:col-span-2">
              <FilterSelect
                label={t.filters.marketHeat}
                value={filters.marketHeat}
                onChange={(value) => setFilters((current) => ({ ...current, marketHeat: value as Filters["marketHeat"] }))}
                options={heatOptions(t)}
              />
              </div>
              <div className="xl:col-span-2">
              <FilterSelect
                label={t.filters.profit}
                value={filters.profitLevel}
                onChange={(value) => setFilters((current) => ({ ...current, profitLevel: value as Filters["profitLevel"] }))}
                options={profitOptions(t)}
              />
              </div>
              <div className="xl:col-span-2">
              <FilterSelect
                label={t.filters.risk}
                value={filters.riskLevel}
                onChange={(value) => setFilters((current) => ({ ...current, riskLevel: value as Filters["riskLevel"] }))}
                options={riskOptions(t)}
              />
              </div>
              <div className="xl:col-span-2">
              <FilterSelect
                label={t.filters.painPoint}
                value={filters.painPoint}
                onChange={(value) => setFilters((current) => ({ ...current, painPoint: value as Filters["painPoint"] }))}
                options={painPointOptions(t)}
              />
              </div>
              <div className="xl:col-span-2">
              <FilterSelect
                label={t.filters.supply}
                value={filters.supplyChainStatus}
                onChange={(value) => setFilters((current) => ({ ...current, supplyChainStatus: value as Filters["supplyChainStatus"] }))}
                options={supplyOptions(t)}
              />
              </div>
              <div className="xl:col-span-2">
              <FilterSelect
                label={t.filters.action}
                value={filters.currentAction}
                onChange={(value) => setFilters((current) => ({ ...current, currentAction: value as Filters["currentAction"] }))}
                options={actionOptions(t)}
              />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => { setFilters(DEFAULT_FILTERS); setMetricFocus(null); }}>
                {t.filters.clear}
              </Button>
              {metricFocus ? <StatusBadge tone="warning">{metricLabel(metricFocus, t)}</StatusBadge> : null}
            </div>
          </div>
        </SectionCard>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px] xl:items-start">
          <SectionCard title={t.list.title} description={t.list.description} className="min-w-0 overflow-hidden">
            <div className="flex min-h-[780px] flex-col">
              <div className="flex-1 space-y-3 overflow-hidden">
                {pagedItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`grid w-full min-w-0 gap-4 rounded-[18px] border p-5 text-left transition-all xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.95fr)] ${
                      item.id === selectedId
                        ? "border-sky-200 bg-[linear-gradient(135deg,#fffdf7_0%,#f6f9ff_55%,#eef6ff_100%)] shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
                        : "border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-white"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-start gap-4">
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                          {item.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.imageUrl} alt={item.titleZh || item.titleKo} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">{t.common.noImage}</div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-base font-semibold tracking-[-0.02em] text-slate-950">
                            {locale === "ko" ? item.titleKo : item.titleZh || item.titleKo}
                          </p>
                          <p className="mt-1 truncate text-sm text-slate-500">
                            {(locale === "ko" ? item.titleZh : item.titleKo) || t.common.none}
                          </p>
                          <p className="mt-2 text-sm text-slate-500">
                            {item.brand || t.common.noBrand} · {item.category} · {item.sourceLabel}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <StatusBadge tone={directionTone(item.recommendedDirection)}>{directionLabel(item.recommendedDirection, t)}</StatusBadge>
                            <StatusBadge tone={decisionTone(item.finalDecision)}>{decisionLabel(item.finalDecision, t)}</StatusBadge>
                            <StatusBadge tone={riskTone(item.riskLevel)}>{riskLabel(item.riskLevel, t)}</StatusBadge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <ListMetricBlock label={t.list.market}>
                        <p>{purchaseBucketLabel(item.monthlyPurchaseBucket, t)}</p>
                        <p>{item.currentPrice ? `${formatNumber(item.currentPrice)} KRW` : t.common.noData}</p>
                        <p>{`${item.rating || 0} / ${formatNumber(item.reviewCount)}`}</p>
                        <p>{marketHeatLabel(item.marketHeat, t)}</p>
                      </ListMetricBlock>

                      <ListMetricBlock label={t.list.competitor}>
                        <p>{item.coreSellingPoints[0] || t.common.noData}</p>
                        <p>{item.painPoints[0] || t.common.noData}</p>
                        <p>{item.improvementPoints[0] || t.common.noData}</p>
                      </ListMetricBlock>

                      <ListMetricBlock label={t.list.profitRisk}>
                        <p>{profitLabel(item.profitLevel, t)}</p>
                        <p>{riskLabel(item.riskLevel, t)}</p>
                        <p>{`${t.detail.certification}: ${riskLabel(item.certificationRisk, t)}`}</p>
                        <p>{`${t.detail.logistics}: ${riskLabel(item.logisticsRisk, t)}`}</p>
                      </ListMetricBlock>

                      <ListMetricBlock label={t.list.action}>
                        <p>{supplyLabel(item.supplyChainStatus, t)}</p>
                        <p>{actionLabel(item.nextAction, t)}</p>
                        <p>{item.nextActionDetail || t.common.noData}</p>
                      </ListMetricBlock>
                    </div>
                  </button>
                ))}
                {!filtered.length ? <EmptyPanel message={t.list.empty} /> : null}
              </div>

              {filtered.length > 0 ? (
                <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">{locale === "ko" ? `${page} / ${totalPages} 페이지` : `第 ${page} / ${totalPages} 页`}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                      {locale === "ko" ? "이전 페이지" : "上一页"}
                    </Button>
                    <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
                      {locale === "ko" ? "下一页".replace("下一页", "다음 페이지") : "下一页"}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </SectionCard>

          <Card className="sticky top-6 min-h-[780px] overflow-hidden">
            <CardHeader className="space-y-4">
              {selected ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{t.detail.eyebrow}</p>
                      <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-950">
                        {locale === "ko" ? selected.titleKo : selected.titleZh || selected.titleKo}
                      </h3>
                      <p className="mt-2 text-sm text-slate-500">
                        {selected.brand || t.common.noBrand} · {selected.category} · {selected.sourceLabel}
                      </p>
                    </div>
                    {selected.coupangUrl ? (
                      <a href={selected.coupangUrl} target="_blank" rel="noreferrer">
                        <Button variant="outline">
                          {t.detail.open}
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <MiniStat label={t.detail.monthly} value={purchaseBucketLabel(selected.monthlyPurchaseBucket, t)} />
                    <MiniStat label={t.detail.heat} value={marketHeatLabel(selected.marketHeat, t)} />
                    <MiniStat label={t.detail.profit} value={profitLabel(selected.profitLevel, t)} />
                    <MiniStat label={t.detail.risk} value={riskLabel(selected.riskLevel, t)} />
                  </div>
                </>
              ) : (
                <div className="text-sm text-slate-500">{t.detail.empty}</div>
              )}
            </CardHeader>

            {selected ? (
              <CardContent className="space-y-6">
                <DetailSection title={t.detail.basic}>
                  <KeyValue label={t.detail.nameKo} value={selected.titleKo} />
                  <KeyValue label={t.detail.nameZh} value={selected.titleZh || t.common.none} />
                  <KeyValue label={t.detail.keyword} value={selected.keywords.slice(0, 6).join(" / ") || t.common.none} />
                  <KeyValue label={t.detail.note} value={selected.notes || t.common.none} />
                </DetailSection>

                <DetailSection title={t.detail.marketData}>
                  <KeyValue label={t.detail.price} value={selected.currentPrice ? `${formatNumber(selected.currentPrice)} KRW` : t.common.noData} />
                  <KeyValue label={t.detail.reviewScore} value={`${selected.rating || 0} / ${formatNumber(selected.reviewCount)}`} />
                  <KeyValue label={t.detail.marketHeat} value={marketHeatLabel(selected.marketHeat, t)} />
                  <KeyValue label={t.detail.monthly} value={selected.monthlyPurchaseBadge || purchaseBucketLabel(selected.monthlyPurchaseBucket, t)} />
                </DetailSection>

                <DetailSection title={t.detail.competitorJudgement}>
                  <SimpleList items={selected.coreSellingPoints.slice(0, 2)} empty={t.common.noData} />
                  <SimpleList items={selected.painPoints.slice(0, 2)} empty={t.common.noData} />
                  <SimpleList items={selected.improvementPoints.slice(0, 1)} empty={t.common.noData} />
                </DetailSection>

                <DetailSection title={t.detail.profitRisk}>
                  <div className="grid grid-cols-2 gap-3">
                    <MiniStat label={t.detail.profit} value={profitLabel(selected.profitLevel, t)} />
                    <MiniStat label={t.detail.marginRate} value={selected.estimatedMarginRate == null ? t.common.noData : `${selected.estimatedMarginRate}%`} />
                    <MiniStat label={t.detail.certification} value={riskLabel(selected.certificationRisk, t)} />
                    <MiniStat label={t.detail.logistics} value={riskLabel(selected.logisticsRisk, t)} />
                    <MiniStat label={t.detail.returnRisk} value={riskLabel(selected.returnRisk, t)} />
                    <MiniStat label={t.detail.risk} value={riskLabel(selected.riskLevel, t)} />
                  </div>
                </DetailSection>

                <DetailSection title={t.detail.recommendation}>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge tone={directionTone(selected.recommendedDirection)}>{directionLabel(selected.recommendedDirection, t)}</StatusBadge>
                    <StatusBadge tone={decisionTone(selected.finalDecision)}>{decisionLabel(selected.finalDecision, t)}</StatusBadge>
                    <StatusBadge tone="neutral">{supplyLabel(selected.supplyChainStatus, t)}</StatusBadge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{selected.decisionReason}</p>
                </DetailSection>

                <DetailSection title={t.detail.actions}>
                  <KeyValue label={t.detail.action} value={actionLabel(selected.nextAction, t)} />
                  <KeyValue label={t.detail.nextStep} value={selected.nextActionDetail || t.common.noData} />
                  <KeyValue label={t.detail.owner} value={selected.owner || t.common.noData} />
                </DetailSection>

                <DetailSection title={t.detail.riskTags}>
                  <div className="flex flex-wrap gap-2">
                    {selected.painPointTags.map((tag) => (
                      <StatusBadge key={tag} tone="warning">{painPointLabel(tag, t)}</StatusBadge>
                    ))}
                    {!selected.painPointTags.length ? <p className="text-sm text-slate-500">{t.common.noData}</p> : null}
                  </div>
                </DetailSection>

                <DetailSection title={t.detail.dataCompleteness}>
                  <KeyValue label={t.detail.completeness} value={`${selected.dataCompleteness}%`} />
                  <KeyValue label={t.detail.missing} value={selected.missingFields.join(" / ") || t.common.none} />
                </DetailSection>

                <DetailSection title={t.detail.quickActions}>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => transferToCompetitor(selected)}>{t.detail.toCompetitor}</Button>
                    <Button variant="outline" onClick={() => transferToTesting(selected)}>{t.detail.toTesting}</Button>
                    <Button variant="outline" onClick={() => transferToOpportunity(selected)}>{t.detail.toOpportunity}</Button>
                    <Button variant="outline" onClick={() => markIgnored(selected)}>{t.detail.ignore}</Button>
                  </div>
                </DetailSection>
              </CardContent>
            ) : (
              <CardContent>
                <EmptyPanel message={t.list.empty} />
              </CardContent>
            )}
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <SectionCard title={t.bottom.groupsTitle} description={t.bottom.groupsDescription}>
            <div className="space-y-3">
              {groupedDecisions.map((group) => (
                <div key={group.label} className="rounded-[18px] border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{group.label}</p>
                      <p className="mt-1 text-xs text-slate-500">{group.note}</p>
                    </div>
                    <span className="text-xl font-semibold text-slate-950">{group.count}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {group.samples.map((sample) => (
                      <StatusBadge key={sample} tone="neutral">{sample}</StatusBadge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title={t.bottom.missingTitle} description={t.bottom.missingDescription}>
            <div className="space-y-3">
              {missingSummary.map((item) => (
                <div key={item.label} className="rounded-[18px] border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-950">{item.label}</p>
                    <span className="text-lg font-semibold text-slate-950">{item.count}</span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{item.note}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title={t.bottom.actionsTitle} description={t.bottom.actionsDescription}>
            <div className="space-y-3">
              {actionSummary.map((item) => (
                <div key={item.label} className="rounded-[18px] border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-950">{item.label}</p>
                    <span className="text-lg font-semibold text-slate-950">{item.count}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.samples.map((sample) => (
                      <StatusBadge key={sample} tone="neutral">{sample}</StatusBadge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </section>
      </div>
    </>
  );
}

function buildDecisionRecords({
  hotItems,
  competitorItems,
  testingItems,
  opportunityItems,
  profitRecords,
  riskRecords,
  reviewRecords,
  locale,
}: {
  hotItems: HotProductIntelligenceItem[];
  competitorItems: CompetitorLibraryItem[];
  testingItems: LocalProduct[];
  opportunityItems: ProductOpportunityRecord[];
  profitRecords: ProductProfitCalculationRecord[];
  riskRecords: ProductRiskAssessmentRecord[];
  reviewRecords: ReviewInsightRecord[];
  locale: "zh" | "ko";
}) {
  const recordMap = new Map<string, DecisionRecord>();

  const upsert = (record: DecisionRecord) => {
    const existing = recordMap.get(record.key);
    recordMap.set(record.key, existing ? mergeDecisionRecord(existing, record) : record);
  };

  hotItems.forEach((item) => upsert(buildBaseFromHot(item, locale)));
  competitorItems.forEach((item) => upsert(buildBaseFromCompetitor(item, locale)));
  testingItems.forEach((item) => upsert(buildBaseFromTesting(item, locale)));
  opportunityItems.forEach((item) => upsert(buildBaseFromOpportunity(item, locale)));
  profitRecords.forEach((item) => upsert(buildBaseFromProfit(item)));
  riskRecords.forEach((item) => upsert(buildBaseFromRisk(item)));
  reviewRecords.forEach((item) => upsert(buildBaseFromReview(item)));

  return Array.from(recordMap.values())
    .map(finalizeDecisionRecord)
    .sort((a, b) => {
      const scoreDiff = decisionScore(b) - decisionScore(a);
      if (scoreDiff !== 0) return scoreDiff;
      return b.reviewCount - a.reviewCount;
    });
}

function buildBaseFromHot(item: HotProductIntelligenceItem, locale: "zh" | "ko"): DecisionRecord {
  const key = recordKey(item.coupang_url, item.product_name_ko, item.brand);
  return {
    id: `decision-${key}`,
    key,
    hotItemId: item.id,
    titleKo: item.product_name_ko,
    titleZh: item.product_name_zh,
    imageUrl: item.image_url,
    coupangUrl: item.coupang_url,
    brand: item.brand,
    category: item.category,
    source: item.source_type === "manual" ? "manual" : "hot",
    sourceLabel: locale === "ko" ? "热销情报".replace("热销情报", "열销 정보") : "热销情报中心",
    monthlyPurchaseBadge: item.monthly_purchase_badge,
    monthlyPurchaseLevel: item.monthly_purchase_badge,
    monthlyPurchaseBucket: monthlyBucket(item.monthly_purchase_level),
    currentPrice: item.competitor_price_krw,
    rating: item.rating,
    reviewCount: item.review_count,
    marketHeat: mapMarketHeat(item.opportunity_level),
    coreSellingPoints: item.core_selling_points,
    badReviewSamples: item.bad_review_samples,
    painPoints: splitPainPoints(item.consumer_pain_points, item.bad_review_samples),
    painPointTags: inferPainPointTags(item.consumer_pain_points, item.bad_review_samples),
    improvementPoints: item.next_action ? [item.next_action] : [],
    profitLevel: "missing",
    estimatedMarginRate: null,
    riskLevel: mapRiskLevel(item.risk_level),
    certificationRisk: inferCertificationRisk(item.risk_tags),
    logisticsRisk: inferLogisticsRisk(item.risk_tags),
    returnRisk: inferReturnRisk(item.bad_review_samples, item.consumer_pain_points),
    recommendedDirection: inferRecommendedDirection(item.recommendation_type, item.recommended_destination),
    finalDecision: "pending",
    decisionReason: [item.hot_reason, item.market_analysis].filter(Boolean).join(" / "),
    nextAction: inferCurrentAction(item.next_action, item.action_status),
    nextActionDetail: item.next_action,
    owner: "",
    supplierName: "",
    supplierQuoteCount: 0,
    supplyChainStatus: "not_started",
    notes: item.notes,
    keywords: item.keywords,
    dataCompleteness: 0,
    missingFields: [],
    topOpportunity: item.core_selling_points[0] || item.hot_reason,
    topRisk: item.risk_tags[0] || item.bad_review_samples[0] || "",
    inCompetitorLibrary: item.imported_to_competitor_library,
    inTestingDb: item.imported_to_product_test,
    inOpportunityPool: item.imported_to_opportunity_pool,
  };
}

function buildBaseFromCompetitor(item: CompetitorLibraryItem, locale: "zh" | "ko"): DecisionRecord {
  const key = recordKey(item.coupang_url, item.product_name_ko, item.brand);
  return {
    id: `decision-${key}`,
    key,
    titleKo: item.product_name_ko,
    titleZh: item.product_name_zh,
    imageUrl: item.image_url,
    coupangUrl: item.coupang_url,
    brand: item.brand,
    category: item.category,
    source: item.source_type === "manual" ? "manual" : "competitor",
    sourceLabel: locale === "ko" ? "경쟁상품库" : "竞品采集库",
    monthlyPurchaseBadge: item.monthly_purchase_badge,
    monthlyPurchaseLevel: item.monthly_purchase_badge,
    monthlyPurchaseBucket: monthlyBucket(item.monthly_purchase_level),
    currentPrice: item.competitor_price_krw,
    rating: item.rating,
    reviewCount: item.review_count,
    marketHeat: mapMarketHeat(item.follow_up_value),
    coreSellingPoints: item.core_selling_points,
    badReviewSamples: item.bad_review_samples,
    painPoints: splitPainPoints(item.consumer_pain_points, item.bad_review_samples),
    painPointTags: inferPainPointTags(item.consumer_pain_points, item.bad_review_samples, item.pain_point_categories),
    improvementPoints: item.improvement_opportunities,
    profitLevel: "missing",
    estimatedMarginRate: null,
    riskLevel: mapRiskLevel(item.risk_level),
    certificationRisk: inferCertificationRisk(item.risk_tags),
    logisticsRisk: inferLogisticsRisk(item.risk_tags),
    returnRisk: inferReturnRisk(item.bad_review_samples, item.consumer_pain_points),
    recommendedDirection: inferRecommendedDirection(item.recommended_import_target, item.recommended_destination),
    finalDecision: item.status === "ignore" ? "abandon" : "pending",
    decisionReason: [item.why_it_sells, item.follow_up_recommendation].filter(Boolean).join(" / "),
    nextAction: inferCurrentAction(item.next_action, item.status),
    nextActionDetail: item.next_action || item.follow_up_recommendation,
    owner: "",
    supplierName: "",
    supplierQuoteCount: 0,
    supplyChainStatus: item.status === "transfer" ? "confirmed" : item.status === "ignore" ? "paused" : "not_started",
    notes: item.notes,
    keywords: item.title_keywords,
    dataCompleteness: 0,
    missingFields: [],
    topOpportunity: item.improvement_opportunities[0] || item.positive_review_points[0] || "",
    topRisk: item.risk_tags[0] || item.bad_review_samples[0] || "",
    inCompetitorLibrary: true,
    inTestingDb: item.imported_to_product_test,
    inOpportunityPool: item.imported_to_opportunity_pool,
    linkedCompetitor: item,
  };
}

function buildBaseFromTesting(item: LocalProduct, locale: "zh" | "ko"): DecisionRecord {
  const analysis = analyzeProduct(item);
  const key = recordKey(item.competitorUrl, item.productNameKo, item.brand);
  return {
    id: `decision-${key}`,
    key,
    titleKo: item.productNameKo,
    titleZh: item.productNameZh,
    imageUrl: item.image,
    coupangUrl: item.competitorUrl,
    brand: item.brand,
    category: item.category,
    source: "testing",
    sourceLabel: locale === "ko" ? "테스트 DB" : "商品测试数据库",
    monthlyPurchaseBadge: "",
    monthlyPurchaseLevel: "",
    monthlyPurchaseBucket: inferMonthlyBucketFromReviews(item.reviewCount),
    currentPrice: item.competitorSalePriceKrw || item.discountPrice || item.price,
    rating: item.rating,
    reviewCount: item.reviewCount,
    marketHeat: inferHeatFromReviews(item.reviewCount),
    coreSellingPoints: item.sellingPoints,
    badReviewSamples: item.reviews.slice(0, 4),
    painPoints: splitPainPoints(item.consumerPainPoints, item.reviews),
    painPointTags: inferPainPointTags(item.consumerPainPoints, item.reviews),
    improvementPoints: [item.productDevelopmentDirection, item.sampleDevelopmentAdvice].filter(Boolean),
    profitLevel: analysis.grossMarginPercent >= 35 ? "high" : analysis.grossMarginPercent >= 20 ? "medium" : analysis.grossMarginPercent > 0 ? "low" : "missing",
    estimatedMarginRate: analysis.grossMarginPercent || null,
    riskLevel: mapAnalysisRisk(analysis.riskLevel),
    certificationRisk: item.needsKcCertification ? "high" : "low",
    logisticsRisk: item.fragile ? "high" : "medium",
    returnRisk: item.possibleHighReturn ? "high" : "medium",
    recommendedDirection: inferRecommendedDirection(analysis.direction, item.recommendationReason),
    finalDecision: "pending",
    decisionReason: [item.recommendationReason, analysis.riskSummary].filter(Boolean).join(" / "),
    nextAction: inferCurrentAction(item.sampleDevelopmentAdvice || item.productDevelopmentDirection, item.status),
    nextActionDetail: item.sampleDevelopmentAdvice || item.productDevelopmentDirection,
    owner: item.owner,
    supplierName: item.supplierNames[0] || "",
    supplierQuoteCount: item.supplierQuoteCount,
    supplyChainStatus: inferSupplyStatus(item.supplierQuoteCount, item.supplierNames.length, item.status),
    notes: item.notes || item.marketAnalysis,
    keywords: item.keywords,
    dataCompleteness: 0,
    missingFields: [],
    topOpportunity: item.productDevelopmentDirection || item.recommendationReason,
    topRisk: analysis.riskSummary,
    inCompetitorLibrary: false,
    inTestingDb: true,
    inOpportunityPool: false,
    linkedTesting: item,
  };
}

function buildBaseFromOpportunity(item: ProductOpportunityRecord, locale: "zh" | "ko"): DecisionRecord {
  const key = recordKey(item.coupang_url || "", item.title, "");
  return {
    id: `decision-${key}`,
    key,
    titleKo: item.title,
    titleZh: item.title,
    imageUrl: item.image_url || "",
    coupangUrl: item.coupang_url || "",
    brand: "",
    category: item.category,
    source: "opportunity",
    sourceLabel: locale === "ko" ? "기회보드" : "商品机会池",
    monthlyPurchaseBadge: item.demand_stability || "",
    monthlyPurchaseLevel: item.demand_stability || "",
    monthlyPurchaseBucket: inferMonthlyBucketFromDemand(item.demand_stability || ""),
    currentPrice: Number(item.price || item.estimated_sale_price || 0),
    rating: Number(item.rating || 0),
    reviewCount: Number(item.review_count || 0),
    marketHeat: mapMarketHeat(item.market_heat),
    coreSellingPoints: splitSlash(item.improvement_points),
    badReviewSamples: splitSlash(item.negative_review_keywords),
    painPoints: splitSlash(item.review_issue_summary),
    painPointTags: inferPainPointTags(item.review_issue_summary ?? "", splitSlash(item.negative_review_keywords)),
    improvementPoints: splitSlash(item.improvement_points),
    profitLevel: mapProfitLevelFromOpportunity(item.profit_level),
    estimatedMarginRate: item.estimated_margin_rate ?? null,
    riskLevel: mapRiskLevel(item.risk_level),
    certificationRisk: mapRiskLevel(item.kc_risk),
    logisticsRisk: mapRiskLevel(item.volume_weight_risk),
    returnRisk: mapRiskLevel(item.return_risk),
    recommendedDirection: mapDirectionFromBusinessType(item.business_type),
    finalDecision: mapFinalDecisionFromOpportunity(item.status),
    decisionReason: [item.notes, item.review_issue_summary].filter(Boolean).join(" / "),
    nextAction: mapCurrentActionFromOpportunity(item.next_action),
    nextActionDetail: item.next_action || "",
    owner: item.owner || "",
    supplierName: "",
    supplierQuoteCount: 0,
    supplyChainStatus: inferSupplyFromOpportunity(item.status, item.owner),
    notes: item.notes || "",
    keywords: splitSlash(item.keyword),
    dataCompleteness: 0,
    missingFields: [],
    topOpportunity: splitSlash(item.improvement_points)[0] || "",
    topRisk: splitSlash(item.review_issue_summary)[0] || "",
    inCompetitorLibrary: false,
    inTestingDb: false,
    inOpportunityPool: true,
    linkedOpportunity: item,
  };
}

function buildBaseFromProfit(item: ProductProfitCalculationRecord): DecisionRecord {
  const key = recordKey(item.coupang_url, item.product_name_ko, item.brand);
  return {
    id: `decision-${key}`,
    key,
    titleKo: item.product_name_ko,
    titleZh: item.product_name_zh,
    imageUrl: item.image_url,
    coupangUrl: item.coupang_url,
    brand: item.brand,
    category: item.category,
    source: item.source_type === "testing_db" ? "testing" : "opportunity",
    sourceLabel: "",
    monthlyPurchaseBadge: item.monthly_purchase_badge,
    monthlyPurchaseLevel: item.monthly_purchase_badge,
    monthlyPurchaseBucket: inferMonthlyBucketFromDemand(item.monthly_purchase_badge),
    currentPrice: item.competitor_price_krw,
    rating: item.rating,
    reviewCount: item.review_count,
    marketHeat: inferHeatFromReviews(item.review_count),
    coreSellingPoints: [],
    badReviewSamples: [],
    painPoints: [],
    painPointTags: [],
    improvementPoints: [],
    profitLevel: mapProfitBand(item.profit_level),
    estimatedMarginRate: item.estimated_margin_rate,
    riskLevel: "missing",
    certificationRisk: "missing",
    logisticsRisk: "missing",
    returnRisk: "missing",
    recommendedDirection: inferDirectionFromProfitRecord(item),
    finalDecision: mapDecisionFromProfitRecord(item),
    decisionReason: item.decision_reason,
    nextAction: inferCurrentAction(item.next_action, item.current_status),
    nextActionDetail: item.next_action,
    owner: "",
    supplierName: "",
    supplierQuoteCount: 0,
    supplyChainStatus: "not_started",
    notes: "",
    keywords: [],
    dataCompleteness: 0,
    missingFields: [],
    topOpportunity: item.decision_reason,
    topRisk: item.missing_fields[0] || "",
    inCompetitorLibrary: false,
    inTestingDb: item.source_type === "testing_db",
    inOpportunityPool: item.source_type === "opportunity_board",
    linkedProfit: item,
  };
}

function buildBaseFromRisk(item: ProductRiskAssessmentRecord): DecisionRecord {
  const key = recordKey(item.coupang_url, item.product_name_ko, item.brand);
  return {
    id: `decision-${key}`,
    key,
    titleKo: item.product_name_ko,
    titleZh: item.product_name_zh,
    imageUrl: item.image_url,
    coupangUrl: item.coupang_url,
    brand: item.brand,
    category: item.category,
    source: item.source_type === "testing_db" ? "testing" : "opportunity",
    sourceLabel: "",
    monthlyPurchaseBadge: item.monthly_purchase_badge,
    monthlyPurchaseLevel: item.monthly_purchase_badge,
    monthlyPurchaseBucket: inferMonthlyBucketFromDemand(item.monthly_purchase_badge),
    currentPrice: item.competitor_price_krw,
    rating: item.rating,
    reviewCount: item.review_count,
    marketHeat: inferHeatFromReviews(item.review_count),
    coreSellingPoints: [],
    badReviewSamples: [],
    painPoints: splitPainPoints(item.consumer_pain_points, []),
    painPointTags: inferPainPointTags(item.consumer_pain_points, []),
    improvementPoints: item.action_items,
    profitLevel: "missing",
    estimatedMarginRate: null,
    riskLevel: mapRiskLevel(item.overall_risk_level),
    certificationRisk: mapRiskLevel(item.certification_risk_level),
    logisticsRisk: mapRiskLevel(item.logistics_risk_level),
    returnRisk: mapRiskLevel(item.return_risk_level),
    recommendedDirection: "general_test",
    finalDecision: mapFinalDecisionFromRiskAction(item.recommended_action),
    decisionReason: item.risk_reason,
    nextAction: inferCurrentAction(item.next_action, item.current_status),
    nextActionDetail: item.next_action,
    owner: "",
    supplierName: "",
    supplierQuoteCount: 0,
    supplyChainStatus: "not_started",
    notes: item.current_status,
    keywords: [],
    dataCompleteness: 0,
    missingFields: [],
    topOpportunity: item.action_items[0] || "",
    topRisk: item.required_documents[0] || item.risk_reason,
    inCompetitorLibrary: false,
    inTestingDb: item.source_type === "testing_db",
    inOpportunityPool: item.source_type === "opportunity_board",
    linkedRisk: item,
  };
}

function buildBaseFromReview(item: ReviewInsightRecord): DecisionRecord {
  const key = recordKey(item.coupang_url, item.product_name_ko, item.brand);
  return {
    id: `decision-${key}`,
    key,
    titleKo: item.product_name_ko,
    titleZh: item.product_name_zh,
    imageUrl: item.image_url,
    coupangUrl: item.coupang_url,
    brand: item.brand,
    category: item.category,
    source: item.source_type === "testing_db" ? "testing" : item.source_type === "opportunity_board" ? "opportunity" : "manual",
    sourceLabel: "",
    monthlyPurchaseBadge: item.monthly_purchase_badge,
    monthlyPurchaseLevel: item.monthly_purchase_badge,
    monthlyPurchaseBucket: inferMonthlyBucketFromDemand(item.monthly_purchase_badge),
    currentPrice: item.price_krw,
    rating: item.rating,
    reviewCount: item.review_count,
    marketHeat: inferHeatFromReviews(item.review_count),
    coreSellingPoints: [],
    badReviewSamples: item.bad_review_samples,
    painPoints: item.top_pain_points.length ? item.top_pain_points : splitPainPoints("", item.bad_review_samples),
    painPointTags: inferPainPointTags(item.top_pain_points.join(" "), item.bad_review_samples, item.pain_point_categories),
    improvementPoints: item.improvement_suggestions,
    profitLevel: "missing",
    estimatedMarginRate: null,
    riskLevel: mapRiskLevel(item.return_risk_level),
    certificationRisk: "missing",
    logisticsRisk: "missing",
    returnRisk: mapRiskLevel(item.return_risk_level),
    recommendedDirection: inferRecommendedDirection(item.development_direction, item.final_recommendation),
    finalDecision: mapFinalDecisionFromReviewStatus(item.status),
    decisionReason: item.final_recommendation,
    nextAction: inferCurrentAction(item.next_action, item.status),
    nextActionDetail: item.next_action,
    owner: "",
    supplierName: "",
    supplierQuoteCount: 0,
    supplyChainStatus: "not_started",
    notes: item.notes,
    keywords: item.negative_keywords,
    dataCompleteness: 0,
    missingFields: [],
    topOpportunity: item.improvement_suggestions[0] || "",
    topRisk: item.top_pain_points[0] || "",
    inCompetitorLibrary: false,
    inTestingDb: item.sync_to_product_test,
    inOpportunityPool: item.sync_to_opportunity_board,
    linkedReview: item,
  };
}

function finalizeDecisionRecord(record: DecisionRecord): DecisionRecord {
  const missingFields = collectMissingFields(record);
  const completeness = Math.max(0, Math.round(((10 - missingFields.length) / 10) * 100));
  const finalDecision = record.finalDecision === "pending" ? deriveFinalDecision(record) : record.finalDecision;
  const recommendedDirection = deriveDirection(record);
  const nextAction = deriveNextAction(record, finalDecision, recommendedDirection);

  return {
    ...record,
    finalDecision,
    recommendedDirection,
    nextAction,
    dataCompleteness: completeness,
    missingFields,
    decisionReason: buildDecisionReason(record, finalDecision, recommendedDirection),
    topOpportunity: record.topOpportunity || record.coreSellingPoints[0] || record.improvementPoints[0] || "",
    topRisk: record.topRisk || record.painPoints[0] || record.badReviewSamples[0] || "",
    sourceLabel: record.sourceLabel || sourceLabel(record.source),
  };
}

function buildDecisionMetrics(records: DecisionRecord[], t: typeof ZH_COPY) {
  return [
    metricCard("pending", t.metrics.pending, records.filter((item) => item.finalDecision === "pending").length, t.metrics.pendingNote, <CircleAlert className="h-4 w-4" />),
    metricCard("continue", t.metrics.continue, records.filter((item) => item.finalDecision === "continue").length, t.metrics.continueNote, <ShieldCheck className="h-4 w-4" />, "success"),
    metricCard("small_test", t.metrics.smallTest, records.filter((item) => item.finalDecision === "small_test").length, t.metrics.smallTestNote, <PackageSearch className="h-4 w-4" />, "success"),
    metricCard("rocket_growth", t.metrics.rg, records.filter((item) => item.recommendedDirection === "rocket_growth").length, t.metrics.rgNote, <TrendingUp className="h-4 w-4" />),
    metricCard("pb_supply", t.metrics.pb, records.filter((item) => item.recommendedDirection === "pb_supply").length, t.metrics.pbNote, <Factory className="h-4 w-4" />),
    metricCard("own_brand", t.metrics.ownBrand, records.filter((item) => item.recommendedDirection === "own_brand").length, t.metrics.ownBrandNote, <Sparkles className="h-4 w-4" />),
    metricCard("high_risk", t.metrics.highRisk, records.filter((item) => item.riskLevel === "high" || item.missingFields.includes(t.missing.risk)).length, t.metrics.highRiskNote, <ShieldAlert className="h-4 w-4" />, "danger"),
    metricCard("abandon", t.metrics.abandon, records.filter((item) => item.finalDecision === "abandon").length, t.metrics.abandonNote, <Truck className="h-4 w-4" />, "danger"),
  ];
}

function metricCard(key: DecisionMetricKey, label: string, value: number, note: string, icon: React.ReactNode, tone?: "success" | "warning" | "danger") {
  return { key, label, value, note, icon, tone };
}

function applyFilters(records: DecisionRecord[], filters: Filters, metricFocus: DecisionMetricKey | null) {
  return records.filter((item) => {
    const keyword = filters.query.trim().toLowerCase();
    const textBlob = [
      item.titleKo,
      item.titleZh,
      item.brand,
      item.category,
      item.coupangUrl,
      item.keywords.join(" "),
      item.painPoints.join(" "),
      item.badReviewSamples.join(" "),
      item.decisionReason,
      item.notes,
    ]
      .join(" ")
      .toLowerCase();

    const metricMatch =
      !metricFocus ||
      (metricFocus === "pending" && item.finalDecision === "pending") ||
      (metricFocus === "continue" && item.finalDecision === "continue") ||
      (metricFocus === "small_test" && item.finalDecision === "small_test") ||
      (metricFocus === "rocket_growth" && item.recommendedDirection === "rocket_growth") ||
      (metricFocus === "pb_supply" && item.recommendedDirection === "pb_supply") ||
      (metricFocus === "own_brand" && item.recommendedDirection === "own_brand") ||
      (metricFocus === "high_risk" && item.riskLevel === "high") ||
      (metricFocus === "abandon" && item.finalDecision === "abandon");

    return (
      (!keyword || textBlob.includes(keyword)) &&
      metricMatch &&
      (filters.finalDecision === "all" || item.finalDecision === filters.finalDecision) &&
      (filters.recommendedDirection === "all" || item.recommendedDirection === filters.recommendedDirection) &&
      (filters.source === "all" || item.source === filters.source) &&
      (filters.monthlyPurchase === "all" || item.monthlyPurchaseBucket === filters.monthlyPurchase) &&
      (filters.marketHeat === "all" || item.marketHeat === filters.marketHeat) &&
      (filters.profitLevel === "all" || item.profitLevel === filters.profitLevel) &&
      (filters.riskLevel === "all" || item.riskLevel === filters.riskLevel) &&
      (filters.painPoint === "all" || item.painPointTags.includes(filters.painPoint)) &&
      (filters.supplyChainStatus === "all" || item.supplyChainStatus === filters.supplyChainStatus) &&
      (filters.currentAction === "all" || item.nextAction === filters.currentAction)
    );
  });
}

function groupDecisionBoard(records: DecisionRecord[], t: typeof ZH_COPY) {
  return [
    boardGroup("continue", decisionLabel("continue", t), t.bottom.groupNotes.continue, records),
    boardGroup("small_test", decisionLabel("small_test", t), t.bottom.groupNotes.smallTest, records),
    boardGroup("pause", decisionLabel("pause", t), t.bottom.groupNotes.pause, records),
    boardGroup("abandon", decisionLabel("abandon", t), t.bottom.groupNotes.abandon, records),
  ];
}

function boardGroup(key: FinalDecision, label: string, note: string, records: DecisionRecord[]) {
  const matches = records.filter((item) => item.finalDecision === key);
  return {
    label,
    note,
    count: matches.length,
    samples: matches.slice(0, 3).map((item) => item.titleZh || item.titleKo),
  };
}

function buildMissingSummary(records: DecisionRecord[], t: typeof ZH_COPY) {
  const counters = [
    { label: t.missing.monthly, note: t.missing.monthlyNote, count: records.filter((item) => item.monthlyPurchaseBucket === "unknown").length },
    { label: t.missing.review, note: t.missing.reviewNote, count: records.filter((item) => !item.painPoints.length).length },
    { label: t.missing.profit, note: t.missing.profitNote, count: records.filter((item) => item.profitLevel === "missing").length },
    { label: t.missing.risk, note: t.missing.riskNote, count: records.filter((item) => item.riskLevel === "missing").length },
    { label: t.missing.supply, note: t.missing.supplyNote, count: records.filter((item) => item.supplyChainStatus === "not_started").length },
  ];
  return counters;
}

function buildActionSummary(records: DecisionRecord[], t: typeof ZH_COPY) {
  const actions: CurrentAction[] = ["find_supplier", "calculate_profit", "review_bad_reviews", "apply_sample", "prepare_rg", "prepare_pb", "observe", "abandon"];
  return actions.map((action) => {
    const matches = records.filter((item) => item.nextAction === action);
    return {
      label: actionLabel(action, t),
      count: matches.length,
      samples: matches.slice(0, 3).map((item) => item.titleZh || item.titleKo),
    };
  });
}

function mergeDecisionRecord(base: DecisionRecord, extra: DecisionRecord): DecisionRecord {
  return {
    ...base,
    ...extra,
    titleKo: preferText(base.titleKo, extra.titleKo),
    titleZh: preferText(base.titleZh, extra.titleZh),
    imageUrl: preferText(base.imageUrl, extra.imageUrl),
    coupangUrl: preferText(base.coupangUrl, extra.coupangUrl),
    brand: preferText(base.brand, extra.brand),
    category: preferText(base.category, extra.category),
    sourceLabel: preferText(base.sourceLabel, extra.sourceLabel),
    monthlyPurchaseBadge: preferText(base.monthlyPurchaseBadge, extra.monthlyPurchaseBadge),
    monthlyPurchaseLevel: preferText(base.monthlyPurchaseLevel, extra.monthlyPurchaseLevel),
    currentPrice: preferNumber(base.currentPrice, extra.currentPrice),
    rating: preferNumber(base.rating, extra.rating),
    reviewCount: preferNumber(base.reviewCount, extra.reviewCount),
    marketHeat: preferEnum(base.marketHeat, extra.marketHeat, "unknown"),
    coreSellingPoints: mergeStrings(base.coreSellingPoints, extra.coreSellingPoints),
    badReviewSamples: mergeStrings(base.badReviewSamples, extra.badReviewSamples),
    painPoints: mergeStrings(base.painPoints, extra.painPoints),
    painPointTags: mergeStrings(base.painPointTags, extra.painPointTags) as PainPointTag[],
    improvementPoints: mergeStrings(base.improvementPoints, extra.improvementPoints),
    profitLevel: preferProfit(base.profitLevel, extra.profitLevel),
    estimatedMarginRate: preferNullableNumber(base.estimatedMarginRate, extra.estimatedMarginRate),
    riskLevel: preferRisk(base.riskLevel, extra.riskLevel),
    certificationRisk: preferRisk(base.certificationRisk, extra.certificationRisk),
    logisticsRisk: preferRisk(base.logisticsRisk, extra.logisticsRisk),
    returnRisk: preferRisk(base.returnRisk, extra.returnRisk),
    recommendedDirection: preferDirection(base.recommendedDirection, extra.recommendedDirection),
    finalDecision: preferDecision(base.finalDecision, extra.finalDecision),
    decisionReason: mergeText(base.decisionReason, extra.decisionReason),
    nextAction: preferAction(base.nextAction, extra.nextAction),
    nextActionDetail: preferText(base.nextActionDetail, extra.nextActionDetail),
    owner: preferText(base.owner, extra.owner),
    supplierName: preferText(base.supplierName, extra.supplierName),
    supplierQuoteCount: Math.max(base.supplierQuoteCount, extra.supplierQuoteCount),
    supplyChainStatus: preferSupply(base.supplyChainStatus, extra.supplyChainStatus),
    notes: mergeText(base.notes, extra.notes),
    keywords: mergeStrings(base.keywords, extra.keywords),
    topOpportunity: preferText(base.topOpportunity, extra.topOpportunity),
    topRisk: preferText(base.topRisk, extra.topRisk),
    inCompetitorLibrary: base.inCompetitorLibrary || extra.inCompetitorLibrary,
    inTestingDb: base.inTestingDb || extra.inTestingDb,
    inOpportunityPool: base.inOpportunityPool || extra.inOpportunityPool,
    hotItemId: base.hotItemId || extra.hotItemId,
    linkedCompetitor: extra.linkedCompetitor ?? base.linkedCompetitor,
    linkedTesting: extra.linkedTesting ?? base.linkedTesting,
    linkedOpportunity: extra.linkedOpportunity ?? base.linkedOpportunity,
    linkedProfit: extra.linkedProfit ?? base.linkedProfit,
    linkedRisk: extra.linkedRisk ?? base.linkedRisk,
    linkedReview: extra.linkedReview ?? base.linkedReview,
  };
}

function collectMissingFields(record: DecisionRecord) {
  const missing: string[] = [];
  if (!record.monthlyPurchaseBadge && record.monthlyPurchaseBucket === "unknown") missing.push(ZH_COPY.missing.monthly);
  if (!record.currentPrice) missing.push(ZH_COPY.missing.price);
  if (!record.rating || !record.reviewCount) missing.push(ZH_COPY.missing.review);
  if (record.profitLevel === "missing") missing.push(ZH_COPY.missing.profit);
  if (record.riskLevel === "missing") missing.push(ZH_COPY.missing.risk);
  if (!record.coreSellingPoints.length) missing.push(ZH_COPY.missing.sellingPoint);
  if (!record.painPoints.length) missing.push(ZH_COPY.missing.pain);
  if (!record.improvementPoints.length) missing.push(ZH_COPY.missing.improvement);
  if (record.supplyChainStatus === "not_started") missing.push(ZH_COPY.missing.supply);
  if (!record.nextActionDetail) missing.push(ZH_COPY.missing.action);
  return Array.from(new Set(missing));
}

function deriveFinalDecision(record: DecisionRecord): FinalDecision {
  if (record.riskLevel === "high" && (record.profitLevel === "low" || record.profitLevel === "missing")) return "abandon";
  if (record.profitLevel === "high" && record.riskLevel === "low" && record.marketHeat === "high") return "continue";
  if ((record.profitLevel === "high" || record.profitLevel === "medium") && record.riskLevel !== "high") return "small_test";
  if (record.riskLevel === "high") return "pause";
  return "pending";
}

function deriveDirection(record: DecisionRecord): RecommendedDirection {
  if (record.recommendedDirection !== "general_test") return record.recommendedDirection;
  if (record.linkedOpportunity?.business_type) return mapDirectionFromBusinessType(record.linkedOpportunity.business_type);
  if (record.linkedTesting && /PB/.test(record.linkedTesting.status)) return "pb_supply";
  if (record.linkedTesting && /RG/.test(record.linkedTesting.status)) return "rocket_growth";
  if (record.profitLevel === "high" && record.marketHeat === "high") return "rocket_growth";
  if (/品牌|브랜드|own brand/i.test(record.improvementPoints.join(" "))) return "own_brand";
  return "general_test";
}

function deriveNextAction(record: DecisionRecord, finalDecision: FinalDecision, direction: RecommendedDirection): CurrentAction {
  if (record.nextAction && record.nextAction !== "observe") return record.nextAction;
  if (finalDecision === "abandon") return "abandon";
  if (record.supplyChainStatus === "not_started") return "find_supplier";
  if (record.profitLevel === "missing") return "calculate_profit";
  if (!record.painPoints.length) return "review_bad_reviews";
  if (direction === "rocket_growth") return "prepare_rg";
  if (direction === "pb_supply") return "prepare_pb";
  if (finalDecision === "small_test") return "apply_sample";
  return "observe";
}

function buildDecisionReason(record: DecisionRecord, decision: FinalDecision, direction: RecommendedDirection) {
  const parts = [
    `${ZH_COPY.detail.marketHeat}: ${marketHeatLabel(record.marketHeat, ZH_COPY)}`,
    `${ZH_COPY.detail.profit}: ${profitLabel(record.profitLevel, ZH_COPY)}`,
    `${ZH_COPY.detail.risk}: ${riskLabel(record.riskLevel, ZH_COPY)}`,
    `${ZH_COPY.detail.direction}: ${directionLabel(direction, ZH_COPY)}`,
    `${ZH_COPY.detail.finalDecision}: ${decisionLabel(decision, ZH_COPY)}`,
  ];
  const keyInfo = [record.topOpportunity, record.topRisk].filter(Boolean).join(" / ");
  return [keyInfo, parts.join(" | "), record.notes].filter(Boolean).join(" / ");
}

function decisionScore(record: DecisionRecord) {
  const heat = record.marketHeat === "high" ? 20 : record.marketHeat === "medium" ? 12 : record.marketHeat === "low" ? 6 : 0;
  const profit = record.profitLevel === "high" ? 22 : record.profitLevel === "medium" ? 14 : record.profitLevel === "low" ? 6 : 0;
  const riskPenalty = record.riskLevel === "high" ? 18 : record.riskLevel === "medium" ? 9 : record.riskLevel === "low" ? 2 : 10;
  const review = record.reviewCount >= 10000 ? 12 : record.reviewCount >= 5000 ? 9 : record.reviewCount >= 1000 ? 6 : 3;
  return heat + profit + review - riskPenalty;
}

function FilterInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
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

function FilterSelect({
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

function ListMetricBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/88 px-4 py-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <div className="mt-3 space-y-2 text-sm font-semibold leading-6 text-slate-950">{children}</div>
    </div>
  );
}

function Banner({ message }: { message: string }) {
  return <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>;
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

function EmptyPanel({ message }: { message: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">{message}</div>;
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-900">{value}</p>
    </div>
  );
}

function SimpleList({ items, empty }: { items: string[]; empty: string }) {
  return (
    <div className="space-y-2">
      {items.length ? (
        items.map((item, index) => (
          <div key={`${item}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
            {item}
          </div>
        ))
      ) : (
        <p className="text-sm text-slate-500">{empty}</p>
      )}
    </div>
  );
}

function recordKey(url: string, title: string, brand: string) {
  const normalizedUrl = normalizeText(url);
  if (normalizedUrl) return normalizedUrl;
  return `${normalizeText(title)}::${normalizeText(brand)}`;
}

function normalizeText(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9\u3131-\u318e\uac00-\ud7a3\u4e00-\u9fff]/g, "");
}

function preferText(a: string, b: string) {
  return a || b;
}

function mergeText(a: string, b: string) {
  if (!a) return b;
  if (!b || a.includes(b)) return a;
  if (b.includes(a)) return b;
  return `${a} / ${b}`;
}

function preferNumber(a: number, b: number) {
  return a || b;
}

function preferNullableNumber(a: number | null, b: number | null) {
  return a ?? b;
}

function mergeStrings<T extends string>(a: T[], b: T[]) {
  return Array.from(new Set([...a, ...b].filter(Boolean)));
}

function splitSlash(value: string | null | undefined) {
  return String(value || "")
    .split(/[,\n/|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitPainPoints(textValue: string, samples: string[]) {
  const points = splitSlash(textValue);
  if (points.length) return points;
  return samples.slice(0, 3);
}

function inferPainPointTags(textValue: string, samples: string[], extra: string[] = []): PainPointTag[] {
  const blob = `${textValue} ${samples.join(" ")} ${extra.join(" ")}`.toLowerCase();
  const tags: PainPointTag[] = [];
  if (/size|尺寸|크기|작아요|크다/.test(blob)) tags.push("size");
  if (/quality|质量|품질|不良|마감/.test(blob)) tags.push("quality");
  if (/install|安装|설치|조립/.test(blob)) tags.push("install");
  if (/adhesive|粘|붙|떨어/.test(blob)) tags.push("adhesive");
  if (/material|材质|소재/.test(blob)) tags.push("material");
  if (/smell|气味|냄새/.test(blob)) tags.push("smell");
  if (/color|颜色|색상/.test(blob)) tags.push("color");
  if (/package|包装|포장|破损/.test(blob)) tags.push("package");
  if (/delivery|配送|배송/.test(blob)) tags.push("delivery");
  if (/image|图片|상세|photo/.test(blob)) tags.push("image");
  if (/use|使用|편해|불편/.test(blob)) tags.push("usability");
  if (/price|性价比|가성비/.test(blob)) tags.push("value");
  if (/return|退货|반품/.test(blob)) tags.push("return");
  return Array.from(new Set(tags));
}

function monthlyBucket(value: string) {
  const normalized = String(value || "");
  if (normalized.includes("10000")) return "10000" as const;
  if (normalized.includes("5000")) return "5000" as const;
  if (normalized.includes("3000")) return "3000" as const;
  if (normalized.includes("1000")) return "1000" as const;
  return "unknown" as const;
}

function inferMonthlyBucketFromReviews(reviewCount: number) {
  if (reviewCount >= 10000) return "10000" as const;
  if (reviewCount >= 5000) return "5000" as const;
  if (reviewCount >= 3000) return "3000" as const;
  if (reviewCount >= 1000) return "1000" as const;
  return "unknown" as const;
}

function inferMonthlyBucketFromDemand(value: string) {
  return monthlyBucket(value);
}

function inferHeatFromReviews(reviewCount: number): MarketHeat {
  if (reviewCount >= 5000) return "high";
  if (reviewCount >= 1000) return "medium";
  if (reviewCount > 0) return "low";
  return "unknown";
}

function inferCertificationRisk(tags: string[]) {
  const blob = tags.join(" ");
  if (/KC|电子|医疗|食品|化妆/.test(blob)) return "high" as const;
  return tags.length ? ("medium" as const) : ("low" as const);
}

function inferLogisticsRisk(tags: string[]) {
  const blob = tags.join(" ");
  if (/物流|易碎|重量|包装/.test(blob)) return "high" as const;
  return tags.length ? ("medium" as const) : ("low" as const);
}

function inferReturnRisk(samples: string[], pain: string) {
  const blob = `${samples.join(" ")} ${pain}`.toLowerCase();
  if (/return|退货|반품|尺寸|质量|安装/.test(blob)) return "high" as const;
  return blob ? ("medium" as const) : ("low" as const);
}

function inferRecommendedDirection(typeText: string, destination: string): RecommendedDirection {
  const blob = `${typeText} ${destination}`.toLowerCase();
  if (/rocket|rg/.test(blob)) return "rocket_growth";
  if (/pb/.test(blob)) return "pb_supply";
  if (/品牌|自有|own/.test(blob)) return "own_brand";
  if (/暂停|暂缓|pause/.test(blob)) return "pause";
  if (/放弃|abandon|ignore/.test(blob)) return "abandon";
  return "general_test";
}

function inferCurrentAction(detail: string, status: string): CurrentAction {
  const blob = `${detail} ${status}`.toLowerCase();
  if (/supplier|供应商/.test(blob)) return "find_supplier";
  if (/profit|利润/.test(blob)) return "calculate_profit";
  if (/review|差评|痛点/.test(blob)) return "review_bad_reviews";
  if (/sample|样品|打样/.test(blob)) return "apply_sample";
  if (/rg|rocket/.test(blob)) return "prepare_rg";
  if (/pb/.test(blob)) return "prepare_pb";
  if (/ignore|drop|放弃/.test(blob)) return "abandon";
  return "observe";
}

function inferSupplyStatus(quotes: number, supplierCount: number, status: string): SupplyChainStatus {
  const blob = String(status || "");
  if (/暂停|放弃/.test(blob)) return "paused";
  if (quotes >= 1) return "quoted";
  if (supplierCount >= 1) return "sourcing";
  return "not_started";
}

function mapMarketHeat(value: string | null | undefined): MarketHeat {
  if (value === "high" || value === "medium" || value === "low") return value;
  return "unknown";
}

function mapRiskLevel(value: string | null | undefined): RiskLevel {
  if (value === "high" || value === "medium" || value === "low") return value;
  return "missing";
}

function mapOpportunityLevel(value: string | null | undefined): "high" | "medium" | "low" {
  if (value === "high" || value === "medium" || value === "low") return value;
  return "medium";
}

function mapAnalysisRisk(value: string): RiskLevel {
  if (value === "遙?" || value === "high") return "high";
  if (value === "訝?" || value === "medium") return "medium";
  if (value === "鵝?" || value === "low") return "low";
  return "missing";
}

function mapProfitLevelFromOpportunity(value: string | null | undefined): ProfitLevel {
  if (value === "high" || value === "medium" || value === "low") return value;
  return "missing";
}

function mapProfitBand(value: string): ProfitLevel {
  if (value === "high" || value === "medium" || value === "low") return value;
  return "missing";
}

function mapDirectionFromBusinessType(value: string): RecommendedDirection {
  if (value === "rocket_growth") return "rocket_growth";
  if (value === "pb_supply") return "pb_supply";
  if (value === "own_brand") return "own_brand";
  return "general_test";
}

function mapFinalDecisionFromOpportunity(value: string): FinalDecision {
  if (value === "high_potential" || value === "in_execution") return "continue";
  if (value === "testable") return "small_test";
  if (value === "paused") return "pause";
  if (value === "dropped") return "abandon";
  return "pending";
}

function mapCurrentActionFromOpportunity(value: string | null): CurrentAction {
  switch (value) {
    case "find_supplier":
      return "find_supplier";
    case "calculate_profit":
      return "calculate_profit";
    case "apply_sample":
      return "apply_sample";
    case "prepare_rg_proposal":
      return "prepare_rg";
    case "prepare_pb_proposal":
      return "prepare_pb";
    case "pause":
      return "abandon";
    default:
      return "observe";
  }
}

function inferSupplyFromOpportunity(status: string, owner: string | null) {
  if (status === "dropped" || status === "paused") return "paused" as const;
  if (owner) return "confirmed" as const;
  return "not_started" as const;
}

function inferDirectionFromProfitRecord(item: ProductProfitCalculationRecord): RecommendedDirection {
  if (item.pb_decision === "strong_yes") return "pb_supply";
  if (item.rocket_growth_decision === "strong_yes") return "rocket_growth";
  if (item.own_brand_decision === "strong_yes") return "own_brand";
  return "general_test";
}

function mapDecisionFromProfitRecord(item: ProductProfitCalculationRecord): FinalDecision {
  if (item.final_profit_decision === "strong_yes") return "continue";
  if (item.final_profit_decision === "conditional") return "small_test";
  if (item.final_profit_decision === "observe") return "pause";
  return "abandon";
}

function mapFinalDecisionFromRiskAction(action: string): FinalDecision {
  if (action === "push") return "continue";
  if (action === "conditional") return "small_test";
  if (action === "observe") return "pause";
  return "abandon";
}

function mapFinalDecisionFromReviewStatus(status: string): FinalDecision {
  if (status === "ready" || status === "sync_testing_db" || status === "sync_opportunity") return "small_test";
  if (status === "observe") return "pause";
  if (status === "dropped") return "abandon";
  return "pending";
}

function mapOpportunityCategory(category: string) {
  if (category.includes("窗")) return "window_curtain" as const;
  if (category.includes("浴")) return "bathroom_curtain" as const;
  if (category.includes("儿童")) return "kids" as const;
  if (category.includes("户外")) return "outdoor" as const;
  if (category.includes("家")) return "household" as const;
  return "other" as const;
}

function mapBusinessType(direction: RecommendedDirection) {
  if (direction === "rocket_growth") return "rocket_growth" as const;
  if (direction === "pb_supply") return "pb_supply" as const;
  if (direction === "own_brand") return "own_brand" as const;
  return "general" as const;
}

function mapOpportunityStatus(decision: FinalDecision) {
  if (decision === "continue") return "high_potential" as const;
  if (decision === "small_test") return "testable" as const;
  if (decision === "pause") return "paused" as const;
  if (decision === "abandon") return "dropped" as const;
  return "pending_analysis" as const;
}

function mapOpportunityAction(action: CurrentAction) {
  switch (action) {
    case "find_supplier":
      return "find_supplier" as const;
    case "calculate_profit":
      return "calculate_profit" as const;
    case "apply_sample":
      return "apply_sample" as const;
    case "prepare_rg":
      return "prepare_rg_proposal" as const;
    case "prepare_pb":
      return "prepare_pb_proposal" as const;
    case "abandon":
      return "pause" as const;
    default:
      return "collect_competitors" as const;
  }
}

function inferCompetitorCount(record: DecisionRecord) {
  if (record.reviewCount >= 5000) return 8;
  if (record.reviewCount >= 1000) return 5;
  return 3;
}

function inferEstimatedPurchaseCost(record: DecisionRecord) {
  const marginRate = record.estimatedMarginRate ?? (record.profitLevel === "high" ? 35 : record.profitLevel === "medium" ? 22 : 12);
  return Math.max(0, Math.round(record.currentPrice * (1 - marginRate / 100) * 0.72));
}

function inferCompetitionLevel(record: DecisionRecord) {
  if (record.reviewCount >= 5000) return "high";
  if (record.reviewCount >= 1000) return "medium";
  return "low";
}

function inferTopSellerCount(record: DecisionRecord) {
  if (record.monthlyPurchaseBucket === "10000") return 10;
  if (record.monthlyPurchaseBucket === "5000") return 7;
  if (record.monthlyPurchaseBucket === "3000") return 5;
  return 3;
}

function preferEnum<T extends string>(a: T, b: T, fallback: T) {
  if (a !== fallback) return a;
  return b;
}

function preferProfit(a: ProfitLevel, b: ProfitLevel) {
  return a !== "missing" ? a : b;
}

function preferRisk(a: RiskLevel, b: RiskLevel) {
  return a !== "missing" ? a : b;
}

function preferDirection(a: RecommendedDirection, b: RecommendedDirection) {
  return a !== "general_test" ? a : b;
}

function preferDecision(a: FinalDecision, b: FinalDecision) {
  return a !== "pending" ? a : b;
}

function preferAction(a: CurrentAction, b: CurrentAction) {
  return a !== "observe" ? a : b;
}

function preferSupply(a: SupplyChainStatus, b: SupplyChainStatus) {
  return a !== "not_started" ? a : b;
}

function mergeByKey<T>(saved: T[], incoming: T[], getKey: (item: T) => string) {
  const map = new Map<string, T>();
  saved.forEach((item) => map.set(getKey(item), item));
  incoming.forEach((item) => {
    const key = getKey(item);
    if (!map.has(key)) map.set(key, item);
  });
  return Array.from(map.values());
}

function sourceLabel(source: DataSource) {
  switch (source) {
    case "competitor":
      return "竞品采集库";
    case "testing":
      return "商品测试数据库";
    case "opportunity":
      return "商品机会池";
    case "manual":
      return "手动新增";
    default:
      return "热销情报中心";
  }
}

function metricLabel(key: DecisionMetricKey, t: typeof ZH_COPY) {
  return buildDecisionMetrics([], t).find((item) => item.key === key)?.label || "";
}

function decisionLabel(value: FinalDecision, t: typeof ZH_COPY) {
  return t.decision[value];
}

function directionLabel(value: RecommendedDirection, t: typeof ZH_COPY) {
  return t.direction[value];
}

function riskLabel(value: RiskLevel, t: typeof ZH_COPY) {
  return t.risk[value];
}

function profitLabel(value: ProfitLevel, t: typeof ZH_COPY) {
  return t.profit[value];
}

function marketHeatLabel(value: MarketHeat, t: typeof ZH_COPY) {
  return t.heat[value];
}

function purchaseBucketLabel(value: DecisionRecord["monthlyPurchaseBucket"], t: typeof ZH_COPY) {
  return t.monthly[value];
}

function supplyLabel(value: SupplyChainStatus, t: typeof ZH_COPY) {
  return t.supply[value];
}

function actionLabel(value: CurrentAction, t: typeof ZH_COPY) {
  return t.action[value];
}

function painPointLabel(value: PainPointTag, t: typeof ZH_COPY) {
  return t.painPoint[value];
}

function riskTone(value: RiskLevel) {
  if (value === "high") return "danger" as const;
  if (value === "medium") return "warning" as const;
  if (value === "low") return "success" as const;
  return "neutral" as const;
}

function decisionTone(value: FinalDecision) {
  if (value === "continue") return "success" as const;
  if (value === "small_test") return "warning" as const;
  if (value === "pause") return "neutral" as const;
  if (value === "abandon") return "danger" as const;
  return "info" as const;
}

function directionTone(value: RecommendedDirection) {
  if (value === "rocket_growth") return "success" as const;
  if (value === "pb_supply") return "warning" as const;
  if (value === "own_brand") return "info" as const;
  if (value === "pause" || value === "abandon") return "danger" as const;
  return "neutral" as const;
}

function decisionOptions(t: typeof ZH_COPY) {
  return [
    { value: "all", label: t.common.all },
    { value: "pending", label: t.decision.pending },
    { value: "continue", label: t.decision.continue },
    { value: "small_test", label: t.decision.small_test },
    { value: "pause", label: t.decision.pause },
    { value: "abandon", label: t.decision.abandon },
  ];
}

function directionOptions(t: typeof ZH_COPY) {
  return [
    { value: "all", label: t.common.all },
    { value: "rocket_growth", label: t.direction.rocket_growth },
    { value: "pb_supply", label: t.direction.pb_supply },
    { value: "own_brand", label: t.direction.own_brand },
    { value: "general_test", label: t.direction.general_test },
    { value: "pause", label: t.direction.pause },
    { value: "abandon", label: t.direction.abandon },
  ];
}

function sourceOptions(t: typeof ZH_COPY) {
  return [
    { value: "all", label: t.common.all },
    { value: "hot", label: t.source.hot },
    { value: "competitor", label: t.source.competitor },
    { value: "testing", label: t.source.testing },
    { value: "opportunity", label: t.source.opportunity },
    { value: "manual", label: t.source.manual },
  ];
}

function monthlyOptions(t: typeof ZH_COPY) {
  return [
    { value: "all", label: t.common.all },
    { value: "1000", label: t.monthly["1000"] },
    { value: "3000", label: t.monthly["3000"] },
    { value: "5000", label: t.monthly["5000"] },
    { value: "10000", label: t.monthly["10000"] },
    { value: "unknown", label: t.monthly.unknown },
  ];
}

function heatOptions(t: typeof ZH_COPY) {
  return [
    { value: "all", label: t.common.all },
    { value: "high", label: t.heat.high },
    { value: "medium", label: t.heat.medium },
    { value: "low", label: t.heat.low },
    { value: "unknown", label: t.heat.unknown },
  ];
}

function profitOptions(t: typeof ZH_COPY) {
  return [
    { value: "all", label: t.common.all },
    { value: "high", label: t.profit.high },
    { value: "medium", label: t.profit.medium },
    { value: "low", label: t.profit.low },
    { value: "missing", label: t.profit.missing },
  ];
}

function riskOptions(t: typeof ZH_COPY) {
  return [
    { value: "all", label: t.common.all },
    { value: "low", label: t.risk.low },
    { value: "medium", label: t.risk.medium },
    { value: "high", label: t.risk.high },
    { value: "missing", label: t.risk.missing },
  ];
}

function painPointOptions(t: typeof ZH_COPY) {
  return [
    { value: "all", label: t.common.all },
    ...(["size", "quality", "install", "adhesive", "material", "smell", "color", "package", "delivery", "image", "usability", "value", "return"] as PainPointTag[]).map((value) => ({
      value,
      label: t.painPoint[value],
    })),
  ];
}

function supplyOptions(t: typeof ZH_COPY) {
  return [
    { value: "all", label: t.common.all },
    { value: "not_started", label: t.supply.not_started },
    { value: "sourcing", label: t.supply.sourcing },
    { value: "quoted", label: t.supply.quoted },
    { value: "sampled", label: t.supply.sampled },
    { value: "confirmed", label: t.supply.confirmed },
    { value: "paused", label: t.supply.paused },
  ];
}

function actionOptions(t: typeof ZH_COPY) {
  return [
    { value: "all", label: t.common.all },
    { value: "find_supplier", label: t.action.find_supplier },
    { value: "calculate_profit", label: t.action.calculate_profit },
    { value: "review_bad_reviews", label: t.action.review_bad_reviews },
    { value: "apply_sample", label: t.action.apply_sample },
    { value: "prepare_rg", label: t.action.prepare_rg },
    { value: "prepare_pb", label: t.action.prepare_pb },
    { value: "observe", label: t.action.observe },
    { value: "abandon", label: t.action.abandon },
  ];
}

function mapDecisionToCompetitor(record: DecisionRecord): CompetitorLibraryItem {
  return {
    id: record.key,
    source_type: "manual",
    source_id: record.key,
    product_name_ko: record.titleKo,
    product_name_zh: record.titleZh,
    coupang_url: record.coupangUrl,
    image_url: record.imageUrl,
    brand: record.brand,
    category: record.category,
    delivery_type: "",
    seller_type: "",
    monthly_purchase_badge: record.monthlyPurchaseBadge,
    monthly_purchase_level:
      record.monthlyPurchaseBucket === "10000"
        ? "over_10000"
        : record.monthlyPurchaseBucket === "5000"
          ? "over_5000"
          : record.monthlyPurchaseBucket === "3000"
            ? "over_3000"
            : record.monthlyPurchaseBucket === "1000"
              ? "over_1000"
              : "unknown",
    competitor_price_krw: record.currentPrice,
    review_count: record.reviewCount,
    rating: record.rating,
    title_keywords: record.keywords,
    main_image_selling_points: record.coreSellingPoints,
    detail_page_selling_points: record.coreSellingPoints,
    core_selling_points: record.coreSellingPoints,
    positive_review_points: record.coreSellingPoints.slice(0, 3),
    bad_review_samples: record.badReviewSamples,
    consumer_pain_points: record.painPoints.join(" / "),
    pain_point_categories: record.painPointTags.map((item) => painPointLabel(item, ZH_COPY)),
    improvement_opportunities: record.improvementPoints,
    why_it_sells: record.decisionReason,
    supply_chain_fit: supplyLabel(record.supplyChainStatus, ZH_COPY),
    rocket_growth_fit: directionLabel(record.recommendedDirection, ZH_COPY),
    pb_supply_fit: directionLabel(record.recommendedDirection, ZH_COPY),
    own_brand_fit: directionLabel(record.recommendedDirection, ZH_COPY),
    competition_level: mapLevelToCompetitor(record.marketHeat),
    risk_level: mapLevelToCompetitor(record.riskLevel),
    follow_up_value: mapLevelToCompetitor(record.marketHeat),
    improvement_opportunity_level: mapLevelToCompetitor(record.marketHeat),
    follow_up_recommendation: record.nextActionDetail,
    recommended_destination: directionLabel(record.recommendedDirection, ZH_COPY),
    recommended_import_target: directionLabel(record.recommendedDirection, ZH_COPY),
    next_action: record.nextActionDetail,
    is_ignored: record.finalDecision === "abandon",
    ignore_reason: record.finalDecision === "abandon" ? ZH_COPY.metrics.abandon : "",
    imported_to_opportunity_board: record.inOpportunityPool,
    imported_to_product_test: record.inTestingDb,
    imported_to_opportunity_pool: record.inOpportunityPool,
    risk_tags: record.painPointTags.map((item) => painPointLabel(item, ZH_COPY)),
    notes: record.notes,
    status: record.finalDecision === "abandon" ? "ignore" : record.finalDecision === "continue" ? "transfer" : "analyze",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function mapLevelToCompetitor(value: MarketHeat | RiskLevel): "low" | "medium" | "high" {
  if (value === "high" || value === "medium") return value;
  return "low";
}

const ZH_COPY = {
  header: {
    eyebrow: "选品情报看板",
    title: "选品情报看板",
    description: "集中判断商品是否值得开发、采购、测试、提案或放弃，汇总热销数据、竞品、差评、利润、风险和执行动作。",
  },
  hero: {
    badge: "最终选品决策中心",
    title: "把热销样本升级成真正可落地的最终判断工作台",
    description: "这里不再只是看热销列表，而是把商品热度、竞品卖点、差评痛点、利润空间、认证物流风险和下一步动作汇总到同一页，帮助你更快做最终判断。",
    refresh: "刷新热销样本",
    cards: [
      { title: "先看值不值得继续", note: "优先判断热度、评分、评论体量和卖点是否足够支撑继续投入。" },
      { title: "再看利润与风险", note: "把利润空间、认证、物流、退货风险统一放进同一判断链路。" },
      { title: "最后定去向", note: "判断更适合 Rocket Growth、PB、自有品牌、小批量测试还是直接放弃。" },
      { title: "动作必须明确", note: "每个商品都要落到找供应商、算利润、看差评、打样或提案动作。" },
    ],
  },
  metrics: {
    pending: "待最终判断",
    pendingNote: "已进入看板但还没有形成明确最终决策的商品数量。",
    continue: "建议继续推进",
    continueNote: "综合数据较好，值得继续找供应商、核算利润或推进开发。",
    smallTest: "建议小批量测试",
    smallTestNote: "市场数据不错、风险可控，适合先做小批量测试。",
    rg: "适合 Rocket Growth",
    rgNote: "更适合走 Rocket Growth 供货路径的商品数量。",
    pb: "适合 PB 供应",
    pbNote: "适合向 Coupang PB 方向继续研究或提案的商品数量。",
    ownBrand: "适合自有品牌",
    ownBrandNote: "更适合长期做品牌化运营的商品数量。",
    highRisk: "高风险待确认",
    highRiskNote: "认证、物流、退货或差评风险偏高，需要先排雷的商品数量。",
    abandon: "建议放弃",
    abandonNote: "利润差、风险高或问题难解决，不建议继续投入的商品数量。",
  },
  filters: {
    title: "筛选搜索区",
    description: "搜索和筛选会实时联动上方指标和下方列表，不刷新整个页面。",
    search: "搜索商品名称、品牌、品类、Coupang 链接、关键词、差评痛点、推荐方向、备注",
    finalDecision: "最终决策",
    direction: "推荐方向",
    source: "数据来源",
    monthlyPurchase: "月购买人数",
    marketHeat: "市场热度",
    profit: "利润空间",
    risk: "风险等级",
    painPoint: "差评痛点",
    supply: "供应链状态",
    action: "当前动作",
    clear: "清空筛选",
  },
  list: {
    title: "商品最终判断列表",
    description: "左侧不再只是热销样本，而是把市场、竞品、利润、风险和动作压缩成可直接决策的商品列表。",
    market: "市场数据",
    competitor: "竞品判断",
    profitRisk: "利润与风险",
    action: "供应链与动作",
    empty: "当前筛选条件下没有可判断的商品。",
  },
  detail: {
    eyebrow: "商品决策详情",
    empty: "请选择左侧商品查看完整决策详情。",
    basic: "商品基础信息",
    marketData: "市场数据",
    competitorJudgement: "竞品判断",
    profitRisk: "利润与风险",
    recommendation: "推荐方向与最终决策",
    actions: "执行动作",
    riskTags: "差评 / 风险标签",
    dataCompleteness: "数据完整度",
    quickActions: "快捷动作",
    open: "打开 Coupang",
    toCompetitor: "转入竞品库",
    toTesting: "转入测试库",
    toOpportunity: "转入机会池",
    ignore: "标记放弃",
    nameKo: "商品名称韩文",
    nameZh: "商品名称中文",
    keyword: "关键词",
    note: "备注",
    price: "当前售价",
    reviewScore: "评分 / 评论数",
    monthly: "月购买人数",
    heat: "市场热度",
    marketHeat: "市场热度",
    profit: "利润空间",
    marginRate: "预计利润率",
    risk: "风险等级",
    certification: "认证风险",
    logistics: "物流风险",
    returnRisk: "退货风险",
    direction: "推荐方向",
    finalDecision: "最终决策",
    action: "当前动作",
    nextStep: "下一步动作",
    owner: "负责人",
    completeness: "完整度",
    missing: "待补字段",
  },
  bottom: {
    groupsTitle: "决策分组看板",
    groupsDescription: "把商品按最终决策分组，快速看哪些值得推进，哪些该暂停或放弃。",
    missingTitle: "待补充数据清单",
    missingDescription: "找到最影响最终判断的缺失字段，优先补全高价值商品的数据。",
    actionsTitle: "下一步执行动作汇总",
    actionsDescription: "把需要做的动作按类型聚合，方便你按批次推进供应商、利润、差评和提案工作。",
    groupNotes: {
      continue: "值得继续推进，优先推进供应链、利润或提案。",
      smallTest: "适合先小批量验证，避免一上来投入过大。",
      pause: "暂缓处理，先补数据或等待更明确判断。",
      abandon: "当前阶段不建议继续投入时间和资源。",
    },
  },
  decision: {
    pending: "待判断",
    continue: "继续推进",
    small_test: "小批量测试",
    pause: "暂缓",
    abandon: "放弃",
  },
  direction: {
    rocket_growth: "Rocket Growth",
    pb_supply: "PB 供应",
    own_brand: "自有品牌",
    general_test: "普通测试",
    pause: "暂缓",
    abandon: "放弃",
  },
  heat: {
    high: "高",
    medium: "中",
    low: "低",
    unknown: "未显示",
  },
  profit: {
    high: "高利润",
    medium: "中利润",
    low: "低利润",
    missing: "数据不足",
  },
  risk: {
    low: "低风险",
    medium: "中风险",
    high: "高风险",
    missing: "数据不足",
  },
  monthly: {
    "1000": "1,000+",
    "3000": "3,000+",
    "5000": "5,000+",
    "10000": "10,000+",
    unknown: "未显示",
  },
  source: {
    hot: "热销情报中心",
    competitor: "竞品采集库",
    testing: "商品测试数据库",
    opportunity: "商品机会池",
    manual: "手动新增",
  },
  supply: {
    not_started: "未找供应商",
    sourcing: "已找供应商",
    quoted: "已报价",
    sampled: "已打样",
    confirmed: "已确认",
    paused: "暂停",
  },
  action: {
    find_supplier: "找供应商",
    calculate_profit: "算利润",
    review_bad_reviews: "看差评",
    apply_sample: "申请样品",
    prepare_rg: "准备 RG 提案",
    prepare_pb: "准备 PB 提案",
    observe: "继续观察",
    abandon: "放弃",
  },
  painPoint: {
    size: "尺寸问题",
    quality: "质量问题",
    install: "安装问题",
    adhesive: "粘贴不牢",
    material: "材质不满意",
    smell: "气味问题",
    color: "颜色差异",
    package: "包装破损",
    delivery: "配送问题",
    image: "图片不符",
    usability: "使用不方便",
    value: "性价比低",
    return: "退货风险",
  },
  missing: {
    monthly: "月购买人数",
    monthlyNote: "缺少月购买人数会直接影响热度判断。",
    price: "当前售价",
    review: "评论和评分",
    reviewNote: "没有评论样本和评分，很难判断产品是否稳定。",
    profit: "利润空间",
    profitNote: "利润空间缺失时，无法给出可靠推进建议。",
    risk: "风险等级",
    riskNote: "认证、物流和退货风险缺失时，容易误判去向。",
    sellingPoint: "竞品卖点",
    pain: "差评痛点",
    improvement: "可改进点",
    supply: "供应链状态",
    supplyNote: "供应链状态缺失会拖慢后续动作安排。",
    action: "当前动作",
  },
  messages: {
    seeded: "已重新导入热销样本，并同步刷新首页决策看板。",
    toCompetitor: "已转入竞品采集库。",
    toTesting: "已转入商品测试数据库。",
    toOpportunity: "已转入商品机会池。",
    ignored: "已标记为放弃。",
    ignoredReason: "当前阶段不建议继续投入",
  },
  common: {
    all: "全部",
    none: "无",
    noBrand: "无品牌",
    noImage: "无图",
    noData: "数据不足",
  },
};

const KO_COPY: typeof ZH_COPY = {
  header: {
    eyebrow: "선정 정보 보드",
    title: "선정 정보 보드",
    description: "상품이 개발, 소싱, 테스트, 제안 또는 중단 대상인지 한 번에 판단할 수 있도록 열상품 데이터, 경쟁상품, 부정 리뷰, 수익성, 리스크와 실행 액션을 모았습니다.",
  },
  hero: {
    badge: "최종 상품 의사결정 센터",
    title: "열상품 샘플을 실제 최종 판단 워크벤치로 업그레이드",
    description: "이제 단순한 열상품 목록이 아니라 시장 열기, 경쟁사 셀링포인트, 부정 리뷰, 수익성, 인증·물류 리스크, 다음 액션을 한 화면에서 보고 최종 판단할 수 있습니다.",
    refresh: "열상품 샘플 새로고침",
    cards: [
      { title: "먼저 계속 볼지 판단", note: "열기, 평점, 리뷰 볼륨, 셀링포인트가 계속 볼 가치가 있는지 우선 확인합니다." },
      { title: "그다음 수익과 리스크", note: "수익성, 인증, 물류, 반품 리스크를 한 판단 체계 안에서 확인합니다." },
      { title: "마지막으로 경로 결정", note: "Rocket Growth, PB, 자사 브랜드, 소량 테스트, 중단 중 어디로 갈지 결정합니다." },
      { title: "액션은 반드시 명확하게", note: "모든 상품은 공급처 탐색, 수익 계산, 리뷰 확인, 샘플, 제안 중 하나로 떨어져야 합니다." },
    ],
  },
  metrics: {
    pending: "최종 판단 대기",
    pendingNote: "보드에 들어왔지만 아직 최종 결론이 없는 상품 수입니다.",
    continue: "계속 추진 추천",
    continueNote: "종합 데이터가 좋아 공급처 탐색, 수익 계산, 개발 추진을 이어갈 상품 수입니다.",
    smallTest: "소량 테스트 추천",
    smallTestNote: "시장 데이터가 괜찮고 리스크가 통제 가능해 소량 테스트에 적합한 상품 수입니다.",
    rg: "Rocket Growth 적합",
    rgNote: "Rocket Growth 공급 경로가 더 적합한 상품 수입니다.",
    pb: "PB 공급 적합",
    pbNote: "Coupang PB 방향으로 추가 검토하거나 제안할 가치가 있는 상품 수입니다.",
    ownBrand: "자사 브랜드 적합",
    ownBrandNote: "장기적으로 브랜드화 운영에 적합한 상품 수입니다.",
    highRisk: "고위험 확인 대기",
    highRiskNote: "인증, 물류, 반품, 차별화 리스크를 먼저 확인해야 하는 상품 수입니다.",
    abandon: "중단 추천",
    abandonNote: "수익성이 낮거나 리스크가 높아 현재 단계에서 중단이 적합한 상품 수입니다.",
  },
  filters: {
    title: "검색 및 필터",
    description: "검색과 필터는 상단 지표와 하단 리스트에 즉시 반영되며 페이지를 새로고침하지 않습니다.",
    search: "상품명, 브랜드, 카테고리, Coupang 링크, 키워드, 부정 리뷰, 추천 방향, 메모 검색",
    finalDecision: "최종 결정",
    direction: "추천 방향",
    source: "데이터 출처",
    monthlyPurchase: "월 구매 인원",
    marketHeat: "시장 열기",
    profit: "수익성",
    risk: "리스크 등급",
    painPoint: "부정 리뷰 통점",
    supply: "공급망 상태",
    action: "현재 액션",
    clear: "필터 초기화",
  },
  list: {
    title: "상품 최종 판단 리스트",
    description: "왼쪽 리스트는 더 이상 열상품 샘플 목록이 아니라 시장, 경쟁, 수익, 리스크, 액션을 한 줄에 압축한 최종 의사결정 리스트입니다.",
    market: "시장 데이터",
    competitor: "경쟁 판단",
    profitRisk: "수익과 리스크",
    action: "공급망과 액션",
    empty: "현재 조건에 맞는 상품이 없습니다.",
  },
  detail: {
    eyebrow: "상품 의사결정 상세",
    empty: "왼쪽 상품을 선택하면 최종 판단 상세를 볼 수 있습니다.",
    basic: "상품 기본 정보",
    marketData: "시장 데이터",
    competitorJudgement: "경쟁 판단",
    profitRisk: "수익과 리스크",
    recommendation: "추천 방향 및 최종 결정",
    actions: "실행 액션",
    riskTags: "부정 리뷰 / 리스크 태그",
    dataCompleteness: "데이터 완성도",
    quickActions: "빠른 액션",
    open: "Coupang 열기",
    toCompetitor: "경쟁상품库로",
    toTesting: "테스트 DB로",
    toOpportunity: "기회보드로",
    ignore: "중단 표시",
    nameKo: "상품명 한국어",
    nameZh: "상품명 중국어",
    keyword: "키워드",
    note: "메모",
    price: "현재 판매가",
    reviewScore: "평점 / 리뷰 수",
    monthly: "월 구매 인원",
    heat: "시장 열기",
    marketHeat: "시장 열기",
    profit: "수익성",
    marginRate: "예상 마진율",
    risk: "리스크 등급",
    certification: "인증 리스크",
    logistics: "물류 리스크",
    returnRisk: "반품 리스크",
    direction: "추천 방향",
    finalDecision: "최종 결정",
    action: "현재 액션",
    nextStep: "다음 액션",
    owner: "담당자",
    completeness: "완성도",
    missing: "보완 필요 필드",
  },
  bottom: {
    groupsTitle: "결정 그룹 보드",
    groupsDescription: "상품을 최종 결정별로 묶어서 어떤 상품을 계속 추진하고 어떤 상품을 보류·중단할지 빠르게 봅니다.",
    missingTitle: "보완 필요 데이터",
    missingDescription: "최종 판단을 가장 많이 흔드는 누락 필드를 모아 우선 보완합니다.",
    actionsTitle: "다음 실행 액션 요약",
    actionsDescription: "공급처 탐색, 수익 계산, 리뷰 확인, 샘플, 제안 작업을 배치 단위로 모아볼 수 있습니다.",
    groupNotes: {
      continue: "공급망, 수익, 제안까지 계속 밀어도 되는 상품입니다.",
      smallTest: "한 번에 크게 들어가기보다 소량 테스트로 검증하는 편이 좋은 상품입니다.",
      pause: "우선 데이터를 더 보완하거나 시점을 늦춰도 되는 상품입니다.",
      abandon: "현재 단계에서 시간과 자원을 더 넣지 않는 편이 좋은 상품입니다.",
    },
  },
  decision: {
    pending: "대기",
    continue: "계속 추진",
    small_test: "소량 테스트",
    pause: "보류",
    abandon: "중단",
  },
  direction: {
    rocket_growth: "Rocket Growth",
    pb_supply: "PB 공급",
    own_brand: "자사 브랜드",
    general_test: "일반 테스트",
    pause: "보류",
    abandon: "중단",
  },
  heat: {
    high: "높음",
    medium: "중간",
    low: "낮음",
    unknown: "미표시",
  },
  profit: {
    high: "고수익",
    medium: "중수익",
    low: "저수익",
    missing: "데이터 부족",
  },
  risk: {
    low: "저위험",
    medium: "중위험",
    high: "고위험",
    missing: "데이터 부족",
  },
  monthly: {
    "1000": "1,000+",
    "3000": "3,000+",
    "5000": "5,000+",
    "10000": "10,000+",
    unknown: "미표시",
  },
  source: {
    hot: "열상품 정보",
    competitor: "경쟁상품 수집库",
    testing: "상품 테스트 DB",
    opportunity: "상품 기회보드",
    manual: "수동 추가",
  },
  supply: {
    not_started: "공급처 미착수",
    sourcing: "공급처 탐색중",
    quoted: "견적 확보",
    sampled: "샘플 진행",
    confirmed: "확정",
    paused: "중단",
  },
  action: {
    find_supplier: "공급처 찾기",
    calculate_profit: "수익 계산",
    review_bad_reviews: "부정 리뷰 보기",
    apply_sample: "샘플 신청",
    prepare_rg: "RG 제안 준비",
    prepare_pb: "PB 제안 준비",
    observe: "계속 관찰",
    abandon: "중단",
  },
  painPoint: {
    size: "사이즈 문제",
    quality: "품질 문제",
    install: "설치 문제",
    adhesive: "부착 불량",
    material: "소재 불만",
    smell: "냄새 문제",
    color: "색상 차이",
    package: "포장 파손",
    delivery: "배송 문제",
    image: "이미지 불일치",
    usability: "사용 불편",
    value: "가성비 낮음",
    return: "반품 리스크",
  },
  missing: {
    monthly: "월 구매 인원",
    monthlyNote: "월 구매 인원이 비어 있으면 시장 열기를 안정적으로 판단하기 어렵습니다.",
    price: "현재 판매가",
    review: "리뷰와 평점",
    reviewNote: "부정 리뷰와 평점이 비어 있으면 제품 안정성을 읽기 어렵습니다.",
    profit: "수익성",
    profitNote: "수익성이 비어 있으면 추진 여부를 신뢰 있게 결정할 수 없습니다.",
    risk: "리스크 등급",
    riskNote: "인증·물류·반품 리스크가 비면 방향 결정이 흔들립니다.",
    sellingPoint: "경쟁 셀링포인트",
    pain: "부정 리뷰 통점",
    improvement: "개선 포인트",
    supply: "공급망 상태",
    supplyNote: "공급망 상태가 비어 있으면 다음 실행 우선순위가 흐려집니다.",
    action: "현재 액션",
  },
  messages: {
    seeded: "열상품 샘플을 다시 불러와 메인 의사결정 보드를 새로고침했습니다.",
    toCompetitor: "경쟁상품 수집库로 보냈습니다.",
    toTesting: "상품 테스트 DB로 보냈습니다.",
    toOpportunity: "상품 기회보드로 보냈습니다.",
    ignored: "중단 상태로 표시했습니다.",
    ignoredReason: "현재 단계에서는 우선순위가 낮음",
  },
  common: {
    all: "전체",
    none: "없음",
    noBrand: "브랜드 없음",
    noImage: "이미지 없음",
    noData: "데이터 부족",
  },
};

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRightLeft,
  Database,
  FolderSync,
  PackageSearch,
  Search,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useLocale } from "@/components/locale-provider";
import { loadLocalProducts } from "@/lib/local-products";
import { loadLocalProductOpportunities } from "@/lib/product-opportunities-local";
import {
  loadLocalHotProductIntelligence,
  buildHotProductFromSampleRow,
  type HotProductIntelligenceItem,
} from "@/lib/hot-product-intelligence-local";
import {
  loadLocalCompetitorLibrary,
  mergeCompetitorLibraryItems,
  replaceLocalCompetitorLibrary,
  updateCompetitorLibraryItem,
  type CompetitorLibraryItem,
  type CompetitorLibraryLevel,
  type CompetitorLibraryStatus,
} from "@/lib/competitor-library-local";

type SampleRow = Record<string, unknown>;

type Filters = {
  query: string;
  reviews: "all" | "over_1000" | "over_3000" | "over_5000" | "over_10000";
  category: string;
  delivery: string;
  seller: string;
  status: "all" | CompetitorLibraryStatus;
  risk: "all" | CompetitorLibraryLevel;
  source: "all" | CompetitorLibraryItem["source_type"];
  followUp: "all" | CompetitorLibraryLevel;
};

export function CompetitorLibraryWorkbench() {
  const { locale } = useLocale();
  const t = locale === "ko" ? KO_COPY : ZH_COPY;
  const [items, setItems] = useState<CompetitorLibraryItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    query: "",
    reviews: "all",
    category: "all",
    delivery: "all",
    seller: "all",
    status: "all",
    risk: "all",
    source: "all",
    followUp: "all",
  });

  useEffect(() => {
    const loaded = loadLocalCompetitorLibrary();
    setItems(loaded);
    setSelectedId(loaded[0]?.id ?? null);
  }, []);

  useEffect(() => {
    if (items.length > 0) return;
    void seedLibrary();
  }, [items.length]);

  const categories = useMemo(() => uniqueValues(items.map((item) => item.category)), [items]);
  const deliveries = useMemo(() => uniqueValues(items.map((item) => item.delivery_type)), [items]);
  const sellers = useMemo(() => uniqueValues(items.map((item) => item.seller_type)), [items]);

  const filtered = useMemo(() => {
    const keyword = filters.query.trim().toLowerCase();
    return items.filter((item) => {
      const text = [
        item.product_name_ko,
        item.product_name_zh,
        item.brand,
        item.category,
        item.consumer_pain_points,
        item.follow_up_recommendation,
        item.recommended_destination,
        item.risk_tags.join(" "),
        item.improvement_opportunities.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!keyword || text.includes(keyword)) &&
        (filters.reviews === "all" || matchesReviewTier(item.review_count, filters.reviews)) &&
        (filters.category === "all" || item.category === filters.category) &&
        (filters.delivery === "all" || item.delivery_type === filters.delivery) &&
        (filters.seller === "all" || item.seller_type === filters.seller) &&
        (filters.status === "all" || item.status === filters.status) &&
        (filters.risk === "all" || item.risk_level === filters.risk) &&
        (filters.source === "all" || item.source_type === filters.source) &&
        (filters.followUp === "all" || item.follow_up_value === filters.followUp)
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

  const metrics = useMemo(() => {
    return [
      {
        label: t.metrics.total,
        value: items.length,
        note: t.metrics.totalNote,
        icon: <Database className="h-4 w-4" />,
      },
      {
        label: t.metrics.improve,
        value: items.filter((item) => item.improvement_opportunity_level === "high").length,
        note: t.metrics.improveNote,
        tone: "success" as const,
        icon: <Sparkles className="h-4 w-4" />,
      },
      {
        label: t.metrics.competition,
        value: items.filter((item) => item.competition_level === "high").length,
        note: t.metrics.competitionNote,
        tone: "warning" as const,
        icon: <TrendingUp className="h-4 w-4" />,
      },
      {
        label: t.metrics.transfer,
        value: items.filter((item) => item.status === "transfer").length,
        note: t.metrics.transferNote,
        tone: "success" as const,
        icon: <ArrowRightLeft className="h-4 w-4" />,
      },
      {
        label: t.metrics.watch,
        value: items.filter((item) => item.status === "watch").length,
        note: t.metrics.watchNote,
        icon: <Target className="h-4 w-4" />,
      },
      {
        label: t.metrics.ignored,
        value: items.filter((item) => item.is_ignored).length,
        note: t.metrics.ignoredNote,
        tone: "danger" as const,
        icon: <ShieldAlert className="h-4 w-4" />,
      },
      {
        label: t.metrics.reviews,
        value: items.filter((item) => item.review_count >= 5000).length,
        note: t.metrics.reviewsNote,
        icon: <PackageSearch className="h-4 w-4" />,
      },
      {
        label: t.metrics.rating,
        value: items.filter((item) => item.rating >= 4.5).length,
        note: t.metrics.ratingNote,
        icon: <Sparkles className="h-4 w-4" />,
      },
    ];
  }, [items, t]);

  function persist(next: CompetitorLibraryItem[], message?: string) {
    replaceLocalCompetitorLibrary(next);
    setItems(next);
    if (message) setBanner(message);
  }

  async function seedLibrary() {
    let hotItems = loadLocalHotProductIntelligence();
    if (!hotItems.length) {
      const sampleModule = await import("@/data/coupang_hot_products_50.json");
      hotItems = ((sampleModule.default as SampleRow[]) ?? []).map(buildHotProductFromSampleRow);
    }

    const next = mergeCompetitorLibraryItems([], [
      ...hotItems.map(mapHotToCompetitor),
      ...loadLocalProducts().map(mapTestingDbToCompetitor),
      ...loadLocalProductOpportunities().map(mapOpportunityToCompetitor),
    ]);

    if (!next.length) return;
    persist(next, t.messages.seeded);
  }

  async function syncHotProducts() {
    let hotItems = loadLocalHotProductIntelligence();
    if (!hotItems.length) {
      const sampleModule = await import("@/data/coupang_hot_products_50.json");
      hotItems = ((sampleModule.default as SampleRow[]) ?? []).map(buildHotProductFromSampleRow);
    }
    persist(mergeCompetitorLibraryItems(items, hotItems.map(mapHotToCompetitor)), t.messages.hot);
  }

  function syncTestingDb() {
    persist(mergeCompetitorLibraryItems(items, loadLocalProducts().map(mapTestingDbToCompetitor)), t.messages.testingDb);
  }

  function syncOpportunity() {
    persist(mergeCompetitorLibraryItems(items, loadLocalProductOpportunities().map(mapOpportunityToCompetitor)), t.messages.opportunity);
  }

  function setStatus(item: CompetitorLibraryItem, status: CompetitorLibraryStatus) {
    persist(
      updateCompetitorLibraryItem(items, item.id, (current) => ({
        ...current,
        status,
        is_ignored: status === "ignore",
        ignore_reason: status === "ignore" ? current.ignore_reason || t.messages.ignoreReason : "",
      })),
      t.messages.statusUpdated,
    );
  }

  return (
    <>
      <PageHeader eyebrow={t.header.eyebrow} title={t.header.title} description={t.header.description} />
      <div className="flex w-full flex-col gap-6 px-5 py-8 sm:px-8 lg:px-10 2xl:px-12">
        <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-[linear-gradient(135deg,#f8fafc_0%,#ffffff_46%,#eff6ff_100%)]">
          <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.95fr)] lg:px-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/90 px-3 py-1 text-xs font-semibold text-sky-700">
                <Database className="h-3.5 w-3.5" />
                {t.hero.badge}
              </div>
              <h2 className="mt-4 text-[28px] font-semibold tracking-[-0.04em] text-slate-950">{t.hero.title}</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{t.hero.description}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button onClick={() => void syncHotProducts()}>
                  <FolderSync className="h-4 w-4" />
                  {t.hero.syncHot}
                </Button>
                <Button variant="outline" onClick={syncTestingDb}>{t.hero.syncTestingDb}</Button>
                <Button variant="outline" onClick={syncOpportunity}>{t.hero.syncOpportunity}</Button>
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

        {banner ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{banner}</div> : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <StatCard key={metric.label} label={metric.label} value={metric.value} note={metric.note} tone={metric.tone} icon={metric.icon} />
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_440px]">
          <div className="space-y-6">
            <SectionCard title={t.filters.title} description={t.filters.description}>
              <div className="flex flex-col gap-4">
                <div className="relative max-w-xl">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={filters.query}
                    onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
                    placeholder={t.filters.search}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <SelectField label={t.filters.reviews} value={filters.reviews} onChange={(value) => setFilters((current) => ({ ...current, reviews: value as Filters["reviews"] }))} options={reviewOptions(t)} />
                  <SelectField label={t.filters.category} value={filters.category} onChange={(value) => setFilters((current) => ({ ...current, category: value }))} options={buildOptions(categories, t.filters.all)} />
                  <SelectField label={t.filters.delivery} value={filters.delivery} onChange={(value) => setFilters((current) => ({ ...current, delivery: value }))} options={buildOptions(deliveries, t.filters.all)} />
                  <SelectField label={t.filters.seller} value={filters.seller} onChange={(value) => setFilters((current) => ({ ...current, seller: value }))} options={buildOptions(sellers, t.filters.all)} />
                  <SelectField label={t.filters.status} value={filters.status} onChange={(value) => setFilters((current) => ({ ...current, status: value as Filters["status"] }))} options={statusOptions(t)} />
                  <SelectField label={t.filters.risk} value={filters.risk} onChange={(value) => setFilters((current) => ({ ...current, risk: value as Filters["risk"] }))} options={levelOptions(t)} />
                  <SelectField label={t.filters.source} value={filters.source} onChange={(value) => setFilters((current) => ({ ...current, source: value as Filters["source"] }))} options={sourceOptions(t)} />
                  <SelectField label={t.filters.followUp} value={filters.followUp} onChange={(value) => setFilters((current) => ({ ...current, followUp: value as Filters["followUp"] }))} options={levelOptions(t)} />
                </div>
              </div>
            </SectionCard>

            <SectionCard title={t.list.title} description={t.list.description}>
              <div className="space-y-3">
                {filtered.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`grid w-full gap-4 rounded-[18px] border p-5 text-left transition-colors lg:grid-cols-[minmax(0,1.55fr)_120px_120px_130px] ${
                      item.id === selectedId ? "border-slate-900 bg-slate-950 text-white" : "border-slate-200 bg-slate-50/55 hover:bg-slate-50"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className={`truncate text-base font-semibold tracking-[-0.02em] ${item.id === selectedId ? "text-white" : "text-slate-950"}`}>
                        {locale === "ko" ? item.product_name_ko : item.product_name_zh || item.product_name_ko}
                      </p>
                      <p className={`mt-2 text-sm ${item.id === selectedId ? "text-slate-300" : "text-slate-500"}`}>
                        {item.brand || t.common.noBrand} · {item.category}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <StatusBadge tone="neutral">{sourceLabel(item.source_type, t)}</StatusBadge>
                        <StatusBadge tone={toneForLevel(item.risk_level)}>{levelLabel(item.risk_level, t)}</StatusBadge>
                        <StatusBadge tone="warning">{statusLabel(item.status, t)}</StatusBadge>
                      </div>
                    </div>
                    <Metric label={t.list.improve} value={levelLabel(item.improvement_opportunity_level, t)} selected={item.id === selectedId} />
                    <Metric label={t.list.competition} value={levelLabel(item.competition_level, t)} selected={item.id === selectedId} />
                    <Metric label={t.list.rating} value={`${item.rating}`} selected={item.id === selectedId} />
                  </button>
                ))}
                {!filtered.length ? <EmptyPanel message={t.list.empty} /> : null}
              </div>
            </SectionCard>
          </div>

          <Card className="h-fit overflow-hidden">
            <CardHeader className="space-y-4">
              {selected ? (
                <>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{t.detail.eyebrow}</p>
                    <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-950">
                      {locale === "ko" ? selected.product_name_ko : selected.product_name_zh || selected.product_name_ko}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">{selected.review_count} reviews · {selected.competitor_price_krw} KRW</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <MiniStat label={t.detail.improve} value={levelLabel(selected.improvement_opportunity_level, t)} />
                    <MiniStat label={t.detail.competition} value={levelLabel(selected.competition_level, t)} />
                    <MiniStat label={t.detail.rating} value={`${selected.rating}`} />
                    <MiniStat label={t.detail.target} value={selected.recommended_destination || "-"} />
                  </div>
                </>
              ) : null}
            </CardHeader>
            {selected ? (
              <CardContent className="space-y-6">
                <DetailSection title={t.detail.sellingPoints}>
                  <SimpleList items={selected.core_selling_points} empty={t.common.none} />
                </DetailSection>

                <DetailSection title={t.detail.badReviews}>
                  <SimpleList items={selected.bad_review_samples} empty={t.common.none} />
                </DetailSection>

                <DetailSection title={t.detail.pain}>
                  <p className="text-sm leading-6 text-slate-600">{selected.consumer_pain_points || t.common.none}</p>
                </DetailSection>

                <DetailSection title={t.detail.improvements}>
                  <SimpleList items={selected.improvement_opportunities} empty={t.common.none} />
                </DetailSection>

                <DetailSection title={t.detail.fits}>
                  <div className="space-y-2 text-sm text-slate-600">
                    <InfoRow label="Supply chain" value={selected.supply_chain_fit || t.common.none} />
                    <InfoRow label="Rocket Growth" value={selected.rocket_growth_fit || t.common.none} />
                    <InfoRow label="PB" value={selected.pb_supply_fit || t.common.none} />
                    <InfoRow label="Own brand" value={selected.own_brand_fit || t.common.none} />
                  </div>
                </DetailSection>

                <DetailSection title={t.detail.risks}>
                  <div className="flex flex-wrap gap-2">
                    {selected.risk_tags.map((tag) => (
                      <StatusBadge key={tag} tone="warning">{tag}</StatusBadge>
                    ))}
                    {!selected.risk_tags.length ? <p className="text-sm text-slate-500">{t.common.none}</p> : null}
                  </div>
                </DetailSection>

                <DetailSection title={t.detail.nextAction}>
                  <p className="text-sm leading-6 text-slate-600">{selected.next_action || selected.follow_up_recommendation || t.common.none}</p>
                </DetailSection>

                <DetailSection title={t.detail.actions}>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => setStatus(selected, "analyze")}>{t.detail.toAnalyze}</Button>
                    <Button variant="outline" onClick={() => setStatus(selected, "transfer")}>{t.detail.toTransfer}</Button>
                    <Button variant="outline" onClick={() => setStatus(selected, "watch")}>{t.detail.toWatch}</Button>
                    <Button variant="outline" onClick={() => setStatus(selected, "ignore")}>{t.detail.toIgnore}</Button>
                    {selected.coupang_url ? (
                      <a href={selected.coupang_url} target="_blank" rel="noreferrer">
                        <Button variant="outline">{t.detail.open}</Button>
                      </a>
                    ) : null}
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
      </div>
    </>
  );
}

function mapHotToCompetitor(item: HotProductIntelligenceItem): CompetitorLibraryItem {
  return {
    id: `hot-${item.id}`,
    source_type: "hot_products",
    source_id: item.id,
    product_name_ko: item.product_name_ko,
    product_name_zh: item.product_name_zh,
    coupang_url: item.coupang_url,
    image_url: item.image_url,
    brand: item.brand,
    category: item.category,
    delivery_type: item.delivery_type,
    seller_type: item.seller_type,
    monthly_purchase_badge: item.monthly_purchase_badge,
    monthly_purchase_level: item.monthly_purchase_level,
    competitor_price_krw: item.competitor_price_krw,
    review_count: item.review_count,
    rating: item.rating,
    title_keywords: item.keywords,
    main_image_selling_points: item.core_selling_points,
    detail_page_selling_points: item.core_selling_points,
    core_selling_points: item.core_selling_points,
    positive_review_points: item.core_selling_points.slice(0, 3),
    bad_review_samples: item.bad_review_samples,
    consumer_pain_points: item.consumer_pain_points,
    pain_point_categories: item.risk_tags,
    improvement_opportunities: [item.next_action].filter(Boolean),
    why_it_sells: item.hot_reason,
    supply_chain_fit: item.risk_tags.includes("电子/KC") ? "先确认认证和供货稳定性" : "可先找 2-3 家工厂对标",
    rocket_growth_fit: /rocket|rg/i.test(item.recommendation_type) ? "适合继续做 RG 判断" : "先补物流和卖点差异化判断",
    pb_supply_fit: /pb/i.test(item.recommendation_type) ? "适合继续做 PB 供应判断" : "先看差评能否形成改良空间",
    own_brand_fit: /own|品牌|自有/i.test(item.recommendation_type) ? "可考虑自有品牌路线" : "暂不建议直接品牌化",
    competition_level: item.competition_level,
    risk_level: item.risk_level,
    follow_up_value: item.opportunity_level,
    improvement_opportunity_level: item.opportunity_level,
    follow_up_recommendation: item.next_action,
    recommended_destination: item.recommended_destination,
    recommended_import_target: item.recommendation_type || item.recommended_destination,
    next_action: item.next_action,
    is_ignored: false,
    ignore_reason: "",
    imported_to_opportunity_board: item.imported_to_opportunity_pool,
    imported_to_product_test: item.imported_to_product_test,
    imported_to_opportunity_pool: item.imported_to_opportunity_pool,
    risk_tags: item.risk_tags,
    notes: item.market_analysis,
    status: item.risk_level === "high" ? "watch" : "analyze",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function mapTestingDbToCompetitor(row: ReturnType<typeof loadLocalProducts>[number]): CompetitorLibraryItem {
  return {
    id: `testing-${row.id}`,
    source_type: "testing_db",
    source_id: row.id,
    product_name_ko: row.productNameKo,
    product_name_zh: row.productNameZh,
    coupang_url: row.competitorUrl,
    image_url: row.image,
    brand: row.brand,
    category: row.category,
    delivery_type: row.deliveryType,
    seller_type: row.sellerType,
    monthly_purchase_badge: "",
    monthly_purchase_level: "unknown",
    competitor_price_krw: row.competitorSalePriceKrw,
    review_count: row.reviewCount,
    rating: row.rating,
    title_keywords: row.keywords,
    main_image_selling_points: row.sellingPoints,
    detail_page_selling_points: row.sellingPoints,
    core_selling_points: row.sellingPoints,
    positive_review_points: row.sellingPoints.slice(0, 3),
    bad_review_samples: row.reviews.slice(0, 6),
    consumer_pain_points: row.consumerPainPoints,
    pain_point_categories: row.possibleHighReturn ? ["高退货风险"] : [],
    improvement_opportunities: [row.productDevelopmentDirection, row.sampleDevelopmentAdvice].filter(Boolean),
    why_it_sells: row.recommendationReason,
    supply_chain_fit: row.supplierQuoteCount > 0 ? "已有供应链线索" : "需要补供应商报价",
    rocket_growth_fit: row.status.includes("RG") ? "已具备 RG 信号" : "需继续观察",
    pb_supply_fit: row.status.includes("PB") ? "已具备 PB 信号" : "需继续观察",
    own_brand_fit: row.productDevelopmentDirection || "",
    competition_level: row.reviewCount >= 5000 ? "high" : row.reviewCount >= 1500 ? "medium" : "low",
    risk_level: row.possibleHighReturn || row.coupangRestricted ? "high" : row.fragile || row.needsKcCertification ? "medium" : "low",
    follow_up_value: row.productDevelopmentDirection ? "high" : "medium",
    improvement_opportunity_level: row.productDevelopmentDirection ? "high" : "medium",
    follow_up_recommendation: row.productDevelopmentDirection || row.sampleDevelopmentAdvice,
    recommended_destination: row.recommendationReason,
    recommended_import_target: row.recommendationReason,
    next_action: row.sampleDevelopmentAdvice || row.productDevelopmentDirection,
    is_ignored: false,
    ignore_reason: "",
    imported_to_opportunity_board: false,
    imported_to_product_test: true,
    imported_to_opportunity_pool: false,
    risk_tags: [
      row.needsKcCertification ? "KC 风险" : "",
      row.fragile ? "易碎物流" : "",
      row.possibleHighReturn ? "高退货风险" : "",
      row.coupangRestricted ? "平台限制" : "",
    ].filter(Boolean),
    notes: row.marketAnalysis,
    status: row.productDevelopmentDirection ? "transfer" : "watch",
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  };
}

function mapOpportunityToCompetitor(row: ReturnType<typeof loadLocalProductOpportunities>[number]): CompetitorLibraryItem {
  return {
    id: `opp-${row.id}`,
    source_type: "opportunity_board",
    source_id: row.id,
    product_name_ko: row.title,
    product_name_zh: row.title,
    coupang_url: row.coupang_url ?? "",
    image_url: row.image_url ?? "",
    brand: "",
    category: row.category,
    delivery_type: "",
    seller_type: "",
    monthly_purchase_badge: row.demand_stability ?? "",
    monthly_purchase_level: "unknown",
    competitor_price_krw: Number(row.price ?? 0),
    review_count: Number(row.review_count ?? 0),
    rating: Number(row.rating ?? 0),
    title_keywords: [],
    main_image_selling_points: splitValue(row.improvement_points),
    detail_page_selling_points: splitValue(row.improvement_points),
    core_selling_points: splitValue(row.improvement_points),
    positive_review_points: splitValue(row.improvement_points).slice(0, 3),
    bad_review_samples: splitValue(row.negative_review_keywords),
    consumer_pain_points: row.review_issue_summary ?? "",
    pain_point_categories: [],
    improvement_opportunities: splitValue(row.improvement_points),
    why_it_sells: row.notes ?? "",
    supply_chain_fit: row.supply_chain_risk === "high" ? "供应链需重新确认" : "可继续验证供应链",
    rocket_growth_fit: row.business_type === "rocket_growth" ? "已进入 RG 路线" : "待判断",
    pb_supply_fit: row.business_type === "pb_supply" ? "已进入 PB 路线" : "待判断",
    own_brand_fit: row.long_term_fit ? "有长期品牌化可能" : "",
    competition_level: row.competition_level ?? "medium",
    risk_level: row.risk_level ?? "medium",
    follow_up_value: row.profit_level ?? "medium",
    improvement_opportunity_level: row.market_heat ?? "medium",
    follow_up_recommendation: row.next_action ?? "",
    recommended_destination: row.business_type,
    recommended_import_target: row.business_type,
    next_action: row.next_action ?? "",
    is_ignored: row.status === "dropped",
    ignore_reason: row.status === "dropped" ? "机会池已放弃" : "",
    imported_to_opportunity_board: true,
    imported_to_product_test: false,
    imported_to_opportunity_pool: true,
    risk_tags: [],
    notes: row.notes ?? "",
    status: row.status === "dropped" ? "ignore" : row.status === "high_potential" ? "transfer" : "analyze",
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function splitValue(value: string | null | undefined) {
  return String(value ?? "")
    .split(/[,\n/|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function matchesReviewTier(reviewCount: number, tier: Filters["reviews"]) {
  if (tier === "over_10000") return reviewCount >= 10000;
  if (tier === "over_5000") return reviewCount >= 5000;
  if (tier === "over_3000") return reviewCount >= 3000;
  return reviewCount >= 1000;
}

function uniqueValues(values: string[]) {
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))];
}

function buildOptions(values: string[], allLabel: string) {
  return [{ value: "all", label: allLabel }, ...values.map((value) => ({ value, label: value }))];
}

function reviewOptions(t: typeof ZH_COPY) {
  return [
    { value: "all", label: t.filters.all },
    { value: "over_1000", label: t.filters.review1000 },
    { value: "over_3000", label: t.filters.review3000 },
    { value: "over_5000", label: t.filters.review5000 },
    { value: "over_10000", label: t.filters.review10000 },
  ];
}

function statusOptions(t: typeof ZH_COPY) {
  return [
    { value: "all", label: t.filters.all },
    { value: "new", label: t.status.new },
    { value: "watch", label: t.status.watch },
    { value: "analyze", label: t.status.analyze },
    { value: "transfer", label: t.status.transfer },
    { value: "ignore", label: t.status.ignore },
  ];
}

function levelOptions(t: typeof ZH_COPY) {
  return [
    { value: "all", label: t.filters.all },
    { value: "low", label: t.levels.low },
    { value: "medium", label: t.levels.medium },
    { value: "high", label: t.levels.high },
  ];
}

function sourceOptions(t: typeof ZH_COPY) {
  return [
    { value: "all", label: t.filters.all },
    { value: "hot_products", label: t.sources.hot_products },
    { value: "testing_db", label: t.sources.testing_db },
    { value: "opportunity_board", label: t.sources.opportunity_board },
    { value: "manual", label: t.sources.manual },
  ];
}

function sourceLabel(source: CompetitorLibraryItem["source_type"], t: typeof ZH_COPY) {
  return t.sources[source];
}

function statusLabel(status: CompetitorLibraryStatus, t: typeof ZH_COPY) {
  return t.status[status];
}

function levelLabel(level: CompetitorLibraryLevel, t: typeof ZH_COPY) {
  return t.levels[level];
}

function toneForLevel(level: CompetitorLibraryLevel) {
  if (level === "high") return "danger" as const;
  if (level === "medium") return "warning" as const;
  return "success" as const;
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

function Metric({ label, value, selected }: { label: string; value: string; selected: boolean }) {
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

function SimpleList({ items, empty }: { items: string[]; empty: string }) {
  return (
    <div className="space-y-2">
      {items.length ? items.map((item, index) => (
        <div key={`${item}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
          {item}
        </div>
      )) : <p className="text-sm text-slate-500">{empty}</p>}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{value}</p>
    </div>
  );
}

function EmptyPanel({ message }: { message: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">{message}</div>;
}

const ZH_COPY = {
  header: {
    eyebrow: "COMPETITOR LIBRARY",
    title: "Coupang 竞品采集库",
    description: "把热销样本、商品测试库和机会池里的竞品信息沉淀成统一库，用来判断卖点、痛点、竞争壁垒和下一步去向。",
  },
  hero: {
    badge: "统一竞品采集库",
    title: "把所有竞品信息集中起来，别再散落在测试库、机会池和零碎备注里",
    description: "这里不是临时记笔记，而是长期维护竞品资产。你可以统一管理竞品卖点、差评样本、改良空间、供应链适配、RG/PB/自有品牌适合度和下一步动作。",
    syncHot: "同步热销情报",
    syncTestingDb: "同步商品测试库",
    syncOpportunity: "同步机会池",
    cards: [
      { title: "先看卖点", note: "先看竞品到底靠什么卖，而不是只看价格。" },
      { title: "再看差评", note: "差评和用户痛点才是真正的改良入口。" },
      { title: "再看壁垒", note: "评论量、评分和风险决定要不要继续跟。" },
      { title: "最后给动作", note: "每条竞品都要落到分析、转动作、继续观察或忽略。" },
    ],
  },
  metrics: {
    total: "竞品条目数",
    totalNote: "当前竞品库中的总样本数。",
    improve: "高改良空间",
    improveNote: "差评和痛点足够集中，值得继续做改良判断。",
    competition: "高竞争壁垒",
    competitionNote: "评论量和强评分已经形成高门槛。",
    transfer: "可转动作",
    transferNote: "适合继续转入机会或开发动作的竞品。",
    watch: "继续观察",
    watchNote: "暂时保留在竞品库里继续跟踪的竞品。",
    ignored: "已忽略",
    ignoredNote: "明确不继续跟进的竞品。",
    reviews: "高评论竞品",
    reviewsNote: "评论量达到头部区间的竞品数。",
    rating: "高评分竞品",
    ratingNote: "评分明显高于普通样本的竞品数。",
  },
  filters: {
    title: "竞品筛选",
    description: "按评论层级、类目、配送方式、卖家类型、状态、风险和来源快速筛出最值得继续分析的竞品。",
    search: "搜索商品名、品牌、类目、痛点、改良建议、推荐去向",
    reviews: "评论层级",
    review1000: "1000+",
    review3000: "3000+",
    review5000: "5000+",
    review10000: "10000+",
    category: "类目",
    delivery: "配送方式",
    seller: "卖家类型",
    status: "状态",
    risk: "风险等级",
    source: "来源",
    followUp: "跟进价值",
    all: "全部",
  },
  list: {
    title: "竞品清单",
    description: "集中管理你已经看过、值得看和不值得再看的竞品。",
    improve: "改良空间",
    competition: "竞争壁垒",
    rating: "评分",
    empty: "当前没有符合筛选条件的竞品记录。",
  },
  detail: {
    eyebrow: "Competitor Detail",
    improve: "改良空间",
    competition: "竞争壁垒",
    rating: "评分",
    target: "推荐去向",
    sellingPoints: "核心卖点",
    badReviews: "差评样本",
    pain: "用户痛点",
    improvements: "改良机会",
    fits: "业务适配判断",
    risks: "风险标签",
    nextAction: "下一步动作",
    actions: "状态动作",
    toAnalyze: "标记分析中",
    toTransfer: "标记可转动作",
    toWatch: "标记继续观察",
    toIgnore: "标记忽略",
    open: "打开 Coupang",
  },
  status: {
    new: "新进入",
    watch: "继续观察",
    analyze: "继续分析",
    transfer: "可转动作",
    ignore: "忽略",
  },
  levels: {
    low: "低",
    medium: "中",
    high: "高",
  },
  sources: {
    hot_products: "热销情报",
    testing_db: "商品测试库",
    opportunity_board: "机会池",
    manual: "手动录入",
  },
  messages: {
    hot: "已把热销情报同步进竞品库。",
    testingDb: "已把商品测试库同步进竞品库。",
    opportunity: "已把机会池同步进竞品库。",
    seeded: "已把热销情报、商品测试库和机会池的样本自动汇入竞品库。",
    statusUpdated: "竞品状态已更新。",
    ignoreReason: "当前不值得继续跟进",
  },
  common: {
    noBrand: "无品牌",
    none: "无",
  },
};

const KO_COPY: typeof ZH_COPY = {
  header: {
    eyebrow: "COMPETITOR LIBRARY",
    title: "Coupang 경쟁상품 수집 라이브러리",
    description: "히트상품 샘플, 상품 테스트 DB, 기회보드의 경쟁상품 정보를 하나의 라이브러리로 모아 관리합니다.",
  },
  hero: {
    badge: "통합 경쟁상품 라이브러리",
    title: "모든 경쟁상품 정보를 한곳에 모아 테스트 DB, 기회보드, 메모에 흩어지지 않게 만듭니다.",
    description: "이 화면은 메모장이 아니라 장기 운영용 경쟁상품 자산 라이브러리입니다. 판매 포인트, 부정 리뷰, 개선 포인트, 공급망 적합도와 RG/PB/브랜드 적합도를 함께 판단합니다.",
    syncHot: "히트상품 인텔리전스 반영",
    syncTestingDb: "상품 테스트 DB 반영",
    syncOpportunity: "기회보드 반영",
    cards: [
      { title: "판매 포인트 확인", note: "가격보다 먼저 무엇으로 팔리는지 봅니다." },
      { title: "부정 리뷰 확인", note: "불만과 문제점이 실제 개선 기회입니다." },
      { title: "장벽 확인", note: "리뷰량, 평점, 리스크가 계속 볼 가치가 있는지 결정합니다." },
      { title: "액션 연결", note: "모든 경쟁상품은 분석, 전환, 관찰, 무시 중 하나로 정리합니다." },
    ],
  },
  metrics: {
    total: "경쟁상품 수",
    totalNote: "현재 라이브러리의 총 샘플 수입니다.",
    improve: "고개선 여지",
    improveNote: "부정 리뷰와 문제점이 집중된 샘플입니다.",
    competition: "고경쟁 장벽",
    competitionNote: "리뷰량과 평점이 이미 높은 샘플입니다.",
    transfer: "액션 전환 가능",
    transferNote: "기회나 개발 액션으로 넘길 수 있는 경쟁상품입니다.",
    watch: "계속 관찰",
    watchNote: "당장은 유지하면서 계속 볼 경쟁상품입니다.",
    ignored: "무시 처리",
    ignoredNote: "더 이상 추적하지 않을 경쟁상품입니다.",
    reviews: "고리뷰 경쟁상품",
    reviewsNote: "리뷰량이 상위권인 경쟁상품 수입니다.",
    rating: "고평점 경쟁상품",
    ratingNote: "평점이 높은 경쟁상품 수입니다.",
  },
  filters: {
    title: "경쟁상품 필터",
    description: "리뷰 레벨, 카테고리, 배송 방식, 판매자 유형, 상태, 리스크, 출처로 우선순위를 빠르게 찾습니다.",
    search: "상품명, 브랜드, 카테고리, 문제점, 개선 제안, 추천 경로 검색",
    reviews: "리뷰 레벨",
    review1000: "1000+",
    review3000: "3000+",
    review5000: "5000+",
    review10000: "10000+",
    category: "카테고리",
    delivery: "배송 방식",
    seller: "판매자 유형",
    status: "상태",
    risk: "리스크 레벨",
    source: "출처",
    followUp: "후속 가치",
    all: "전체",
  },
  list: {
    title: "경쟁상품 목록",
    description: "이미 본 경쟁상품, 계속 볼 가치가 있는 경쟁상품, 버릴 경쟁상품을 한 화면에서 관리합니다.",
    improve: "개선 여지",
    competition: "경쟁 장벽",
    rating: "평점",
    empty: "필터 조건에 맞는 경쟁상품 기록이 없습니다.",
  },
  detail: {
    eyebrow: "Competitor Detail",
    improve: "개선 여지",
    competition: "경쟁 장벽",
    rating: "평점",
    target: "추천 경로",
    sellingPoints: "핵심 판매 포인트",
    badReviews: "부정 리뷰 샘플",
    pain: "사용자 문제점",
    improvements: "개선 기회",
    fits: "비즈니스 적합도",
    risks: "리스크 태그",
    nextAction: "다음 액션",
    actions: "상태 액션",
    toAnalyze: "분석 중 표시",
    toTransfer: "액션 전환 표시",
    toWatch: "계속 관찰 표시",
    toIgnore: "무시 표시",
    open: "Coupang 열기",
  },
  status: {
    new: "신규",
    watch: "계속 관찰",
    analyze: "계속 분석",
    transfer: "액션 전환 가능",
    ignore: "무시",
  },
  levels: {
    low: "낮음",
    medium: "중간",
    high: "높음",
  },
  sources: {
    hot_products: "히트상품 인텔리전스",
    testing_db: "상품 테스트 DB",
    opportunity_board: "기회보드",
    manual: "수동 입력",
  },
  messages: {
    hot: "히트상품 인텔리전스를 경쟁상품 라이브러리에 반영했습니다.",
    testingDb: "상품 테스트 DB를 경쟁상품 라이브러리에 반영했습니다.",
    opportunity: "기회보드를 경쟁상품 라이브러리에 반영했습니다.",
    seeded: "히트상품, 테스트 DB, 기회보드 샘플을 경쟁상품 라이브러리에 자동 반영했습니다.",
    statusUpdated: "경쟁상품 상태를 업데이트했습니다.",
    ignoreReason: "현재 추적 우선순위가 낮음",
  },
  common: {
    noBrand: "브랜드 없음",
    none: "없음",
  },
};

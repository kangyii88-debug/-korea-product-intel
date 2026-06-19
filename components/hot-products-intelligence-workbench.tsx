"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRightLeft,
  Boxes,
  Flame,
  FolderSync,
  PackagePlus,
  PackageSearch,
  ShieldAlert,
  Sparkles,
  Target,
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
  mergeHotProductIntelligence,
  monthlyPurchaseLevel,
  replaceLocalHotProductIntelligence,
  updateHotProductItem,
  type HotActionStatus,
  type HotProductIntelligenceItem,
  type HotRiskLevel,
  type MonthlyPurchaseLevel,
} from "@/lib/hot-product-intelligence-local";
import {
  mergeCompetitorLibraryItems,
  loadLocalCompetitorLibrary,
  replaceLocalCompetitorLibrary,
  type CompetitorLibraryItem,
} from "@/lib/competitor-library-local";
import { buildProductFromForm, upsertLocalProduct } from "@/lib/local-products";
import { createLocalProductOpportunity } from "@/lib/product-opportunities-local";

type SampleRow = Record<string, unknown>;

export function HotProductsIntelligenceWorkbench() {
  const { locale } = useLocale();
  const t = locale === "ko" ? KO_COPY : ZH_COPY;
  const [items, setItems] = useState<HotProductIntelligenceItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    const loaded = loadLocalHotProductIntelligence();
    setItems(loaded);
    setSelectedId(loaded[0]?.id ?? null);
  }, []);

  useEffect(() => {
    if (items.length > 0) return;
    void seed();
  }, [items.length]);

  const filtered = items;

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
        icon: <PackageSearch className="h-4 w-4" />,
      },
      {
        label: t.metrics.purchase1000,
        value: items.filter((item) => ["over_1000", "over_3000", "over_5000", "over_10000"].includes(item.monthly_purchase_level)).length,
        note: t.metrics.purchase1000Note,
        tone: "success" as const,
        icon: <Flame className="h-4 w-4" />,
      },
      {
        label: t.metrics.purchase5000,
        value: items.filter((item) => ["over_5000", "over_10000"].includes(item.monthly_purchase_level)).length,
        note: t.metrics.purchase5000Note,
        tone: "success" as const,
        icon: <Sparkles className="h-4 w-4" />,
      },
      {
        label: t.metrics.highOpportunity,
        value: items.filter((item) => item.opportunity_level === "high").length,
        note: t.metrics.highOpportunityNote,
        tone: "success" as const,
        icon: <Target className="h-4 w-4" />,
      },
      {
        label: t.metrics.highRisk,
        value: items.filter((item) => item.risk_level === "high").length,
        note: t.metrics.highRiskNote,
        tone: "danger" as const,
        icon: <ShieldAlert className="h-4 w-4" />,
      },
      {
        label: t.metrics.toCompetitor,
        value: items.filter((item) => item.imported_to_competitor_library).length,
        note: t.metrics.toCompetitorNote,
        icon: <Boxes className="h-4 w-4" />,
      },
      {
        label: t.metrics.toTesting,
        value: items.filter((item) => item.imported_to_product_test).length,
        note: t.metrics.toTestingNote,
        icon: <PackagePlus className="h-4 w-4" />,
      },
      {
        label: t.metrics.toOpportunity,
        value: items.filter((item) => item.imported_to_opportunity_pool).length,
        note: t.metrics.toOpportunityNote,
        icon: <ArrowRightLeft className="h-4 w-4" />,
      },
    ];
  }, [items, t]);

  async function seed() {
    const sampleModule = await import("@/data/coupang_hot_products_50.json");
    const mapped = ((sampleModule.default as SampleRow[]) ?? []).map(buildHotProductFromSampleRow);
    const next = mergeHotProductIntelligence([], mapped);
    replaceLocalHotProductIntelligence(next);
    setItems(next);
    setSelectedId(next[0]?.id ?? null);
    setBanner(t.messages.seeded);
  }

  function persist(next: HotProductIntelligenceItem[], message?: string) {
    replaceLocalHotProductIntelligence(next);
    setItems(next);
    if (message) setBanner(message);
  }

  function refreshFromBundle() {
    void seed();
  }

  function transferToCompetitor(item: HotProductIntelligenceItem) {
    const current = loadLocalCompetitorLibrary();
    const nextLibrary = mergeCompetitorLibraryItems(current, [mapHotToCompetitor(item)]);
    replaceLocalCompetitorLibrary(nextLibrary);
    persist(
      updateHotProductItem(items, item.id, (currentItem) => ({
        ...currentItem,
        imported_to_competitor_library: true,
        action_status: "transferred_competitor",
      })),
      t.messages.toCompetitor,
    );
  }

  function transferToTesting(item: HotProductIntelligenceItem) {
    upsertLocalProduct(
      buildProductFromForm({
        productNameKo: item.product_name_ko,
        productNameZh: item.product_name_zh,
        brand: item.brand,
        category: item.category,
        competitorUrl: item.coupang_url,
        image: item.image_url,
        price: String(item.competitor_price_krw),
        discountPrice: String(item.competitor_price_krw),
        competitorSalePriceKrw: String(item.competitor_price_krw),
        reviewCount: String(item.review_count),
        rating: String(item.rating),
        deliveryType: item.delivery_type,
        sellerType: item.seller_type,
        marketAnalysis: item.market_analysis,
        priceRange: item.price_range,
        reviewSummary: item.bad_review_samples.join(" / "),
        consumerPainPoints: item.consumer_pain_points,
        productDevelopmentDirection: item.next_action,
        recommendationReason: item.recommended_destination,
        sampleDevelopmentAdvice: item.next_action,
        notes: item.notes,
      }),
    );

    persist(
      updateHotProductItem(items, item.id, (currentItem) => ({
        ...currentItem,
        imported_to_product_test: true,
        action_status: "transferred_testing",
      })),
      t.messages.toTesting,
    );
  }

  function transferToOpportunity(item: HotProductIntelligenceItem) {
    createLocalProductOpportunity({
      title: item.product_name_zh || item.product_name_ko,
      sku: "",
      keyword: item.keywords.join(", "),
      category: "other",
      business_type: inferBusinessType(item.recommendation_type),
      coupang_url: item.coupang_url,
      image_url: item.image_url,
      price: item.competitor_price_krw,
      review_count: item.review_count,
      rating: item.rating,
      competitor_count: item.competition_level === "high" ? 9 : item.competition_level === "medium" ? 5 : 2,
      estimated_purchase_cost: Math.round(item.competitor_price_krw * 0.38),
      estimated_shipping_cost: 3800,
      estimated_local_delivery_cost: 3200,
      platform_fee_rate: 11.9,
      estimated_ad_cost: 600,
      estimated_sale_price: item.competitor_price_krw,
      market_heat: item.opportunity_level,
      competition_level: item.competition_level,
      kc_risk: item.risk_level,
      volume_weight_risk: item.risk_tags.includes("易碎物流") ? "high" : "low",
      return_risk: item.risk_level,
      negative_review_risk: item.risk_level,
      price_war_risk: item.competition_level,
      supply_chain_risk: item.risk_tags.includes("电子/KC") ? "high" : "medium",
      notes: [item.market_analysis, item.consumer_pain_points, item.hot_reason].filter(Boolean).join("\n"),
      status: item.risk_level === "high" ? "paused" : "testable",
      next_action: "collect_competitors",
      demand_stability: item.monthly_purchase_badge,
      seasonality: item.seasonality_status,
      long_term_fit: /pb|自有品牌|own/i.test(item.recommendation_type),
      short_term_test_fit: item.risk_level !== "high",
      competitor_price_range: item.price_range,
      top_seller_count: item.monthly_purchase_level === "over_10000" ? 10 : item.monthly_purchase_level === "over_5000" ? 6 : 3,
      review_issue_summary: item.consumer_pain_points,
      negative_review_keywords: item.bad_review_samples.join(", "),
      improvement_points: item.next_action,
    });

    persist(
      updateHotProductItem(items, item.id, (currentItem) => ({
        ...currentItem,
        imported_to_opportunity_pool: true,
        action_status: "transferred_opportunity",
      })),
      t.messages.toOpportunity,
    );
  }

  function markIgnored(item: HotProductIntelligenceItem) {
    persist(
      updateHotProductItem(items, item.id, (currentItem) => ({
        ...currentItem,
        action_status: "ignored",
        exclude_reason: currentItem.exclude_reason || t.messages.ignoredReason,
      })),
      t.messages.ignored,
    );
  }

  return (
    <>
      <PageHeader eyebrow={t.header.eyebrow} title={t.header.title} description={t.header.description} />
      <div className="flex w-full flex-col gap-6 px-5 py-8 sm:px-8 lg:px-10 2xl:px-12">
        <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_46%,#eef5ff_100%)]">
          <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.95fr)] lg:px-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/90 px-3 py-1 text-xs font-semibold text-orange-700">
                <Flame className="h-3.5 w-3.5" />
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

        {banner ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{banner}</div> : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <StatCard key={metric.label} label={metric.label} value={metric.value} note={metric.note} tone={metric.tone} icon={metric.icon} />
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_440px]">
          <div className="space-y-6">
            <SectionCard title={t.list.title} description={t.list.description}>
              <div className="space-y-3">
                {filtered.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`grid w-full gap-4 rounded-[18px] border p-5 text-left transition-colors lg:grid-cols-[minmax(0,1.7fr)_120px_120px_140px] ${
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
                        <StatusBadge tone="info">{purchaseLabel(item.monthly_purchase_level, t)}</StatusBadge>
                        <StatusBadge tone={toneForRisk(item.risk_level)}>{riskLabel(item.risk_level, t)}</StatusBadge>
                        <StatusBadge tone="neutral">{actionLabel(item.action_status, t)}</StatusBadge>
                      </div>
                    </div>
                    <Metric label={t.list.price} value={`${item.competitor_price_krw}`} selected={item.id === selectedId} />
                    <Metric label={t.list.reviews} value={`${item.review_count}`} selected={item.id === selectedId} />
                    <Metric label={t.list.destination} value={item.recommended_destination || "-"} selected={item.id === selectedId} />
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
                    <p className="mt-2 text-sm text-slate-500">{locale === "ko" ? `${selected.competitor_price_krw}원 · 리뷰 ${selected.review_count}개` : `${selected.competitor_price_krw}韩元 · 评论 ${selected.review_count}条`}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <MiniStat label={t.detail.monthly} value={purchaseLabel(selected.monthly_purchase_level, t)} />
                    <MiniStat label={t.detail.risk} value={riskLabel(selected.risk_level, t)} />
                    <MiniStat label={t.detail.competition} value={riskLabel(selected.competition_level, t)} />
                    <MiniStat label={t.detail.opportunity} value={riskLabel(selected.opportunity_level, t)} />
                  </div>
                </>
              ) : null}
            </CardHeader>
            {selected ? (
              <CardContent className="space-y-6">
                <DetailSection title={t.detail.summary}>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge tone="info">{selected.recommendation_type || t.common.noRecommendation}</StatusBadge>
                    <StatusBadge tone="neutral">{selected.delivery_type || t.common.noDelivery}</StatusBadge>
                    <StatusBadge tone="neutral">{selected.seller_type || t.common.noSeller}</StatusBadge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{selected.hot_reason || "-"}</p>
                </DetailSection>

                <DetailSection title={t.detail.marketAnalysis}>
                  <p className="text-sm leading-6 text-slate-600">{selected.market_analysis || "-"}</p>
                </DetailSection>

                <DetailSection title={t.detail.painPoints}>
                  <p className="text-sm leading-6 text-slate-600">{selected.consumer_pain_points || "-"}</p>
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
                  <p className="text-sm leading-6 text-slate-600">{selected.next_action || "-"}</p>
                </DetailSection>

                <DetailSection title={t.detail.actions}>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => transferToCompetitor(selected)}>{t.detail.toCompetitor}</Button>
                    <Button variant="outline" onClick={() => transferToTesting(selected)}>{t.detail.toTesting}</Button>
                    <Button variant="outline" onClick={() => transferToOpportunity(selected)}>{t.detail.toOpportunity}</Button>
                    <Button variant="outline" onClick={() => markIgnored(selected)}>{t.detail.ignore}</Button>
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
    supply_chain_fit: item.risk_tags.includes("电子/KC") ? "需要先确认认证与供货稳定性" : "适合先找 2-3 家供应商快速对标",
    rocket_growth_fit: /rocket|rg/i.test(item.recommendation_type) ? "可直接进 RG 深挖" : "先观察卖点和物流模式是否适合 RG",
    pb_supply_fit: /pb/i.test(item.recommendation_type) ? "可进入 PB 供应判断" : "先看差评能否形成产品差异化",
    own_brand_fit: /own|品牌|自有/i.test(item.recommendation_type) ? "可延伸自有品牌" : "暂不建议直接做品牌化",
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
    imported_to_opportunity_board: false,
    imported_to_product_test: item.imported_to_product_test,
    imported_to_opportunity_pool: item.imported_to_opportunity_pool,
    risk_tags: item.risk_tags,
    notes: item.market_analysis,
    status: item.risk_level === "high" ? "watch" : "analyze",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function inferBusinessType(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes("pb")) return "pb_supply";
  if (normalized.includes("rocket") || normalized.includes("rg")) return "rocket_growth";
  return "general";
}

function purchaseLabel(level: MonthlyPurchaseLevel, t: typeof ZH_COPY) {
  return t.purchase[level];
}

function actionLabel(status: HotActionStatus, t: typeof ZH_COPY) {
  return t.actions[status];
}

function riskLabel(level: HotRiskLevel, t: typeof ZH_COPY) {
  return t.levels[level];
}

function toneForRisk(level: HotRiskLevel) {
  if (level === "high") return "danger" as const;
  if (level === "medium") return "warning" as const;
  return "success" as const;
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

function EmptyPanel({ message }: { message: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">{message}</div>;
}

const ZH_COPY = {
  header: {
    eyebrow: "热销情报中心",
    title: "Coupang 热销情报中心",
    description: "围绕 Coupang 热销样本做长期运营判断，不再只看一眼爆款，而是持续管理热度、风险、去向和后续动作。",
  },
  hero: {
    badge: "长期运营型热销工作台",
    title: "先看市场已经验证的热销商品，再决定它应该进入竞品库、测试库还是机会池",
    description: "这个页面不是简单展示爆款样本，而是把热销商品沉淀成可筛选、可归档、可流转的情报清单。你可以在这里判断热度层级、风险标签、季节性、推荐去向和下一步动作。",
    refresh: "重新载入热销样本",
    cards: [
      { title: "先看热度", note: "月购标签和评论规模先决定这个样本值不值得盯。" },
      { title: "再看风险", note: "KC、退货、物流、类目限制要尽早暴露出来。" },
      { title: "再定去向", note: "不是所有热销样本都直接进机会池，有些更适合先进竞品库。" },
      { title: "最后转动作", note: "每个样本最后都要落到同步、继续跟踪或忽略。" },
    ],
  },
  metrics: {
    total: "热销样本数",
    totalNote: "当前工作台中的总样本数。",
    purchase1000: "月购 1000+",
    purchase1000Note: "已有明显成交验证的热销样本。",
    purchase5000: "月购 5000+",
    purchase5000Note: "已经进入头部区间的热销样本。",
    highOpportunity: "高机会样本",
    highOpportunityNote: "适合继续深挖或流转动作的样本。",
    highRisk: "高风险样本",
    highRiskNote: "认证、退货或物流风险偏高的样本。",
    toCompetitor: "已入竞品库",
    toCompetitorNote: "已同步进入竞品采集库的样本。",
    toTesting: "已入测试库",
    toTestingNote: "已同步进入商品测试数据库的样本。",
    toOpportunity: "已入机会池",
    toOpportunityNote: "已转入机会池继续分析的样本。",
  },
  filters: {
    title: "情报筛选",
    description: "按热度、类目、配送方式、卖家类型、风险和动作状态，快速找到最值得推进或最该排除的样本。",
    search: "搜索商品名、品牌、类目、风险标签、下一步动作",
    purchase: "月购层级",
    category: "类目",
    delivery: "配送方式",
    seller: "卖家类型",
    action: "动作状态",
    risk: "风险等级",
    seasonality: "季节性",
    source: "来源",
    all: "全部",
  },
  list: {
    title: "热销样本列表",
    description: "把热销样本当成长期追踪资产，而不是一次性灵感。",
    price: "售价",
    reviews: "评论数",
    destination: "推荐去向",
    empty: "当前没有符合筛选条件的热销样本。",
  },
  detail: {
    eyebrow: "베스트셀러 샘플 상세",
    monthly: "月购层级",
    risk: "风险等级",
    competition: "竞争强度",
    opportunity: "机会等级",
    summary: "样本摘要",
    marketAnalysis: "市场判断",
    painPoints: "差评 / 用户痛点",
    risks: "风险标签",
    nextAction: "下一步动作",
    actions: "流转动作",
    toCompetitor: "同步到竞品库",
    toTesting: "同步到测试库",
    toOpportunity: "同步到机会池",
    ignore: "标记忽略",
    open: "打开 Coupang",
  },
  purchase: {
    under_1000: "不足 1000",
    over_1000: "1000+",
    over_3000: "3000+",
    over_5000: "5000+",
    over_10000: "10000+",
    unknown: "待确认",
  },
  actions: {
    pending: "待判断",
    recommended: "已推荐去向",
    transferred_competitor: "已转竞品库",
    transferred_testing: "已转测试库",
    transferred_opportunity: "已转机会池",
    ignored: "已忽略",
  },
  levels: {
    low: "低",
    medium: "中",
    high: "高",
  },
  seasonality: {
    evergreen: "常年型",
    seasonal: "季节型",
    uncertain: "待确认",
  },
  sources: {
    sample_bundle: "内置热销样本",
    codex_import: "Codex 导入",
    manual: "手动录入",
  },
  messages: {
    seeded: "已把内置热销样本装入情报中心。",
    toCompetitor: "已同步到竞品采集库。",
    toTesting: "已同步到商品测试数据库。",
    toOpportunity: "已同步到机会池。",
    ignored: "已标记为忽略样本。",
    ignoredReason: "当前不适合继续跟进",
  },
  common: {
    noBrand: "无品牌",
    noRecommendation: "未给出推荐方向",
    noDelivery: "配送待确认",
    noSeller: "卖家待确认",
    none: "无",
  },
};

const KO_COPY: typeof ZH_COPY = {
  header: {
    eyebrow: "베스트셀러 인텔리전스",
    title: "Coupang 베스트셀러 정보판",
    description: "베스트셀러 샘플, 경쟁 강도, 리스크 태그와 후속 액션을 한 화면에서 보며 어떤 상품을 더 밀고 어떤 상품을 보류할지 빠르게 판단합니다.",
  },
  hero: {
    badge: "장기 운영형 히트상품 워크벤치",
    title: "시장 검증이 끝난 히트상품을 먼저 보고 경쟁상품 라이브러리, 테스트 DB, 기회보드 중 어디로 보낼지 결정합니다.",
    description: "이 화면은 단순 폭발상품 모음이 아니라, 히트상품을 계속 추적할 수 있는 인텔리전스 자산으로 관리하는 곳입니다.",
    refresh: "히트상품 샘플 다시 불러오기",
    cards: [
      { title: "열기 확인", note: "월구매 배지와 리뷰 규모를 먼저 봅니다." },
      { title: "리스크 확인", note: "KC, 반품, 물류, 카테고리 제한을 먼저 드러냅니다." },
      { title: "경로 결정", note: "모든 샘플이 바로 기회보드로 가는 것은 아닙니다." },
      { title: "액션 연결", note: "각 샘플은 결국 동기화, 추적, 무시 중 하나로 정리됩니다." },
    ],
  },
  metrics: {
    total: "히트상품 샘플 수",
    totalNote: "현재 워크벤치의 총 샘플 수입니다.",
    purchase1000: "월구매 1000+",
    purchase1000Note: "명확한 판매 검증이 있는 샘플입니다.",
    purchase5000: "월구매 5000+",
    purchase5000Note: "상위권 구간에 들어간 샘플입니다.",
    highOpportunity: "고기회 샘플",
    highOpportunityNote: "계속 깊게 파볼 가치가 있는 샘플입니다.",
    highRisk: "고위험 샘플",
    highRiskNote: "인증·반품·물류 리스크가 큰 샘플입니다.",
    toCompetitor: "경쟁상품 라이브러리 반영",
    toCompetitorNote: "경쟁상품 라이브러리로 넘긴 샘플입니다.",
    toTesting: "테스트 DB 반영",
    toTestingNote: "상품 테스트 DB로 넘긴 샘플입니다.",
    toOpportunity: "기회보드 반영",
    toOpportunityNote: "기회보드로 넘긴 샘플입니다.",
  },
  filters: {
    title: "인텔리전스 필터",
    description: "열도, 카테고리, 배송 방식, 판매자 유형, 리스크와 액션 상태로 우선순위를 빠르게 찾습니다.",
    search: "상품명, 브랜드, 카테고리, 리스크 태그, 다음 액션 검색",
    purchase: "월구매 레벨",
    category: "카테고리",
    delivery: "배송 방식",
    seller: "판매자 유형",
    action: "액션 상태",
    risk: "리스크 레벨",
    seasonality: "계절성",
    source: "출처",
    all: "전체",
  },
  list: {
    title: "히트상품 샘플 목록",
    description: "한 번 보고 버리는 샘플이 아니라 지속 추적 대상로 관리합니다.",
    price: "판매가",
    reviews: "리뷰수",
    destination: "추천 경로",
    empty: "필터 조건에 맞는 히트상품 샘플이 없습니다.",
  },
  detail: {
    eyebrow: "热销样本详情",
    monthly: "월구매 레벨",
    risk: "리스크 레벨",
    competition: "경쟁 강도",
    opportunity: "기회 레벨",
    summary: "샘플 요약",
    marketAnalysis: "시장 판단",
    painPoints: "부정 리뷰 / 사용자 불만",
    risks: "리스크 태그",
    nextAction: "다음 액션",
    actions: "전환 액션",
    toCompetitor: "경쟁상품 라이브러리로",
    toTesting: "테스트 DB로",
    toOpportunity: "기회보드로",
    ignore: "무시 처리",
    open: "Coupang 열기",
  },
  purchase: {
    under_1000: "1000 미만",
    over_1000: "1000+",
    over_3000: "3000+",
    over_5000: "5000+",
    over_10000: "10000+",
    unknown: "확인 필요",
  },
  actions: {
    pending: "판단 대기",
    recommended: "추천 완료",
    transferred_competitor: "경쟁상품 반영",
    transferred_testing: "테스트 DB 반영",
    transferred_opportunity: "기회보드 반영",
    ignored: "무시 완료",
  },
  levels: {
    low: "낮음",
    medium: "중간",
    high: "높음",
  },
  seasonality: {
    evergreen: "상시형",
    seasonal: "계절형",
    uncertain: "확인 필요",
  },
  sources: {
    sample_bundle: "내장 샘플",
    codex_import: "Codex 가져오기",
    manual: "수동 입력",
  },
  messages: {
    seeded: "내장 히트상품 샘플을 인텔리전스 센터에 반영했습니다.",
    toCompetitor: "경쟁상품 라이브러리에 동기화했습니다.",
    toTesting: "상품 테스트 DB에 동기화했습니다.",
    toOpportunity: "기회보드에 동기화했습니다.",
    ignored: "무시 샘플로 표시했습니다.",
    ignoredReason: "현재 운영 우선순위가 낮음",
  },
  common: {
    noBrand: "브랜드 없음",
    noRecommendation: "추천 방향 없음",
    noDelivery: "배송 확인 필요",
    noSeller: "판매자 확인 필요",
    none: "없음",
  },
};

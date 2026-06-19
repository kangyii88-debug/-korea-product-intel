"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Database,
  FolderSync,
  PackageSearch,
  RefreshCcw,
  Search,
  ShieldAlert,
  Sparkles,
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
  loadLocalCompetitorLibrary,
  replaceLocalCompetitorLibrary,
  type CompetitorLibraryItem,
} from "@/lib/competitor-library-local";

type SampleRow = Record<string, unknown>;

export function CompetitorLibraryWorkbench() {
  const { locale } = useLocale();
  const t = locale === "ko" ? KO_COPY : ZH_COPY;
  const [items, setItems] = useState<CompetitorLibraryItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    const loaded = loadLocalCompetitorLibrary();
    setItems(loaded);
    setSelectedId(loaded[0]?.id ?? null);
  }, []);

  useEffect(() => {
    if (items.length > 0) {
      return;
    }
    void seedLibrary();
  }, [items.length]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return items.filter((item) =>
      !keyword ||
      [
        item.product_name_ko,
        item.product_name_zh,
        item.brand,
        item.category,
        item.consumer_pain_points,
        item.follow_up_recommendation,
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [items, query]);

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
    const highImprove = items.filter((item) => item.improvement_opportunity_level === "high").length;
    const highCompetition = items.filter((item) => item.competition_level === "high").length;
    const transfer = items.filter((item) => item.status === "transfer").length;
    const watch = items.filter((item) => item.status === "watch").length;
    const ignored = items.filter((item) => item.is_ignored).length;
    const highReviews = items.filter((item) => item.review_count >= 5000).length;
    const strongRating = items.filter((item) => item.rating >= 4.5).length;

    return [
      { label: t.metrics.total, value: String(items.length), note: t.metrics.totalNote, tone: "default" as const, icon: <Database className="h-4 w-4" /> },
      { label: t.metrics.improve, value: String(highImprove), note: t.metrics.improveNote, tone: "success" as const, icon: <Sparkles className="h-4 w-4" /> },
      { label: t.metrics.competition, value: String(highCompetition), note: t.metrics.competitionNote, tone: "warning" as const, icon: <ShieldAlert className="h-4 w-4" /> },
      { label: t.metrics.transfer, value: String(transfer), note: t.metrics.transferNote, tone: "success" as const, icon: <ArrowRight className="h-4 w-4" /> },
      { label: t.metrics.watch, value: String(watch), note: t.metrics.watchNote, tone: "default" as const, icon: <RefreshCcw className="h-4 w-4" /> },
      { label: t.metrics.ignored, value: String(ignored), note: t.metrics.ignoredNote, tone: "danger" as const, icon: <ShieldAlert className="h-4 w-4" /> },
      { label: t.metrics.reviews, value: String(highReviews), note: t.metrics.reviewsNote, tone: "default" as const, icon: <PackageSearch className="h-4 w-4" /> },
      { label: t.metrics.rating, value: String(strongRating), note: t.metrics.ratingNote, tone: "default" as const, icon: <Sparkles className="h-4 w-4" /> },
    ];
  }, [items, t]);

  async function syncHotProducts() {
    const response = await fetch("/api/testing-db-samples?name=coupang_hot_products_50", { cache: "no-store" });
    const payload = (await response.json()) as { items?: SampleRow[] };
    const mapped = (payload.items ?? []).map(mapHotProductToCompetitor);
    persist(mergeItems(items, mapped));
    setBanner(t.banner.hot);
  }

  async function seedLibrary() {
    const response = await fetch("/api/testing-db-samples?name=coupang_hot_products_50", { cache: "no-store" });
    const payload = (await response.json()) as { items?: SampleRow[] };
    const next = mergeItems([], [
      ...(payload.items ?? []).map(mapHotProductToCompetitor),
      ...loadLocalProducts().map(mapTestingDbToCompetitor),
      ...loadLocalProductOpportunities().map(mapOpportunityToCompetitor),
    ]);
    if (!next.length) {
      return;
    }
    persist(next);
    setBanner(t.banner.seeded);
  }

  function syncTestingDb() {
    const mapped = loadLocalProducts().map(mapTestingDbToCompetitor);
    persist(mergeItems(items, mapped));
    setBanner(t.banner.testingDb);
  }

  function syncOpportunity() {
    const mapped = loadLocalProductOpportunities().map(mapOpportunityToCompetitor);
    persist(mergeItems(items, mapped));
    setBanner(t.banner.opportunity);
  }

  function persist(next: CompetitorLibraryItem[]) {
    replaceLocalCompetitorLibrary(next);
    setItems(next);
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
                <Button onClick={() => void syncHotProducts()}>{t.hero.syncHot}</Button>
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

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_420px]">
          <SectionCard title={t.list.title} description={t.list.description}>
            <div className="mb-4 relative max-w-xl">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t.list.searchPlaceholder}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-slate-900/10"
              />
            </div>
            <div className="space-y-3">
              {filtered.map((item) => (
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
                      {item.brand || t.common.noBrand} · {item.category}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <StatusBadge tone="neutral">{sourceLabel(item.source_type, t)}</StatusBadge>
                      <StatusBadge tone="warning">{statusLabel(item.status, t)}</StatusBadge>
                    </div>
                  </div>
                  <Metric label={t.list.improve} value={levelLabel(item.improvement_opportunity_level, t)} selected={item.id === selectedId} />
                  <Metric label={t.list.competition} value={levelLabel(item.competition_level, t)} selected={item.id === selectedId} />
                  <Metric label={t.list.rating} value={`${item.rating}`} selected={item.id === selectedId} />
                </button>
              ))}
            </div>
          </SectionCard>

          <Card className="h-fit overflow-hidden">
            <CardHeader className="space-y-4">
              {selected ? (
                <>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{t.detail.eyebrow}</p>
                    <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-950">
                      {locale === "ko" ? selected.product_name_ko : selected.product_name_zh || selected.product_name_ko}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">{selected.review_count} {t.detail.reviewUnit} · {selected.competitor_price_krw} KRW</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <MiniStat label={t.detail.improve} value={levelLabel(selected.improvement_opportunity_level, t)} />
                    <MiniStat label={t.detail.competition} value={levelLabel(selected.competition_level, t)} />
                    <MiniStat label={t.detail.rating} value={`${selected.rating}`} />
                    <MiniStat label={t.detail.target} value={selected.recommended_import_target || "-"} />
                  </div>
                </>
              ) : null}
            </CardHeader>
            {selected ? (
              <CardContent className="space-y-6">
                <DetailSection title={t.detail.points}>
                  <ul className="space-y-2 text-sm leading-6 text-slate-600">
                    {selected.core_selling_points.map((point) => (
                      <li key={point}>- {point}</li>
                    ))}
                    {!selected.core_selling_points.length ? <li>-</li> : null}
                  </ul>
                </DetailSection>
                <DetailSection title={t.detail.pain}>
                  <p className="text-sm leading-6 text-slate-600">{selected.consumer_pain_points || "-"}</p>
                </DetailSection>
                <DetailSection title={t.detail.followUp}>
                  <p className="text-sm leading-6 text-slate-600">{selected.follow_up_recommendation || "-"}</p>
                </DetailSection>
                <DetailSection title={t.detail.samples}>
                  <div className="space-y-2">
                    {selected.bad_review_samples.slice(0, 4).map((sample, index) => (
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

function mapHotProductToCompetitor(row: SampleRow): CompetitorLibraryItem {
  const reviewCount = num(row.review_count);
  const pain = text(row.consumer_pain_points || row.review_analysis_summary || "");
  return {
    id: `hot-${text(row.product_name_ko)}-${text(row.brand)}`,
    source_type: "hot_products",
    source_id: text(row.coupang_url),
    product_name_ko: text(row.product_name_ko),
    product_name_zh: text(row.product_name_zh),
    coupang_url: text(row.coupang_url),
    image_url: text(row.image_url),
    brand: text(row.brand),
    category: text(row.category),
    delivery_type: text(row.delivery_type),
    seller_type: text(row.seller_type),
    monthly_purchase_badge: text(row.monthly_purchase_badge),
    competitor_price_krw: num(row.competitor_price_krw),
    review_count: reviewCount,
    rating: num(row.rating),
    core_selling_points: split(row.core_selling_points),
    bad_review_samples: split(row.bad_review_samples),
    consumer_pain_points: pain,
    improvement_opportunity_level: pain ? "high" : "medium",
    competition_level: reviewCount >= 5000 ? "high" : reviewCount >= 1500 ? "medium" : "low",
    follow_up_recommendation: text(row.next_action),
    recommended_import_target: text(row.recommended_business_type),
    is_ignored: false,
    notes: text(row.market_analysis),
    status: pain ? "analyze" : "watch",
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
    competitor_price_krw: row.competitorSalePriceKrw,
    review_count: row.reviewCount,
    rating: row.rating,
    core_selling_points: row.sellingPoints,
    bad_review_samples: row.reviews.slice(0, 6),
    consumer_pain_points: row.consumerPainPoints,
    improvement_opportunity_level: row.productDevelopmentDirection ? "high" : "medium",
    competition_level: row.reviewCount >= 5000 ? "high" : row.reviewCount >= 1500 ? "medium" : "low",
    follow_up_recommendation: row.productDevelopmentDirection || row.sampleDevelopmentAdvice,
    recommended_import_target: row.recommendationReason,
    is_ignored: false,
    notes: row.marketAnalysis,
    status: row.productDevelopmentDirection ? "transfer" : "watch",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
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
    competitor_price_krw: Number(row.price ?? 0),
    review_count: Number(row.review_count ?? 0),
    rating: Number(row.rating ?? 0),
    core_selling_points: split(row.improvement_points),
    bad_review_samples: split(row.negative_review_keywords),
    consumer_pain_points: row.review_issue_summary ?? "",
    improvement_opportunity_level: row.profit_level ?? "medium",
    competition_level: row.competition_level ?? "medium",
    follow_up_recommendation: row.next_action ?? "",
    recommended_import_target: row.business_type,
    is_ignored: row.status === "dropped",
    notes: row.notes ?? "",
    status: row.status === "dropped" ? "ignore" : row.status === "high_potential" ? "transfer" : "analyze",
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mergeItems(current: CompetitorLibraryItem[], incoming: CompetitorLibraryItem[]) {
  const next = [...current];
  for (const item of incoming) {
    const index = next.findIndex((currentItem) => currentItem.id === item.id || currentItem.coupang_url === item.coupang_url);
    if (index >= 0) {
      next[index] = { ...next[index], ...item, updated_at: new Date().toISOString() };
    } else {
      next.unshift(item);
    }
  }
  return next;
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
}

function num(value: unknown) {
  const n = Number(String(value ?? 0).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function split(value: unknown) {
  return text(value)
    .split(/[,\n/|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function sourceLabel(source: CompetitorLibraryItem["source_type"], t: typeof ZH_COPY) {
  if (source === "hot_products") return t.common.hot;
  if (source === "testing_db") return t.common.testing;
  if (source === "opportunity_board") return t.common.opportunity;
  return t.common.manual;
}

function statusLabel(status: CompetitorLibraryItem["status"], t: typeof ZH_COPY) {
  return t.status[status];
}

function levelLabel(level: "low" | "medium" | "high", t: typeof ZH_COPY) {
  return t.levels[level];
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

const ZH_COPY = {
  header: {
    eyebrow: "COMPETITOR LIBRARY",
    title: "Coupang 竞品采集库",
    description: "把热销样本、商品测试库和机会池里的竞品信息沉淀成统一库，用来判断卖点、痛点、竞争壁垒和下一步去向。",
  },
  hero: {
    badge: "统一竞品采集库",
    title: "把所有竞品信息集中起来，别再散落在测试库、机会池和零碎备注里",
    description: "这里负责统一看竞品卖点、差评、痛点、评分、评论量和建议去向，让你能快速决定哪些值得继续分析、哪些该忽略、哪些该直接转动作。",
    syncHot: "同步热销情报",
    syncTestingDb: "同步商品测试库",
    syncOpportunity: "同步机会池",
    cards: [
      { title: "看卖点", note: "先看竞品到底卖什么，而不是只看价格。" },
      { title: "看痛点", note: "差评、退货、安装、材质等问题决定是否有切入空间。" },
      { title: "看壁垒", note: "评论深度和评分高度会决定是不是值得继续追。" },
      { title: "看去向", note: "继续分析、转动作、继续观察或直接忽略，都应该有明确状态。" },
    ],
  },
  metrics: {
    total: "竞品条目数",
    totalNote: "当前竞品库中的总样本数。",
    improve: "高改进空间",
    improveNote: "差评或痛点明确，存在明显优化空间。",
    competition: "高竞争壁垒",
    competitionNote: "评论壁垒高、市场跟进难度高的样本。",
    transfer: "可转动作",
    transferNote: "适合继续转入机会或开发动作的竞品。",
    watch: "继续观察",
    watchNote: "先保留在库里，暂时不立刻推进。",
    ignored: "已忽略",
    ignoredNote: "明确不继续跟进的竞品。",
    reviews: "高评论壁垒",
    reviewsNote: "评论量达到头部区间的竞品数。",
    rating: "高评分竞品",
    ratingNote: "评分明显高于普通样本的竞品数。",
  },
  list: {
    title: "竞品清单",
    description: "集中管理你已经看过、值得看和不值得再看的竞品。",
    searchPlaceholder: "搜索商品名、品牌、类目、痛点",
    improve: "改进空间",
    competition: "竞争",
    rating: "评分",
  },
  detail: {
    eyebrow: "Competitor Detail",
    reviewUnit: "条评论",
    improve: "改进空间",
    competition: "竞争壁垒",
    rating: "评分",
    target: "建议去向",
    points: "核心卖点",
    pain: "用户痛点",
    followUp: "后续建议",
    samples: "差评样本",
  },
  banner: {
    hot: "已把热销情报同步进竞品库。",
    testingDb: "已把商品测试库同步进竞品库。",
    opportunity: "已把机会池同步进竞品库。",
    seeded: "已把热销情报、商品测试库和机会池的样本自动汇入竞品库。",
  },
  common: {
    noBrand: "无品牌",
    hot: "热销情报",
    testing: "商品测试库",
    opportunity: "机会池",
    manual: "手动",
  },
  status: {
    new: "新导入",
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
};

const KO_COPY: typeof ZH_COPY = {
  ...ZH_COPY,
  header: {
    eyebrow: "COMPETITOR LIBRARY",
    title: "Coupang 경쟁상품 수집 라이브러리",
    description: "히트상품 샘플, 상품 테스트DB, 기회보드의 경쟁상품 정보를 하나의 라이브러리로 모아 판매 포인트, 문제점, 경쟁 장벽과 다음 경로를 판단합니다.",
  },
  hero: {
    badge: "통합 경쟁상품 라이브러리",
    title: "경쟁상품 정보를 테스트DB, 기회보드, 메모에 흩어두지 말고 한곳에 모읍니다",
    description: "경쟁상품의 판매 포인트, 부정 리뷰, 문제점, 평점, 리뷰 수, 추천 경로를 한 화면에서 보고 계속 분석할지, 무시할지, 바로 액션으로 넘길지 결정할 수 있습니다.",
    syncHot: "히트상품 인텔리전스 동기화",
    syncTestingDb: "상품 테스트DB 동기화",
    syncOpportunity: "기회보드 동기화",
    cards: [
      { title: "판매 포인트 확인", note: "가격만 보지 말고 경쟁상품이 실제로 무엇을 파는지 봅니다." },
      { title: "문제점 확인", note: "부정 리뷰, 반품, 설치, 재질 문제는 진입 공간을 결정합니다." },
      { title: "장벽 확인", note: "리뷰 깊이와 평점 높이가 추적 가치 여부를 좌우합니다." },
      { title: "다음 경로", note: "계속 분석, 액션 전환, 관찰 유지, 무시 상태가 명확해야 합니다." },
    ],
  },
  metrics: {
    total: "경쟁상품 수",
    totalNote: "현재 라이브러리에 들어온 총 샘플 수입니다.",
    improve: "개선 여지 높음",
    improveNote: "부정 리뷰나 문제점이 뚜렷해 개선 여지가 큰 샘플입니다.",
    competition: "고경쟁 장벽",
    competitionNote: "리뷰 장벽과 시장 추종 난도가 높은 샘플입니다.",
    transfer: "액션 전환 가능",
    transferNote: "기회 또는 개발 액션으로 넘길 수 있는 경쟁상품입니다.",
    watch: "계속 관찰",
    watchNote: "당장 추진하지 않고 라이브러리에서 계속 보는 샘플입니다.",
    ignored: "무시 처리",
    ignoredNote: "명확히 더 이상 추적하지 않는 경쟁상품입니다.",
    reviews: "고리뷰 장벽",
    reviewsNote: "리뷰 수가 이미 상위권인 경쟁상품입니다.",
    rating: "고평점 경쟁상품",
    ratingNote: "평점이 명확히 높은 경쟁상품 수입니다.",
  },
  list: {
    title: "경쟁상품 목록",
    description: "이미 본 경쟁상품, 더 볼 가치가 있는 경쟁상품, 버려야 할 경쟁상품을 함께 관리합니다.",
    searchPlaceholder: "상품명, 브랜드, 카테고리, 문제점 검색",
    improve: "개선 여지",
    competition: "경쟁",
    rating: "평점",
  },
  detail: {
    eyebrow: "Competitor Detail",
    reviewUnit: "개 리뷰",
    improve: "개선 여지",
    competition: "경쟁 장벽",
    rating: "평점",
    target: "추천 경로",
    points: "핵심 판매 포인트",
    pain: "사용자 문제점",
    followUp: "후속 제안",
    samples: "부정 리뷰 샘플",
  },
  banner: {
    hot: "히트상품 인텔리전스를 경쟁상품 라이브러리에 반영했습니다.",
    testingDb: "상품 테스트DB를 경쟁상품 라이브러리에 반영했습니다.",
    opportunity: "기회보드를 경쟁상품 라이브러리에 반영했습니다.",
    seeded: "히트상품, 상품 테스트DB, 기회보드 샘플을 경쟁상품 라이브러리에 자동 반영했습니다.",
  },
  common: {
    noBrand: "브랜드 없음",
    hot: "히트상품 인텔리전스",
    testing: "상품 테스트DB",
    opportunity: "기회보드",
    manual: "수동",
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
};

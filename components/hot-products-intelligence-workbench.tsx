"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Flame,
  LineChart,
  PackageSearch,
  RefreshCcw,
  ShieldAlert,
  Sparkles,
  Star,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useLocale } from "@/components/locale-provider";
import { createLocalProductOpportunity } from "@/lib/product-opportunities-local";

type HotProductRow = Record<string, unknown>;

type HotProductInsight = {
  id: string;
  productNameKo: string;
  productNameZh: string;
  coupangUrl: string;
  imageUrl: string;
  brand: string;
  category: string;
  reviewCount: number;
  rating: number;
  price: number;
  monthlySales: number;
  monthlyPurchaseBadge: string;
  painPoints: string;
  marketAnalysis: string;
  priceRange: string;
  recommendationType: string;
  nextAction: string;
  opportunityLevel: "low" | "medium" | "high";
  competitionLevel: "low" | "medium" | "high";
  riskLevel: "low" | "medium" | "high";
};

export function HotProductsIntelligenceWorkbench() {
  const { locale } = useLocale();
  const t = locale === "ko" ? KO_COPY : ZH_COPY;
  const [items, setItems] = useState<HotProductInsight[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/testing-db-samples?name=coupang_hot_products_50", { cache: "no-store" });
      const payload = (await response.json()) as { items?: HotProductRow[] };
      const mapped = (payload.items ?? []).map(mapHotProductRow);
      setItems(mapped);
      setSelectedId(mapped[0]?.id ?? null);
    } finally {
      setLoading(false);
    }
  }

  const selected = items.find((item) => item.id === selectedId) ?? null;

  const metrics = useMemo(() => {
    const highOpportunity = items.filter((item) => item.opportunityLevel === "high").length;
    const highCompetition = items.filter((item) => item.competitionLevel === "high").length;
    const strongBadge = items.filter((item) => item.monthlyPurchaseBadge.includes("1000") || item.monthlyPurchaseBadge.includes("1,000")).length;
    const pbFit = items.filter((item) => item.recommendationType.toLowerCase().includes("pb")).length;
    const rgFit = items.filter((item) => item.recommendationType.toLowerCase().includes("rocket")).length;
    const highRisk = items.filter((item) => item.riskLevel === "high").length;
    const avgRating = items.length ? (items.reduce((sum, item) => sum + item.rating, 0) / items.length).toFixed(1) : "0.0";
    const avgReviews = items.length ? Math.round(items.reduce((sum, item) => sum + item.reviewCount, 0) / items.length) : 0;

    return [
      { label: t.metrics.total, value: String(items.length), note: t.metrics.totalNote, tone: "default" as const, icon: <PackageSearch className="h-4 w-4" /> },
      { label: t.metrics.opportunity, value: String(highOpportunity), note: t.metrics.opportunityNote, tone: "success" as const, icon: <Sparkles className="h-4 w-4" /> },
      { label: t.metrics.badge, value: String(strongBadge), note: t.metrics.badgeNote, tone: "success" as const, icon: <Flame className="h-4 w-4" /> },
      { label: t.metrics.competition, value: String(highCompetition), note: t.metrics.competitionNote, tone: "warning" as const, icon: <LineChart className="h-4 w-4" /> },
      { label: t.metrics.rg, value: String(rgFit), note: t.metrics.rgNote, tone: "default" as const, icon: <ArrowRight className="h-4 w-4" /> },
      { label: t.metrics.pb, value: String(pbFit), note: t.metrics.pbNote, tone: "default" as const, icon: <ArrowRight className="h-4 w-4" /> },
      { label: t.metrics.risk, value: String(highRisk), note: t.metrics.riskNote, tone: "danger" as const, icon: <ShieldAlert className="h-4 w-4" /> },
      { label: t.metrics.rating, value: `${avgRating} / ${avgReviews}`, note: t.metrics.ratingNote, tone: "default" as const, icon: <Star className="h-4 w-4" /> },
    ];
  }, [items, t]);

  function transferToOpportunity(item: HotProductInsight) {
    createLocalProductOpportunity({
      title: item.productNameZh || item.productNameKo,
      sku: "",
      keyword: item.category,
      category: "other",
      business_type: item.recommendationType.toLowerCase().includes("pb") ? "pb_supply" : item.recommendationType.toLowerCase().includes("rocket") ? "rocket_growth" : "general",
      coupang_url: item.coupangUrl,
      image_url: item.imageUrl,
      price: item.price,
      review_count: item.reviewCount,
      rating: item.rating,
      competitor_count: item.competitionLevel === "high" ? 8 : item.competitionLevel === "medium" ? 5 : 2,
      estimated_purchase_cost: Math.round(item.price * 0.38),
      estimated_shipping_cost: 3800,
      estimated_local_delivery_cost: 3200,
      platform_fee_rate: 11.9,
      estimated_ad_cost: 600,
      estimated_sale_price: item.price,
      market_heat: item.opportunityLevel,
      competition_level: item.competitionLevel,
      kc_risk: item.riskLevel,
      volume_weight_risk: "low",
      return_risk: item.riskLevel,
      negative_review_risk: item.riskLevel,
      price_war_risk: item.competitionLevel,
      supply_chain_risk: "medium",
      notes: [item.marketAnalysis, item.painPoints].filter(Boolean).join("\n"),
      status: "testable",
      next_action: "collect_competitors",
      demand_stability: item.monthlyPurchaseBadge,
      seasonality: "",
      long_term_fit: item.recommendationType.toLowerCase().includes("pb"),
      short_term_test_fit: true,
      competitor_price_range: item.priceRange,
      top_seller_count: 0,
      review_issue_summary: item.painPoints,
      negative_review_keywords: item.painPoints,
      improvement_points: item.nextAction,
    });
    setBanner(t.bannerTransferred);
  }

  return (
    <>
      <PageHeader eyebrow={t.header.eyebrow} title={t.header.title} description={t.header.description} />
      <div className="flex w-full flex-col gap-6 px-5 py-8 sm:px-8 lg:px-10 2xl:px-12">
        <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_46%,#eef5ff_100%)]">
          <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)] lg:px-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/90 px-3 py-1 text-xs font-semibold text-orange-700">
                <Flame className="h-3.5 w-3.5" />
                {t.hero.badge}
              </div>
              <h2 className="mt-4 text-[28px] font-semibold tracking-[-0.04em] text-slate-950">{t.hero.title}</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{t.hero.description}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button onClick={() => void load()} disabled={loading}>
                  <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
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

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_420px]">
          <SectionCard title={t.list.title} description={t.list.description}>
            <div className="space-y-3">
              {items.slice(0, 18).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`grid w-full gap-4 rounded-[18px] border p-5 text-left transition-colors lg:grid-cols-[minmax(0,1.6fr)_120px_120px_120px] ${
                    item.id === selectedId ? "border-slate-900 bg-slate-950 text-white" : "border-slate-200 bg-slate-50/55 hover:bg-slate-50"
                  }`}
                >
                  <div className="min-w-0">
                    <p className={`truncate text-base font-semibold tracking-[-0.02em] ${item.id === selectedId ? "text-white" : "text-slate-950"}`}>
                      {locale === "ko" ? item.productNameKo : item.productNameZh || item.productNameKo}
                    </p>
                    <p className={`mt-2 text-sm ${item.id === selectedId ? "text-slate-300" : "text-slate-500"}`}>
                      {item.brand || t.common.noBrand} · {item.category}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <StatusBadge tone="info">{item.monthlyPurchaseBadge || t.common.noBadge}</StatusBadge>
                      <StatusBadge tone="warning">{item.priceRange || t.common.noPriceRange}</StatusBadge>
                    </div>
                  </div>
                  <Metric label={t.list.opportunity} value={levelLabel(item.opportunityLevel, t)} selected={item.id === selectedId} />
                  <Metric label={t.list.competition} value={levelLabel(item.competitionLevel, t)} selected={item.id === selectedId} />
                  <Metric label={t.list.recommendation} value={item.recommendationType || "-"} selected={item.id === selectedId} />
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
                      {locale === "ko" ? selected.productNameKo : selected.productNameZh || selected.productNameKo}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">{selected.brand || t.common.noBrand} · {selected.reviewCount} {t.detail.reviewUnit}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <MiniStat label={t.detail.rating} value={String(selected.rating)} />
                    <MiniStat label={t.detail.price} value={`${selected.price}`} />
                    <MiniStat label={t.detail.sales} value={String(selected.monthlySales)} />
                    <MiniStat label={t.detail.risk} value={levelLabel(selected.riskLevel, t)} />
                  </div>
                </>
              ) : null}
            </CardHeader>
            {selected ? (
              <CardContent className="space-y-6">
                <DetailSection title={t.detail.marketAnalysis}>
                  <p className="text-sm leading-6 text-slate-600">{selected.marketAnalysis || "-"}</p>
                </DetailSection>
                <DetailSection title={t.detail.painPoints}>
                  <p className="text-sm leading-6 text-slate-600">{selected.painPoints || "-"}</p>
                </DetailSection>
                <DetailSection title={t.detail.nextAction}>
                  <p className="text-sm leading-6 text-slate-600">{selected.nextAction || "-"}</p>
                </DetailSection>
                <DetailSection title={t.detail.actions}>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => transferToOpportunity(selected)}>{t.detail.transfer}</Button>
                    <a href={selected.coupangUrl} target="_blank" rel="noreferrer">
                      <Button variant="outline">{t.detail.open}</Button>
                    </a>
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

function mapHotProductRow(row: HotProductRow): HotProductInsight {
  const recommendationType = text(row.recommended_business_type || row.recommendation_direction || "");
  const pain = text(row.consumer_pain_points || row.review_analysis_summary || row.bad_review_samples || "");
  const reviewCount = num(row.review_count);
  const rating = num(row.rating);
  const monthlySales = num(row.estimated_monthly_sales);
  return {
    id: crypto.randomUUID(),
    productNameKo: text(row.product_name_ko),
    productNameZh: text(row.product_name_zh),
    coupangUrl: text(row.coupang_url),
    imageUrl: text(row.image_url),
    brand: text(row.brand),
    category: text(row.category),
    reviewCount,
    rating,
    price: num(row.competitor_price_krw),
    monthlySales,
    monthlyPurchaseBadge: text(row.monthly_purchase_badge),
    painPoints: pain,
    marketAnalysis: text(row.market_analysis),
    priceRange: text(row.price_range),
    recommendationType,
    nextAction: text(row.next_action),
    opportunityLevel: monthlySales >= 4000 ? "high" : monthlySales >= 1500 ? "medium" : "low",
    competitionLevel: reviewCount >= 5000 ? "high" : reviewCount >= 1500 ? "medium" : "low",
    riskLevel: /高|risk|退货|반품/i.test(pain) ? "high" : /中|warning/i.test(pain) ? "medium" : "low",
  };
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
}

function num(value: unknown) {
  const n = Number(String(value ?? 0).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
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
    eyebrow: "HOT PRODUCT INTELLIGENCE",
    title: "Coupang 热销情报中心",
    description: "围绕 Coupang 热销商品样本，快速判断市场热度、竞争壁垒、评论风险和下一步业务去向。",
  },
  hero: {
    badge: "Coupang 热销样本情报",
    title: "先看市场已经验证的热销商品，再决定要不要进入机会池与竞品库",
    description: "这里不是杂乱信息堆积，而是把热销商品样本转成结构化情报，帮助你判断哪些值得继续追、哪些竞争已经太深、哪些需要先观察。",
    refresh: "刷新热销样本",
    cards: [
      { title: "看热度", note: "先看月购标签、评论量和评分，判断是不是已经被市场验证。" },
      { title: "看竞争", note: "评论壁垒太深的商品，不一定适合继续追。" },
      { title: "看去向", note: "适合的商品直接转机会池，不适合的商品留在情报层观察。" },
      { title: "看风险", note: "退货、差评和高竞争风险会直接影响是否继续推进。" },
    ],
  },
  metrics: {
    total: "热销样本数",
    totalNote: "当前纳入情报中心的热销商品数量。",
    opportunity: "高机会商品",
    opportunityNote: "市场热度高且还值得继续跟进的商品。",
    badge: "高月购标签",
    badgeNote: "月购标签强，说明市场已经形成明确需求。",
    competition: "高竞争壁垒",
    competitionNote: "评论与头部竞争壁垒偏高，需要谨慎推进。",
    rg: "适合 RG",
    rgNote: "更适合走 Rocket Growth 路线。",
    pb: "适合 PB",
    pbNote: "更适合作为 PB 候选方向。",
    risk: "高风险样本",
    riskNote: "存在明显差评或退货信号的样本。",
    rating: "评分 / 均评数",
    ratingNote: "样本平均评分与平均评论规模。",
  },
  list: {
    title: "热销商品情报列表",
    description: "从热销样本里挑出真正值得继续追踪的商品。",
    opportunity: "机会",
    competition: "竞争",
    recommendation: "建议去向",
  },
  detail: {
    eyebrow: "Hot Product Detail",
    reviewUnit: "条评论",
    rating: "评分",
    price: "售价 KRW",
    sales: "月销估算",
    risk: "风险",
    marketAnalysis: "市场判断",
    painPoints: "差评 / 痛点",
    nextAction: "下一步动作",
    actions: "动作",
    transfer: "转入机会池",
    open: "打开 Coupang",
  },
  bannerTransferred: "已把该热销商品转入本地机会池。",
  common: {
    noBrand: "无品牌",
    noBadge: "无月购标签",
    noPriceRange: "无价格区间",
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
    eyebrow: "HOT PRODUCT INTELLIGENCE",
    title: "Coupang 히트상품 인텔리전스 센터",
    description: "Coupang 히트상품 샘플을 기준으로 시장 열도, 경쟁 장벽, 리뷰 리스크, 다음 비즈니스 방향을 빠르게 판단합니다.",
  },
  hero: {
    badge: "Coupang 히트상품 샘플 인텔리전스",
    title: "이미 시장 검증이 된 히트상품부터 보고 기회보드 / 경쟁상품 라이브러리로 넘길지 결정합니다",
    description: "단순 정보 모음이 아니라 히트상품 샘플을 구조화된 인텔리전스로 바꿔서, 계속 추적할지 경쟁이 너무 깊은지 먼저 판단할 수 있게 합니다.",
    refresh: "히트상품 샘플 새로고침",
    cards: [
      { title: "열도 확인", note: "월구매 배지, 리뷰 수, 평점을 먼저 보고 시장 검증 여부를 봅니다." },
      { title: "경쟁 확인", note: "리뷰 장벽이 너무 높은 상품은 무리해서 따라가지 않습니다." },
      { title: "다음 경로", note: "맞는 상품은 바로 기회보드로, 아닌 상품은 인텔리전스 단계에서 계속 관찰합니다." },
      { title: "리스크 확인", note: "반품, 부정 리뷰, 과도한 경쟁 신호는 바로 의사결정에 반영합니다." },
    ],
  },
  metrics: {
    total: "히트상품 샘플 수",
    totalNote: "현재 센터에 반영된 히트상품 수입니다.",
    opportunity: "고기회 상품",
    opportunityNote: "시장 열도가 높고 계속 추적할 가치가 있는 상품입니다.",
    badge: "강한 월구매 배지",
    badgeNote: "월구매 신호가 강해 시장 수요가 분명한 상품입니다.",
    competition: "고경쟁 장벽",
    competitionNote: "리뷰 및 상위 경쟁 장벽이 높아 주의가 필요한 상품입니다.",
    rg: "RG 적합",
    rgNote: "Rocket Growth 경로에 더 적합합니다.",
    pb: "PB 적합",
    pbNote: "PB 후보 방향에 더 적합합니다.",
    risk: "고위험 샘플",
    riskNote: "부정 리뷰 또는 반품 리스크가 높은 샘플입니다.",
    rating: "평점 / 평균 리뷰수",
    ratingNote: "샘플 평균 평점과 평균 리뷰 규모입니다.",
  },
  list: {
    title: "히트상품 인텔리전스 목록",
    description: "히트상품 샘플 중 실제로 계속 추적할 가치가 있는 상품을 뽑습니다.",
    opportunity: "기회",
    competition: "경쟁",
    recommendation: "추천 경로",
  },
  detail: {
    eyebrow: "Hot Product Detail",
    reviewUnit: "개 리뷰",
    rating: "평점",
    price: "판매가 KRW",
    sales: "월 판매 추정",
    risk: "리스크",
    marketAnalysis: "시장 판단",
    painPoints: "부정 리뷰 / 문제점",
    nextAction: "다음 액션",
    actions: "액션",
    transfer: "기회보드로 전환",
    open: "Coupang 열기",
  },
  bannerTransferred: "이 히트상품을 로컬 기회보드로 전환했습니다.",
  common: {
    noBrand: "브랜드 없음",
    noBadge: "월구매 배지 없음",
    noPriceRange: "가격대 없음",
  },
  levels: {
    low: "낮음",
    medium: "중간",
    high: "높음",
  },
};

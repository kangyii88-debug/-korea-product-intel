"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRightLeft,
  BadgeDollarSign,
  Calculator,
  CircleAlert,
  FileBarChart2,
  FolderSync,
  HandCoins,
  Search,
  Target,
  TrendingDown,
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
  buildProfitCalculationFromLocalProduct,
  buildProfitCalculationFromOpportunity,
  buildProfitCalculationFromSampleRow,
  loadLocalProfitCalculations,
  mergeProfitCalculationRecords,
  replaceLocalProfitCalculations,
  type CostCompleteness,
  type DecisionStatus,
  type ProductProfitCalculationRecord,
  type ProfitBand,
} from "@/lib/product-profit-local";

type SampleRow = Record<string, unknown>;

type Filters = {
  query: string;
  profit: "all" | ProfitBand;
  decision: "all" | DecisionStatus;
  completeness: "all" | CostCompleteness;
};

export function PricingProfitWorkbench() {
  const { locale } = useLocale();
  const t = locale === "ko" ? KO_COPY : ZH_COPY;
  const [items, setItems] = useState<ProductProfitCalculationRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    query: "",
    profit: "all",
    decision: "all",
    completeness: "all",
  });

  useEffect(() => {
    const loaded = loadLocalProfitCalculations();
    setItems(loaded);
    setSelectedId(loaded[0]?.id ?? null);
  }, []);

  useEffect(() => {
    if (items.length > 0) return;
    seed();
  }, [items.length]);

  const filtered = useMemo(() => {
    const keyword = filters.query.trim().toLowerCase();
    return items.filter((item) => {
      const text = [
        item.product_name_ko,
        item.product_name_zh,
        item.brand,
        item.category,
        item.current_status,
        item.next_action,
        item.decision_reason,
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!keyword || text.includes(keyword)) &&
        (filters.profit === "all" || item.profit_level === filters.profit) &&
        (filters.decision === "all" || item.final_profit_decision === filters.decision) &&
        (filters.completeness === "all" || item.cost_completeness === filters.completeness)
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
    const total = items.length;
    const high = items.filter((item) => item.profit_level === "high").length;
    const healthy = items.filter((item) => item.profit_level === "medium").length;
    const lowOrLoss = items.filter((item) => item.profit_level === "low" || item.profit_level === "loss").length;
    const incomplete = items.filter((item) => item.cost_completeness !== "complete").length;
    const rg = items.filter((item) => item.rocket_growth_decision === "strong_yes").length;
    const pb = items.filter((item) => item.pb_decision === "strong_yes").length;
    const own = items.filter((item) => item.own_brand_decision === "strong_yes").length;

    return [
      { label: t.metrics.total, value: total, note: t.metrics.totalNote, icon: <FileBarChart2 className="h-4 w-4" /> },
      { label: t.metrics.high, value: high, note: t.metrics.highNote, tone: "success" as const, icon: <TrendingUp className="h-4 w-4" /> },
      { label: t.metrics.healthy, value: healthy, note: t.metrics.healthyNote, tone: "default" as const, icon: <HandCoins className="h-4 w-4" /> },
      { label: t.metrics.low, value: lowOrLoss, note: t.metrics.lowNote, tone: "warning" as const, icon: <TrendingDown className="h-4 w-4" /> },
      { label: t.metrics.incomplete, value: incomplete, note: t.metrics.incompleteNote, tone: "danger" as const, icon: <CircleAlert className="h-4 w-4" /> },
      { label: t.metrics.rg, value: rg, note: t.metrics.rgNote, icon: <ArrowRightLeft className="h-4 w-4" /> },
      { label: t.metrics.pb, value: pb, note: t.metrics.pbNote, icon: <BadgeDollarSign className="h-4 w-4" /> },
      { label: t.metrics.own, value: own, note: t.metrics.ownNote, icon: <Target className="h-4 w-4" /> },
    ];
  }, [items, t]);

  function persist(next: ProductProfitCalculationRecord[], message?: string) {
    replaceLocalProfitCalculations(next);
    setItems(next);
    if (message) setBanner(message);
  }

  async function seed() {
    const products = loadLocalProducts().map(buildProfitCalculationFromLocalProduct);
    const opportunities = loadLocalProductOpportunities().map(buildProfitCalculationFromOpportunity);
    let samples: ProductProfitCalculationRecord[] = [];
    if (!products.length && !opportunities.length) {
      try {
        const sampleModule = await import("@/data/coupang_hot_products_50.json");
        samples = ((sampleModule.default as SampleRow[]) ?? []).map(buildProfitCalculationFromSampleRow);
      } catch {
        samples = [];
      }
    }
    const next = mergeProfitCalculationRecords([], [...products, ...opportunities, ...samples]);
    if (!next.length) return;
    persist(next, t.messages.seeded);
  }

  function syncTestingDb() {
    const next = mergeProfitCalculationRecords(items, loadLocalProducts().map(buildProfitCalculationFromLocalProduct));
    persist(next, t.messages.testingDb);
  }

  function syncOpportunity() {
    const next = mergeProfitCalculationRecords(items, loadLocalProductOpportunities().map(buildProfitCalculationFromOpportunity));
    persist(next, t.messages.opportunity);
  }

  return (
    <>
      <PageHeader eyebrow={t.header.eyebrow} title={t.header.title} description={t.header.description} />
      <div className="flex w-full flex-col gap-6 px-5 py-8 sm:px-8 lg:px-10 2xl:px-12">
        <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-[linear-gradient(135deg,#fefce8_0%,#ffffff_46%,#eef6ff_100%)]">
          <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.95fr)] lg:px-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/90 px-3 py-1 text-xs font-semibold text-amber-700">
                <Calculator className="h-3.5 w-3.5" />
                {t.hero.badge}
              </div>
              <h2 className="mt-4 text-[28px] font-semibold tracking-[-0.04em] text-slate-950">{t.hero.title}</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{t.hero.description}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button onClick={syncTestingDb}>
                  <FolderSync className="h-4 w-4" />
                  {t.hero.syncTestingDb}
                </Button>
                <Button variant="outline" onClick={syncOpportunity}>
                  <ArrowRightLeft className="h-4 w-4" />
                  {t.hero.syncOpportunity}
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

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_440px]">
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
                <div className="grid gap-3 md:grid-cols-3">
                  <SelectField
                    label={t.filters.profit}
                    value={filters.profit}
                    onChange={(value) => setFilters((current) => ({ ...current, profit: value as Filters["profit"] }))}
                    options={[
                      { value: "all", label: t.filters.all },
                      { value: "high", label: t.levels.high },
                      { value: "medium", label: t.levels.medium },
                      { value: "low", label: t.levels.low },
                      { value: "loss", label: t.levels.loss },
                    ]}
                  />
                  <SelectField
                    label={t.filters.decision}
                    value={filters.decision}
                    onChange={(value) => setFilters((current) => ({ ...current, decision: value as Filters["decision"] }))}
                    options={[
                      { value: "all", label: t.filters.all },
                      { value: "strong_yes", label: t.decisions.strong_yes },
                      { value: "conditional", label: t.decisions.conditional },
                      { value: "observe", label: t.decisions.observe },
                      { value: "reject", label: t.decisions.reject },
                    ]}
                  />
                  <SelectField
                    label={t.filters.completeness}
                    value={filters.completeness}
                    onChange={(value) => setFilters((current) => ({ ...current, completeness: value as Filters["completeness"] }))}
                    options={[
                      { value: "all", label: t.filters.all },
                      { value: "complete", label: t.completeness.complete },
                      { value: "partial", label: t.completeness.partial },
                      { value: "missing", label: t.completeness.missing },
                    ]}
                  />
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
                    className={`grid w-full gap-4 rounded-[18px] border p-5 text-left transition-colors lg:grid-cols-[minmax(0,1.5fr)_110px_110px_130px] ${
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
                        <StatusBadge tone={toneForProfit(item.profit_level)}>{profitLabel(item.profit_level, t)}</StatusBadge>
                        <StatusBadge tone={toneForDecision(item.final_profit_decision)}>{decisionLabel(item.final_profit_decision, t)}</StatusBadge>
                      </div>
                    </div>
                    <Metric label={t.list.margin} value={`${item.estimated_margin_rate}%`} selected={item.id === selectedId} />
                    <Metric label={t.list.cost} value={`${item.total_cost_krw}`} selected={item.id === selectedId} />
                    <Metric label={t.list.status} value={item.current_status} selected={item.id === selectedId} />
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
                    <p className="mt-2 text-sm text-slate-500">
                      {selected.competitor_price_krw} KRW · {selected.review_count} reviews
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <MiniStat label={t.detail.marginRate} value={`${selected.estimated_margin_rate}%`} />
                    <MiniStat label={t.detail.marginKrw} value={`${selected.estimated_margin_krw}`} />
                    <MiniStat label={t.detail.breakEven} value={`${selected.break_even_price_krw}`} />
                    <MiniStat label={t.detail.safePrice} value={`${selected.safe_price_krw}`} />
                  </div>
                </>
              ) : null}
            </CardHeader>
            {selected ? (
              <CardContent className="space-y-6">
                <DetailSection title={t.detail.costBreakdown}>
                  <div className="grid gap-2 text-sm text-slate-600">
                    <DetailRow label={t.detail.chinaCost} value={`${selected.estimated_china_cost_rmb} RMB / ${selected.estimated_china_cost_krw} KRW`} />
                    <DetailRow label={t.detail.shipping} value={`${selected.international_shipping_krw} / ${selected.korea_local_shipping_krw}`} />
                    <DetailRow label={t.detail.fee} value={`${selected.coupang_fee_rate}% / ${selected.coupang_fee_krw} KRW`} />
                    <DetailRow label={t.detail.ads} value={`${selected.ad_cost_krw}`} />
                    <DetailRow label={t.detail.returnLoss} value={`${selected.return_loss_krw}`} />
                    <DetailRow label={t.detail.other} value={`${selected.other_cost_krw}`} />
                    <DetailRow label={t.detail.totalCost} value={`${selected.total_cost_krw}`} />
                  </div>
                </DetailSection>

                <DetailSection title={t.detail.decisionBoard}>
                  <div className="space-y-2">
                    <DecisionRow label="Rocket Growth" decision={selected.rocket_growth_decision} supply={`${selected.rocket_growth_supply_price}`} t={t} />
                    <DecisionRow label="PB" decision={selected.pb_decision} supply={`${selected.pb_supply_price}`} t={t} />
                    <DecisionRow label={t.detail.ownBrand} decision={selected.own_brand_decision} supply={`${selected.own_brand_sale_price}`} t={t} />
                    <DecisionRow label={t.detail.finalDecision} decision={selected.final_profit_decision} supply={selected.current_status} t={t} />
                  </div>
                </DetailSection>

                <DetailSection title={t.detail.scenarios}>
                  <div className="space-y-2">
                    {selected.scenarios.map((scenario) => (
                      <div key={scenario.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-medium text-slate-950">{scenario.label}</span>
                          <span>{scenario.sale_price_krw} KRW</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <span>{scenario.margin_krw} KRW / {scenario.margin_rate}%</span>
                          <StatusBadge tone={toneForProfit(scenario.decision)}>{profitLabel(scenario.decision, t)}</StatusBadge>
                        </div>
                      </div>
                    ))}
                  </div>
                </DetailSection>

                <DetailSection title={t.detail.missingFields}>
                  <p className="text-sm leading-6 text-slate-600">
                    {selected.missing_fields.length ? selected.missing_fields.join(", ") : t.detail.none}
                  </p>
                </DetailSection>

                <DetailSection title={t.detail.nextAction}>
                  <p className="text-sm leading-6 text-slate-600">{selected.next_action}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{selected.decision_reason}</p>
                </DetailSection>
              </CardContent>
            ) : (
              <CardContent>
                <EmptyPanel message={t.detail.empty} />
              </CardContent>
            )}
          </Card>
        </section>
      </div>
    </>
  );
}

function profitLabel(value: ProfitBand, t: typeof ZH_COPY) {
  return t.levels[value];
}

function decisionLabel(value: DecisionStatus, t: typeof ZH_COPY) {
  return t.decisions[value];
}

function toneForProfit(value: ProfitBand) {
  if (value === "high") return "success" as const;
  if (value === "medium") return "warning" as const;
  if (value === "low") return "warning" as const;
  return "danger" as const;
}

function toneForDecision(value: DecisionStatus) {
  if (value === "strong_yes") return "success" as const;
  if (value === "conditional") return "warning" as const;
  if (value === "observe") return "neutral" as const;
  return "danger" as const;
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <span>{label}</span>
      <span className="font-medium text-slate-950">{value}</span>
    </div>
  );
}

function DecisionRow({
  label,
  decision,
  supply,
  t,
}: {
  label: string;
  decision: DecisionStatus;
  supply: string;
  t: typeof ZH_COPY;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-950">{label}</p>
        <StatusBadge tone={toneForDecision(decision)}>{decisionLabel(decision, t)}</StatusBadge>
      </div>
      <p className="mt-2 text-sm text-slate-600">{supply}</p>
    </div>
  );
}

function EmptyPanel({ message }: { message: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">{message}</div>;
}

const ZH_COPY = {
  header: {
    eyebrow: "PROFIT INTELLIGENCE",
    title: "价格与供货利润测算",
    description: "把售价、采购、运费、平台费、广告费和退货损耗拆开算清楚，再判断 RG、PB、自有品牌到底值不值得做。",
  },
  hero: {
    badge: "长期运营型利润工作台",
    title: "先把利润算明白，再决定是冲规模、做 PB，还是直接暂停",
    description: "这里不是通用 AI 页面，而是实际运营会每天看的利润中台。核心目标是快速看清商品到底赚不赚钱、哪里还没补齐、下一步该压价还是该进样。",
    syncTestingDb: "同步商品测试库",
    syncOpportunity: "同步机会池",
    cards: [
      { title: "先看总利润", note: "先看目标售价下的总成本、毛利额和毛利率，避免只看采购价做判断。" },
      { title: "再看安全线", note: "看保本价、安全售价、30% / 40% 毛利可接受采购价，知道谈价空间。" },
      { title: "最后看去向", note: "RG、PB、自有品牌要分开判断，不同路径对利润要求不一样。" },
      { title: "缺字段就别硬推", note: "成本字段没补齐时直接标红，避免把半成品判断推给后续团队。" },
    ],
  },
  metrics: {
    total: "测算样本数",
    totalNote: "当前利润工作台里的总商品数。",
    high: "高利润",
    highNote: "毛利率达到 40% 及以上，可直接优先推进。",
    healthy: "健康利润",
    healthyNote: "毛利率在 25%-39%，可谈价后推进。",
    low: "低利润 / 亏损",
    lowNote: "当前利润偏薄，或者已经出现亏损。",
    incomplete: "成本不完整",
    incompleteNote: "还缺关键成本字段，先补数据再决策。",
    rg: "RG 可推进",
    rgNote: "适合 Rocket Growth 路线的商品。",
    pb: "PB 可推进",
    pbNote: "适合 PB 供应路径的商品。",
    own: "自有品牌可做",
    ownNote: "具备长期品牌化运营空间的商品。",
  },
  filters: {
    title: "利润筛选",
    description: "按利润等级、最终决策和成本完整度，快速筛出该推进和该暂停的商品。",
    search: "搜索商品名、品牌、类目、决策原因",
    profit: "利润等级",
    decision: "最终决策",
    completeness: "成本完整度",
    all: "全部",
  },
  list: {
    title: "利润测算列表",
    description: "统一管理所有已测算的商品利润表现。",
    margin: "毛利率",
    cost: "总成本",
    status: "当前状态",
    empty: "当前没有符合筛选条件的利润测算记录。",
  },
  detail: {
    eyebrow: "Profit Detail",
    empty: "请选择左侧商品查看利润拆解。",
    marginRate: "毛利率",
    marginKrw: "毛利额",
    breakEven: "保本价",
    safePrice: "安全售价",
    costBreakdown: "成本拆解",
    chinaCost: "中国采购成本",
    shipping: "国际 / 韩国物流",
    fee: "平台费率 / 金额",
    ads: "广告成本",
    returnLoss: "退货损耗",
    other: "其他成本",
    totalCost: "总成本",
    decisionBoard: "路线判断",
    ownBrand: "自有品牌",
    finalDecision: "最终决策",
    scenarios: "价格场景推演",
    missingFields: "缺失字段",
    nextAction: "下一步动作",
    none: "无",
  },
  levels: {
    high: "高利润",
    medium: "健康利润",
    low: "低利润",
    loss: "亏损",
  },
  decisions: {
    strong_yes: "可直接推进",
    conditional: "压价后推进",
    observe: "继续观察",
    reject: "建议暂停",
  },
  completeness: {
    complete: "完整",
    partial: "部分缺失",
    missing: "明显缺失",
  },
  messages: {
    seeded: "已把商品测试库和机会池样本自动汇入利润工作台。",
    testingDb: "已同步商品测试库到利润工作台。",
    opportunity: "已同步机会池到利润工作台。",
  },
  common: {
    noBrand: "无品牌",
  },
};

const KO_COPY: typeof ZH_COPY = {
  header: {
    eyebrow: "PROFIT INTELLIGENCE",
    title: "가격 및 공급 수익성 계산",
    description: "판매가, 매입가, 물류비, 플랫폼 수수료, 광고비, 반품 손실을 한 번에 계산해 RG / PB / 자사브랜드 방향을 판단합니다.",
  },
  hero: {
    badge: "장기 운영형 수익성 워크벤치",
    title: "먼저 이익을 숫자로 확인한 뒤, RG로 갈지 PB로 갈지 바로 판단합니다",
    description: "이 화면은 일반 AI 페이지가 아니라 실제 운영용 수익성 판단 워크벤치입니다. 상품이 실제로 남는지, 어느 비용이 비는지, 다음에 압가를 해야 하는지 바로 보게 합니다.",
    syncTestingDb: "상품 테스트DB 동기화",
    syncOpportunity: "기회보드 동기화",
    cards: [
      { title: "총이익 먼저", note: "판매가 대비 총비용, 마진액, 마진율을 먼저 보고 공급가만으로 착각하지 않게 합니다." },
      { title: "안전선 확인", note: "손익분기 가격, 안전 판매가, 30% / 40% 마진 기준 허용 매입가를 같이 봅니다." },
      { title: "경로별 판단", note: "RG, PB, 자사브랜드는 기대 마진 구조가 다르므로 각각 따로 판단합니다." },
      { title: "빈 데이터 차단", note: "핵심 비용 필드가 비면 바로 경고해서 반쪽짜리 의사결정을 막습니다." },
    ],
  },
  metrics: {
    total: "계산 상품 수",
    totalNote: "현재 수익성 워크벤치에 들어온 상품 수입니다.",
    high: "고수익 상품",
    highNote: "마진율 40% 이상으로 우선 추진 가능한 상품입니다.",
    healthy: "건강 수익",
    healthyNote: "마진율 25%-39%로 조건부 추진 가능한 상품입니다.",
    low: "저수익 / 손실",
    lowNote: "이익이 얇거나 이미 손실 구간인 상품입니다.",
    incomplete: "비용 미완성",
    incompleteNote: "핵심 비용 데이터가 비어 있어 먼저 보완이 필요합니다.",
    rg: "RG 가능",
    rgNote: "Rocket Growth 경로로 추진할 수 있는 상품입니다.",
    pb: "PB 가능",
    pbNote: "PB 공급 경로에 더 적합한 상품입니다.",
    own: "자사브랜드 가능",
    ownNote: "장기 브랜드 운영으로 확장 가능한 상품입니다.",
  },
  filters: {
    title: "수익성 필터",
    description: "마진 구간, 최종 결정, 비용 완성도를 기준으로 우선순위 상품을 빠르게 추립니다.",
    search: "상품명, 브랜드, 카테고리, 판단 이유 검색",
    profit: "수익 구간",
    decision: "최종 판단",
    completeness: "비용 완성도",
    all: "전체",
  },
  list: {
    title: "수익성 계산 목록",
    description: "계산이 끝난 상품을 한곳에서 관리합니다.",
    margin: "마진율",
    cost: "총비용",
    status: "현재 상태",
    empty: "필터 조건에 맞는 수익성 계산 기록이 없습니다.",
  },
  detail: {
    eyebrow: "Profit Detail",
    empty: "왼쪽에서 상품을 선택하면 수익성 상세를 볼 수 있습니다.",
    marginRate: "마진율",
    marginKrw: "마진액",
    breakEven: "손익분기 가격",
    safePrice: "안전 판매가",
    costBreakdown: "비용 분해",
    chinaCost: "중국 원가",
    shipping: "국제 / 국내 물류",
    fee: "수수료율 / 금액",
    ads: "광고비",
    returnLoss: "반품 손실",
    other: "기타 비용",
    totalCost: "총비용",
    decisionBoard: "경로 판단",
    ownBrand: "자사브랜드",
    finalDecision: "최종 판단",
    scenarios: "판매가 시나리오",
    missingFields: "누락 필드",
    nextAction: "다음 액션",
    none: "없음",
  },
  levels: {
    high: "고수익",
    medium: "건강 수익",
    low: "저수익",
    loss: "손실",
  },
  decisions: {
    strong_yes: "바로 추진",
    conditional: "압가 후 추진",
    observe: "계속 관찰",
    reject: "일단 보류",
  },
  completeness: {
    complete: "완전",
    partial: "부분 누락",
    missing: "핵심 누락",
  },
  messages: {
    seeded: "상품 테스트DB와 기회보드 샘플을 수익성 워크벤치에 자동 반영했습니다.",
    testingDb: "상품 테스트DB를 수익성 워크벤치에 반영했습니다.",
    opportunity: "기회보드를 수익성 워크벤치에 반영했습니다.",
  },
  common: {
    noBrand: "브랜드 없음",
  },
};

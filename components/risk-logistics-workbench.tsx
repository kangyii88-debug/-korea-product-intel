"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  FileWarning,
  FolderSync,
  PackageSearch,
  Radar,
  Search,
  ShieldAlert,
  ShieldCheck,
  Truck,
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
  buildRiskAssessmentFromLocalProduct,
  buildRiskAssessmentFromOpportunity,
  loadLocalRiskAssessments,
  mergeRiskAssessmentRecords,
  replaceLocalRiskAssessments,
  type ProductRiskAssessmentRecord,
  type RiskAction,
  type RiskLevel,
} from "@/lib/product-risk-local";

type SampleRow = Record<string, unknown>;

type Filters = {
  query: string;
  overall: "all" | RiskLevel;
  certification: "all" | RiskLevel;
  logistics: "all" | RiskLevel;
  action: "all" | RiskAction;
};

export function RiskLogisticsWorkbench() {
  const { locale } = useLocale();
  const t = locale === "ko" ? KO_COPY : ZH_COPY;
  const [items, setItems] = useState<ProductRiskAssessmentRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    query: "",
    overall: "all",
    certification: "all",
    logistics: "all",
    action: "all",
  });

  useEffect(() => {
    const loaded = loadLocalRiskAssessments();
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
        item.consumer_pain_points,
        item.risk_reason,
        item.current_status,
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!keyword || text.includes(keyword)) &&
        (filters.overall === "all" || item.overall_risk_level === filters.overall) &&
        (filters.certification === "all" || item.certification_risk_level === filters.certification) &&
        (filters.logistics === "all" || item.logistics_risk_level === filters.logistics) &&
        (filters.action === "all" || item.recommended_action === filters.action)
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
      { label: t.metrics.total, value: items.length, note: t.metrics.totalNote, icon: <PackageSearch className="h-4 w-4" /> },
      { label: t.metrics.high, value: items.filter((item) => item.overall_risk_level === "high").length, note: t.metrics.highNote, tone: "danger" as const, icon: <AlertTriangle className="h-4 w-4" /> },
      { label: t.metrics.certification, value: items.filter((item) => item.certification_risk_level === "high").length, note: t.metrics.certificationNote, tone: "warning" as const, icon: <ShieldAlert className="h-4 w-4" /> },
      { label: t.metrics.logistics, value: items.filter((item) => item.logistics_risk_level === "high").length, note: t.metrics.logisticsNote, tone: "warning" as const, icon: <Truck className="h-4 w-4" /> },
      { label: t.metrics.returnRisk, value: items.filter((item) => item.return_risk_level === "high").length, note: t.metrics.returnRiskNote, tone: "warning" as const, icon: <Radar className="h-4 w-4" /> },
      { label: t.metrics.platform, value: items.filter((item) => item.platform_risk_level === "high").length, note: t.metrics.platformNote, tone: "danger" as const, icon: <FileWarning className="h-4 w-4" /> },
      { label: t.metrics.push, value: items.filter((item) => item.recommended_action === "push").length, note: t.metrics.pushNote, tone: "success" as const, icon: <ShieldCheck className="h-4 w-4" /> },
      { label: t.metrics.pause, value: items.filter((item) => item.recommended_action === "pause").length, note: t.metrics.pauseNote, tone: "danger" as const, icon: <ShieldAlert className="h-4 w-4" /> },
    ];
  }, [items, t]);

  function persist(next: ProductRiskAssessmentRecord[], message?: string) {
    replaceLocalRiskAssessments(next);
    setItems(next);
    if (message) setBanner(message);
  }

  async function seed() {
    const products = loadLocalProducts().map(buildRiskAssessmentFromLocalProduct);
    const opportunities = loadLocalProductOpportunities().map(buildRiskAssessmentFromOpportunity);
    let samples: ProductRiskAssessmentRecord[] = [];
    if (!products.length && !opportunities.length) {
      try {
        const sampleModule = await import("@/data/coupang_hot_products_50.json");
        samples = ((sampleModule.default as SampleRow[]) ?? []).map(mapSampleToRiskRecord);
      } catch {
        samples = [];
      }
    }
    const next = mergeRiskAssessmentRecords([], [...products, ...opportunities, ...samples]);
    if (!next.length) return;
    persist(next, t.messages.seeded);
  }

  function syncTestingDb() {
    const next = mergeRiskAssessmentRecords(items, loadLocalProducts().map(buildRiskAssessmentFromLocalProduct));
    persist(next, t.messages.testingDb);
  }

  function syncOpportunity() {
    const next = mergeRiskAssessmentRecords(items, loadLocalProductOpportunities().map(buildRiskAssessmentFromOpportunity));
    persist(next, t.messages.opportunity);
  }

  return (
    <>
      <PageHeader eyebrow={t.header.eyebrow} title={t.header.title} description={t.header.description} />
      <div className="flex w-full flex-col gap-6 px-5 py-8 sm:px-8 lg:px-10 2xl:px-12">
        <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-[linear-gradient(135deg,#fff1f2_0%,#ffffff_46%,#eef7ff_100%)]">
          <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.95fr)] lg:px-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white/90 px-3 py-1 text-xs font-semibold text-rose-700">
                <ShieldAlert className="h-3.5 w-3.5" />
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
                  <ShieldCheck className="h-4 w-4" />
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
                <div className="grid gap-3 md:grid-cols-4">
                  <SelectField
                    label={t.filters.overall}
                    value={filters.overall}
                    onChange={(value) => setFilters((current) => ({ ...current, overall: value as Filters["overall"] }))}
                    options={[
                      { value: "all", label: t.filters.all },
                      { value: "high", label: t.levels.high },
                      { value: "medium", label: t.levels.medium },
                      { value: "low", label: t.levels.low },
                    ]}
                  />
                  <SelectField
                    label={t.filters.certification}
                    value={filters.certification}
                    onChange={(value) => setFilters((current) => ({ ...current, certification: value as Filters["certification"] }))}
                    options={[
                      { value: "all", label: t.filters.all },
                      { value: "high", label: t.levels.high },
                      { value: "medium", label: t.levels.medium },
                      { value: "low", label: t.levels.low },
                    ]}
                  />
                  <SelectField
                    label={t.filters.logistics}
                    value={filters.logistics}
                    onChange={(value) => setFilters((current) => ({ ...current, logistics: value as Filters["logistics"] }))}
                    options={[
                      { value: "all", label: t.filters.all },
                      { value: "high", label: t.levels.high },
                      { value: "medium", label: t.levels.medium },
                      { value: "low", label: t.levels.low },
                    ]}
                  />
                  <SelectField
                    label={t.filters.action}
                    value={filters.action}
                    onChange={(value) => setFilters((current) => ({ ...current, action: value as Filters["action"] }))}
                    options={[
                      { value: "all", label: t.filters.all },
                      { value: "push", label: t.actions.push },
                      { value: "conditional", label: t.actions.conditional },
                      { value: "observe", label: t.actions.observe },
                      { value: "pause", label: t.actions.pause },
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
                        <StatusBadge tone={toneForLevel(item.overall_risk_level)}>{riskLabel(item.overall_risk_level, t)}</StatusBadge>
                        <StatusBadge tone={toneForAction(item.recommended_action)}>{actionLabel(item.recommended_action, t)}</StatusBadge>
                      </div>
                    </div>
                    <Metric label={t.list.certification} value={riskLabel(item.certification_risk_level, t)} selected={item.id === selectedId} />
                    <Metric label={t.list.logistics} value={riskLabel(item.logistics_risk_level, t)} selected={item.id === selectedId} />
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
                      {selected.review_count} reviews · {selected.competitor_price_krw} KRW
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <MiniStat label={t.detail.overall} value={riskLabel(selected.overall_risk_level, t)} />
                    <MiniStat label={t.detail.certification} value={riskLabel(selected.certification_risk_level, t)} />
                    <MiniStat label={t.detail.logistics} value={riskLabel(selected.logistics_risk_level, t)} />
                    <MiniStat label={t.detail.returnRisk} value={riskLabel(selected.return_risk_level, t)} />
                  </div>
                </>
              ) : null}
            </CardHeader>
            {selected ? (
              <CardContent className="space-y-6">
                <DetailSection title={t.detail.flags}>
                  <div className="flex flex-wrap gap-2">
                    {buildFlagChips(selected, t).map((flag) => (
                      <StatusBadge key={flag} tone="warning">{flag}</StatusBadge>
                    ))}
                    {!buildFlagChips(selected, t).length ? <p className="text-sm text-slate-500">{t.detail.none}</p> : null}
                  </div>
                </DetailSection>

                <DetailSection title={t.detail.documents}>
                  <p className="text-sm leading-6 text-slate-600">
                    {selected.required_documents.length ? selected.required_documents.join(", ") : t.detail.none}
                  </p>
                </DetailSection>

                <DetailSection title={t.detail.reason}>
                  <p className="text-sm leading-6 text-slate-600">{selected.risk_reason}</p>
                </DetailSection>

                <DetailSection title={t.detail.actionItems}>
                  <div className="space-y-2">
                    {selected.action_items.map((item, index) => (
                      <div key={`${item}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                        {item}
                      </div>
                    ))}
                    {!selected.action_items.length ? <p className="text-sm text-slate-500">{t.detail.none}</p> : null}
                  </div>
                </DetailSection>

                <DetailSection title={t.detail.nextAction}>
                  <p className="text-sm leading-6 text-slate-600">{selected.next_action}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusBadge tone={toneForAction(selected.recommended_action)}>{actionLabel(selected.recommended_action, t)}</StatusBadge>
                    <StatusBadge tone={toneForLevel(selected.platform_risk_level)}>{t.detail.platform}: {riskLabel(selected.platform_risk_level, t)}</StatusBadge>
                  </div>
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

function mapSampleToRiskRecord(row: SampleRow): ProductRiskAssessmentRecord {
  const now = new Date().toISOString();
  const pain = [text(row.consumer_pain_points), text(row.bad_review_samples), text(row.market_analysis)]
    .filter(Boolean)
    .join(" ");
  const needKc = /baby|kids|儿童|婴儿|食品|food|电子|电池|usb|led|medical|医|化妆|cosmetic/i.test(
    `${text(row.product_name_ko)} ${text(row.product_name_zh)} ${text(row.category)}`,
  );
  const fragile = /fragile|易碎|破损|깨짐/i.test(pain);
  const sizeIssue = /size|尺寸|太小|太大|작다|크다/i.test(pain);
  const installIssue = /install|安装|설치|조립/i.test(pain);
  const qualityIssue = /quality|质量|불량|内구|마감/i.test(pain);
  const colorIssue = /color|颜色|색상/i.test(pain);
  const smellIssue = /smell|味道|냄새/i.test(pain);
  const imageIssue = /image|photo|图片|상세|图文/i.test(pain);
  const highReturn = /退货|반품/i.test(pain);
  const certification: RiskLevel = needKc ? "high" : "low";
  const logistics: RiskLevel = fragile ? "high" : "medium";
  const returnRisk: RiskLevel = highReturn || qualityIssue || sizeIssue ? "high" : installIssue || colorIssue || smellIssue || imageIssue ? "medium" : "low";
  const platform: RiskLevel = needKc ? "medium" : "low";
  const overall: RiskLevel = [certification, logistics, returnRisk, platform].includes("high")
    ? "high"
    : [certification, logistics, returnRisk, platform].includes("medium")
      ? "medium"
      : "low";
  const action: RiskAction = certification === "high" ? "pause" : overall === "high" ? "observe" : overall === "medium" ? "conditional" : "push";
  const docs = needKc ? ["KC certification or exemption note"] : [];
  const actions = [
    needKc ? "先确认 KC 或韩国法规适配" : "",
    fragile ? "先确认包装与运输抗损方案" : "",
    highReturn || sizeIssue || qualityIssue ? "先复盘差评并修正尺寸 / 质量 / 文案" : "",
  ].filter(Boolean);

  return {
    id: `sample-${text(row.coupang_url) || text(row.product_name_ko)}`,
    source_type: "opportunity_board",
    source_id: text(row.coupang_url) || text(row.product_name_ko),
    product_name_ko: text(row.product_name_ko),
    product_name_zh: text(row.product_name_zh),
    coupang_url: text(row.coupang_url),
    image_url: text(row.image_url),
    category: text(row.category),
    brand: text(row.brand),
    material: "",
    usage_description: text(row.market_analysis),
    size: "",
    weight: "",
    package_size: "",
    competitor_price_krw: toNumber(row.competitor_price_krw),
    monthly_purchase_badge: text(row.monthly_purchase_badge),
    review_count: toNumber(row.review_count),
    rating: toNumber(row.rating),
    consumer_pain_points: pain,
    risk_need_kc: needKc,
    risk_kc_documents_ready: false,
    risk_children_product: /baby|kids|儿童|婴儿/i.test(`${text(row.product_name_ko)} ${text(row.product_name_zh)}`),
    risk_food: /food|食品/i.test(`${text(row.product_name_ko)} ${text(row.product_name_zh)}`),
    risk_electronics: /电子|电|usb|led|충전|전기/i.test(`${text(row.product_name_ko)} ${text(row.product_name_zh)}`),
    risk_cosmetics: /化妆|护肤|cosmetic|뷰티/i.test(`${text(row.product_name_ko)} ${text(row.product_name_zh)}`),
    risk_medical: /medical|医疗|医|치료/i.test(`${text(row.product_name_ko)} ${text(row.product_name_zh)}`),
    risk_skin_contact: /贴肤|face|body|피부|착용/i.test(`${text(row.product_name_ko)} ${text(row.product_name_zh)}`),
    risk_battery: /battery|电池|배터리/i.test(`${text(row.product_name_ko)} ${text(row.product_name_zh)}`),
    risk_plug: /plug|插头|콘센트|전기/i.test(`${text(row.product_name_ko)} ${text(row.product_name_zh)}`),
    risk_liquid: /liquid|液体|喷雾|세제/i.test(`${text(row.product_name_ko)} ${text(row.product_name_zh)}`),
    risk_chemical: /chemical|化学|胶|접착|세정/i.test(`${text(row.product_name_ko)} ${text(row.product_name_zh)} ${pain}`),
    risk_korea_regulation_uncertain: false,
    risk_fragile: fragile,
    risk_heavy: false,
    risk_large_volume: false,
    risk_package_unknown: true,
    international_logistics_risk: logistics,
    korea_local_logistics_risk: "medium",
    risk_high_return: highReturn,
    risk_size_issue: sizeIssue,
    risk_installation_issue: installIssue,
    risk_quality_issue: qualityIssue,
    risk_color_difference: colorIssue,
    risk_smell_issue: smellIssue,
    risk_image_mismatch: imageIssue,
    risk_coupang_platform_limit: false,
    certification_risk_level: certification,
    logistics_risk_level: logistics,
    return_risk_level: returnRisk,
    platform_risk_level: platform,
    overall_risk_level: overall,
    risk_reason: [`certification ${certification}`, `logistics ${logistics}`, `return ${returnRisk}`].join(" | "),
    required_documents: docs,
    recommended_action: action,
    next_action: actions[0] || "继续观察",
    current_status: action === "push" ? "可继续推进" : action === "conditional" ? "有条件推进" : action === "observe" ? "继续观察" : "建议暂停",
    action_items: actions,
    created_at: now,
    updated_at: now,
  };
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
}

function toNumber(value: unknown) {
  const n = Number(String(value ?? 0).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function buildFlagChips(item: ProductRiskAssessmentRecord, t: typeof ZH_COPY) {
  const flags: string[] = [];
  if (item.risk_need_kc) flags.push(t.flags.kc);
  if (item.risk_children_product) flags.push(t.flags.children);
  if (item.risk_food) flags.push(t.flags.food);
  if (item.risk_electronics) flags.push(t.flags.electronics);
  if (item.risk_cosmetics) flags.push(t.flags.cosmetics);
  if (item.risk_medical) flags.push(t.flags.medical);
  if (item.risk_fragile) flags.push(t.flags.fragile);
  if (item.risk_large_volume) flags.push(t.flags.largeVolume);
  if (item.risk_heavy) flags.push(t.flags.heavy);
  if (item.risk_coupang_platform_limit) flags.push(t.flags.platformLimit);
  return flags;
}

function riskLabel(level: RiskLevel, t: typeof ZH_COPY) {
  return t.levels[level];
}

function actionLabel(action: RiskAction, t: typeof ZH_COPY) {
  return t.actions[action];
}

function toneForLevel(level: RiskLevel) {
  if (level === "high") return "danger" as const;
  if (level === "medium") return "warning" as const;
  return "success" as const;
}

function toneForAction(action: RiskAction) {
  if (action === "push") return "success" as const;
  if (action === "conditional") return "warning" as const;
  if (action === "observe") return "neutral" as const;
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

function EmptyPanel({ message }: { message: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">{message}</div>;
}

const ZH_COPY = {
  header: {
    eyebrow: "RISK INTELLIGENCE",
    title: "认证 / 物流风险判断",
    description: "把 KC、法规、包装、物流、退货和平台限制统一看清，避免还没上架就把问题留给后面。",
  },
  hero: {
    badge: "长期运营型风险工作台",
    title: "先看能不能进韩国，再看能不能稳定卖",
    description: "这不是泛泛的风险提示页，而是把认证、法规、物流、退货和平台限制统一落成执行判断的页面。目的不是吓人，而是尽早排雷。",
    syncTestingDb: "同步商品测试库",
    syncOpportunity: "同步机会池",
    cards: [
      { title: "先看认证红线", note: "儿童、食品、电子、医疗、KC 缺件这类先单独拎出来看。" },
      { title: "再看物流难度", note: "易碎、大体积、重货、包装未知，都会直接推高国际和本地履约风险。" },
      { title: "再看退货触发", note: "尺寸、安装、质量、色差、异味、图文不符是最常见的退货起点。" },
      { title: "最后给动作", note: "每个商品都必须落到继续推进、有条件推进、观察、暂停四种动作之一。" },
    ],
  },
  metrics: {
    total: "风险样本数",
    totalNote: "当前风险工作台中的总商品数。",
    high: "高总风险",
    highNote: "整体风险已经高到不能直接推进的商品。",
    certification: "认证高风险",
    certificationNote: "KC / 法规类风险偏高的商品。",
    logistics: "物流高风险",
    logisticsNote: "体积、重量或破损风险过高的商品。",
    returnRisk: "退货高风险",
    returnRiskNote: "差评与售后问题会直接推高退货的商品。",
    platform: "平台高风险",
    platformNote: "Coupang 限制或平台规则不确定的商品。",
    push: "可继续推进",
    pushNote: "整体风险较低，可进入后续动作。",
    pause: "建议暂停",
    pauseNote: "当前更适合暂停，先别往后推。",
  },
  filters: {
    title: "风险筛选",
    description: "按总风险、认证、物流和动作建议，快速筛出最该优先排雷的商品。",
    search: "搜索商品名、品牌、类目、风险原因",
    overall: "总风险",
    certification: "认证风险",
    logistics: "物流风险",
    action: "动作建议",
    all: "全部",
  },
  list: {
    title: "风险判断列表",
    description: "统一管理认证、物流和平台侧的商品风险。",
    certification: "认证",
    logistics: "物流",
    status: "状态",
    empty: "当前没有符合筛选条件的风险记录。",
  },
  detail: {
    eyebrow: "Risk Detail",
    empty: "请选择左侧商品查看风险细节。",
    overall: "总风险",
    certification: "认证",
    logistics: "物流",
    returnRisk: "退货",
    platform: "平台",
    flags: "风险标签",
    documents: "需要准备的文件",
    reason: "风险原因",
    actionItems: "排雷动作",
    nextAction: "下一步动作",
    none: "无",
  },
  levels: {
    high: "高风险",
    medium: "中风险",
    low: "低风险",
  },
  actions: {
    push: "可推进",
    conditional: "有条件推进",
    observe: "继续观察",
    pause: "建议暂停",
  },
  flags: {
    kc: "需要 KC",
    children: "儿童用品",
    food: "食品相关",
    electronics: "电子相关",
    cosmetics: "美妆相关",
    medical: "医疗相关",
    fragile: "易碎",
    largeVolume: "大体积",
    heavy: "重货",
    platformLimit: "平台限制",
  },
  messages: {
    seeded: "已把商品测试库和机会池样本自动汇入风险工作台。",
    testingDb: "已同步商品测试库到风险工作台。",
    opportunity: "已同步机会池到风险工作台。",
  },
  common: {
    noBrand: "无品牌",
  },
};

const KO_COPY: typeof ZH_COPY = {
  header: {
    eyebrow: "RISK INTELLIGENCE",
    title: "인증 / 물류 리스크 판단",
    description: "KC, 규제, 포장, 물류, 반품, 플랫폼 제한을 한 화면에서 점검해 뒤늦은 리스크를 막습니다.",
  },
  hero: {
    badge: "장기 운영형 리스크 워크벤치",
    title: "한국에 들여올 수 있는지, 그리고 안정적으로 팔 수 있는지 먼저 확인합니다",
    description: "이 화면은 단순 경고용이 아니라 실제 운영을 위한 리스크 판단 화면입니다. 인증, 규제, 물류, 반품, 플랫폼 제한을 모두 묶어서 다음 액션으로 바로 연결합니다.",
    syncTestingDb: "상품 테스트DB 동기화",
    syncOpportunity: "기회보드 동기화",
    cards: [
      { title: "인증 레드라인", note: "어린이, 식품, 전자, 의료, KC 미비 항목을 먼저 분리해서 봅니다." },
      { title: "물류 난이도", note: "파손, 대형 부피, 중량, 포장 미확정은 국제 / 국내 물류 리스크를 크게 올립니다." },
      { title: "반품 유발 포인트", note: "사이즈, 설치, 품질, 색상, 냄새, 상세페이지 불일치가 대표적인 반품 원인입니다." },
      { title: "액션 강제", note: "모든 상품은 추진 / 조건부 / 관찰 / 보류 중 하나로 떨어지게 설계했습니다." },
    ],
  },
  metrics: {
    total: "리스크 샘플 수",
    totalNote: "현재 리스크 워크벤치 안의 총 상품 수입니다.",
    high: "고위험 상품",
    highNote: "바로 추진하기 어려운 전체 고위험 상품입니다.",
    certification: "인증 고위험",
    certificationNote: "KC / 규제 관련 리스크가 높은 상품입니다.",
    logistics: "물류 고위험",
    logisticsNote: "부피, 중량, 파손 가능성이 높은 상품입니다.",
    returnRisk: "반품 고위험",
    returnRiskNote: "반품과 CS 이슈가 크게 발생할 가능성이 높은 상품입니다.",
    platform: "플랫폼 고위험",
    platformNote: "Coupang 제한 또는 플랫폼 정책 불확실성이 큰 상품입니다.",
    push: "계속 추진 가능",
    pushNote: "전체 리스크가 낮아 다음 단계로 넘길 수 있습니다.",
    pause: "일단 보류",
    pauseNote: "현재 단계에서는 멈추고 먼저 검증이 필요한 상품입니다.",
  },
  filters: {
    title: "리스크 필터",
    description: "총 리스크, 인증, 물류, 추천 액션 기준으로 우선 점검 상품을 빠르게 찾습니다.",
    search: "상품명, 브랜드, 카테고리, 리스크 이유 검색",
    overall: "총 리스크",
    certification: "인증 리스크",
    logistics: "물류 리스크",
    action: "액션 제안",
    all: "전체",
  },
  list: {
    title: "리스크 판단 목록",
    description: "인증, 물류, 플랫폼 측 리스크 상품을 한곳에서 관리합니다.",
    certification: "인증",
    logistics: "물류",
    status: "상태",
    empty: "필터 조건에 맞는 리스크 판단 기록이 없습니다.",
  },
  detail: {
    eyebrow: "Risk Detail",
    empty: "왼쪽에서 상품을 선택하면 리스크 상세를 볼 수 있습니다.",
    overall: "총 리스크",
    certification: "인증",
    logistics: "물류",
    returnRisk: "반품",
    platform: "플랫폼",
    flags: "리스크 태그",
    documents: "필요 서류",
    reason: "리스크 이유",
    actionItems: "선행 조치",
    nextAction: "다음 액션",
    none: "없음",
  },
  levels: {
    high: "고위험",
    medium: "중위험",
    low: "저위험",
  },
  actions: {
    push: "추진 가능",
    conditional: "조건부 추진",
    observe: "계속 관찰",
    pause: "보류 권장",
  },
  flags: {
    kc: "KC 필요",
    children: "어린이 제품",
    food: "식품 관련",
    electronics: "전자 관련",
    cosmetics: "화장품 관련",
    medical: "의료 관련",
    fragile: "파손 주의",
    largeVolume: "대부피",
    heavy: "중량물",
    platformLimit: "플랫폼 제한",
  },
  messages: {
    seeded: "상품 테스트DB와 기회보드 샘플을 리스크 워크벤치에 자동 반영했습니다.",
    testingDb: "상품 테스트DB를 리스크 워크벤치에 반영했습니다.",
    opportunity: "기회보드를 리스크 워크벤치에 반영했습니다.",
  },
  common: {
    noBrand: "브랜드 없음",
  },
};

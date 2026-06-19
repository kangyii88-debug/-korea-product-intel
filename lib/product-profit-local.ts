"use client";

import type { LocalProduct } from "@/lib/local-products";
import type { ProductOpportunityRecord } from "@/lib/product-opportunities";

type SampleRow = Record<string, unknown>;

export type ProfitBand = "high" | "medium" | "low" | "loss";
export type CostCompleteness = "complete" | "partial" | "missing";
export type DecisionStatus = "strong_yes" | "conditional" | "observe" | "reject";

export type ProductProfitCalculationRecord = {
  id: string;
  source_type: "testing_db" | "opportunity_board";
  source_id: string;
  product_name_ko: string;
  product_name_zh: string;
  coupang_url: string;
  image_url: string;
  category: string;
  brand: string;
  competitor_price_krw: number;
  price_range: string;
  monthly_purchase_badge: string;
  review_count: number;
  rating: number;
  estimated_china_cost_rmb: number;
  exchange_rate: number;
  estimated_china_cost_krw: number;
  international_shipping_krw: number;
  korea_local_shipping_krw: number;
  coupang_fee_rate: number;
  coupang_fee_krw: number;
  ad_cost_krw: number;
  return_loss_krw: number;
  other_cost_krw: number;
  target_sale_price_krw: number;
  total_cost_krw: number;
  estimated_margin_krw: number;
  estimated_margin_rate: number;
  break_even_price_krw: number;
  safe_price_krw: number;
  max_purchase_cost_for_40_margin: number;
  max_purchase_cost_for_30_margin: number;
  profit_level: ProfitBand;
  cost_completeness: CostCompleteness;
  price_war_risk: "low" | "medium" | "high";
  rocket_growth_supply_price: number;
  rocket_growth_decision: DecisionStatus;
  pb_supply_price: number;
  pb_decision: DecisionStatus;
  own_brand_sale_price: number;
  own_brand_decision: DecisionStatus;
  final_profit_decision: DecisionStatus;
  decision_reason: string;
  missing_fields: string[];
  next_action: string;
  current_status: string;
  scenarios: Array<{
    label: string;
    sale_price_krw: number;
    margin_krw: number;
    margin_rate: number;
    decision: ProfitBand;
  }>;
  created_at: string;
  updated_at: string;
};

const STORAGE_KEY = "kpi-product-profit-calculations-v1";
export const DEFAULT_EXCHANGE_RATE = 190;

export function loadLocalProfitCalculations(): ProductProfitCalculationRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ProductProfitCalculationRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalProfitCalculations(items: ProductProfitCalculationRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function replaceLocalProfitCalculations(items: ProductProfitCalculationRecord[]) {
  saveLocalProfitCalculations(items);
}

export function buildProfitCalculationFromLocalProduct(product: LocalProduct): ProductProfitCalculationRecord {
  const estimatedChinaCostRmb = round(product.chinaCostRmb || product.targetSupplyPriceKrw / DEFAULT_EXCHANGE_RATE || 0, 1);
  const base = buildProfitRecordBase({
    id: `testing-${product.id}`,
    source_type: "testing_db",
    source_id: product.id,
    product_name_ko: product.productNameKo,
    product_name_zh: product.productNameZh,
    coupang_url: product.competitorUrl,
    image_url: product.image,
    category: product.category,
    brand: product.brand,
    competitor_price_krw: product.competitorSalePriceKrw || product.discountPrice || product.price || 0,
    price_range: product.priceRange,
    monthly_purchase_badge: "",
    review_count: product.reviewCount,
    rating: product.rating,
    estimated_china_cost_rmb: estimatedChinaCostRmb,
    exchange_rate: DEFAULT_EXCHANGE_RATE,
    international_shipping_krw: product.internationalShippingKrw || 3800,
    korea_local_shipping_krw: product.koreaShippingKrw || 3200,
    coupang_fee_rate: product.coupangFeePercent || 11.9,
    ad_cost_krw: product.adCostKrw || 600,
    return_loss_krw: product.returnLossKrw || 800,
    other_cost_krw: product.otherCostKrw || 300,
    target_sale_price_krw: product.competitorSalePriceKrw || product.discountPrice || product.price || 0,
    notes: [product.marketAnalysis, product.sampleDevelopmentAdvice, product.recommendationReason].filter(Boolean).join(" "),
    source_margin_rate: undefined,
    source_risk_level: undefined,
  });

  return finalizeProfitRecord(base);
}

export function buildProfitCalculationFromOpportunity(item: ProductOpportunityRecord): ProductProfitCalculationRecord {
  const estimatedPurchaseCost = Number(item.estimated_purchase_cost || 0);
  const estimatedChinaCostRmb = round(estimatedPurchaseCost / DEFAULT_EXCHANGE_RATE, 1);
  const base = buildProfitRecordBase({
    id: `opportunity-${item.id}`,
    source_type: "opportunity_board",
    source_id: item.id,
    product_name_ko: item.title,
    product_name_zh: item.title,
    coupang_url: item.coupang_url || "",
    image_url: item.image_url || "",
    category: item.category,
    brand: "",
    competitor_price_krw: Number(item.price || item.estimated_sale_price || 0),
    price_range: item.competitor_price_range || "",
    monthly_purchase_badge: item.demand_stability || "",
    review_count: Number(item.review_count || 0),
    rating: Number(item.rating || 0),
    estimated_china_cost_rmb: estimatedChinaCostRmb,
    exchange_rate: DEFAULT_EXCHANGE_RATE,
    international_shipping_krw: Number(item.estimated_shipping_cost || 3800),
    korea_local_shipping_krw: Number(item.estimated_local_delivery_cost || 3200),
    coupang_fee_rate: Number(item.platform_fee_rate || 11.9),
    ad_cost_krw: Number(item.estimated_ad_cost || 600),
    return_loss_krw: estimateReturnLossFromRisk(item.return_risk),
    other_cost_krw: 300,
    target_sale_price_krw: Number(item.estimated_sale_price || item.price || 0),
    notes: [item.notes, item.improvement_points, item.review_issue_summary].filter(Boolean).join(" "),
    source_margin_rate: item.estimated_margin_rate,
    source_risk_level: item.risk_level,
  });

  return finalizeProfitRecord(base);
}

export function buildProfitCalculationFromSampleRow(row: SampleRow): ProductProfitCalculationRecord {
  const salePrice = toNumber(row.competitor_price_krw);
  const recommendation = text(row.recommended_business_type || row.next_action);
  const estimatedChinaCostRmb = round(Math.max(0, salePrice * 0.34) / DEFAULT_EXCHANGE_RATE, 1);
  const base = buildProfitRecordBase({
    id: `sample-${text(row.coupang_url) || text(row.product_name_ko)}`,
    source_type: "opportunity_board",
    source_id: text(row.coupang_url) || text(row.product_name_ko),
    product_name_ko: text(row.product_name_ko),
    product_name_zh: text(row.product_name_zh),
    coupang_url: text(row.coupang_url),
    image_url: text(row.image_url),
    category: text(row.category),
    brand: text(row.brand),
    competitor_price_krw: salePrice,
    price_range: text(row.price_range),
    monthly_purchase_badge: text(row.monthly_purchase_badge),
    review_count: toNumber(row.review_count),
    rating: toNumber(row.rating),
    estimated_china_cost_rmb: estimatedChinaCostRmb,
    exchange_rate: DEFAULT_EXCHANGE_RATE,
    international_shipping_krw: salePrice > 25000 ? 5500 : 3800,
    korea_local_shipping_krw: 3200,
    coupang_fee_rate: 11.9,
    ad_cost_krw: salePrice > 15000 ? 900 : 600,
    return_loss_krw: /退货|반품/i.test(text(row.consumer_pain_points)) ? 1200 : 600,
    other_cost_krw: 300,
    target_sale_price_krw: salePrice,
    notes: [text(row.market_analysis), text(row.consumer_pain_points), recommendation].filter(Boolean).join(" "),
    source_margin_rate: undefined,
    source_risk_level: undefined,
  });
  return finalizeProfitRecord(base);
}

export function mergeProfitCalculationRecords(
  current: ProductProfitCalculationRecord[],
  incoming: ProductProfitCalculationRecord[],
) {
  const next = [...current];
  for (const item of incoming) {
    const index = next.findIndex(
      (existing) =>
        existing.id === item.id ||
        (existing.coupang_url && existing.coupang_url === item.coupang_url) ||
        (existing.source_type === item.source_type && existing.source_id === item.source_id),
    );
    if (index >= 0) {
      next[index] = { ...next[index], ...item, updated_at: new Date().toISOString() };
    } else {
      next.unshift(item);
    }
  }
  return next;
}

type ProfitRecordSeed = {
  id: string;
  source_type: "testing_db" | "opportunity_board";
  source_id: string;
  product_name_ko: string;
  product_name_zh: string;
  coupang_url: string;
  image_url: string;
  category: string;
  brand: string;
  competitor_price_krw: number;
  price_range: string;
  monthly_purchase_badge: string;
  review_count: number;
  rating: number;
  estimated_china_cost_rmb: number;
  exchange_rate: number;
  international_shipping_krw: number;
  korea_local_shipping_krw: number;
  coupang_fee_rate: number;
  ad_cost_krw: number;
  return_loss_krw: number;
  other_cost_krw: number;
  target_sale_price_krw: number;
  notes: string;
  source_margin_rate?: number | null;
  source_risk_level?: string | null;
};

function buildProfitRecordBase(seed: ProfitRecordSeed) {
  const now = new Date().toISOString();
  const estimated_china_cost_krw = Math.round(seed.estimated_china_cost_rmb * seed.exchange_rate);
  const coupang_fee_krw = Math.round(seed.target_sale_price_krw * (seed.coupang_fee_rate / 100));
  const total_cost_krw =
    estimated_china_cost_krw +
    seed.international_shipping_krw +
    seed.korea_local_shipping_krw +
    coupang_fee_krw +
    seed.ad_cost_krw +
    seed.return_loss_krw +
    seed.other_cost_krw;
  const estimated_margin_krw = seed.target_sale_price_krw - total_cost_krw;
  const estimated_margin_rate = seed.target_sale_price_krw
    ? round((estimated_margin_krw / seed.target_sale_price_krw) * 100, 1)
    : 0;
  const break_even_price_krw = total_cost_krw;
  const safe_price_krw = Math.ceil(total_cost_krw / 0.7);
  const nonPurchaseCost =
    seed.international_shipping_krw +
    seed.korea_local_shipping_krw +
    coupang_fee_krw +
    seed.ad_cost_krw +
    seed.return_loss_krw +
    seed.other_cost_krw;
  const max_purchase_cost_for_40_margin = Math.max(0, Math.floor(seed.target_sale_price_krw * 0.6 - nonPurchaseCost));
  const max_purchase_cost_for_30_margin = Math.max(0, Math.floor(seed.target_sale_price_krw * 0.7 - nonPurchaseCost));
  const missing_fields = buildMissingFields(seed);
  const cost_completeness: CostCompleteness =
    missing_fields.length === 0 ? "complete" : missing_fields.length <= 2 ? "partial" : "missing";
  const price_war_risk = derivePriceWarRisk(seed.competitor_price_krw, estimated_margin_rate, seed.rating, seed.review_count);
  const rocket_growth_supply_price = Math.max(0, Math.floor(max_purchase_cost_for_30_margin));
  const pb_supply_price = Math.max(0, Math.floor(max_purchase_cost_for_40_margin));
  const own_brand_sale_price = Math.ceil(total_cost_krw / 0.55);

  return {
    ...seed,
    estimated_china_cost_krw,
    coupang_fee_krw,
    total_cost_krw,
    estimated_margin_krw,
    estimated_margin_rate,
    break_even_price_krw,
    safe_price_krw,
    max_purchase_cost_for_40_margin,
    max_purchase_cost_for_30_margin,
    cost_completeness,
    price_war_risk,
    rocket_growth_supply_price,
    pb_supply_price,
    own_brand_sale_price,
    missing_fields,
    created_at: now,
    updated_at: now,
  };
}

function finalizeProfitRecord(base: ReturnType<typeof buildProfitRecordBase>): ProductProfitCalculationRecord {
  const profit_level = deriveProfitBand(base.estimated_margin_rate);
  const rocket_growth_decision = deriveRocketDecision(base.estimated_margin_rate, base.price_war_risk, base.cost_completeness);
  const pb_decision = derivePbDecision(base.estimated_margin_rate, base.review_count, base.rating, base.cost_completeness);
  const own_brand_decision = deriveOwnBrandDecision(
    base.estimated_margin_rate,
    base.review_count,
    base.rating,
    base.cost_completeness,
    base.source_type,
  );
  const final_profit_decision = deriveFinalDecision({
    profit_level,
    cost_completeness: base.cost_completeness,
    rocket_growth_decision,
    pb_decision,
    own_brand_decision,
    price_war_risk: base.price_war_risk,
  });

  return {
    id: base.id,
    source_type: base.source_type,
    source_id: base.source_id,
    product_name_ko: base.product_name_ko,
    product_name_zh: base.product_name_zh,
    coupang_url: base.coupang_url,
    image_url: base.image_url,
    category: base.category,
    brand: base.brand,
    competitor_price_krw: base.competitor_price_krw,
    price_range: base.price_range,
    monthly_purchase_badge: base.monthly_purchase_badge,
    review_count: base.review_count,
    rating: base.rating,
    estimated_china_cost_rmb: base.estimated_china_cost_rmb,
    exchange_rate: base.exchange_rate,
    estimated_china_cost_krw: base.estimated_china_cost_krw,
    international_shipping_krw: base.international_shipping_krw,
    korea_local_shipping_krw: base.korea_local_shipping_krw,
    coupang_fee_rate: base.coupang_fee_rate,
    coupang_fee_krw: base.coupang_fee_krw,
    ad_cost_krw: base.ad_cost_krw,
    return_loss_krw: base.return_loss_krw,
    other_cost_krw: base.other_cost_krw,
    target_sale_price_krw: base.target_sale_price_krw,
    total_cost_krw: base.total_cost_krw,
    estimated_margin_krw: base.estimated_margin_krw,
    estimated_margin_rate: base.estimated_margin_rate,
    break_even_price_krw: base.break_even_price_krw,
    safe_price_krw: base.safe_price_krw,
    max_purchase_cost_for_40_margin: base.max_purchase_cost_for_40_margin,
    max_purchase_cost_for_30_margin: base.max_purchase_cost_for_30_margin,
    profit_level,
    cost_completeness: base.cost_completeness,
    price_war_risk: base.price_war_risk,
    rocket_growth_supply_price: base.rocket_growth_supply_price,
    rocket_growth_decision,
    pb_supply_price: base.pb_supply_price,
    pb_decision,
    own_brand_sale_price: base.own_brand_sale_price,
    own_brand_decision,
    final_profit_decision,
    decision_reason: buildDecisionReason(base, { profit_level, rocket_growth_decision, pb_decision, own_brand_decision, final_profit_decision }),
    missing_fields: base.missing_fields,
    next_action: buildNextAction(base, final_profit_decision),
    current_status: buildCurrentStatus(final_profit_decision, base.cost_completeness),
    scenarios: buildScenarios(base.target_sale_price_krw, base),
    created_at: base.created_at,
    updated_at: base.updated_at,
  };
}

function buildMissingFields(seed: ProfitRecordSeed) {
  const checks: Array<[boolean, string]> = [
    [Boolean(seed.product_name_ko || seed.product_name_zh), "product_name"],
    [seed.target_sale_price_krw > 0, "target_sale_price"],
    [seed.estimated_china_cost_rmb > 0, "estimated_china_cost_rmb"],
    [seed.exchange_rate > 0, "exchange_rate"],
    [seed.international_shipping_krw > 0, "international_shipping_krw"],
    [seed.korea_local_shipping_krw > 0, "korea_local_shipping_krw"],
    [seed.coupang_fee_rate > 0, "coupang_fee_rate"],
    [seed.ad_cost_krw >= 0, "ad_cost_krw"],
  ];
  return checks.filter(([ok]) => !ok).map(([, label]) => label);
}

function deriveProfitBand(rate: number): ProfitBand {
  if (rate >= 40) return "high";
  if (rate >= 25) return "medium";
  if (rate >= 0) return "low";
  return "loss";
}

function derivePriceWarRisk(price: number, marginRate: number, rating: number, reviewCount: number) {
  if (price <= 10000 || marginRate < 20 || reviewCount >= 3000) return "high" as const;
  if (price <= 20000 || marginRate < 30 || rating < 4.3) return "medium" as const;
  return "low" as const;
}

function deriveRocketDecision(rate: number, priceWarRisk: "low" | "medium" | "high", completeness: CostCompleteness): DecisionStatus {
  if (completeness === "missing" || rate < 20) return "reject";
  if (rate >= 35 && priceWarRisk === "low") return "strong_yes";
  if (rate >= 25) return "conditional";
  return "observe";
}

function derivePbDecision(rate: number, reviewCount: number, rating: number, completeness: CostCompleteness): DecisionStatus {
  if (completeness === "missing" || rate < 25) return "reject";
  if (rate >= 35 && reviewCount >= 500 && rating >= 4.4) return "strong_yes";
  if (rate >= 28) return "conditional";
  return "observe";
}

function deriveOwnBrandDecision(
  rate: number,
  reviewCount: number,
  rating: number,
  completeness: CostCompleteness,
  sourceType: "testing_db" | "opportunity_board",
): DecisionStatus {
  if (completeness === "missing" || rate < 20) return "reject";
  if (rate >= 30 && reviewCount >= 300 && rating >= 4.3 && sourceType === "testing_db") return "strong_yes";
  if (rate >= 25) return "conditional";
  return "observe";
}

function deriveFinalDecision(input: {
  profit_level: ProfitBand;
  cost_completeness: CostCompleteness;
  rocket_growth_decision: DecisionStatus;
  pb_decision: DecisionStatus;
  own_brand_decision: DecisionStatus;
  price_war_risk: "low" | "medium" | "high";
}): DecisionStatus {
  if (input.cost_completeness === "missing" || input.profit_level === "loss") return "reject";
  if (
    input.rocket_growth_decision === "strong_yes" ||
    input.pb_decision === "strong_yes" ||
    input.own_brand_decision === "strong_yes"
  ) {
    return "strong_yes";
  }
  if (input.price_war_risk === "high" && input.profit_level === "low") return "observe";
  if (
    input.rocket_growth_decision === "conditional" ||
    input.pb_decision === "conditional" ||
    input.own_brand_decision === "conditional"
  ) {
    return "conditional";
  }
  if (input.profit_level === "low") return "observe";
  return "reject";
}

function buildDecisionReason(
  base: ReturnType<typeof buildProfitRecordBase>,
  decisions: {
    profit_level: ProfitBand;
    rocket_growth_decision: DecisionStatus;
    pb_decision: DecisionStatus;
    own_brand_decision: DecisionStatus;
    final_profit_decision: DecisionStatus;
  },
) {
  const chunks = [
    `margin ${base.estimated_margin_rate}%`,
    `cost ${base.cost_completeness}`,
    `price-war ${base.price_war_risk}`,
    `rg ${decisions.rocket_growth_decision}`,
    `pb ${decisions.pb_decision}`,
    `own ${decisions.own_brand_decision}`,
  ];
  if (base.missing_fields.length) {
    chunks.push(`missing ${base.missing_fields.join(", ")}`);
  }
  return chunks.join(" | ");
}

function buildNextAction(base: ReturnType<typeof buildProfitRecordBase>, decision: DecisionStatus) {
  if (base.missing_fields.length) return "补齐成本字段后重算";
  if (decision === "strong_yes" && base.pb_supply_price > 0) return "进入供应商询价与样品打样";
  if (decision === "conditional") return "压采购价并重跑利润场景";
  if (decision === "observe") return "继续观察市场售价与竞品变化";
  return "暂停推进，避免低利润投入";
}

function buildCurrentStatus(decision: DecisionStatus, completeness: CostCompleteness) {
  if (completeness === "missing") return "待补全成本";
  if (decision === "strong_yes") return "可进入动作";
  if (decision === "conditional") return "需要压价";
  if (decision === "observe") return "继续观察";
  return "建议暂停";
}

function buildScenarios(price: number, base: ReturnType<typeof buildProfitRecordBase>) {
  const deltas = [
    { label: "-10%", factor: 0.9 },
    { label: "base", factor: 1 },
    { label: "+10%", factor: 1.1 },
    { label: "+20%", factor: 1.2 },
  ];

  return deltas.map(({ label, factor }) => {
    const sale_price_krw = Math.round(price * factor);
    const fee = Math.round(sale_price_krw * (base.coupang_fee_rate / 100));
    const totalCost =
      base.estimated_china_cost_krw +
      base.international_shipping_krw +
      base.korea_local_shipping_krw +
      fee +
      base.ad_cost_krw +
      base.return_loss_krw +
      base.other_cost_krw;
    const margin_krw = sale_price_krw - totalCost;
    const margin_rate = sale_price_krw ? round((margin_krw / sale_price_krw) * 100, 1) : 0;
    return {
      label,
      sale_price_krw,
      margin_krw,
      margin_rate,
      decision: deriveProfitBand(margin_rate),
    };
  });
}

function estimateReturnLossFromRisk(level: string | null) {
  if (level === "high") return 1500;
  if (level === "medium") return 900;
  return 500;
}

function round(value: number, precision = 0) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
}

function toNumber(value: unknown) {
  const n = Number(String(value ?? 0).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

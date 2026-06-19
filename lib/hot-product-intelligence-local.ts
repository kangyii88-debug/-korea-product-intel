"use client";

export type HotRiskLevel = "low" | "medium" | "high";
export type HotSourceType = "sample_bundle" | "codex_import" | "manual";
export type HotActionStatus =
  | "pending"
  | "recommended"
  | "transferred_competitor"
  | "transferred_testing"
  | "transferred_opportunity"
  | "ignored";

export type MonthlyPurchaseLevel = "under_1000" | "over_1000" | "over_3000" | "over_5000" | "over_10000" | "unknown";

export type HotProductIntelligenceItem = {
  id: string;
  source_type: HotSourceType;
  source_id: string;
  product_name_ko: string;
  product_name_zh: string;
  coupang_url: string;
  image_url: string;
  brand: string;
  category: string;
  delivery_type: string;
  seller_type: string;
  monthly_purchase_badge: string;
  monthly_purchase_level: MonthlyPurchaseLevel;
  competitor_price_krw: number;
  review_count: number;
  rating: number;
  estimated_monthly_sales: number;
  price_range: string;
  recommendation_type: string;
  recommended_destination: string;
  next_action: string;
  opportunity_level: HotRiskLevel;
  competition_level: HotRiskLevel;
  risk_level: HotRiskLevel;
  seasonality_status: "evergreen" | "seasonal" | "uncertain";
  seasonality_note: string;
  risk_tags: string[];
  keywords: string[];
  core_selling_points: string[];
  bad_review_samples: string[];
  consumer_pain_points: string;
  market_analysis: string;
  hot_reason: string;
  notes: string;
  imported_to_competitor_library: boolean;
  imported_to_product_test: boolean;
  imported_to_opportunity_pool: boolean;
  action_status: HotActionStatus;
  exclude_reason: string;
  created_at: string;
  updated_at: string;
};

const STORAGE_KEY = "kpi_hot_product_intelligence_v1";

export function loadLocalHotProductIntelligence(): HotProductIntelligenceItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown[];
    return Array.isArray(parsed) ? parsed.map((item) => normalizeHotProductItem(item as Partial<HotProductIntelligenceItem>)) : [];
  } catch {
    return [];
  }
}

export function replaceLocalHotProductIntelligence(items: HotProductIntelligenceItem[]) {
  if (typeof window === "undefined") return items;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  return items;
}

export function mergeHotProductIntelligence(
  current: HotProductIntelligenceItem[],
  incoming: HotProductIntelligenceItem[],
) {
  const next = [...current];

  for (const item of incoming) {
    const index = next.findIndex(
      (existing) =>
        existing.id === item.id ||
        (existing.coupang_url && existing.coupang_url === item.coupang_url) ||
        (existing.product_name_ko === item.product_name_ko && existing.brand === item.brand),
    );

    if (index >= 0) {
      next[index] = normalizeHotProductItem({
        ...next[index],
        ...item,
        updated_at: new Date().toISOString(),
      });
    } else {
      next.unshift(normalizeHotProductItem(item));
    }
  }

  return next;
}

export function updateHotProductItem(
  items: HotProductIntelligenceItem[],
  id: string,
  updater: (item: HotProductIntelligenceItem) => HotProductIntelligenceItem,
) {
  return items.map((item) =>
    item.id === id ? normalizeHotProductItem({ ...updater(item), updated_at: new Date().toISOString() }) : item,
  );
}

export function buildHotProductFromSampleRow(row: Record<string, unknown>): HotProductIntelligenceItem {
  const monthly_purchase_badge = text(row.monthly_purchase_badge);
  const review_count = numberValue(row.review_count);
  const rating = numberValue(row.rating);
  const estimated_monthly_sales = estimateMonthlySales(monthly_purchase_badge, review_count);
  const consumer_pain_points = text(row.consumer_pain_points || row.review_analysis_summary || row.bad_review_samples);
  const market_analysis = text(row.market_analysis);
  const categoryText = `${text(row.category)} ${text(row.product_name_ko)} ${text(row.product_name_zh)}`;
  const risk_tags = deriveRiskTags(categoryText, consumer_pain_points, text(row.price_range), monthly_purchase_badge);
  const risk_level = deriveRiskLevel(risk_tags, consumer_pain_points);
  const competition_level = review_count >= 5000 ? "high" : review_count >= 1500 ? "medium" : "low";
  const opportunity_level = estimated_monthly_sales >= 5000 ? "high" : estimated_monthly_sales >= 1500 ? "medium" : "low";
  const recommendation_type = text(row.recommended_business_type || row.recommendation_direction);
  const recommended_destination =
    recommendation_type || (opportunity_level === "high" ? "机会池深度分析" : competition_level === "high" ? "竞品库持续跟踪" : "商品测试库");

  return normalizeHotProductItem({
    id: `hot-${text(row.coupang_url) || text(row.product_name_ko)}-${text(row.brand)}`,
    source_type: "sample_bundle",
    source_id: text(row.coupang_url) || text(row.product_name_ko),
    product_name_ko: text(row.product_name_ko),
    product_name_zh: text(row.product_name_zh),
    coupang_url: text(row.coupang_url),
    image_url: text(row.image_url),
    brand: text(row.brand),
    category: text(row.category),
    delivery_type: text(row.delivery_type),
    seller_type: text(row.seller_type),
    monthly_purchase_badge,
    monthly_purchase_level: monthlyPurchaseLevel(monthly_purchase_badge),
    competitor_price_krw: numberValue(row.competitor_price_krw),
    review_count,
    rating,
    estimated_monthly_sales,
    price_range: text(row.price_range),
    recommendation_type,
    recommended_destination,
    next_action: text(row.next_action) || "先补竞品卖点、差评样本和风险判断，再决定去向",
    opportunity_level,
    competition_level,
    risk_level,
    seasonality_status: deriveSeasonality(text(row.is_seasonal), categoryText),
    seasonality_note: text(row.seasonality_note),
    risk_tags,
    keywords: splitList(text(row.keywords)),
    core_selling_points: splitList(text(row.core_selling_points)),
    bad_review_samples: splitList(text(row.bad_review_samples)),
    consumer_pain_points,
    market_analysis,
    hot_reason: buildHotReason(monthly_purchase_badge, competition_level, opportunity_level),
    notes: market_analysis,
    imported_to_competitor_library: false,
    imported_to_product_test: false,
    imported_to_opportunity_pool: false,
    action_status: recommendation_type ? "recommended" : "pending",
    exclude_reason: "",
  });
}

export function normalizeHotProductItem(input: Partial<HotProductIntelligenceItem>) {
  const now = new Date().toISOString();
  const monthly_purchase_badge = text(input.monthly_purchase_badge);
  return {
    id: text(input.id) || crypto.randomUUID(),
    source_type: input.source_type ?? "manual",
    source_id: text(input.source_id),
    product_name_ko: text(input.product_name_ko),
    product_name_zh: text(input.product_name_zh),
    coupang_url: text(input.coupang_url),
    image_url: text(input.image_url),
    brand: text(input.brand),
    category: text(input.category),
    delivery_type: text(input.delivery_type),
    seller_type: text(input.seller_type),
    monthly_purchase_badge,
    monthly_purchase_level: input.monthly_purchase_level ?? monthlyPurchaseLevel(monthly_purchase_badge),
    competitor_price_krw: numberValue(input.competitor_price_krw),
    review_count: numberValue(input.review_count),
    rating: numberValue(input.rating),
    estimated_monthly_sales: numberValue(input.estimated_monthly_sales),
    price_range: text(input.price_range),
    recommendation_type: text(input.recommendation_type),
    recommended_destination: text(input.recommended_destination),
    next_action: text(input.next_action),
    opportunity_level: input.opportunity_level ?? "low",
    competition_level: input.competition_level ?? "low",
    risk_level: input.risk_level ?? "low",
    seasonality_status: input.seasonality_status ?? "uncertain",
    seasonality_note: text(input.seasonality_note),
    risk_tags: arrayValue(input.risk_tags),
    keywords: arrayValue(input.keywords),
    core_selling_points: arrayValue(input.core_selling_points),
    bad_review_samples: arrayValue(input.bad_review_samples),
    consumer_pain_points: text(input.consumer_pain_points),
    market_analysis: text(input.market_analysis),
    hot_reason: text(input.hot_reason),
    notes: text(input.notes),
    imported_to_competitor_library: Boolean(input.imported_to_competitor_library),
    imported_to_product_test: Boolean(input.imported_to_product_test),
    imported_to_opportunity_pool: Boolean(input.imported_to_opportunity_pool),
    action_status: input.action_status ?? "pending",
    exclude_reason: text(input.exclude_reason),
    created_at: text(input.created_at) || now,
    updated_at: text(input.updated_at) || now,
  } satisfies HotProductIntelligenceItem;
}

export function monthlyPurchaseLevel(value: string): MonthlyPurchaseLevel {
  const normalized = value.replace(/[,\s]/g, "");
  if (!normalized) return "unknown";
  if (normalized.includes("10000")) return "over_10000";
  if (normalized.includes("5000")) return "over_5000";
  if (normalized.includes("3000")) return "over_3000";
  if (normalized.includes("1000")) return "over_1000";
  return "under_1000";
}

function deriveRiskTags(categoryText: string, pain: string, priceRange: string, monthlyPurchaseBadge: string) {
  const textBlob = `${categoryText} ${pain} ${priceRange} ${monthlyPurchaseBadge}`.toLowerCase();
  const tags: string[] = [];
  if (/kids|baby|儿童|婴儿|유아|아동/.test(textBlob)) tags.push("儿童品类");
  if (/food|食品|먹거리|식품/.test(textBlob)) tags.push("食品风险");
  if (/usb|led|电子|전기|battery|充电/.test(textBlob)) tags.push("电子/KC");
  if (/cosmetic|美妆|化妆|뷰티/.test(textBlob)) tags.push("美妆合规");
  if (/medical|医疗|의료/.test(textBlob)) tags.push("医疗风险");
  if (/fragile|易碎|파손/.test(textBlob)) tags.push("易碎物流");
  if (/return|退货|반품|差评|불만/.test(textBlob)) tags.push("高退货风险");
  if (/season|季节|여름|겨울/.test(textBlob)) tags.push("季节性");
  if (/低价|价格战|price/.test(textBlob) && !monthlyPurchaseBadge) tags.push("价格带不清");
  return tags;
}

function deriveRiskLevel(tags: string[], pain: string): HotRiskLevel {
  if (tags.length >= 3 || /退货|反复|故障|质量|불량/.test(pain)) return "high";
  if (tags.length >= 1 || pain.length > 20) return "medium";
  return "low";
}

function deriveSeasonality(raw: string, textBlob: string): HotProductIntelligenceItem["seasonality_status"] {
  const normalized = `${raw} ${textBlob}`.toLowerCase();
  if (/seasonal|yes|季节|夏季|冬季|여름|겨울/.test(normalized)) return "seasonal";
  if (/evergreen|no|常年|日用|daily|생활/.test(normalized)) return "evergreen";
  return "uncertain";
}

function estimateMonthlySales(badge: string, reviewCount: number) {
  const level = monthlyPurchaseLevel(badge);
  if (level === "over_10000") return 12000;
  if (level === "over_5000") return 6500;
  if (level === "over_3000") return 4200;
  if (level === "over_1000") return 1800;
  if (level === "under_1000") return 900;
  return reviewCount >= 5000 ? 3800 : reviewCount >= 1500 ? 1800 : 700;
}

function buildHotReason(badge: string, competition: HotRiskLevel, opportunity: HotRiskLevel) {
  return [
    badge ? `月购标签：${badge}` : "月购标签待确认",
    `竞争强度：${competition}`,
    `机会等级：${opportunity}`,
  ].join(" | ");
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
}

function numberValue(value: unknown) {
  const n = Number(String(value ?? 0).replace(/,/g, "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function arrayValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => text(item)).filter(Boolean);
  }
  return splitList(text(value));
}

function splitList(value: string) {
  return value
    .split(/[,\n/|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

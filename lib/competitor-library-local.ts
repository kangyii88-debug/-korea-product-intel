"use client";

export type CompetitorLibraryStatus = "new" | "watch" | "analyze" | "transfer" | "ignore";
export type CompetitorLibraryLevel = "low" | "medium" | "high";
export type CompetitorLibrarySource = "hot_products" | "testing_db" | "opportunity_board" | "manual";

export type CompetitorLibraryItem = {
  id: string;
  source_type: CompetitorLibrarySource;
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
  monthly_purchase_level: "under_1000" | "over_1000" | "over_3000" | "over_5000" | "over_10000" | "unknown";
  competitor_price_krw: number;
  review_count: number;
  rating: number;
  title_keywords: string[];
  main_image_selling_points: string[];
  detail_page_selling_points: string[];
  core_selling_points: string[];
  positive_review_points: string[];
  bad_review_samples: string[];
  consumer_pain_points: string;
  pain_point_categories: string[];
  improvement_opportunities: string[];
  why_it_sells: string;
  supply_chain_fit: string;
  rocket_growth_fit: string;
  pb_supply_fit: string;
  own_brand_fit: string;
  competition_level: CompetitorLibraryLevel;
  risk_level: CompetitorLibraryLevel;
  follow_up_value: CompetitorLibraryLevel;
  improvement_opportunity_level: CompetitorLibraryLevel;
  follow_up_recommendation: string;
  recommended_destination: string;
  recommended_import_target: string;
  next_action: string;
  is_ignored: boolean;
  ignore_reason: string;
  imported_to_opportunity_board: boolean;
  imported_to_product_test: boolean;
  imported_to_opportunity_pool: boolean;
  risk_tags: string[];
  notes: string;
  status: CompetitorLibraryStatus;
  created_at: string;
  updated_at: string;
};

const STORAGE_KEY = "kpi_competitor_library_v2";
const LEGACY_STORAGE_KEY = "kpi_competitor_library_v1";

export function loadLocalCompetitorLibrary(): CompetitorLibraryItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown[];
    return Array.isArray(parsed) ? parsed.map(normalizeCompetitorLibraryItem).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function saveLocalCompetitorLibrary(items: CompetitorLibraryItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function replaceLocalCompetitorLibrary(items: CompetitorLibraryItem[]) {
  saveLocalCompetitorLibrary(items);
  return items;
}

export function mergeCompetitorLibraryItems(
  current: CompetitorLibraryItem[],
  incoming: CompetitorLibraryItem[],
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
      next[index] = normalizeCompetitorLibraryItem({
        ...next[index],
        ...item,
        updated_at: new Date().toISOString(),
      });
    } else {
      next.unshift(normalizeCompetitorLibraryItem(item));
    }
  }

  return next;
}

export function updateCompetitorLibraryItem(
  items: CompetitorLibraryItem[],
  id: string,
  updater: (item: CompetitorLibraryItem) => CompetitorLibraryItem,
) {
  return items.map((item) =>
    item.id === id ? normalizeCompetitorLibraryItem({ ...updater(item), updated_at: new Date().toISOString() }) : item,
  );
}

export function normalizeCompetitorLibraryItem(input: unknown): CompetitorLibraryItem {
  const item = (input ?? {}) as Record<string, unknown>;
  const now = new Date().toISOString();
  const monthly_purchase_badge = text(item.monthly_purchase_badge);

  return {
    id: text(item.id) || crypto.randomUUID(),
    source_type: sourceType(item.source_type),
    source_id: text(item.source_id),
    product_name_ko: text(item.product_name_ko),
    product_name_zh: text(item.product_name_zh),
    coupang_url: text(item.coupang_url),
    image_url: text(item.image_url),
    brand: text(item.brand),
    category: text(item.category),
    delivery_type: text(item.delivery_type),
    seller_type: text(item.seller_type),
    monthly_purchase_badge,
    monthly_purchase_level: monthlyPurchaseLevel(text(item.monthly_purchase_level) || monthly_purchase_badge),
    competitor_price_krw: numberValue(item.competitor_price_krw),
    review_count: numberValue(item.review_count),
    rating: numberValue(item.rating),
    title_keywords: arrayValue(item.title_keywords),
    main_image_selling_points: arrayValue(item.main_image_selling_points),
    detail_page_selling_points: arrayValue(item.detail_page_selling_points),
    core_selling_points: arrayValue(item.core_selling_points),
    positive_review_points: arrayValue(item.positive_review_points),
    bad_review_samples: arrayValue(item.bad_review_samples),
    consumer_pain_points: text(item.consumer_pain_points),
    pain_point_categories: arrayValue(item.pain_point_categories),
    improvement_opportunities: arrayValue(item.improvement_opportunities),
    why_it_sells: text(item.why_it_sells),
    supply_chain_fit: text(item.supply_chain_fit),
    rocket_growth_fit: text(item.rocket_growth_fit),
    pb_supply_fit: text(item.pb_supply_fit),
    own_brand_fit: text(item.own_brand_fit),
    competition_level: levelValue(item.competition_level),
    risk_level: levelValue(item.risk_level),
    follow_up_value: levelValue(item.follow_up_value),
    improvement_opportunity_level: levelValue(item.improvement_opportunity_level),
    follow_up_recommendation: text(item.follow_up_recommendation),
    recommended_destination: text(item.recommended_destination),
    recommended_import_target: text(item.recommended_import_target),
    next_action: text(item.next_action),
    is_ignored: Boolean(item.is_ignored),
    ignore_reason: text(item.ignore_reason),
    imported_to_opportunity_board: Boolean(item.imported_to_opportunity_board),
    imported_to_product_test: Boolean(item.imported_to_product_test),
    imported_to_opportunity_pool: Boolean(item.imported_to_opportunity_pool),
    risk_tags: arrayValue(item.risk_tags),
    notes: text(item.notes),
    status: statusValue(item.status, Boolean(item.is_ignored)),
    created_at: text(item.created_at) || now,
    updated_at: text(item.updated_at) || now,
  };
}

function sourceType(value: unknown): CompetitorLibrarySource {
  if (value === "testing_db" || value === "opportunity_board" || value === "manual") return value;
  return "hot_products";
}

function statusValue(value: unknown, ignored: boolean): CompetitorLibraryStatus {
  if (ignored) return "ignore";
  if (value === "watch" || value === "analyze" || value === "transfer" || value === "ignore") return value;
  return "new";
}

function levelValue(value: unknown): CompetitorLibraryLevel {
  if (value === "medium" || value === "high") return value;
  return "low";
}

function monthlyPurchaseLevel(value: string): CompetitorLibraryItem["monthly_purchase_level"] {
  const normalized = value.replace(/[,\s]/g, "");
  if (!normalized) return "unknown";
  if (normalized.includes("10000")) return "over_10000";
  if (normalized.includes("5000")) return "over_5000";
  if (normalized.includes("3000")) return "over_3000";
  if (normalized.includes("1000")) return "over_1000";
  return "under_1000";
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
  return text(value)
    .split(/[,\n/|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

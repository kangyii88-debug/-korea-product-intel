"use client";

import {
  buildOpportunityPayload,
  type ProductOpportunityInput,
  type ProductOpportunityRecord,
} from "@/lib/product-opportunities";

const STORAGE_KEY = "kpi-product-opportunities";

export function loadLocalProductOpportunities(): ProductOpportunityRecord[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ProductOpportunityRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalProductOpportunities(items: ProductOpportunityRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function createLocalProductOpportunity(input: ProductOpportunityInput) {
  const now = new Date().toISOString();
  const payload = buildOpportunityPayload(input, "local-workspace");

  const item: ProductOpportunityRecord = {
    id: crypto.randomUUID(),
    user_id: "local-workspace",
    title: payload.title,
    sku: payload.sku || null,
    keyword: payload.keyword || null,
    category: payload.category,
    business_type: payload.business_type,
    coupang_url: payload.coupang_url || null,
    image_url: payload.image_url || null,
    price: payload.price,
    review_count: payload.review_count,
    rating: payload.rating,
    competitor_count: payload.competitor_count,
    estimated_purchase_cost: payload.estimated_purchase_cost,
    estimated_shipping_cost: payload.estimated_shipping_cost,
    estimated_local_delivery_cost: payload.estimated_local_delivery_cost,
    platform_fee_rate: payload.platform_fee_rate,
    estimated_ad_cost: payload.estimated_ad_cost,
    estimated_sale_price: payload.estimated_sale_price,
    estimated_margin: payload.estimated_margin,
    estimated_margin_rate: payload.estimated_margin_rate,
    market_heat: payload.market_heat,
    competition_level: payload.competition_level,
    profit_level: payload.profit_level,
    risk_level: payload.risk_level,
    kc_risk: payload.kc_risk,
    volume_weight_risk: payload.volume_weight_risk,
    return_risk: payload.return_risk,
    negative_review_risk: payload.negative_review_risk,
    price_war_risk: payload.price_war_risk,
    supply_chain_risk: payload.supply_chain_risk,
    score: payload.score,
    status: payload.status,
    next_action: payload.next_action,
    owner: "local-workspace",
    deadline: null,
    notes: payload.notes || null,
    demand_stability: payload.demand_stability || null,
    seasonality: payload.seasonality || null,
    long_term_fit: payload.long_term_fit,
    short_term_test_fit: payload.short_term_test_fit,
    competitor_price_range: payload.competitor_price_range || null,
    top_seller_count: payload.top_seller_count,
    review_issue_summary: payload.review_issue_summary || null,
    negative_review_keywords: payload.negative_review_keywords || null,
    improvement_points: payload.improvement_points || null,
    created_at: now,
    updated_at: now,
  };

  const items = loadLocalProductOpportunities();
  const nextItems = [item, ...items];
  saveLocalProductOpportunities(nextItems);
  return item;
}

export function updateLocalProductOpportunity(id: string, input: ProductOpportunityInput) {
  const items = loadLocalProductOpportunities();
  const payload = buildOpportunityPayload(input, "local-workspace");
  const nextItems = items.map((item) =>
    item.id === id
      ? {
          ...item,
          ...payload,
          sku: payload.sku || null,
          keyword: payload.keyword || null,
          coupang_url: payload.coupang_url || null,
          image_url: payload.image_url || null,
          notes: payload.notes || null,
          demand_stability: payload.demand_stability || null,
          seasonality: payload.seasonality || null,
          competitor_price_range: payload.competitor_price_range || null,
          review_issue_summary: payload.review_issue_summary || null,
          negative_review_keywords: payload.negative_review_keywords || null,
          improvement_points: payload.improvement_points || null,
          updated_at: new Date().toISOString(),
        }
      : item,
  );
  saveLocalProductOpportunities(nextItems);
  return nextItems.find((item) => item.id === id) ?? null;
}

export function deleteLocalProductOpportunity(id: string) {
  const items = loadLocalProductOpportunities();
  const nextItems = items.filter((item) => item.id !== id);
  saveLocalProductOpportunities(nextItems);
  return true;
}


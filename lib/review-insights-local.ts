"use client";

export type ReviewInsightStatus =
  | "new"
  | "analyzing"
  | "ready"
  | "sync_testing_db"
  | "sync_opportunity"
  | "observe"
  | "dropped";

export type ReviewInsightRecord = {
  id: string;
  source_product_id: string;
  source_type: "testing_db" | "opportunity_board" | "manual_import";
  product_name_ko: string;
  product_name_zh: string;
  coupang_url: string;
  image_url: string;
  brand: string;
  category: string;
  price_krw: number;
  rating: number;
  review_count: number;
  monthly_purchase_badge: string;
  delivery_type: string;
  review_samples: string[];
  bad_review_samples: string[];
  negative_keywords: string[];
  pain_point_categories: string[];
  top_pain_points: string[];
  severity_level: "low" | "medium" | "high";
  frequency_level: "low" | "medium" | "high";
  return_risk_level: "low" | "medium" | "high";
  rating_impact_level: "low" | "medium" | "high";
  improvement_possible: boolean;
  improvement_suggestions: string[];
  development_direction: string;
  final_recommendation: string;
  next_action: string;
  sync_to_product_test: boolean;
  sync_to_opportunity_board: boolean;
  notes: string;
  status: ReviewInsightStatus;
  created_at: string;
  updated_at: string;
};

const STORAGE_KEY = "kpi_review_insights_v1";

export function loadLocalReviewInsights(): ReviewInsightRecord[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ReviewInsightRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalReviewInsights(items: ReviewInsightRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function upsertLocalReviewInsight(item: ReviewInsightRecord) {
  const items = loadLocalReviewInsights();
  const index = items.findIndex((current) => current.id === item.id);
  const next = [...items];

  if (index >= 0) {
    next[index] = { ...item, updated_at: new Date().toISOString() };
  } else {
    next.unshift(item);
  }

  saveLocalReviewInsights(next);
  return next;
}

export function replaceLocalReviewInsights(items: ReviewInsightRecord[]) {
  saveLocalReviewInsights(items);
  return items;
}

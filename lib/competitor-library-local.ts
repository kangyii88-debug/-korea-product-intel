"use client";

export type CompetitorLibraryStatus = "new" | "watch" | "analyze" | "transfer" | "ignore";

export type CompetitorLibraryItem = {
  id: string;
  source_type: "hot_products" | "testing_db" | "opportunity_board" | "manual";
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
  competitor_price_krw: number;
  review_count: number;
  rating: number;
  core_selling_points: string[];
  bad_review_samples: string[];
  consumer_pain_points: string;
  improvement_opportunity_level: "low" | "medium" | "high";
  competition_level: "low" | "medium" | "high";
  follow_up_recommendation: string;
  recommended_import_target: string;
  is_ignored: boolean;
  notes: string;
  status: CompetitorLibraryStatus;
  created_at: string;
  updated_at: string;
};

const STORAGE_KEY = "kpi_competitor_library_v1";

export function loadLocalCompetitorLibrary(): CompetitorLibraryItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CompetitorLibraryItem[];
    return Array.isArray(parsed) ? parsed : [];
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

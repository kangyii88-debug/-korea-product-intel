export type OpportunityStatus =
  | "pending_analysis"
  | "testable"
  | "high_potential"
  | "paused"
  | "dropped"
  | "in_execution";

export type OpportunityDirection =
  | "rocket_growth"
  | "pb_supply"
  | "own_brand"
  | "general";

export type OpportunityCategory =
  | "window_curtain"
  | "bathroom_curtain"
  | "household"
  | "kids"
  | "outdoor"
  | "other";

export type OpportunityLevel = "low" | "medium" | "high";

export type OpportunityNextAction =
  | "collect_competitors"
  | "calculate_profit"
  | "find_supplier"
  | "apply_sample"
  | "prepare_rg_proposal"
  | "prepare_pb_proposal"
  | "launch_test"
  | "pause";

export type ProductOpportunityRecord = {
  id: string;
  user_id: string;
  title: string;
  sku: string | null;
  keyword: string | null;
  category: OpportunityCategory;
  business_type: OpportunityDirection;
  coupang_url: string | null;
  image_url: string | null;
  price: number | null;
  review_count: number | null;
  rating: number | null;
  competitor_count: number | null;
  estimated_purchase_cost: number | null;
  estimated_shipping_cost: number | null;
  estimated_local_delivery_cost: number | null;
  platform_fee_rate: number | null;
  estimated_ad_cost: number | null;
  estimated_sale_price: number | null;
  estimated_margin: number | null;
  estimated_margin_rate: number | null;
  market_heat: OpportunityLevel | null;
  competition_level: OpportunityLevel | null;
  profit_level: OpportunityLevel | null;
  risk_level: OpportunityLevel | null;
  kc_risk: OpportunityLevel | null;
  volume_weight_risk: OpportunityLevel | null;
  return_risk: OpportunityLevel | null;
  negative_review_risk: OpportunityLevel | null;
  price_war_risk: OpportunityLevel | null;
  supply_chain_risk: OpportunityLevel | null;
  score: number | null;
  status: OpportunityStatus;
  next_action: OpportunityNextAction | null;
  owner: string | null;
  deadline: string | null;
  notes: string | null;
  demand_stability: string | null;
  seasonality: string | null;
  long_term_fit: boolean | null;
  short_term_test_fit: boolean | null;
  competitor_price_range: string | null;
  top_seller_count: number | null;
  review_issue_summary: string | null;
  negative_review_keywords: string | null;
  improvement_points: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductOpportunityInput = {
  title: string;
  sku: string;
  keyword: string;
  category: OpportunityCategory;
  business_type: OpportunityDirection;
  coupang_url: string;
  image_url: string;
  price: number;
  review_count: number;
  rating: number;
  competitor_count: number;
  estimated_purchase_cost: number;
  estimated_shipping_cost: number;
  estimated_local_delivery_cost: number;
  platform_fee_rate: number;
  estimated_ad_cost: number;
  estimated_sale_price: number;
  market_heat: OpportunityLevel;
  competition_level: OpportunityLevel;
  kc_risk: OpportunityLevel;
  volume_weight_risk: OpportunityLevel;
  return_risk: OpportunityLevel;
  negative_review_risk: OpportunityLevel;
  price_war_risk: OpportunityLevel;
  supply_chain_risk: OpportunityLevel;
  notes: string;
  status: OpportunityStatus;
  next_action: OpportunityNextAction;
  demand_stability: string;
  seasonality: string;
  long_term_fit: boolean;
  short_term_test_fit: boolean;
  competitor_price_range: string;
  top_seller_count: number;
  review_issue_summary: string;
  negative_review_keywords: string;
  improvement_points: string;
};

export function calculatePlatformFee(salePrice: number, feeRate: number) {
  return Math.round((Number(salePrice || 0) * Number(feeRate || 0)) / 100);
}

export function calculateEstimatedMargin(input: Pick<ProductOpportunityInput, "estimated_sale_price" | "estimated_purchase_cost" | "estimated_shipping_cost" | "estimated_local_delivery_cost" | "platform_fee_rate" | "estimated_ad_cost">) {
  const salePrice = Number(input.estimated_sale_price || 0);
  const purchase = Number(input.estimated_purchase_cost || 0);
  const shipping = Number(input.estimated_shipping_cost || 0);
  const localDelivery = Number(input.estimated_local_delivery_cost || 0);
  const adCost = Number(input.estimated_ad_cost || 0);
  const fee = calculatePlatformFee(salePrice, Number(input.platform_fee_rate || 0));
  return salePrice - purchase - shipping - localDelivery - fee - adCost;
}

export function calculateEstimatedMarginRate(margin: number, salePrice: number) {
  if (!salePrice) return 0;
  return Math.round((margin / salePrice) * 1000) / 10;
}

export function deriveProfitLevel(rate: number): OpportunityLevel {
  if (rate >= 35) return "high";
  if (rate >= 20) return "medium";
  return "low";
}

export function deriveRiskLevel(input: Pick<ProductOpportunityInput, "kc_risk" | "volume_weight_risk" | "return_risk" | "negative_review_risk" | "price_war_risk" | "supply_chain_risk">): OpportunityLevel {
  const levels = [
    input.kc_risk,
    input.volume_weight_risk,
    input.return_risk,
    input.negative_review_risk,
    input.price_war_risk,
    input.supply_chain_risk,
  ];
  if (levels.includes("high")) return "high";
  if (levels.includes("medium")) return "medium";
  return "low";
}

export function deriveScore(input: Pick<ProductOpportunityInput, "market_heat" | "competition_level" | "rating" | "review_count">, marginRate: number, riskLevel: OpportunityLevel) {
  const heatScore = input.market_heat === "high" ? 24 : input.market_heat === "medium" ? 16 : 8;
  const competitionScore = input.competition_level === "low" ? 18 : input.competition_level === "medium" ? 10 : 4;
  const marginScore = marginRate >= 35 ? 24 : marginRate >= 20 ? 16 : 8;
  const ratingScore = Number(input.rating || 0) >= 4.5 ? 14 : Number(input.rating || 0) >= 4 ? 10 : 6;
  const reviewScore = Number(input.review_count || 0) >= 1000 ? 10 : Number(input.review_count || 0) >= 200 ? 7 : 4;
  const riskPenalty = riskLevel === "high" ? 14 : riskLevel === "medium" ? 8 : 2;
  return Math.max(0, Math.min(100, heatScore + competitionScore + marginScore + ratingScore + reviewScore - riskPenalty));
}

export function buildOpportunityPayload(input: ProductOpportunityInput, owner: string) {
  const estimated_margin = calculateEstimatedMargin(input);
  const estimated_margin_rate = calculateEstimatedMarginRate(estimated_margin, input.estimated_sale_price);
  const profit_level = deriveProfitLevel(estimated_margin_rate);
  const risk_level = deriveRiskLevel(input);
  const score = deriveScore(input, estimated_margin_rate, risk_level);

  return {
    ...input,
    estimated_margin,
    estimated_margin_rate,
    profit_level,
    risk_level,
    score,
    owner,
  };
}

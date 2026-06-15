import type { MarketIntelligenceResult } from "@/lib/types";
import { createSupabaseBrowserClient } from "@/lib/supabase";

const memoryMarketRuns: MarketIntelligenceResult[] = [];

export async function saveMarketIntelligenceResult(result: MarketIntelligenceResult) {
  memoryMarketRuns.push(result);

  const supabase = createSupabaseBrowserClient();
  if (!supabase) return result;

  if (result.snapshots.length) {
    await supabase.from("market_trend_snapshots").upsert(
      result.snapshots.map((snapshot) => ({
        id: snapshot.id,
        snapshot_date: snapshot.snapshotDate,
        platform: snapshot.platform,
        category: snapshot.category,
        product_count: snapshot.productCount,
        average_price: snapshot.averagePrice,
        average_discount_price: snapshot.averageDiscountPrice,
        average_rating: snapshot.averageRating,
        total_review_count: snapshot.totalReviewCount,
        total_estimated_sales: snapshot.totalEstimatedSales,
        average_rank: snapshot.averageRank,
        price_change_index: snapshot.priceChangeIndex,
        review_change_index: snapshot.reviewChangeIndex,
        rank_change_index: snapshot.rankChangeIndex,
      })),
      { onConflict: "id" },
    );
  }

  const trends = [
    ...result.trendCenter.fastestGrowing7Days,
    ...result.trendCenter.fastestGrowing30Days,
    ...result.trendCenter.fastestGrowing90Days,
  ];
  if (trends.length) {
    await supabase.from("market_product_trends").upsert(
      trends.map((trend) => ({
        id: `${trend.productId}-${trend.growthWindowDays}-${result.generatedAt.slice(0, 10)}`,
        product_id: null,
        product_name: trend.productName,
        platform: trend.platform,
        category: trend.category,
        growth_window_days: trend.growthWindowDays,
        growth_speed: trend.growthSpeed,
        growth_level: trend.growthLevel,
        growth_reasons: trend.growthReasons,
        calculated_at: result.generatedAt,
      })),
      { onConflict: "id" },
    );
  }

  await supabase.from("market_opportunity_radar").insert({
    generated_at: result.generatedAt,
    new_opportunities: result.opportunityRadar.newOpportunities,
    new_trends: result.opportunityRadar.newTrends,
    new_categories: result.opportunityRadar.newCategories,
    growing_categories: result.opportunityRadar.growingCategories,
    declining_categories: result.opportunityRadar.decliningCategories,
  });

  await supabase.from("competitor_intelligence_reports").insert({
    generated_at: result.generatedAt,
    growing_brands: result.competitorIntelligence.growingBrands,
    declining_brands: result.competitorIntelligence.decliningBrands,
    review_growth_leaders: result.competitorIntelligence.reviewGrowthLeaders,
    ranking_movers: result.competitorIntelligence.rankingMovers,
    price_movers: result.competitorIntelligence.priceMovers,
  });

  if (result.alerts.length) {
    await supabase.from("market_alerts").upsert(
      result.alerts.map((alert) => ({
        id: alert.id,
        alert_type: alert.type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        product_id: null,
        platform: alert.platform,
        evidence: alert.evidence,
        created_at: alert.createdAt,
      })),
      { onConflict: "id" },
    );
  }

  await supabase.from("ai_reports").insert({
    product_id: null,
    version: memoryMarketRuns.length,
    report_type: "market_intelligence",
    title: "Market Intelligence Daily Report",
    content: result,
    input_snapshot: {
      generatedAt: result.generatedAt,
      snapshotCount: result.snapshots.length,
      alertCount: result.alerts.length,
    },
    status: "completed",
    created_at: result.generatedAt,
  });

  return result;
}

export function getLatestMarketIntelligenceResult() {
  return memoryMarketRuns.at(-1);
}

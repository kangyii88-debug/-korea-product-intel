import type { OpportunityCenterResult } from "@/lib/types";
import { createSupabaseBrowserClient } from "@/lib/supabase";

const memoryOpportunityRuns: OpportunityCenterResult[] = [];

export async function saveOpportunityCenterResult(result: OpportunityCenterResult) {
  memoryOpportunityRuns.push(result);

  const supabase = createSupabaseBrowserClient();
  if (!supabase) return result;

  const opportunities = [
    ...result.pools.growth,
    ...result.pools.optimization,
    ...result.pools.supplyChain,
    ...result.pools.innovation,
  ];

  if (opportunities.length) {
    await supabase.from("product_opportunities").upsert(
      opportunities.map((item) => ({
        id: item.id,
        product_id: null,
        product_name: item.productName,
        opportunity_type: item.type,
        opportunity_pool: item.pool,
        platform: item.platform,
        category: item.category,
        evidence: item.evidence,
        estimated_impact_score: item.estimatedImpactScore,
        opportunity_score: item.opportunityScore,
        opportunity_level: item.opportunityLevel,
        opportunity_reasons: item.opportunityReasons,
        why_worth_attention: item.whyWorthAttention,
        why_growing: item.whyGrowing,
        biggest_market_opportunity: item.biggestMarketOpportunity,
        biggest_risk: item.biggestRisk,
        china_supply_chain_fit: item.chinaSupplyChainFit,
        korea_market_fit: item.koreaMarketFit,
        test_fit: item.testFit,
        estimated_profit_margin: item.estimatedProfitMargin,
        competition_level: item.competitionLevel,
        development_difficulty: item.developmentDifficulty,
        risk_level: item.riskLevel,
        recommended_action: item.recommendedAction,
        discovered_at: item.discoveredAt,
        status: item.status,
      })),
      { onConflict: "id" },
    );
  }

  await supabase.from("ai_reports").insert({
    product_id: null,
    version: memoryOpportunityRuns.length,
    report_type: "opportunity_center",
    title: "Product Opportunity Engine Daily Scan",
    content: result,
    input_snapshot: {
      generatedAt: result.generatedAt,
      reportCount: result.reports.length,
    },
    status: "completed",
    created_at: result.generatedAt,
  });

  return result;
}

export function getLatestOpportunityCenterResult() {
  return memoryOpportunityRuns.at(-1);
}

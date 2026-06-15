import type { ProductDecisionEngineResult } from "@/lib/types";
import { createSupabaseBrowserClient } from "@/lib/supabase";

const memoryDecisionRuns: ProductDecisionEngineResult[] = [];

export async function saveProductDecisionEngineResult(result: ProductDecisionEngineResult) {
  memoryDecisionRuns.push(result);

  const supabase = createSupabaseBrowserClient();
  if (!supabase) return result;

  if (result.profiles.length) {
    await supabase.from("product_decision_profiles").upsert(
      result.profiles.map((profile) => ({
        id: profile.id,
        product_id: null,
        product_name: profile.productName,
        platform: profile.platform,
        category: profile.category,
        product_opportunity_index: profile.productOpportunityIndex,
        development_priority: profile.developmentPriority,
        decision: profile.decision,
        action: profile.action,
        can_do: profile.canDo,
        why: profile.why,
        biggest_opportunity: profile.biggestOpportunity,
        biggest_risk: profile.biggestRisk,
        suggested_sale_price: profile.suggestedSalePrice,
        suggested_purchase_price: profile.suggestedPurchasePrice,
        suggested_first_batch_quantity: profile.suggestedFirstBatchQuantity,
        suggested_test_cycle_days: profile.suggestedTestCycleDays,
        estimated_margin_rate: profile.estimatedMarginRate,
        estimated_payback_cycle_days: profile.estimatedPaybackCycleDays,
        score: profile.score,
        lifecycle_forecast: profile.lifecycleForecast,
        next_step: profile.nextStep,
        generated_at: profile.generatedAt,
      })),
      { onConflict: "id" },
    );
  }

  if (result.newProductDiscovery.length) {
    await supabase.from("new_product_discovery_signals").upsert(
      result.newProductDiscovery.map((signal) => ({
        id: signal.id,
        product_id: null,
        product_name: signal.productName,
        platform: signal.platform,
        signal_type: signal.signalType,
        evidence: signal.evidence,
        severity: signal.severity,
        opportunity_score: signal.opportunityScore,
        discovered_at: signal.discoveredAt,
        auto_entered_pool: signal.autoEnteredPool,
      })),
      { onConflict: "id" },
    );
  }

  await supabase.from("ai_reports").insert({
    product_id: null,
    version: memoryDecisionRuns.length,
    report_type: "product_decision_engine",
    title: "Product Decision Engine Daily Decision Run",
    content: result,
    input_snapshot: {
      generatedAt: result.generatedAt,
      profileCount: result.profiles.length,
      signalCount: result.newProductDiscovery.length,
    },
    status: "completed",
    created_at: result.generatedAt,
  });

  return result;
}

export function getLatestProductDecisionEngineResult() {
  return memoryDecisionRuns.at(-1);
}

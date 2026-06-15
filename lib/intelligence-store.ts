import type { AiVersionRecord, ProductIntelligenceResult } from "@/lib/types";
import { createSupabaseBrowserClient } from "@/lib/supabase";

const memoryRecords = new Map<string, AiVersionRecord<ProductIntelligenceResult>[]>();
const memoryAgentLogs = new Map<string, AiVersionRecord<unknown>[]>();

export async function getNextAnalysisVersion(productId: string) {
  const localRecords = memoryRecords.get(productId) ?? [];
  return localRecords.length + 1;
}

export async function saveAnalysisRecord(record: AiVersionRecord<ProductIntelligenceResult>) {
  memoryRecords.set(record.productId, [...(memoryRecords.get(record.productId) ?? []), record]);

  const supabase = createSupabaseBrowserClient();
  if (!supabase) return record;

  await supabase.from("ai_reports").insert({
    product_id: record.productId,
    version: record.version,
    report_type: "product_intelligence",
    content: record.output,
    input_snapshot: record.inputSnapshot,
    status: "completed",
    created_at: record.finishedAt,
  });

  await supabase.from("ai_scores").insert({
    product_id: record.productId,
    version: record.version,
    market_demand_score: record.output.score.marketDemand,
    competition_score: record.output.score.competition,
    profit_score: record.output.score.profitMargin,
    review_optimization_score: record.output.score.reviewOptimizationSpace,
    supply_chain_score: record.output.score.supplyChainFeasibility,
    logistics_score: record.output.score.logisticsFriendliness,
    recommendation_index: record.output.score.recommendationIndex,
    final_grade: record.output.score.grade,
    reasoning: record.output.score.reasons,
    created_at: record.finishedAt,
  });

  return record;
}

export async function saveAgentRecord(record: AiVersionRecord<unknown>) {
  memoryAgentLogs.set(record.productId, [...(memoryAgentLogs.get(record.productId) ?? []), record]);

  const supabase = createSupabaseBrowserClient();
  if (!supabase) return record;

  await supabase.from("ai_logs").insert({
    agent_id: null,
    product_id: record.productId,
    task_type: record.agentCode,
    input: record.inputSnapshot,
    output: record.output,
    status: "completed",
    latency_ms: record.durationMs,
    created_at: record.finishedAt,
  });

  return record;
}

export async function getAnalysisHistory(productId: string) {
  return memoryRecords.get(productId) ?? [];
}

export async function getAgentHistory(productId: string) {
  return memoryAgentLogs.get(productId) ?? [];
}

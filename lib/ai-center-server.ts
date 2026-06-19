import { createClient } from "@/lib/supabase/server";
import { getPrimaryProviderEnvKey, hasProviderApiKey } from "@/lib/ai-env";
import {
  buildAnalysisFromOpportunity,
  buildDefaultProviders,
  buildDefaultTaskTemplates,
  buildGeneratedTaskRecords,
  buildPerplexityPlaceholderReport,
  type AIAnalysisRecord,
  type AIProviderName,
  type AIProviderRecord,
  type AITaskTemplateRecord,
  type AITaskType,
  type AIGeneratedTaskRecord,
  type PerplexityOutputFormat,
  type PerplexityReportRecord,
  type PerplexityReportType,
  type PerplexitySavedTo,
} from "@/lib/ai-workspace";
import type { ProductOpportunityRecord } from "@/lib/product-opportunities";
import { runGeminiAnalysis, runGrokAnalysis, runOpenAIAnalysis, runPerplexityResearch, testLiveProvider } from "@/lib/ai-runtime";

export async function listAIProviders() {
  const defaults = buildDefaultProviders();
  const supabase = await createClient();
  if (!supabase) {
    return {
      items: defaults,
      mode: "env_only" as const,
      error: "supabase_not_configured" as const,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      items: defaults,
      mode: "env_only" as const,
      error: "unauthorized" as const,
    };
  }

  const { data, error } = await supabase
    .from("ai_providers")
    .select("*")
    .eq("user_id", user.id)
    .order("provider_name", { ascending: true });

  if (error) {
    return {
      items: defaults,
      mode: "env_only" as const,
      error: error.message,
    };
  }

  const merged = defaults.map((item) => {
    const matched = (data ?? []).find((row) => row.provider_name === item.provider_name);
    if (!matched) return item;

    return {
      ...item,
      ...matched,
      api_key_configured: item.api_key_configured || Boolean(matched.api_key_configured),
      status: matched.enabled ? (item.api_key_configured || matched.api_key_configured ? "ready" : "missing_key") : "disabled",
    } as AIProviderRecord;
  });

  return {
    items: merged,
    mode: "database" as const,
    error: null,
    userId: user.id,
  };
}

export async function upsertAIProvider(input: {
  provider_name: AIProviderName;
  enabled: boolean;
  default_model: string;
  usage_type: string[];
  notes?: string | null;
  api_key_configured?: boolean;
}) {
  const supabase = await createClient();
  if (!supabase) {
    return { error: "supabase_not_configured" as const };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "unauthorized" as const };
  }

  const payload = {
    user_id: user.id,
    provider_name: input.provider_name,
    enabled: input.enabled,
    api_key_configured: Boolean(input.api_key_configured || hasProviderApiKey(input.provider_name)),
    default_model: input.default_model,
    usage_type: input.usage_type,
    notes: input.notes ?? null,
    status: input.enabled
      ? (input.api_key_configured || hasProviderApiKey(input.provider_name) ? "ready" : "missing_key")
      : "disabled",
  };

  const { data, error } = await supabase
    .from("ai_providers")
    .upsert(payload, { onConflict: "user_id,provider_name" })
    .select("*")
    .single();

  if (error) {
    return { error: error.message };
  }

  return { item: data as AIProviderRecord, error: null };
}

export async function testAIProvider(input: { provider_name: AIProviderName; apiKey?: string | null }) {
  const result = await testLiveProvider(input.provider_name);
  return {
    provider_name: input.provider_name,
    ...result,
    checked_at: new Date().toISOString(),
  };
}

export async function listAITaskTemplates() {
  const defaults = buildDefaultTaskTemplates();
  const supabase = await createClient();
  if (!supabase) {
    return { items: defaults, mode: "default" as const, error: "supabase_not_configured" as const };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { items: defaults, mode: "default" as const, error: "unauthorized" as const };
  }

  const { data, error } = await supabase
    .from("ai_task_templates")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    return { items: defaults, mode: "default" as const, error: error.message };
  }

  const merged = defaults.map((item) => {
    const matched = (data ?? []).find((row) => row.task_type === item.task_type);
    if (!matched) return item;

    return {
      ...item,
      ...matched,
      input_schema: Array.isArray(matched.input_schema) ? matched.input_schema : item.input_schema,
      output_schema: Array.isArray(matched.output_schema) ? matched.output_schema : item.output_schema,
      applicable_pages: Array.isArray(matched.applicable_pages) ? matched.applicable_pages : item.applicable_pages,
    } as AITaskTemplateRecord;
  });

  return { items: merged, mode: "database" as const, error: null };
}

export async function listProductOpportunitiesForAI() {
  const supabase = await createClient();
  if (!supabase) return { items: [], error: "supabase_not_configured" as const };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { items: [], error: "unauthorized" as const };

  const { data, error } = await supabase
    .from("product_opportunities")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) {
    return { items: [], error: error.message };
  }

  return { items: (data ?? []) as ProductOpportunityRecord[], error: null };
}

export async function listAIAnalysisRecords() {
  const supabase = await createClient();
  if (!supabase) return { items: [], error: "supabase_not_configured" as const };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { items: [], error: "unauthorized" as const };

  const { data, error } = await supabase
    .from("ai_analysis_records")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return { items: [], error: error.message };
  }

  return { items: (data ?? []) as AIAnalysisRecord[], error: null };
}

export async function createAIAnalysis(input: {
  source_type: string;
  source_id: string;
  source_title: string;
  task_type: AITaskType;
  source_snapshot: ProductOpportunityRecord;
  provider_name?: AIProviderName;
  model_name?: string;
}) {
  const providersResult = await listAIProviders();
  const activeProvider = selectAnalysisProvider(providersResult.items, input.task_type, input.provider_name);
  const execution = await executeAnalysisWithProvider(activeProvider, input.task_type, input.source_snapshot, input.model_name);

  const output = execution.result;
  const timestamp = new Date().toISOString();
  const draftId = crypto.randomUUID();
  const draftRecord: AIAnalysisRecord = {
    id: draftId,
    user_id: null,
    source_type: input.source_type,
    source_id: input.source_id,
    source_title: input.source_title,
    task_type: input.task_type,
    provider_name: execution.provider,
    model_name: execution.model,
    input_snapshot: input.source_snapshot as unknown as Record<string, unknown>,
    output_result: output,
    status: "completed",
    error_message: null,
    created_at: timestamp,
    updated_at: timestamp,
  };

  const draftTasks = buildGeneratedTaskRecords(draftId, input.source_type, input.source_id, output, new Date());

  const supabase = await createClient();
  if (!supabase) {
    return { item: draftRecord, tasks: draftTasks, persisted: false, error: "supabase_not_configured" as const };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { item: draftRecord, tasks: draftTasks, persisted: false, error: "unauthorized" as const };
  }

  const { data, error } = await supabase
    .from("ai_analysis_records")
    .insert({
      user_id: user.id,
      source_type: input.source_type,
      source_id: input.source_id,
      source_title: input.source_title,
      task_type: input.task_type,
      provider_name: draftRecord.provider_name,
      model_name: draftRecord.model_name,
      input_snapshot: draftRecord.input_snapshot,
      output_result: draftRecord.output_result,
      status: draftRecord.status,
      error_message: null,
    })
    .select("*")
    .single();

  if (error) {
    return { item: draftRecord, tasks: draftTasks, persisted: false, error: error.message };
  }

  const savedTasks = buildGeneratedTaskRecords(data.id, input.source_type, input.source_id, output, new Date());
  await supabase.from("ai_generated_tasks").insert(
    savedTasks.map((task) => ({
      user_id: user.id,
      analysis_id: data.id,
      source_type: task.source_type,
      source_id: task.source_id,
      task_title: task.task_title,
      task_content: task.task_content,
      owner: task.owner,
      deadline: task.deadline,
      status: task.status,
    })),
  );

  return {
    item: data as AIAnalysisRecord,
    tasks: savedTasks,
    persisted: true,
    error: null,
  };
}

function selectAnalysisProvider(
  providers: AIProviderRecord[],
  taskType: AITaskType,
  requestedProvider?: AIProviderName,
) {
  const enabled = providers.filter((item) => item.enabled && item.api_key_configured);
  if (requestedProvider) {
    const direct = enabled.find((item) => item.provider_name === requestedProvider);
    if (direct) return direct;
  }

  const preferenceMap: Record<AITaskType, AIProviderName[]> = {
    product_analysis: ["OpenAI", "Gemini", "Grok"],
    competitor_analysis: ["OpenAI", "Gemini", "Grok"],
    review_analysis: ["OpenAI", "Gemini", "Grok", "Claude"],
    profit_analysis: ["OpenAI", "Gemini", "Grok"],
    risk_analysis: ["OpenAI", "Gemini", "Grok"],
    seasonality_analysis: ["Perplexity", "OpenAI", "Gemini"],
    pb_fit_analysis: ["OpenAI", "Gemini", "Grok"],
    rg_fit_analysis: ["OpenAI", "Gemini", "Grok"],
    own_brand_fit_analysis: ["OpenAI", "Gemini", "Grok"],
    action_generation: ["OpenAI", "Gemini", "Grok"],
  };

  for (const providerName of preferenceMap[taskType]) {
    const matched = enabled.find((item) => item.provider_name === providerName);
    if (matched) return matched;
  }

  return (
    providers.find((item) => item.provider_name === requestedProvider) ??
    providers.find((item) => item.enabled) ??
    providers[0]
  );
}

async function executeAnalysisWithProvider(
  provider: AIProviderRecord,
  taskType: AITaskType,
  sourceSnapshot: ProductOpportunityRecord,
  modelName?: string,
) {
  const model = modelName || provider.default_model;

  if (provider.provider_name === "OpenAI" && hasProviderApiKey("OpenAI")) {
    return runOpenAIAnalysis({ taskType, product: sourceSnapshot, model });
  }

  if (provider.provider_name === "Gemini" && hasProviderApiKey("Gemini")) {
    return runGeminiAnalysis({ taskType, product: sourceSnapshot, model });
  }

  if (provider.provider_name === "Grok" && hasProviderApiKey("Grok")) {
    return runGrokAnalysis({ taskType, product: sourceSnapshot, model });
  }

  return {
    result: buildAnalysisFromOpportunity(sourceSnapshot, taskType),
    mode: "fallback" as const,
    provider: provider.provider_name,
    model,
  };
}

export async function listAIGeneratedTasks() {
  const supabase = await createClient();
  if (!supabase) return { items: [], error: "supabase_not_configured" as const };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { items: [], error: "unauthorized" as const };

  const { data, error } = await supabase
    .from("ai_generated_tasks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return { items: [], error: error.message };
  }

  return { items: (data ?? []) as AIGeneratedTaskRecord[], error: null };
}

export async function listPerplexityReports() {
  const supabase = await createClient();
  if (!supabase) return { items: [], error: "supabase_not_configured" as const };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { items: [], error: "unauthorized" as const };

  const { data, error } = await supabase
    .from("perplexity_reports")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return { items: [], error: error.message };
  }

  return { items: (data ?? []) as PerplexityReportRecord[], error: null };
}

export async function createPerplexityReport(input: {
  query: string;
  report_type: PerplexityReportType;
  output_format: PerplexityOutputFormat;
  saved_to: PerplexitySavedTo;
  response_language?: "zh" | "ko";
}) {
  const providersResult = await listAIProviders();
  const opportunityResult = await listProductOpportunitiesForAI();
  const providerReady = providersResult.items.some(
    (provider) => provider.provider_name === "Perplexity" && provider.enabled && provider.api_key_configured,
  );

  const liveResult = providerReady
      ? await runPerplexityResearch({
        query: input.query,
        reportType: input.report_type,
        outputFormat: input.output_format,
        savedTo: input.saved_to,
        responseLanguage: input.response_language ?? "zh",
      })
    : null;

  const fallback = buildPerplexityPlaceholderReport({
    query: input.query,
    reportType: input.report_type,
    outputFormat: input.output_format,
    savedTo: input.saved_to,
    providers: providersResult.items,
    opportunities: opportunityResult.items,
  });

  const report = liveResult
    ? {
        ...fallback,
        ...liveResult.item,
      }
    : fallback;

  const supabase = await createClient();
  if (!supabase) {
    return { item: report, persisted: false, error: "supabase_not_configured" as const };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { item: report, persisted: false, error: "unauthorized" as const };
  }

  const { data, error } = await supabase
    .from("perplexity_reports")
    .insert({
      user_id: user.id,
      report_type: report.report_type,
      title: report.title,
      query: report.query,
      output_format: report.output_format,
      content: report.content,
      content_json: report.content_json,
      source_links: report.source_links,
      saved_to: report.saved_to,
      status: report.status,
    })
    .select("*")
    .single();

  if (error) {
    return { item: report, persisted: false, error: error.message };
  }

  return { item: data as PerplexityReportRecord, persisted: true, error: null };
}

function getProviderEnvKey(provider: AIProviderName) {
  return getPrimaryProviderEnvKey(provider);
}

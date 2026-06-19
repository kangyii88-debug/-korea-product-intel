import { hasProviderApiKey } from "@/lib/ai-env";
import type { ProductOpportunityRecord } from "@/lib/product-opportunities";

export type Locale = "zh" | "ko";

export type LocalizedText = {
  zh: string;
  ko: string;
};

export type AIProviderName = "OpenAI" | "Claude" | "Gemini" | "Perplexity" | "Grok";

export type AIProviderStatus = "ready" | "missing_key" | "disabled" | "pending";

export type AIUsageType =
  | "general_analysis"
  | "deep_reasoning"
  | "web_search"
  | "market_research"
  | "review_analysis"
  | "multi_model_compare"
  | "backup_model";

export type AITaskType =
  | "product_analysis"
  | "competitor_analysis"
  | "review_analysis"
  | "profit_analysis"
  | "risk_analysis"
  | "seasonality_analysis"
  | "pb_fit_analysis"
  | "rg_fit_analysis"
  | "own_brand_fit_analysis"
  | "action_generation";

export type AIAnalysisStatus = "completed" | "pending" | "failed";

export type AIProviderRecord = {
  id: string;
  user_id: string | null;
  provider_name: AIProviderName;
  enabled: boolean;
  api_key_configured: boolean;
  default_model: string;
  usage_type: AIUsageType[];
  status: AIProviderStatus;
  last_tested_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type AITaskTemplateRecord = {
  id: string;
  user_id: string | null;
  task_name: string;
  task_type: AITaskType;
  applicable_pages: string[];
  default_provider: AIProviderName;
  default_model: string;
  input_schema: string[];
  output_schema: string[];
  prompt_template: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type AIOutputDirection = "Rocket Growth" | "PB" | "Own Brand" | "General Test" | "Pause" | "Drop";
export type AIFinalConclusion = "push_now" | "small_test" | "observe" | "pause" | "drop";

export type AIResultTaskSeed = {
  title: LocalizedText;
  content: LocalizedText;
  owner: string;
  deadlineDays: number;
  status: "pending" | "confirmed";
};

export type AIAnalysisResult = {
  worthResearch: LocalizedText;
  recommendedDirection: AIOutputDirection;
  reasonWhy: LocalizedText;
  biggestOpportunity: LocalizedText;
  biggestRisk: LocalizedText;
  reviewPainPoint: LocalizedText;
  improvementSuggestion: LocalizedText;
  seasonality: LocalizedText;
  profitJudgement: LocalizedText;
  nextAction: LocalizedText;
  finalConclusion: AIFinalConclusion;
  dataGaps: string[];
  rgFit: {
    score: number;
    verdict: LocalizedText;
  };
  pbFit: {
    score: number;
    verdict: LocalizedText;
  };
  ownBrandFit: {
    score: number;
    verdict: LocalizedText;
  };
  generatedTasks: AIResultTaskSeed[];
};

export type AIAnalysisRecord = {
  id: string;
  user_id: string | null;
  source_type: string;
  source_id: string;
  source_title: string;
  task_type: AITaskType;
  provider_name: AIProviderName;
  model_name: string;
  input_snapshot: Record<string, unknown>;
  output_result: AIAnalysisResult;
  status: AIAnalysisStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export type AIGeneratedTaskRecord = {
  id: string;
  user_id: string | null;
  analysis_id: string;
  source_type: string;
  source_id: string;
  task_title: LocalizedText;
  task_content: LocalizedText;
  owner: string;
  deadline: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type PerplexityReportType =
  | "market_research"
  | "trend_discovery"
  | "competitor_analysis"
  | "opportunity_discovery"
  | "review_pain_research"
  | "seasonal_opportunity"
  | "pb_proposal"
  | "rocket_growth_proposal";

export type PerplexitySavedTo =
  | "market_reports"
  | "trend_reports"
  | "competitor_reports"
  | "opportunity_reports";

export type PerplexityOutputFormat = "markdown" | "json" | "csv";

export type PerplexityReportRecord = {
  id: string;
  user_id: string | null;
  report_type: PerplexityReportType;
  title: string;
  query: string;
  output_format: PerplexityOutputFormat;
  content: string;
  content_json: Record<string, unknown>;
  source_links: string[];
  saved_to: PerplexitySavedTo;
  status: "ready" | "pending_config";
  created_at: string;
  updated_at: string;
};

type ProviderPreset = {
  provider_name: AIProviderName;
  default_model: string;
  usage_type: AIUsageType[];
  envKey: string;
};

const providerPresets: ProviderPreset[] = [
  {
    provider_name: "OpenAI",
    default_model: "gpt-5",
    usage_type: ["general_analysis"],
    envKey: "OPENAI_API_KEY",
  },
  {
    provider_name: "Claude",
    default_model: "claude-sonnet-4",
    usage_type: ["deep_reasoning", "review_analysis"],
    envKey: "ANTHROPIC_API_KEY",
  },
  {
    provider_name: "Gemini",
    default_model: "gemini-2.5-pro",
    usage_type: ["deep_reasoning"],
    envKey: "GOOGLE_API_KEY",
  },
  {
    provider_name: "Perplexity",
    default_model: "sonar-pro",
    usage_type: ["web_search", "market_research"],
    envKey: "PERPLEXITY_API_KEY",
  },
  {
    provider_name: "Grok",
    default_model: "grok-3",
    usage_type: ["backup_model", "multi_model_compare"],
    envKey: "XAI_API_KEY",
  },
];

type TaskPreset = Omit<AITaskTemplateRecord, "id" | "user_id" | "created_at" | "updated_at">;

const taskPresets: TaskPreset[] = [
  {
    task_name: "product_analysis",
    task_type: "product_analysis",
    applicable_pages: ["/", "/opportunities"],
    default_provider: "OpenAI",
    default_model: "gpt-5",
    input_schema: ["title", "price", "review_count", "rating", "estimated_margin_rate", "risk_level"],
    output_schema: ["recommendedDirection", "biggestOpportunity", "biggestRisk", "nextAction", "finalConclusion"],
    prompt_template:
      "Use structured product fields only. Return a concrete go / no-go decision, reasons, top risk, and next action. Never use empty phrasing. If fields are missing, list them clearly.",
    enabled: true,
  },
  {
    task_name: "competitor_analysis",
    task_type: "competitor_analysis",
    applicable_pages: ["/competitors", "/"],
    default_provider: "OpenAI",
    default_model: "gpt-5",
    input_schema: ["title", "competitor_price_range", "competitor_count", "review_issue_summary", "improvement_points"],
    output_schema: ["core_selling_points", "consumer_likes", "consumer_dislikes", "follow_up_verdict"],
    prompt_template:
      "Extract concrete competitor strengths, weaknesses, and follow-up value. Do not invent missing market data.",
    enabled: true,
  },
  {
    task_name: "review_analysis",
    task_type: "review_analysis",
    applicable_pages: ["/reviews", "/testing-db"],
    default_provider: "OpenAI",
    default_model: "gpt-5",
    input_schema: ["review_issue_summary", "negative_review_keywords", "improvement_points"],
    output_schema: ["high_frequency_issues", "severity", "improvement_opportunities", "after_sales_risk"],
    prompt_template:
      "Summarize pain points into categories, severity, and product improvement actions. No generic wording.",
    enabled: true,
  },
  {
    task_name: "profit_analysis",
    task_type: "profit_analysis",
    applicable_pages: ["/pricing-profit", "/"],
    default_provider: "OpenAI",
    default_model: "gpt-5",
    input_schema: [
      "price",
      "estimated_purchase_cost",
      "estimated_shipping_cost",
      "estimated_local_delivery_cost",
      "platform_fee_rate",
      "estimated_ad_cost",
      "estimated_sale_price",
    ],
    output_schema: ["margin", "margin_rate", "minimum_price", "recommended_supply_price", "profit_verdict"],
    prompt_template:
      "Judge profitability using cost structure and margin thresholds. Recommend whether to proceed or stop.",
    enabled: true,
  },
  {
    task_name: "risk_analysis",
    task_type: "risk_analysis",
    applicable_pages: ["/risk-logistics", "/"],
    default_provider: "OpenAI",
    default_model: "gpt-5",
    input_schema: [
      "category",
      "kc_risk",
      "volume_weight_risk",
      "return_risk",
      "negative_review_risk",
      "price_war_risk",
      "supply_chain_risk",
    ],
    output_schema: ["kc_risk", "regulation_risk", "logistics_risk", "continue_verdict", "required_materials"],
    prompt_template:
      "Assess certification, logistics, return, and platform risks from provided fields only. Flag data gaps clearly.",
    enabled: true,
  },
  {
    task_name: "seasonality_analysis",
    task_type: "seasonality_analysis",
    applicable_pages: ["/", "/perplexity"],
    default_provider: "Perplexity",
    default_model: "sonar-pro",
    input_schema: ["category", "seasonality", "market_heat"],
    output_schema: ["seasonality", "best_sales_season", "stocking_note"],
    prompt_template:
      "Determine whether the opportunity is seasonal and what stocking rhythm is suitable.",
    enabled: true,
  },
  {
    task_name: "pb_fit_analysis",
    task_type: "pb_fit_analysis",
    applicable_pages: ["/pb", "/"],
    default_provider: "OpenAI",
    default_model: "gpt-5",
    input_schema: ["category", "improvement_points", "estimated_margin_rate", "supply_chain_risk"],
    output_schema: ["pb_fit_score", "pb_fit_verdict", "development_note"],
    prompt_template:
      "Judge PB fit from category gap, differentiation space, supply chain, and long-term operation suitability.",
    enabled: true,
  },
  {
    task_name: "rg_fit_analysis",
    task_type: "rg_fit_analysis",
    applicable_pages: ["/rocket-growth", "/"],
    default_provider: "OpenAI",
    default_model: "gpt-5",
    input_schema: ["category", "price", "estimated_margin_rate", "risk_level", "review_count"],
    output_schema: ["rg_fit_score", "rg_fit_verdict", "fulfillment_note"],
    prompt_template:
      "Judge Rocket Growth fit from standardization, fulfillment ease, low-after-sales risk, and demand stability.",
    enabled: true,
  },
  {
    task_name: "own_brand_fit_analysis",
    task_type: "own_brand_fit_analysis",
    applicable_pages: ["/development", "/"],
    default_provider: "OpenAI",
    default_model: "gpt-5",
    input_schema: ["category", "improvement_points", "review_issue_summary", "estimated_margin_rate"],
    output_schema: ["own_brand_score", "own_brand_verdict", "brand_build_note"],
    prompt_template:
      "Judge whether the product has enough room for branded differentiation and repeatable operation.",
    enabled: true,
  },
  {
    task_name: "action_generation",
    task_type: "action_generation",
    applicable_pages: ["/actions", "/"],
    default_provider: "OpenAI",
    default_model: "gpt-5",
    input_schema: ["recommendedDirection", "risk_level", "estimated_margin_rate", "data_gaps"],
    output_schema: ["tasks", "deadline", "owner", "priority"],
    prompt_template:
      "Generate concrete next-step tasks with deadlines and owners. No vague follow-up advice.",
    enabled: true,
  },
];

export function buildDefaultProviders(now = new Date().toISOString()): AIProviderRecord[] {
  return providerPresets.map((preset, index) => {
    const configured = hasProviderApiKey(preset.provider_name);
    return {
      id: `provider-${index + 1}`,
      user_id: null,
      provider_name: preset.provider_name,
      enabled: configured,
      api_key_configured: configured,
      default_model: preset.default_model,
      usage_type: preset.usage_type,
      status: configured ? "ready" : "missing_key",
      last_tested_at: null,
      notes: null,
      created_at: now,
      updated_at: now,
    };
  });
}

export function buildDefaultTaskTemplates(now = new Date().toISOString()): AITaskTemplateRecord[] {
  return taskPresets.map((preset, index) => ({
    id: `template-${index + 1}`,
    user_id: null,
    created_at: now,
    updated_at: now,
    ...preset,
  }));
}

export function getTaskTemplateByType(taskType: AITaskType) {
  return taskPresets.find((task) => task.task_type === taskType) ?? taskPresets[0];
}

export function buildAIDashboardSummary(
  providers: AIProviderRecord[],
  analyses: AIAnalysisRecord[],
  opportunities: ProductOpportunityRecord[],
) {
  const readyProviders = providers.filter((provider) => provider.enabled && provider.status === "ready");
  const failureCount = analyses.filter((item) => item.status === "failed").length;
  const lastSuccess = [...analyses]
    .filter((item) => item.status === "completed")
    .sort((left, right) => right.created_at.localeCompare(left.created_at))[0];

  return {
    enabledProviders: readyProviders.length,
    todayAnalysisCount: analyses.filter((item) => item.created_at.startsWith(new Date().toISOString().slice(0, 10))).length,
    pendingOpportunityCount: opportunities.filter(
      (item) => !analyses.some((analysis) => analysis.source_id === item.id && analysis.task_type === "product_analysis"),
    ).length,
    failureCount,
    lastSuccessTime: lastSuccess?.created_at ?? null,
    defaultAnalysisModel: readyProviders.find((provider) => provider.usage_type.includes("general_analysis"))?.default_model ?? "Not configured",
  };
}

export function buildAnalysisFromOpportunity(
  source: ProductOpportunityRecord,
  taskType: AITaskType,
): AIAnalysisResult {
  const marginRate = Number(source.estimated_margin_rate ?? 0);
  const reviewCount = Number(source.review_count ?? 0);
  const rating = Number(source.rating ?? 0);
  const score = Number(source.score ?? 0);
  const highRisk =
    source.risk_level === "high" ||
    source.kc_risk === "high" ||
    source.volume_weight_risk === "high" ||
    source.return_risk === "high";
  const mediumRisk = !highRisk && (source.risk_level === "medium" || source.price_war_risk === "medium");

  const rgScore = clampScore(
    score +
      (source.market_heat === "high" ? 10 : source.market_heat === "medium" ? 4 : 0) +
      (source.competition_level === "low" ? 10 : source.competition_level === "medium" ? 4 : -4) +
      (marginRate >= 30 ? 10 : marginRate >= 20 ? 4 : -8) +
      (highRisk ? -16 : mediumRisk ? -8 : 8),
  );
  const pbScore = clampScore(
    score +
      ((source.improvement_points?.length ?? 0) > 10 ? 12 : 4) +
      ((source.review_issue_summary?.length ?? 0) > 10 ? 8 : 2) +
      (source.supply_chain_risk === "low" ? 8 : source.supply_chain_risk === "medium" ? 2 : -8) +
      (marginRate >= 35 ? 8 : marginRate >= 25 ? 4 : -6),
  );
  const ownBrandScore = clampScore(
    score +
      ((source.improvement_points?.length ?? 0) > 16 ? 12 : 3) +
      (source.competition_level === "high" ? 4 : 0) +
      (Number(source.review_count ?? 0) >= 500 ? 8 : 3) +
      (source.supply_chain_risk === "low" ? 8 : -6),
  );

  const recommendedDirection = pickRecommendedDirection({
    highRisk,
    mediumRisk,
    marginRate,
    score,
    rgScore,
    pbScore,
    ownBrandScore,
  });

  const finalConclusion = pickFinalConclusion({
    recommendedDirection,
    highRisk,
    mediumRisk,
    marginRate,
    score,
  });

  const dataGaps = collectDataGaps(source);

  const biggestOpportunity = source.improvement_points
    ? localize(
        `评论与竞品信息已经暴露出可优化点，适合围绕“${truncate(source.improvement_points, 28)}”做差异化。`,
        `리뷰와 경쟁 상품 정보에서 개선 포인트가 드러났고, "${truncate(source.improvement_points, 24)}" 방향으로 차별화할 수 있습니다.`,
      )
    : localize(
        marginRate >= 30
          ? "现有利润结构相对健康，适合先做供货或测试报价。"
          : "市场基础还在，但需要先把利润模型和差异化方案补全。",
        marginRate >= 30
          ? "현재 수익 구조가 비교적 안정적이어서 공급 또는 테스트 견적 검토에 적합합니다."
          : "시장 기본 수요는 있으나 수익 구조와 차별화 포인트를 먼저 보강해야 합니다.",
      );

  const biggestRisk = highRisk
    ? localize("当前风险项已经达到高风险，优先确认认证、物流或退货问题。", "현재 리스크가 고위험 수준이므로 인증, 물류, 반품 이슈를 먼저 확인해야 합니다.")
    : marginRate < 20
      ? localize("毛利率低于 20%，利润安全线没有通过。", "마진율이 20% 미만으로 수익 안전선을 통과하지 못했습니다.")
      : source.competition_level === "high"
        ? localize("竞争强度偏高，后续很容易进入价格战。", "경쟁 강도가 높아 이후 가격 경쟁으로 빠질 가능성이 큽니다.")
        : localize("当前最大风险是数据不足，不能直接做最终决策。", "현재 가장 큰 리스크는 데이터 부족으로 최종 결정을 바로 내리기 어렵다는 점입니다.");

  const reviewPainPoint = source.review_issue_summary
    ? localize(
        `差评集中在：${truncate(source.review_issue_summary, 40)}`,
        `부정 리뷰는 "${truncate(source.review_issue_summary, 34)}"에 집중됩니다.`,
      )
    : source.negative_review_keywords
      ? localize(
          `当前可见差评关键词为：${truncate(source.negative_review_keywords, 40)}`,
          `현재 확인 가능한 부정 키워드는 "${truncate(source.negative_review_keywords, 34)}" 입니다.`,
        )
      : localize("当前没有足够的差评样本，建议先补充低星评价与退货原因。", "현재 부정 리뷰 샘플이 충분하지 않아 저성점 리뷰와 반품 사유를 먼저 보강해야 합니다.");

  const improvementSuggestion = source.improvement_points
    ? localize(
        `建议优先围绕 ${truncate(source.improvement_points, 30)} 做样品改版，并同步优化详情页解释。`,
        `${truncate(source.improvement_points, 26)} 중심으로 샘플 개선을 우선 진행하고 상세페이지 설명도 함께 보완하는 것이 좋습니다.`,
      )
    : localize(
        "建议先补充竞品卖点、差评样本和成本结构，再判断是否值得继续开发。",
        "경쟁 상품 강점, 부정 리뷰 샘플, 비용 구조를 먼저 보강한 뒤 계속 개발할지 판단하는 것이 좋습니다.",
      );

  const seasonality = source.seasonality
    ? localize(`季节性判断：${source.seasonality}`, `계절성 판단: ${source.seasonality}`)
    : localize("当前未看到强季节性证据，默认按常规需求品观察。", "강한 계절성 근거는 아직 보이지 않아 일반 수요 상품으로 우선 관찰합니다.");

  const profitJudgement = marginRate >= 40
    ? localize("利润空间优先推进，当前毛利率已经超过 40%。", "수익성이 우선 추진 구간이며 현재 마진율이 40%를 넘습니다.")
    : marginRate >= 30
      ? localize("利润空间可以推进，但还需要验证供应链报价稳定性。", "수익성은 추진 가능하지만 공급망 견적 안정성을 추가 검증해야 합니다.")
      : marginRate >= 20
        ? localize("利润空间偏紧，建议谨慎测试，不要直接放量。", "수익성이 다소 타이트해 신중한 테스트가 필요하며 바로 물량 확대하면 안 됩니다.")
        : localize("利润空间不安全，除非能够明显压低供货成本，否则不建议继续。", "수익 안전선이 부족하므로 공급 원가를 크게 낮출 수 없다면 계속 추진하지 않는 것이 좋습니다.");

  const worthResearch = finalConclusion === "drop"
    ? localize("当前不建议继续深入研究。", "현재는 추가 심층 검토를 권장하지 않습니다.")
    : finalConclusion === "pause"
      ? localize("可以保留观察，但不建议马上投入资源。", "관찰은 유지할 수 있지만 지금 바로 리소스를 투입할 단계는 아닙니다.")
      : finalConclusion === "observe"
        ? localize("值得继续研究，但先补齐关键字段再决定。", "추가 검토 가치는 있으나 핵심 필드를 먼저 보강한 뒤 결정해야 합니다.")
        : localize("值得继续推进，已经具备进入下一步判断的基础。", "다음 단계로 추진할 가치가 있으며 기본 판단 조건은 갖췄습니다.");

  const reasonWhy = localize(
    [
      `综合评分 ${score} 分`,
      `毛利率 ${Math.round(marginRate)}%`,
      `风险等级 ${riskLabelZh(source.risk_level)}`,
      `评论数 ${reviewCount}`,
      `评分 ${rating || 0}`,
    ].join("，"),
    [
      `종합 점수 ${score}점`,
      `마진율 ${Math.round(marginRate)}%`,
      `리스크 등급 ${riskLabelKo(source.risk_level)}`,
      `리뷰 수 ${reviewCount}`,
      `평점 ${rating || 0}`,
    ].join(", "),
  );

  const nextTaskSeeds = buildTaskSeeds({
    source,
    recommendedDirection,
    finalConclusion,
    highRisk,
    mediumRisk,
    dataGaps,
  });

  const nextAction = nextTaskSeeds[0]?.title ?? localize("先补充更多数据", "먼저 추가 데이터를 보강");

  return {
    worthResearch,
    recommendedDirection,
    reasonWhy,
    biggestOpportunity,
    biggestRisk,
    reviewPainPoint,
    improvementSuggestion,
    seasonality,
    profitJudgement,
    nextAction,
    finalConclusion,
    dataGaps,
    rgFit: {
      score: rgScore,
      verdict: scoreVerdict(rgScore, "rg"),
    },
    pbFit: {
      score: pbScore,
      verdict: scoreVerdict(pbScore, "pb"),
    },
    ownBrandFit: {
      score: ownBrandScore,
      verdict: scoreVerdict(ownBrandScore, "own"),
    },
    generatedTasks: taskType === "action_generation" ? nextTaskSeeds : nextTaskSeeds,
  };
}

export function buildGeneratedTaskRecords(
  analysisId: string,
  sourceType: string,
  sourceId: string,
  result: AIAnalysisResult,
  now = new Date(),
): AIGeneratedTaskRecord[] {
  return result.generatedTasks.map((task, index) => {
    const deadline = new Date(now);
    deadline.setDate(deadline.getDate() + task.deadlineDays);
    const timestamp = now.toISOString();
    return {
      id: `${analysisId}-task-${index + 1}`,
      user_id: null,
      analysis_id: analysisId,
      source_type: sourceType,
      source_id: sourceId,
      task_title: task.title,
      task_content: task.content,
      owner: task.owner,
      deadline: deadline.toISOString(),
      status: task.status,
      created_at: timestamp,
      updated_at: timestamp,
    };
  });
}

export function buildPerplexityPlaceholderReport(params: {
  query: string;
  reportType: PerplexityReportType;
  outputFormat: PerplexityOutputFormat;
  savedTo: PerplexitySavedTo;
  providers: AIProviderRecord[];
  opportunities: ProductOpportunityRecord[];
}): PerplexityReportRecord {
  const now = new Date().toISOString();
  const hasPerplexity = params.providers.some(
    (provider) => provider.provider_name === "Perplexity" && provider.enabled && provider.api_key_configured,
  );
  const opportunities = params.opportunities;
  const highPotential = opportunities.filter((item) => Number(item.score ?? 0) >= 80).length;
  const highRisk = opportunities.filter((item) => item.risk_level === "high").length;
  const topCategories = summarizeCategories(opportunities);
  const contentJson = {
    mode: hasPerplexity ? "provider_ready_placeholder" : "pending_config",
    summary: {
      total_opportunities: opportunities.length,
      high_potential: highPotential,
      high_risk: highRisk,
      top_categories: topCategories,
    },
    recommendation: hasPerplexity
      ? "Provider is configured. This first version stores the research workflow and can be upgraded to live Perplexity retrieval."
      : "Perplexity API is not configured yet. Configure the provider to unlock external web research.",
    query: params.query,
    report_type: params.reportType,
  };

  const markdown = [
    `# ${params.query}`,
    "",
    hasPerplexity
      ? "当前已检测到 Perplexity 提供商配置，页面和数据流已经准备好，后续只需要接入真实 API 调用。"
      : "当前还没有配置 Perplexity API，因此这份报告先以系统内机会数据和研究流程模板输出。",
    "",
    `- 当前商品机会数：${opportunities.length}`,
    `- 高潜力商品数：${highPotential}`,
    `- 高风险商品数：${highRisk}`,
    `- 候选重点类目：${topCategories.join(" / ") || "未形成样本"}`,
    "",
    "## 建议下一步",
    "1. 优先补齐高潜力类目的竞品与评论样本。",
    "2. 补充利润结构和 KC / 物流风险字段。",
    "3. Perplexity API 配置完成后，再执行外部趋势和竞品资料搜索。",
  ].join("\n");

  return {
    id: `perplexity-${cryptoRandomId()}`,
    user_id: null,
    report_type: params.reportType,
    title: params.query,
    query: params.query,
    output_format: params.outputFormat,
    content: params.outputFormat === "json" ? JSON.stringify(contentJson, null, 2) : params.outputFormat === "csv" ? objectToCsv(contentJson) : markdown,
    content_json: contentJson,
    source_links: [],
    saved_to: params.savedTo,
    status: hasPerplexity ? "ready" : "pending_config",
    created_at: now,
    updated_at: now,
  };
}

export function localize(zh: string, ko: string): LocalizedText {
  return { zh, ko };
}

export function pickLocalizedText(value: LocalizedText, locale: Locale) {
  return value[locale];
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function collectDataGaps(source: ProductOpportunityRecord) {
  const gaps: string[] = [];
  if (!source.price) gaps.push("price");
  if (!source.review_count) gaps.push("review_count");
  if (!source.rating) gaps.push("rating");
  if (!source.estimated_purchase_cost) gaps.push("estimated_purchase_cost");
  if (!source.estimated_shipping_cost) gaps.push("estimated_shipping_cost");
  if (!source.estimated_sale_price) gaps.push("estimated_sale_price");
  if (!source.review_issue_summary && !source.negative_review_keywords) gaps.push("negative_reviews");
  return gaps;
}

function pickRecommendedDirection(input: {
  highRisk: boolean;
  mediumRisk: boolean;
  marginRate: number;
  score: number;
  rgScore: number;
  pbScore: number;
  ownBrandScore: number;
}): AIOutputDirection {
  if (input.highRisk || input.marginRate < 20 || input.score < 55) return "Drop";
  if (input.mediumRisk || input.score < 70) return "Pause";
  const best = Math.max(input.rgScore, input.pbScore, input.ownBrandScore);
  if (best === input.rgScore && input.rgScore >= 75) return "Rocket Growth";
  if (best === input.pbScore && input.pbScore >= 75) return "PB";
  if (best === input.ownBrandScore && input.ownBrandScore >= 75) return "Own Brand";
  return "General Test";
}

function pickFinalConclusion(input: {
  recommendedDirection: AIOutputDirection;
  highRisk: boolean;
  mediumRisk: boolean;
  marginRate: number;
  score: number;
}): AIFinalConclusion {
  if (input.recommendedDirection === "Drop") return "drop";
  if (input.recommendedDirection === "Pause") return "pause";
  if (input.score >= 80 && input.marginRate >= 30 && !input.highRisk) return "push_now";
  if (input.score >= 70 && input.marginRate >= 20 && !input.mediumRisk) return "small_test";
  return "observe";
}

function buildTaskSeeds(params: {
  source: ProductOpportunityRecord;
  recommendedDirection: AIOutputDirection;
  finalConclusion: AIFinalConclusion;
  highRisk: boolean;
  mediumRisk: boolean;
  dataGaps: string[];
}): AIResultTaskSeed[] {
  const tasks: AIResultTaskSeed[] = [];

  if (params.dataGaps.includes("estimated_purchase_cost") || params.dataGaps.includes("estimated_shipping_cost")) {
    tasks.push({
      title: localize("找 3 家中国供应商报价", "중국 공급사 3곳 견적 요청"),
      content: localize("补齐采购价、国际物流费和 MOQ 信息，再重新计算利润安全线。", "구매가, 국제 물류비, MOQ 정보를 보강한 뒤 수익 안전선을 다시 계산합니다."),
      owner: "CN Team",
      deadlineDays: 3,
      status: "pending",
    });
  }

  if (params.source.review_issue_summary || params.source.negative_review_keywords) {
    tasks.push({
      title: localize("整理差评痛点与改进方向", "부정 리뷰 문제점과 개선 방향 정리"),
      content: localize("输出可改进点、详情页需说明项和潜在退货原因。", "개선 포인트, 상세페이지 사전 설명 항목, 잠재 반품 사유를 정리합니다."),
      owner: "KR Team",
      deadlineDays: 2,
      status: "pending",
    });
  }

  if (params.recommendedDirection === "Rocket Growth") {
    tasks.push({
      title: localize("准备 Rocket Growth 产品提案", "Rocket Growth 제안 자료 준비"),
      content: localize("整理供货节奏、包装标准、低售后风险说明和补货计划。", "공급 리듬, 포장 표준, 낮은 CS 리스크 근거, 보충 발주 계획을 정리합니다."),
      owner: "Ops",
      deadlineDays: 5,
      status: "pending",
    });
  }

  if (params.recommendedDirection === "PB") {
    tasks.push({
      title: localize("准备 PB 开发方案", "PB 개발 제안 준비"),
      content: localize("整理差异化开发点、供应链优势、系列化延展空间。", "차별화 개발 포인트, 공급망 우위, 시리즈 확장 가능성을 정리합니다."),
      owner: "PM",
      deadlineDays: 7,
      status: "pending",
    });
  }

  if (params.recommendedDirection === "Own Brand") {
    tasks.push({
      title: localize("梳理品牌化测试方案", "브랜드화 테스트 방향 정리"),
      content: localize("定义品牌定位、包装升级点和内容素材方向。", "브랜드 포지셔닝, 패키지 업그레이드 포인트, 콘텐츠 방향을 정의합니다."),
      owner: "Brand",
      deadlineDays: 7,
      status: "pending",
    });
  }

  if (params.highRisk || params.mediumRisk) {
    tasks.push({
      title: localize("确认认证 / 物流 / 退货风险", "인증 / 물류 / 반품 리스크 확인"),
      content: localize("逐项确认 KC、体积重量、破损和退货风险，再决定是否继续推进。", "KC, 부피중량, 파손, 반품 리스크를 항목별로 확인한 뒤 계속 추진 여부를 결정합니다."),
      owner: "QA",
      deadlineDays: 2,
      status: "pending",
    });
  }

  if (!tasks.length) {
    tasks.push({
      title: localize("继续观察同类商品走势", "유사 상품 추세 계속 관찰"),
      content: localize("补充同类竞品价格、评分和评论变化，再决定是否推进。", "유사 경쟁 상품의 가격, 평점, 리뷰 변화를 보강한 뒤 추진 여부를 다시 결정합니다."),
      owner: "Ops",
      deadlineDays: 5,
      status: "pending",
    });
  }

  if (params.finalConclusion === "drop") {
    tasks.unshift({
      title: localize("标记为淘汰并记录原因", "제외 처리 후 사유 기록"),
      content: localize("保留淘汰原因，方便后续复盘和避免重复投入。", "제외 사유를 남겨 두어 추후 회고와 중복 투입 방지에 활용합니다."),
      owner: "Ops",
      deadlineDays: 1,
      status: "pending",
    });
  }

  return tasks;
}

function scoreVerdict(score: number, type: "rg" | "pb" | "own") {
  if (type === "rg") {
    if (score >= 85) return localize("强烈推荐 Rocket Growth", "Rocket Growth 강력 추천");
    if (score >= 70) return localize("可以作为 Rocket Growth 候选", "Rocket Growth 후보로 검토 가능");
    if (score >= 55) return localize("暂时不适合 Rocket Growth", "당장은 Rocket Growth 적합도가 낮음");
    return localize("不建议 Rocket Growth", "Rocket Growth 비추천");
  }
  if (type === "pb") {
    if (score >= 85) return localize("强烈推荐 PB", "PB 강력 추천");
    if (score >= 70) return localize("可以作为 PB 候选", "PB 후보로 검토 가능");
    if (score >= 55) return localize("暂时不适合 PB", "당장은 PB 적합도가 낮음");
    return localize("不建议 PB", "PB 비추천");
  }

  if (score >= 85) return localize("适合做长期品牌化方向", "장기 브랜드화 방향으로 적합");
  if (score >= 70) return localize("可以作为品牌化候选", "브랜드화 후보로 검토 가능");
  if (score >= 55) return localize("品牌化空间一般", "브랜드화 여지는 보통 수준");
  return localize("不建议做品牌化投入", "브랜드화 투자는 비추천");
}

function riskLabelZh(value: string | null | undefined) {
  if (value === "high") return "高风险";
  if (value === "medium") return "中风险";
  return "低风险";
}

function riskLabelKo(value: string | null | undefined) {
  if (value === "high") return "고위험";
  if (value === "medium") return "중위험";
  return "저위험";
}

function truncate(value: string, length: number) {
  return value.length > length ? `${value.slice(0, length)}...` : value;
}

function summarizeCategories(items: ProductOpportunityRecord[]) {
  const buckets = new Map<string, number>();
  for (const item of items) {
    const key = item.category || "other";
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return [...buckets.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([key]) => key);
}

function objectToCsv(value: Record<string, unknown>) {
  const rows = Object.entries(value).map(([key, entry]) => {
    const serialized = typeof entry === "string" ? entry : JSON.stringify(entry);
    return `${key},"${String(serialized).replaceAll('"', '""')}"`;
  });
  return ["key,value", ...rows].join("\n");
}

function cryptoRandomId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

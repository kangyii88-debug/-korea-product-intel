import OpenAI from "openai";
import type {
  AIAnalysisResult,
  AIProviderName,
  PerplexityOutputFormat,
  PerplexityReportRecord,
  PerplexityReportType,
  PerplexitySavedTo,
} from "@/lib/ai-workspace";
import { buildAnalysisFromOpportunity } from "@/lib/ai-workspace";
import type { AITaskType } from "@/lib/ai-workspace";
import type { ProductOpportunityRecord } from "@/lib/product-opportunities";

export async function runOpenAIAnalysis(input: {
  taskType: AITaskType;
  product: ProductOpportunityRecord;
  model: string;
}): Promise<{ result: AIAnalysisResult; mode: "live" | "fallback"; provider: AIProviderName; model: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      result: buildAnalysisFromOpportunity(input.product, input.taskType),
      mode: "fallback",
      provider: "OpenAI",
      model: input.model,
    };
  }

  const client = new OpenAI({ apiKey });
  const prompt = buildOpenAIAnalysisPrompt(input.taskType, input.product);

  try {
    const response = await client.responses.create({
      model: input.model,
      input: prompt,
      temperature: 0.2,
      max_output_tokens: 1800,
    });

    const outputText = response.output_text?.trim();
    if (!outputText) {
      throw new Error("empty_output");
    }

    const parsed = parseJsonFromText(outputText) as AIAnalysisResult;
    return {
      result: normalizeAnalysisResult(parsed, input.product, input.taskType),
      mode: "live",
      provider: "OpenAI",
      model: input.model,
    };
  } catch {
    return {
      result: buildAnalysisFromOpportunity(input.product, input.taskType),
      mode: "fallback",
      provider: "OpenAI",
      model: input.model,
    };
  }
}

export async function runGeminiAnalysis(input: {
  taskType: AITaskType;
  product: ProductOpportunityRecord;
  model: string;
}): Promise<{ result: AIAnalysisResult; mode: "live" | "fallback"; provider: AIProviderName; model: string }> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return {
      result: buildAnalysisFromOpportunity(input.product, input.taskType),
      mode: "fallback",
      provider: "Gemini",
      model: input.model,
    };
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(input.model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: buildOpenAIAnalysisPrompt(input.taskType, input.product) }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`gemini_http_${response.status}`);
    }

    const payload = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };

    const outputText = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
    if (!outputText) throw new Error("empty_output");

    const parsed = parseJsonFromText(outputText) as AIAnalysisResult;
    return {
      result: normalizeAnalysisResult(parsed, input.product, input.taskType),
      mode: "live",
      provider: "Gemini",
      model: input.model,
    };
  } catch {
    return {
      result: buildAnalysisFromOpportunity(input.product, input.taskType),
      mode: "fallback",
      provider: "Gemini",
      model: input.model,
    };
  }
}

export async function runGrokAnalysis(input: {
  taskType: AITaskType;
  product: ProductOpportunityRecord;
  model: string;
}): Promise<{ result: AIAnalysisResult; mode: "live" | "fallback"; provider: AIProviderName; model: string }> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return {
      result: buildAnalysisFromOpportunity(input.product, input.taskType),
      mode: "fallback",
      provider: "Grok",
      model: input.model,
    };
  }

  try {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: input.model,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: "You are a Korea Coupang product intelligence analyst. Return JSON only.",
          },
          {
            role: "user",
            content: buildOpenAIAnalysisPrompt(input.taskType, input.product),
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`grok_http_${response.status}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const outputText = payload.choices?.[0]?.message?.content?.trim();
    if (!outputText) throw new Error("empty_output");

    const parsed = parseJsonFromText(outputText) as AIAnalysisResult;
    return {
      result: normalizeAnalysisResult(parsed, input.product, input.taskType),
      mode: "live",
      provider: "Grok",
      model: input.model,
    };
  } catch {
    return {
      result: buildAnalysisFromOpportunity(input.product, input.taskType),
      mode: "fallback",
      provider: "Grok",
      model: input.model,
    };
  }
}

export async function runPerplexityResearch(input: {
  query: string;
  reportType: PerplexityReportType;
  outputFormat: PerplexityOutputFormat;
  savedTo: PerplexitySavedTo;
  responseLanguage: "zh" | "ko";
}): Promise<{ item: Omit<PerplexityReportRecord, "id" | "user_id" | "created_at" | "updated_at">; mode: "live" | "pending_config" }> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    return {
      item: buildPendingPerplexityRecord(input),
      mode: "pending_config",
    };
  }

  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-pro",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              input.responseLanguage === "ko"
                ? "당신은 한국 Coupang 상품 리서치 분석가입니다. 결과는 반드시 구조화된 JSON 하나로만 반환하세요."
                : "你是韩国 Coupang 商品情报研究分析师。结果必须只返回一个结构化 JSON 对象。",
          },
          {
            role: "user",
            content: buildPerplexityPrompt(input),
          },
        ],
        search_language_filter: input.responseLanguage === "ko" ? ["ko"] : ["zh", "ko"],
        return_related_questions: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`perplexity_http_${response.status}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      citations?: string[];
      related_questions?: string[];
    };

    const text = payload.choices?.[0]?.message?.content?.trim();
    if (!text) {
      throw new Error("perplexity_empty_output");
    }

    const parsed = parseJsonFromText(text) as {
      title?: string;
      summary?: string;
      findings?: string[];
      opportunities?: string[];
      next_steps?: string[];
    };

    const contentJson = {
      title: parsed.title || input.query,
      summary: parsed.summary || "",
      findings: parsed.findings ?? [],
      opportunities: parsed.opportunities ?? [],
      next_steps: parsed.next_steps ?? [],
      related_questions: payload.related_questions ?? [],
      citations: payload.citations ?? [],
      report_type: input.reportType,
    };

    return {
      mode: "live",
      item: {
        report_type: input.reportType,
        title: parsed.title || input.query,
        query: input.query,
        output_format: input.outputFormat,
        content:
          input.outputFormat === "json"
            ? JSON.stringify(contentJson, null, 2)
            : input.outputFormat === "csv"
              ? reportJsonToCsv(contentJson)
              : reportJsonToMarkdown(contentJson),
        content_json: contentJson,
        source_links: payload.citations ?? [],
        saved_to: input.savedTo,
        status: "ready",
      },
    };
  } catch {
    return {
      item: buildPendingPerplexityRecord(input),
      mode: "pending_config",
    };
  }
}

export async function testLiveProvider(providerName: AIProviderName) {
  if (providerName === "OpenAI") {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return { configured: false, status: "missing_key", message: "OPENAI_API_KEY is missing." };
    }

    try {
      const client = new OpenAI({ apiKey });
      const response = await client.responses.create({
        model: "gpt-4o-mini",
        input: "Reply with the single word OK.",
        max_output_tokens: 20,
      });
      return {
        configured: true,
        status: "ready",
        message: response.output_text?.trim() || "OK",
      };
    } catch (error) {
      return {
        configured: true,
        status: "pending",
        message: error instanceof Error ? error.message : "OpenAI test failed.",
      };
    }
  }

  if (providerName === "Perplexity") {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      return { configured: false, status: "missing_key", message: "PERPLEXITY_API_KEY is missing." };
    }

    try {
      const response = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "sonar",
          messages: [{ role: "user", content: "Reply with OK." }],
          max_tokens: 20,
          disable_search: true,
        }),
      });
      const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
      return {
        configured: response.ok,
        status: response.ok ? "ready" : "pending",
        message: payload.choices?.[0]?.message?.content?.trim() || `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        configured: true,
        status: "pending",
        message: error instanceof Error ? error.message : "Perplexity test failed.",
      };
    }
  }

  if (providerName === "Gemini") {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return { configured: false, status: "missing_key", message: "GOOGLE_API_KEY is missing." };
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: "Reply with OK." }] }],
          }),
        },
      );
      const payload = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const message = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
      return {
        configured: response.ok,
        status: response.ok ? "ready" : "pending",
        message: message || `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        configured: true,
        status: "pending",
        message: error instanceof Error ? error.message : "Gemini test failed.",
      };
    }
  }

  if (providerName === "Grok") {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return { configured: false, status: "missing_key", message: "XAI_API_KEY is missing." };
    }

    try {
      const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "grok-3-mini",
          messages: [{ role: "user", content: "Reply with OK." }],
          temperature: 0,
        }),
      });
      const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
      return {
        configured: response.ok,
        status: response.ok ? "ready" : "pending",
        message: payload.choices?.[0]?.message?.content?.trim() || `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        configured: true,
        status: "pending",
        message: error instanceof Error ? error.message : "Grok test failed.",
      };
    }
  }

  const envKey =
    providerName === "Claude"
      ? "ANTHROPIC_API_KEY"
      : providerName === "Gemini"
        ? "GOOGLE_API_KEY"
        : providerName === "Grok"
          ? "XAI_API_KEY"
          : "";

  const configured = Boolean(envKey && process.env[envKey]);
  return {
    configured,
    status: configured ? "ready" : "missing_key",
    message: configured
      ? `${providerName} key detected. Live test endpoint is reserved for the next connector step.`
      : `${envKey || providerName} is missing.`,
  };
}

function buildOpenAIAnalysisPrompt(taskType: AITaskType, product: ProductOpportunityRecord) {
  return [
    "You are a Korea Coupang product intelligence analyst.",
    "Return JSON only with this exact structure:",
    JSON.stringify(
      {
        worthResearch: { zh: "", ko: "" },
        recommendedDirection: "Rocket Growth | PB | Own Brand | General Test | Pause | Drop",
        reasonWhy: { zh: "", ko: "" },
        biggestOpportunity: { zh: "", ko: "" },
        biggestRisk: { zh: "", ko: "" },
        reviewPainPoint: { zh: "", ko: "" },
        improvementSuggestion: { zh: "", ko: "" },
        seasonality: { zh: "", ko: "" },
        profitJudgement: { zh: "", ko: "" },
        nextAction: { zh: "", ko: "" },
        finalConclusion: "push_now | small_test | observe | pause | drop",
        dataGaps: [],
        rgFit: { score: 0, verdict: { zh: "", ko: "" } },
        pbFit: { score: 0, verdict: { zh: "", ko: "" } },
        ownBrandFit: { score: 0, verdict: { zh: "", ko: "" } },
        generatedTasks: [{ title: { zh: "", ko: "" }, content: { zh: "", ko: "" }, owner: "", deadlineDays: 3, status: "pending" }],
      },
      null,
      2,
    ),
    "Rules:",
    "- No empty generic wording.",
    "- Base the judgment on only the supplied fields.",
    "- If data is missing, say exactly which fields are missing in dataGaps.",
    `- Current task type: ${taskType}.`,
    "- All Chinese and Korean strings must be natural and business-usable.",
    `Input product JSON: ${JSON.stringify(product)}`,
  ].join("\n");
}

function buildPerplexityPrompt(input: {
  query: string;
  reportType: PerplexityReportType;
  outputFormat: PerplexityOutputFormat;
  savedTo: PerplexitySavedTo;
}) {
  return [
    `Research topic: ${input.query}`,
    `Report type: ${input.reportType}`,
    `Save target: ${input.savedTo}`,
    "Return JSON only with keys: title, summary, findings, opportunities, next_steps.",
    "The report must be concrete and useful for Coupang product opportunity analysis.",
    "Do not add any prose outside the JSON object.",
  ].join("\n");
}

function parseJsonFromText(text: string) {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i)?.[1];
  const source = fenced ?? text;
  const start = source.indexOf("{");
  const end = source.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("json_not_found");
  }
  return JSON.parse(source.slice(start, end + 1));
}

function normalizeAnalysisResult(
  parsed: Partial<AIAnalysisResult>,
  product: ProductOpportunityRecord,
  taskType: AITaskType,
): AIAnalysisResult {
  const fallback = buildAnalysisFromOpportunity(product, taskType);
  return {
    ...fallback,
    ...parsed,
    worthResearch: parsed.worthResearch ?? fallback.worthResearch,
    reasonWhy: parsed.reasonWhy ?? fallback.reasonWhy,
    biggestOpportunity: parsed.biggestOpportunity ?? fallback.biggestOpportunity,
    biggestRisk: parsed.biggestRisk ?? fallback.biggestRisk,
    reviewPainPoint: parsed.reviewPainPoint ?? fallback.reviewPainPoint,
    improvementSuggestion: parsed.improvementSuggestion ?? fallback.improvementSuggestion,
    seasonality: parsed.seasonality ?? fallback.seasonality,
    profitJudgement: parsed.profitJudgement ?? fallback.profitJudgement,
    nextAction: parsed.nextAction ?? fallback.nextAction,
    rgFit: parsed.rgFit ?? fallback.rgFit,
    pbFit: parsed.pbFit ?? fallback.pbFit,
    ownBrandFit: parsed.ownBrandFit ?? fallback.ownBrandFit,
    dataGaps: Array.isArray(parsed.dataGaps) ? parsed.dataGaps : fallback.dataGaps,
    generatedTasks: Array.isArray(parsed.generatedTasks) && parsed.generatedTasks.length ? parsed.generatedTasks : fallback.generatedTasks,
  };
}

function buildPendingPerplexityRecord(input: {
  query: string;
  reportType: PerplexityReportType;
  outputFormat: PerplexityOutputFormat;
  savedTo: PerplexitySavedTo;
}) {
  const contentJson = {
    title: input.query,
    summary: "Perplexity API is not configured or live search failed. The workflow remains available and can be retried after configuration.",
    findings: [],
    opportunities: [],
    next_steps: ["Configure PERPLEXITY_API_KEY.", "Retry the report from the Perplexity Intelligence Center."],
    report_type: input.reportType,
  };

  return {
    report_type: input.reportType,
    title: input.query,
    query: input.query,
    output_format: input.outputFormat,
    content:
      input.outputFormat === "json"
        ? JSON.stringify(contentJson, null, 2)
        : input.outputFormat === "csv"
          ? reportJsonToCsv(contentJson)
          : reportJsonToMarkdown(contentJson),
    content_json: contentJson,
    source_links: [],
    saved_to: input.savedTo,
    status: "pending_config" as const,
  };
}

function reportJsonToMarkdown(content: Record<string, unknown>) {
  return [
    `# ${String(content.title ?? "")}`,
    "",
    String(content.summary ?? ""),
    "",
    "## Findings",
    ...((content.findings as string[] | undefined) ?? []).map((item) => `- ${item}`),
    "",
    "## Opportunities",
    ...((content.opportunities as string[] | undefined) ?? []).map((item) => `- ${item}`),
    "",
    "## Next Steps",
    ...((content.next_steps as string[] | undefined) ?? []).map((item) => `- ${item}`),
  ].join("\n");
}

function reportJsonToCsv(content: Record<string, unknown>) {
  const rows = [
    ["field", "value"],
    ["title", String(content.title ?? "")],
    ["summary", String(content.summary ?? "")],
    ["findings", JSON.stringify(content.findings ?? [])],
    ["opportunities", JSON.stringify(content.opportunities ?? [])],
    ["next_steps", JSON.stringify(content.next_steps ?? [])],
  ];
  return rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
}

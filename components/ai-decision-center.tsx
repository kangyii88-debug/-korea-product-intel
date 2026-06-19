"use client";

import { BrainCircuit, CheckCircle2, Clock3, Layers3, RefreshCcw, Sparkles, Wand2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { useLocale } from "@/components/locale-provider";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { loadLocalProductOpportunities } from "@/lib/product-opportunities-local";
import {
  appendLocalAIAnalysisRecord,
  appendLocalAIGeneratedTasks,
  loadLocalAIAnalysisRecords,
  loadLocalAIProviders,
  loadLocalAIGeneratedTasks,
  saveLocalAIProviders,
} from "@/lib/ai-workspace-local";
import {
  buildAIDashboardSummary,
  pickLocalizedText,
  type AIAnalysisRecord,
  type AIProviderRecord,
  type AITaskTemplateRecord,
  type Locale,
  type AIGeneratedTaskRecord,
} from "@/lib/ai-workspace";
import type { ProductOpportunityRecord } from "@/lib/product-opportunities";
import type { AITaskType } from "@/lib/ai-workspace";

const copy = {
  zh: {
    eyebrow: "AI ENGINE CENTER",
    title: "AI 决策中心",
    description: "集中管理商品分析、竞品判断、评论洞察、利润风险和执行建议。",
    batchRun: "批量生成分析",
    providers: "AI 提供商配置中心",
    providersDescription: "管理 OpenAI、Claude、Gemini、Perplexity、Grok 的启用状态、默认模型和任务用途。API Key 仅检测服务端环境变量状态，前端不会显示明文密钥。",
    templates: "AI 任务模板",
    templatesDescription: "定义每种 AI 任务的适用页面、默认模型、输入字段和输出结构。",
    records: "最近 AI 分析记录",
    recordsDescription: "查看结构化分析结果、失败信息和重新生成入口。",
    queue: "待处理 AI 分析队列",
    queueDescription: "从商品机会池里找出还没有完成综合分析的商品，支持单条或批量生成。",
    compare: "多模型使用策略",
    compareDescription: "当前第一版先用规则分析引擎生成稳定结论，后续可将真实 OpenAI / Claude / Perplexity 调用接到同一服务端接口。",
    stats: {
      providers: "已启用 AI 提供商",
      today: "今日 AI 分析次数",
      pending: "待分析商品数量",
      failed: "失败任务数量",
      last: "最近一次成功分析时间",
      model: "默认分析模型",
    },
    statsNotes: {
      providers: "当前可参与分析工作的 AI 提供商数量。",
      today: "今日已生成并写入的分析记录数量。",
      pending: "还没有完成综合分析的商品机会数量。",
      failed: "最近分析过程中失败或未完成的任务数量。",
      last: "最近一次成功分析的时间戳。",
      model: "当前默认用于结构化商品判断的模型。",
    },
    save: "保存配置",
    test: "测试连接",
    enabled: "启用",
    disabled: "停用",
    configured: "已配置",
    notConfigured: "未配置",
    testReady: "服务端已检测到 Key，真实连通性测试将在接入外网调用后执行。",
    testMissing: "当前没有检测到可用 Key，请先补充环境变量。",
    saveSuccess: "AI 提供商配置已更新。",
    saveFallback: "当前处于本地工作模式，配置已保存到本地浏览器。",
    loadError: "AI 模块加载失败，请稍后重试。",
    run: "生成分析",
    rerun: "重新生成",
    result: "查看结果",
    noResults: "当前还没有 AI 分析记录",
    noResultsDescription: "从商品机会池触发第一条 AI 综合分析后，这里会显示结构化记录和生成的下一步任务。",
    noQueue: "当前没有待分析商品",
    noQueueDescription: "所有商品都已经完成综合分析，或者当前还没有真实商品机会。",
    providerStatus: {
      ready: "已就绪",
      missing_key: "缺少 Key",
      disabled: "已停用",
      pending: "待确认",
    },
    taskEnabled: "启用中",
    taskDisabled: "已停用",
    source: "来源页面",
    inputFields: "输入字段",
    outputFields: "输出结构",
    generatedTasks: "生成任务",
    generatedTasksDescription: "AI 分析完成后自动生成的下一步动作。",
    owner: "负责人",
    deadline: "截止时间",
    emptyTasks: "当前还没有 AI 生成任务",
    fields: {
      model: "默认模型",
      usage: "用途",
      notes: "备注",
    },
    usageOptions: {
      general_analysis: "通用分析",
      deep_reasoning: "深度推理",
      web_search: "网页搜索",
      market_research: "市场调研",
      review_analysis: "评论分析",
      multi_model_compare: "多模型对比",
      backup_model: "备用模型",
    },
    queueAction: "立即分析",
    finalConclusion: "最终结论",
    nextAction: "下一步动作",
    dataGaps: "待补字段",
    modelStrategy: [
      "OpenAI 负责结构化商品判断、价格利润判断和任务生成。",
      "Claude 负责长文本评论 / 差评总结与报告整理。",
      "Gemini 预留给后续商品图和详情页视觉理解。",
      "Perplexity 预留给外部市场搜索、趋势和竞品资料补充。",
      "Grok 作为备用模型和多模型观点对比入口。",
    ],
  },
  ko: {
    eyebrow: "AI ENGINE CENTER",
    title: "AI 의사결정 센터",
    description: "상품 분석, 경쟁 판단, 리뷰 인사이트, 수익/리스크, 실행 제안을 한곳에서 관리합니다.",
    batchRun: "일괄 분석 생성",
    providers: "AI 제공업체 설정 센터",
    providersDescription: "OpenAI, Claude, Gemini, Perplexity, Grok 의 활성 상태, 기본 모델, 작업 용도를 관리합니다. API Key 는 서버 환경 변수 상태만 확인하며 프런트에는 원문을 노출하지 않습니다.",
    templates: "AI 작업 템플릿",
    templatesDescription: "각 AI 작업의 적용 페이지, 기본 모델, 입력 필드, 출력 구조를 정의합니다.",
    records: "최근 AI 분석 기록",
    recordsDescription: "구조화된 분석 결과, 실패 정보, 재생성 진입점을 확인합니다.",
    queue: "대기 중인 AI 분석 큐",
    queueDescription: "상품 기회 풀에서 아직 종합 분석을 마치지 않은 상품을 찾아 단건 또는 일괄 생성할 수 있습니다.",
    compare: "멀티 모델 사용 전략",
    compareDescription: "현재 1차 버전은 규칙 기반 분석 엔진으로 안정적인 결론을 만들고, 이후 동일한 서버 API 에 실제 OpenAI / Claude / Perplexity 호출을 연결할 수 있습니다.",
    stats: {
      providers: "활성 AI 제공업체",
      today: "오늘 AI 분석 횟수",
      pending: "대기 상품 수",
      failed: "실패 작업 수",
      last: "최근 성공 분석 시간",
      model: "기본 분석 모델",
    },
    statsNotes: {
      providers: "현재 분석 작업에 참여할 수 있는 AI 제공업체 수입니다.",
      today: "오늘 생성되어 저장된 분석 기록 수입니다.",
      pending: "아직 종합 분석을 완료하지 않은 상품 기회 수입니다.",
      failed: "최근 분석 과정에서 실패하거나 완료되지 않은 작업 수입니다.",
      last: "최근 성공 분석의 생성 시각입니다.",
      model: "현재 구조화 상품 판단에 사용하는 기본 모델입니다.",
      },
    save: "설정 저장",
    test: "연결 확인",
    enabled: "활성",
    disabled: "비활성",
    configured: "구성됨",
    notConfigured: "미구성",
    testReady: "서버에서 Key 를 감지했습니다. 실제 외부 호출 검증은 다음 통합 단계에서 실행됩니다.",
    testMissing: "사용 가능한 Key 가 아직 감지되지 않았습니다. 환경 변수를 먼저 설정해 주세요.",
    saveSuccess: "AI 제공업체 설정이 업데이트되었습니다.",
    saveFallback: "현재 로컬 작업 모드이므로 설정이 브라우저 로컬에 저장되었습니다.",
    loadError: "AI 모듈을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
    run: "분석 생성",
    rerun: "다시 생성",
    result: "결과 보기",
    noResults: "아직 AI 분석 기록이 없습니다",
    noResultsDescription: "상품 기회 풀에서 첫 번째 AI 종합 분석을 실행하면 구조화 기록과 다음 액션이 여기에 표시됩니다.",
    noQueue: "현재 대기 중인 상품이 없습니다",
    noQueueDescription: "모든 상품이 이미 종합 분석을 마쳤거나 아직 실제 상품 기회가 없습니다.",
    providerStatus: {
      ready: "준비 완료",
      missing_key: "키 필요",
      disabled: "비활성",
      pending: "확인 대기",
    },
    taskEnabled: "활성 중",
    taskDisabled: "비활성",
    source: "적용 페이지",
    inputFields: "입력 필드",
    outputFields: "출력 구조",
    generatedTasks: "생성된 작업",
    generatedTasksDescription: "AI 분석 완료 후 자동 생성된 다음 액션입니다.",
    owner: "담당자",
    deadline: "마감일",
    emptyTasks: "현재 AI 생성 작업이 없습니다",
    fields: {
      model: "기본 모델",
      usage: "용도",
      notes: "메모",
    },
    usageOptions: {
      general_analysis: "일반 분석",
      deep_reasoning: "심층 추론",
      web_search: "웹 검색",
      market_research: "시장 조사",
      review_analysis: "리뷰 분석",
      multi_model_compare: "멀티 모델 비교",
      backup_model: "백업 모델",
    },
    queueAction: "지금 분석",
    finalConclusion: "최종 결론",
    nextAction: "다음 액션",
    dataGaps: "보강 필요 필드",
    modelStrategy: [
      "OpenAI 는 구조화 상품 판단, 가격/수익 판단, 작업 생성을 담당합니다.",
      "Claude 는 장문 리뷰 / 부정 리뷰 요약과 보고서 정리를 담당합니다.",
      "Gemini 는 추후 상품 이미지와 상세페이지 시각 이해용으로 예약합니다.",
      "Perplexity 는 외부 시장 검색, 트렌드, 경쟁 자료 보강용으로 사용합니다.",
      "Grok 은 백업 모델과 멀티 모델 의견 비교용으로 둡니다.",
    ],
  },
} as const;

type ProviderFormState = Record<
  string,
  {
    enabled: boolean;
    default_model: string;
    usage_type: string[];
    notes: string;
  }
>;

export function AIDecisionCenter() {
  const { locale } = useLocale();
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<string | null>(null);
  const [providers, setProviders] = useState<AIProviderRecord[]>([]);
  const [templates, setTemplates] = useState<AITaskTemplateRecord[]>([]);
  const [analyses, setAnalyses] = useState<AIAnalysisRecord[]>([]);
  const [tasks, setTasks] = useState<AIGeneratedTaskRecord[]>([]);
  const [opportunities, setOpportunities] = useState<ProductOpportunityRecord[]>([]);
  const [providerForms, setProviderForms] = useState<ProviderFormState>({});
  const [selectedAnalysis, setSelectedAnalysis] = useState<AIAnalysisRecord | null>(null);
  const [runningIds, setRunningIds] = useState<string[]>([]);

  const t = copy[locale];

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const [providersRes, templatesRes, analysesRes, tasksRes, opportunitiesRes] = await Promise.all([
          fetch("/api/ai/providers", { cache: "no-store" }).then((response) => response.json()),
          fetch("/api/ai/templates", { cache: "no-store" }).then((response) => response.json()),
          fetch("/api/ai/analysis", { cache: "no-store" }).then((response) => response.json()),
          fetch("/api/ai/tasks", { cache: "no-store" }).then((response) => response.json()),
          fetch("/api/product-opportunities", { cache: "no-store" }).then((response) => response.json()),
        ]);

        if (!active) return;

        const providerItems = ((providersRes.items as AIProviderRecord[] | undefined) ?? []).length
          ? (providersRes.items as AIProviderRecord[])
          : loadLocalAIProviders();
        const analysisItems = ((analysesRes.items as AIAnalysisRecord[] | undefined) ?? []).length
          ? (analysesRes.items as AIAnalysisRecord[])
          : loadLocalAIAnalysisRecords();
        const taskItems = ((tasksRes.items as AIGeneratedTaskRecord[] | undefined) ?? []).length
          ? (tasksRes.items as AIGeneratedTaskRecord[])
          : loadLocalAIGeneratedTasks();
        const opportunityItems = ((opportunitiesRes.items as ProductOpportunityRecord[] | undefined) ?? []).length
          ? (opportunitiesRes.items as ProductOpportunityRecord[])
          : loadLocalProductOpportunities();

        setProviders(providerItems);
        setTemplates((templatesRes.items as AITaskTemplateRecord[] | undefined) ?? []);
        setAnalyses(analysisItems);
        setTasks(taskItems);
        setOpportunities(opportunityItems);
        setProviderForms(
          Object.fromEntries(
            providerItems.map((provider) => [
              provider.provider_name,
              {
                enabled: provider.enabled,
                default_model: provider.default_model,
                usage_type: provider.usage_type,
                notes: provider.notes ?? "",
              },
            ]),
          ),
        );
        setSelectedAnalysis((current) =>
          current ? analysisItems.find((item) => item.id === current.id) ?? analysisItems[0] ?? null : analysisItems[0] ?? null,
        );
      } catch {
        if (active) {
          setProviders(loadLocalAIProviders());
          setAnalyses(loadLocalAIAnalysisRecords());
          setTasks(loadLocalAIGeneratedTasks());
          setOpportunities(loadLocalProductOpportunities());
          setBanner(t.loadError);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [t.loadError]);

  const summary = useMemo(
    () => buildAIDashboardSummary(providers, analyses, opportunities),
    [analyses, opportunities, providers],
  );

  const pendingQueue = useMemo(
    () =>
      opportunities.filter(
        (item) => !analyses.some((analysis) => analysis.source_id === item.id && analysis.task_type === "product_analysis"),
      ),
    [analyses, opportunities],
  );

  async function saveProvider(providerName: string) {
    const form = providerForms[providerName];
    if (!form) return;

    const response = await fetch("/api/ai/providers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider_name: providerName,
        enabled: form.enabled,
        default_model: form.default_model,
        usage_type: form.usage_type,
        notes: form.notes,
      }),
    });
    const payload = (await response.json()) as { item?: AIProviderRecord; error?: string };

    if (response.ok && payload.item) {
      const next = providers.map((item) => (item.provider_name === providerName ? payload.item! : item));
      setProviders(next);
      saveLocalAIProviders(next);
      setBanner(t.saveSuccess);
      return;
    }

    const current = providers.find((item) => item.provider_name === providerName);
    if (!current) return;

    const localItem: AIProviderRecord = {
      ...current,
      enabled: form.enabled,
      default_model: form.default_model,
      usage_type: form.usage_type as AIProviderRecord["usage_type"],
      notes: form.notes,
      status: form.enabled ? (current.api_key_configured ? "ready" : "missing_key") : "disabled",
      updated_at: new Date().toISOString(),
    };

    const next = providers.map((item) => (item.provider_name === providerName ? localItem : item));
    setProviders(next);
    saveLocalAIProviders(next);
    setBanner(t.saveFallback);
  }

  async function testProvider(providerName: string) {
    const response = await fetch("/api/ai/providers/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider_name: providerName }),
    });
    const payload = (await response.json()) as { configured?: boolean };
    setBanner(payload.configured ? t.testReady : t.testMissing);
  }

  async function runAnalysis(item: ProductOpportunityRecord, taskType: AITaskType = "product_analysis") {
    setRunningIds((current) => [...current, item.id]);
    try {
      const response = await fetch("/api/ai/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_type: "product_opportunity",
          source_id: item.id,
          source_title: item.title,
          task_type: taskType,
          source_snapshot: item,
        }),
      });
      const payload = (await response.json()) as {
        item?: AIAnalysisRecord;
        tasks?: AIGeneratedTaskRecord[];
      };

      if (payload.item) {
        const nextAnalyses = [payload.item, ...analyses.filter((entry) => entry.id !== payload.item!.id)];
        const nextTasks = [...(payload.tasks ?? []), ...tasks.filter((entry) => !(payload.tasks ?? []).some((task) => task.id === entry.id))];
        setAnalyses(nextAnalyses);
        setTasks(nextTasks);
        setSelectedAnalysis(payload.item);
        appendLocalAIAnalysisRecord(payload.item);
        appendLocalAIGeneratedTasks(payload.tasks ?? []);
      }
    } finally {
      setRunningIds((current) => current.filter((id) => id !== item.id));
    }
  }

  async function runBatch() {
    const targets = pendingQueue.slice(0, 5);
    for (const item of targets) {
      await runAnalysis(item);
    }
  }

  if (loading) {
    return (
      <>
        <PageHeader eyebrow={t.eyebrow} title={t.title} description={t.description} />
        <div className="px-5 py-8 sm:px-8 lg:px-10 2xl:px-12">
          <SectionCard title="Loading" description="Preparing AI workspace...">
            <div className="h-12" />
          </SectionCard>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={t.eyebrow}
        title={t.title}
        description={t.description}
        action={
          <Button onClick={() => void runBatch()} disabled={!pendingQueue.length}>
            <Wand2 className="h-4 w-4" />
            {t.batchRun}
          </Button>
        }
      />
      <div className="flex w-full flex-col gap-6 px-5 py-8 sm:px-8 lg:px-10 2xl:px-12">
        {banner ? <Banner message={banner} /> : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <StatCard label={t.stats.providers} value={summary.enabledProviders} note={t.statsNotes.providers} icon={<Sparkles className="h-4 w-4" />} />
          <StatCard label={t.stats.today} value={summary.todayAnalysisCount} note={t.statsNotes.today} icon={<BrainCircuit className="h-4 w-4" />} />
          <StatCard label={t.stats.pending} value={summary.pendingOpportunityCount} note={t.statsNotes.pending} icon={<Clock3 className="h-4 w-4" />} tone="warning" />
          <StatCard label={t.stats.failed} value={summary.failureCount} note={t.statsNotes.failed} icon={<RefreshCcw className="h-4 w-4" />} tone={summary.failureCount ? "danger" : "default"} />
          <StatCard label={t.stats.last} value={summary.lastSuccessTime ? formatDateTime(summary.lastSuccessTime) : "-"} note={t.statsNotes.last} icon={<CheckCircle2 className="h-4 w-4" />} />
          <StatCard label={t.stats.model} value={summary.defaultAnalysisModel} note={t.statsNotes.model} icon={<Layers3 className="h-4 w-4" />} />
        </section>

        <SectionCard title={t.providers} description={t.providersDescription}>
          <div id="providers" className="grid gap-4 xl:grid-cols-2">
            {providers.map((provider) => {
              const form = providerForms[provider.provider_name];
              return (
                <div key={provider.provider_name} className="rounded-[20px] border border-slate-200 bg-slate-50/55 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-950">{provider.provider_name}</h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <StatusBadge tone={provider.status === "ready" ? "success" : provider.status === "disabled" ? "neutral" : "warning"}>
                          {t.providerStatus[provider.status]}
                        </StatusBadge>
                        <StatusBadge tone={provider.api_key_configured ? "success" : "warning"}>
                          {provider.api_key_configured ? t.configured : t.notConfigured}
                        </StatusBadge>
                      </div>
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={form?.enabled ?? provider.enabled}
                        onChange={(event) =>
                          setProviderForms((current) => ({
                            ...current,
                            [provider.provider_name]: {
                              ...(current[provider.provider_name] ?? {
                                enabled: provider.enabled,
                                default_model: provider.default_model,
                                usage_type: provider.usage_type,
                                notes: provider.notes ?? "",
                              }),
                              enabled: event.target.checked,
                            },
                          }))
                        }
                      />
                      {form?.enabled ?? provider.enabled ? t.enabled : t.disabled}
                    </label>
                  </div>
                  <div className="mt-4 grid gap-3">
                    <Field
                      label={t.fields.model}
                      value={form?.default_model ?? provider.default_model}
                      onChange={(value) =>
                        setProviderForms((current) => ({
                          ...current,
                          [provider.provider_name]: {
                            ...(current[provider.provider_name] ?? {
                              enabled: provider.enabled,
                              default_model: provider.default_model,
                              usage_type: provider.usage_type,
                              notes: provider.notes ?? "",
                            }),
                            default_model: value,
                          },
                        }))
                      }
                    />
                    <Field
                      label={t.fields.usage}
                      value={(form?.usage_type ?? provider.usage_type).map((item) => t.usageOptions[item as keyof typeof t.usageOptions] ?? item).join(", ")}
                      onChange={(value) =>
                        setProviderForms((current) => ({
                          ...current,
                          [provider.provider_name]: {
                            ...(current[provider.provider_name] ?? {
                              enabled: provider.enabled,
                              default_model: provider.default_model,
                              usage_type: provider.usage_type,
                              notes: provider.notes ?? "",
                            }),
                            usage_type: value
                              .split(",")
                              .map((item) => item.trim())
                              .filter(Boolean),
                          },
                        }))
                      }
                    />
                    <Field
                      label={t.fields.notes}
                      value={form?.notes ?? provider.notes ?? ""}
                      onChange={(value) =>
                        setProviderForms((current) => ({
                          ...current,
                          [provider.provider_name]: {
                            ...(current[provider.provider_name] ?? {
                              enabled: provider.enabled,
                              default_model: provider.default_model,
                              usage_type: provider.usage_type,
                              notes: provider.notes ?? "",
                            }),
                            notes: value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => void testProvider(provider.provider_name)}>
                      {t.test}
                    </Button>
                    <Button onClick={() => void saveProvider(provider.provider_name)}>{t.save}</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard title={t.templates} description={t.templatesDescription}>
          <div className="grid gap-4 xl:grid-cols-2">
            {templates.map((template) => (
              <div key={template.id} className="rounded-[20px] border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-950">{template.task_name}</h3>
                    <p className="mt-1 text-sm text-slate-500">{template.default_provider} / {template.default_model}</p>
                  </div>
                  <StatusBadge tone={template.enabled ? "success" : "neutral"}>
                    {template.enabled ? t.taskEnabled : t.taskDisabled}
                  </StatusBadge>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-slate-500">
                  <p><span className="font-medium text-slate-700">{t.source}:</span> {template.applicable_pages.join(", ")}</p>
                  <p><span className="font-medium text-slate-700">{t.inputFields}:</span> {template.input_schema.join(", ")}</p>
                  <p><span className="font-medium text-slate-700">{t.outputFields}:</span> {template.output_schema.join(", ")}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,0.9fr)]">
          <SectionCard title={t.records} description={t.recordsDescription}>
            {!analyses.length ? (
              <EmptyState title={t.noResults} description={t.noResultsDescription} primaryLabel={t.run} primaryHref="/" />
            ) : (
              <div className="space-y-3">
                {analyses.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setSelectedAnalysis(item)}
                    className="w-full rounded-[18px] border border-slate-200 bg-slate-50/55 p-4 text-left transition-colors hover:bg-white"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{item.source_title}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.provider_name} / {item.model_name}</p>
                      </div>
                      <StatusBadge tone={item.status === "completed" ? "success" : item.status === "failed" ? "danger" : "warning"}>
                        {item.status}
                      </StatusBadge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <StatusBadge tone="neutral">{item.task_type}</StatusBadge>
                      <StatusBadge tone="info">{pickLocalizedText(item.output_result.nextAction, locale)}</StatusBadge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title={selectedAnalysis ? selectedAnalysis.source_title : t.result} description={selectedAnalysis ? pickLocalizedText(selectedAnalysis.output_result.reasonWhy, locale) : t.recordsDescription}>
            {selectedAnalysis ? (
              <div className="space-y-4">
                <ResultRow label={t.finalConclusion} value={selectedAnalysis.output_result.finalConclusion} />
                <ResultRow label={t.nextAction} value={pickLocalizedText(selectedAnalysis.output_result.nextAction, locale)} />
                <ResultRow label="Direction" value={selectedAnalysis.output_result.recommendedDirection} />
                <ResultRow label="RG" value={`${selectedAnalysis.output_result.rgFit.score} / ${pickLocalizedText(selectedAnalysis.output_result.rgFit.verdict, locale)}`} />
                <ResultRow label="PB" value={`${selectedAnalysis.output_result.pbFit.score} / ${pickLocalizedText(selectedAnalysis.output_result.pbFit.verdict, locale)}`} />
                <ResultRow label="Own Brand" value={`${selectedAnalysis.output_result.ownBrandFit.score} / ${pickLocalizedText(selectedAnalysis.output_result.ownBrandFit.verdict, locale)}`} />
                <ResultBlock title="Opportunity" content={pickLocalizedText(selectedAnalysis.output_result.biggestOpportunity, locale)} />
                <ResultBlock title="Risk" content={pickLocalizedText(selectedAnalysis.output_result.biggestRisk, locale)} />
                <ResultBlock title="Review" content={pickLocalizedText(selectedAnalysis.output_result.reviewPainPoint, locale)} />
                <ResultBlock title="Improvement" content={pickLocalizedText(selectedAnalysis.output_result.improvementSuggestion, locale)} />
                <ResultBlock title="Profit" content={pickLocalizedText(selectedAnalysis.output_result.profitJudgement, locale)} />
                <ResultBlock title={t.dataGaps} content={selectedAnalysis.output_result.dataGaps.length ? selectedAnalysis.output_result.dataGaps.join(", ") : "-"} />
              </div>
            ) : (
              <EmptyState title={t.noResults} description={t.noResultsDescription} primaryLabel={t.run} primaryHref="/" />
            )}
          </SectionCard>
        </div>

        <SectionCard title={t.queue} description={t.queueDescription}>
          {!pendingQueue.length ? (
            <EmptyState title={t.noQueue} description={t.noQueueDescription} primaryLabel={t.run} primaryHref="/" />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {pendingQueue.slice(0, 8).map((item) => (
                <div key={item.id} className="rounded-[18px] border border-slate-200 bg-slate-50/55 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-slate-950">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{item.category} / {item.business_type}</p>
                    </div>
                    <StatusBadge tone="warning">{item.status}</StatusBadge>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-slate-500">
                    <p>Score: {item.score ?? 0}</p>
                    <p>Margin: {Math.round(Number(item.estimated_margin_rate ?? 0))}%</p>
                    <p>Risk: {item.risk_level ?? "low"}</p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button onClick={() => void runAnalysis(item)} disabled={runningIds.includes(item.id)}>
                      {t.queueAction}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title={t.generatedTasks} description={t.generatedTasksDescription}>
          {!tasks.length ? (
            <p className="text-sm text-slate-500">{t.emptyTasks}</p>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {tasks.slice(0, 8).map((task) => (
                <div key={task.id} className="rounded-[18px] border border-slate-200 bg-white p-5">
                  <p className="text-base font-semibold text-slate-950">{pickLocalizedText(task.task_title, locale)}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{pickLocalizedText(task.task_content, locale)}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <StatusBadge tone="neutral">{t.owner}: {task.owner}</StatusBadge>
                    <StatusBadge tone="info">{t.deadline}: {task.deadline ? formatDateTime(task.deadline) : "-"}</StatusBadge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title={t.compare} description={t.compareDescription}>
          <div className="grid gap-3 xl:grid-cols-2">
            {t.modelStrategy.map((line) => (
              <div key={line} className="rounded-[18px] border border-slate-200 bg-slate-50/55 p-4 text-sm leading-6 text-slate-600">
                {line}
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </>
  );
}

function Banner({ message }: { message: string }) {
  return <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>;
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="text-slate-500">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400"
      />
    </label>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/55 px-4 py-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}

function ResultBlock({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{content}</p>
    </div>
  );
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}-${`${date.getDate()}`.padStart(2, "0")} ${`${date.getHours()}`.padStart(2, "0")}:${`${date.getMinutes()}`.padStart(2, "0")}`;
}

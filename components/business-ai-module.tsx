"use client";

import { BrainCircuit } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/locale-provider";
import { appendLocalAIAnalysisRecord, loadLocalAIAnalysisRecords } from "@/lib/ai-workspace-local";
import type { AIAnalysisRecord, AITaskType, Locale, LocalizedText } from "@/lib/ai-workspace";
import type { ProductOpportunityRecord } from "@/lib/product-opportunities";
import { loadLocalProductOpportunities } from "@/lib/product-opportunities-local";

type ModuleKind = "reviews" | "pricing" | "risks" | "actions";

const copy = {
  zh: {
    reviews: {
      eyebrow: "REVIEW INTELLIGENCE",
      title: "评论差评分析",
      description: "分析消费者真实痛点，判断差评是否可以转化为产品升级机会。",
      button: "AI 差评分析",
      metrics: ["评论样本", "可分析商品", "已生成分析", "可改进项"],
      notes: [
        "来自商品机会中的评论与差评字段。",
        "当前可用于差评 AI 分析的商品数量。",
        "已经完成差评 AI 分析的记录数量。",
        "从 AI 结果里提炼出的改进机会数量。",
      ],
    },
    pricing: {
      eyebrow: "PROFIT INTELLIGENCE",
      title: "价格与供货利润测算",
      description: "计算目标供货价、成本结构、毛利率和利润安全线。",
      button: "AI 利润判断",
      metrics: ["平均毛利率", "高利润商品", "低利润商品", "已生成利润分析"],
      notes: [
        "来自商品机会当前的估算毛利率。",
        "毛利率 30% 以上的商品数量。",
        "毛利率低于 20% 的商品数量。",
        "已经完成利润 AI 判断的记录数量。",
      ],
    },
    risks: {
      eyebrow: "RISK INTELLIGENCE",
      title: "认证 / 物流风险判断",
      description: "识别 KC、儿童用品、食品、电器、体积、重量和破损风险。",
      button: "AI 风险判断",
      metrics: ["高风险商品", "中风险商品", "低风险商品", "已生成风险分析"],
      notes: [
        "综合认证、物流、退货和法规风险。",
        "当前风险等级为高的商品数量。",
        "当前风险等级为中的商品数量。",
        "已经完成风险 AI 判断的记录数量。",
      ],
    },
    actions: {
      eyebrow: "ACTION CENTER",
      title: "执行动作清单",
      description: "根据分析结果确认转项、观察、供应商开发和淘汰动作。",
      button: "AI 生成动作",
      metrics: ["待执行任务", "已完成分析商品", "可继续推进", "待补资料商品"],
      notes: [
        "来自 AI 自动生成的下一步任务。",
        "当前已经完成综合分析的商品数量。",
        "AI 最终结论为推进或测试的商品数量。",
        "AI 判断中仍然缺少关键字段的商品数量。",
      ],
    },
    emptyTitle: "当前还没有商品数据",
    emptyDescription: "请先添加第一个真实 Coupang 商品机会，系统将从竞品、评论、利润、风险和 RG/PB 适合度开始分析。",
    resultTitle: "AI 分析结果",
    noResult: "当前还没有该模块的 AI 分析结果。",
    final: "最终结论",
    next: "下一步动作",
    gaps: "待补字段",
    run: "立即分析",
    running: "分析中...",
  },
  ko: {
    reviews: {
      eyebrow: "REVIEW INTELLIGENCE",
      title: "리뷰 문제점 분석",
      description: "소비자의 실제 불만을 분석하고 부정 리뷰를 제품 개선 기회로 전환할 수 있는지 판단합니다.",
      button: "AI 리뷰 분석",
      metrics: ["리뷰 샘플", "분석 가능 상품", "생성된 분석", "개선 기회"],
      notes: [
        "상품 기회에 입력된 리뷰 / 부정 리뷰 필드 기준입니다.",
        "현재 리뷰 AI 분석에 사용할 수 있는 상품 수입니다.",
        "이미 완료된 리뷰 AI 분석 기록 수입니다.",
        "AI 결과에서 정리된 개선 포인트 수입니다.",
      ],
    },
    pricing: {
      eyebrow: "PROFIT INTELLIGENCE",
      title: "가격 및 공급 수익성 계산",
      description: "목표 공급가, 비용 구조, 마진율, 수익 안전선을 계산합니다.",
      button: "AI 수익 판단",
      metrics: ["평균 마진율", "고수익 상품", "저수익 상품", "생성된 수익 분석"],
      notes: [
        "상품 기회의 현재 추정 마진율 기준입니다.",
        "마진율 30% 이상 상품 수입니다.",
        "마진율 20% 미만 상품 수입니다.",
        "완료된 수익 AI 판단 기록 수입니다.",
      ],
    },
    risks: {
      eyebrow: "RISK INTELLIGENCE",
      title: "인증 / 물류 리스크 판단",
      description: "KC, 어린이용품, 식품, 전기제품, 부피, 무게, 파손 리스크를 식별합니다.",
      button: "AI 리스크 판단",
      metrics: ["고위험 상품", "중위험 상품", "저위험 상품", "생성된 리스크 분석"],
      notes: [
        "인증, 물류, 반품, 규제 리스크 종합 기준입니다.",
        "현재 리스크 등급이 높은 상품 수입니다.",
        "현재 리스크 등급이 중간인 상품 수입니다.",
        "완료된 리스크 AI 판단 기록 수입니다.",
      ],
    },
    actions: {
      eyebrow: "ACTION CENTER",
      title: "실행 액션 목록",
      description: "분석 결과에 따라 전환, 관찰, 공급사 개발, 제외 액션을 확인합니다.",
      button: "AI 액션 생성",
      metrics: ["대기 작업", "분석 완료 상품", "계속 추진 가능", "자료 보강 필요"],
      notes: [
        "AI 가 자동으로 생성한 다음 액션 수입니다.",
        "현재 종합 분석이 완료된 상품 수입니다.",
        "AI 최종 결론이 추진 또는 테스트인 상품 수입니다.",
        "AI 판단에서 핵심 필드가 아직 부족한 상품 수입니다.",
      ],
    },
    emptyTitle: "아직 등록된 상품 데이터가 없습니다",
    emptyDescription: "첫 번째 실제 Coupang 상품 기회를 추가하면 경쟁 상품, 리뷰, 수익성, 리스크, RG/PB 적합도를 분석할 수 있습니다.",
    resultTitle: "AI 분석 결과",
    noResult: "현재 이 모듈의 AI 분석 결과가 없습니다.",
    final: "최종 결론",
    next: "다음 액션",
    gaps: "보강 필요 필드",
    run: "지금 분석",
    running: "분석 중...",
  },
} as const;

export function BusinessAIModule({ kind, taskType }: { kind: ModuleKind; taskType: AITaskType }) {
  const { locale } = useLocale();
  const t = copy[locale as Locale];
  const page = t[kind];
  const [items, setItems] = useState<ProductOpportunityRecord[]>([]);
  const [analysisMap, setAnalysisMap] = useState<Record<string, AIAnalysisRecord>>({});
  const [selected, setSelected] = useState<AIAnalysisRecord | null>(null);
  const [runningIds, setRunningIds] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [productsRes, analysisRes] = await Promise.all([
          fetch("/api/product-opportunities", { cache: "no-store" }).then((response) => response.json()),
          fetch("/api/ai/analysis", { cache: "no-store" }).then((response) => response.json()),
        ]);

        if (!active) return;
        const products = ((productsRes.items as ProductOpportunityRecord[] | undefined) ?? []).length
          ? (productsRes.items as ProductOpportunityRecord[])
          : loadLocalProductOpportunities();
        const analyses = ((analysisRes.items as AIAnalysisRecord[] | undefined) ?? []).length
          ? (analysisRes.items as AIAnalysisRecord[])
          : loadLocalAIAnalysisRecords();
        const filtered = analyses.filter((item) => item.task_type === taskType);
        setItems(products);
        setAnalysisMap(Object.fromEntries(filtered.map((item) => [item.source_id, item])));
        setSelected(filtered[0] ?? null);
      } catch {
        const products = loadLocalProductOpportunities();
        const analyses = loadLocalAIAnalysisRecords().filter((item) => item.task_type === taskType);
        if (!active) return;
        setItems(products);
        setAnalysisMap(Object.fromEntries(analyses.map((item) => [item.source_id, item])));
        setSelected(analyses[0] ?? null);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [taskType]);

  const stats = useMemo(() => buildModuleStats(kind, items, analysisMap), [analysisMap, items, kind]);

  async function run(item: ProductOpportunityRecord) {
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
      const payload = (await response.json()) as { item?: AIAnalysisRecord };
      if (payload.item) {
        setAnalysisMap((current) => ({ ...current, [item.id]: payload.item! }));
        setSelected(payload.item);
        appendLocalAIAnalysisRecord(payload.item);
      }
    } finally {
      setRunningIds((current) => current.filter((id) => id !== item.id));
    }
  }

  return (
    <>
      <PageHeader eyebrow={page.eyebrow} title={page.title} description={page.description} />
      <div className="flex w-full flex-col gap-6 px-5 py-8 sm:px-8 lg:px-10 2xl:px-12">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label={page.metrics[0]} value={stats[0]} note={page.notes[0]} />
          <StatCard label={page.metrics[1]} value={stats[1]} note={page.notes[1]} />
          <StatCard label={page.metrics[2]} value={stats[2]} note={page.notes[2]} tone="success" />
          <StatCard label={page.metrics[3]} value={stats[3]} note={page.notes[3]} tone="warning" />
        </section>

        {!items.length ? (
          <EmptyState title={t.emptyTitle} description={t.emptyDescription} primaryLabel="新增商品机会" primaryHref="/" />
        ) : (
          <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
            <SectionCard title={page.title} description={page.description}>
              <div className="space-y-4">
                {items.map((item) => {
                  const result = analysisMap[item.id];
                  return (
                    <div key={item.id} className="rounded-[18px] border border-slate-200 bg-slate-50/55 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-base font-semibold text-slate-950">{item.title}</p>
                          <p className="mt-1 text-sm text-slate-500">{item.category} / {item.business_type}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <StatusBadge tone="neutral">Score {item.score ?? 0}</StatusBadge>
                            <StatusBadge tone={item.risk_level === "high" ? "danger" : item.risk_level === "medium" ? "warning" : "success"}>
                              {item.risk_level ?? "low"}
                            </StatusBadge>
                          </div>
                        </div>
                        <Button onClick={() => void run(item)} disabled={runningIds.includes(item.id)}>
                          <BrainCircuit className="h-4 w-4" />
                          {runningIds.includes(item.id) ? t.running : page.button}
                        </Button>
                      </div>
                      {result ? (
                        <button
                          type="button"
                          onClick={() => setSelected(result)}
                          className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left"
                        >
                          <p className="text-sm font-semibold text-slate-950">{pickText(result.output_result.nextAction, locale as Locale)}</p>
                          <p className="mt-1 text-sm leading-6 text-slate-500">{pickModuleSummary(kind, result.output_result, locale as Locale)}</p>
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard title={t.resultTitle} description={selected ? selected.source_title : page.description}>
              {selected ? (
                <div className="space-y-4">
                  <ResultRow label={t.final} value={selected.output_result.finalConclusion} />
                  <ResultRow label={t.next} value={pickText(selected.output_result.nextAction, locale as Locale)} />
                  <ResultBlock title="Summary" content={pickModuleSummary(kind, selected.output_result, locale as Locale)} />
                  <ResultBlock title={t.gaps} content={selected.output_result.dataGaps.length ? selected.output_result.dataGaps.join(", ") : "-"} />
                </div>
              ) : (
                <div className="rounded-[18px] border border-slate-200 bg-slate-50/55 p-4 text-sm text-slate-500">{t.noResult}</div>
              )}
            </SectionCard>
          </div>
        )}
      </div>
    </>
  );
}

function buildModuleStats(kind: ModuleKind, items: ProductOpportunityRecord[], analysisMap: Record<string, AIAnalysisRecord>) {
  if (kind === "reviews") {
    const reviewSamples = items.reduce((sum, item) => sum + Number(item.review_count ?? 0), 0);
    const analyzable = items.filter((item) => Boolean(item.review_issue_summary || item.negative_review_keywords)).length;
    const generated = Object.values(analysisMap).length;
    const improvable = Object.values(analysisMap).filter((item) => item.output_result.improvementSuggestion.zh || item.output_result.improvementSuggestion.ko).length;
    return [reviewSamples, analyzable, generated, improvable];
  }
  if (kind === "pricing") {
    const avgMargin = items.length ? `${Math.round(items.reduce((sum, item) => sum + Number(item.estimated_margin_rate ?? 0), 0) / items.length)}%` : "0%";
    const highProfit = items.filter((item) => Number(item.estimated_margin_rate ?? 0) >= 30).length;
    const lowProfit = items.filter((item) => Number(item.estimated_margin_rate ?? 0) < 20).length;
    const generated = Object.values(analysisMap).length;
    return [avgMargin, highProfit, lowProfit, generated];
  }
  if (kind === "risks") {
    const highRisk = items.filter((item) => item.risk_level === "high").length;
    const mediumRisk = items.filter((item) => item.risk_level === "medium").length;
    const lowRisk = items.filter((item) => item.risk_level === "low").length;
    const generated = Object.values(analysisMap).length;
    return [highRisk, mediumRisk, lowRisk, generated];
  }
  const taskCount = Object.values(analysisMap).reduce((sum, item) => sum + item.output_result.generatedTasks.length, 0);
  const analyzed = Object.values(analysisMap).length;
  const pushable = Object.values(analysisMap).filter((item) => ["push_now", "small_test"].includes(item.output_result.finalConclusion)).length;
  const gaps = Object.values(analysisMap).filter((item) => item.output_result.dataGaps.length > 0).length;
  return [taskCount, analyzed, pushable, gaps];
}

function pickModuleSummary(kind: ModuleKind, result: AIAnalysisRecord["output_result"], locale: Locale) {
  if (kind === "reviews") return pickText(result.reviewPainPoint, locale);
  if (kind === "pricing") return pickText(result.profitJudgement, locale);
  if (kind === "risks") return pickText(result.biggestRisk, locale);
  return pickText(result.nextAction, locale);
}

function pickText(value: LocalizedText, locale: Locale) {
  return value[locale];
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

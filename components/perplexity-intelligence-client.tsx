"use client";

import { useState } from "react";
import { BrainCircuit } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { useLocale } from "@/components/locale-provider";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { getDictionary } from "@/lib/i18n";
import type { PerplexityCapability, PerplexityOutputFormat } from "@/agents/perplexity/types";

const capabilityKeys = [
  "market-research",
  "trend-discovery",
  "competitor-analysis",
  "new-product-discovery",
] as const;

const capabilityLabels: Record<
  (typeof capabilityKeys)[number],
  { title: { zh: string; ko: string }; description: { zh: string; ko: string }; table: string }
> = {
  "market-research": {
    title: { zh: "市场研究", ko: "시장 조사" },
    description: { zh: "输出外部市场信息并保存到 `market_reports`。", ko: "외부 시장 정보를 출력하고 `market_reports`에 저장합니다." },
    table: "market_reports",
  },
  "trend-discovery": {
    title: { zh: "趋势发现", ko: "트렌드 발굴" },
    description: { zh: "输出关键词与趋势变化并保存到 `trend_reports`。", ko: "키워드와 트렌드 변화를 출력하고 `trend_reports`에 저장합니다." },
    table: "trend_reports",
  },
  "competitor-analysis": {
    title: { zh: "竞品分析", ko: "경쟁 상품 분석" },
    description: { zh: "输出竞品结构化分析并保存到 `competitor_reports`。", ko: "경쟁 상품 구조화 분석을 출력하고 `competitor_reports`에 저장합니다." },
    table: "competitor_reports",
  },
  "new-product-discovery": {
    title: { zh: "新品机会发现", ko: "신규 상품 기회 발굴" },
    description: { zh: "输出新品机会线索并保存到 `opportunity_reports`。", ko: "신규 상품 기회 단서를 출력하고 `opportunity_reports`에 저장합니다." },
    table: "opportunity_reports",
  },
};

type ApiState = {
  loading: boolean;
  capability: PerplexityCapability;
  format: PerplexityOutputFormat;
  payload: unknown | null;
  error: string | null;
};

export function PerplexityIntelligenceClient() {
  const { locale } = useLocale();
  const t = getDictionary(locale);
  const [state, setState] = useState<ApiState>({
    loading: false,
    capability: "market-research",
    format: "json",
    payload: null,
    error: null,
  });

  async function run(capability: PerplexityCapability, format: PerplexityOutputFormat) {
    setState({ loading: true, capability, format, payload: null, error: null });

    try {
      const response = await fetch(`/api/perplexity/${capability}?format=${format}`);
      const payload = await response.json();

      if (!response.ok) {
        setState({
          loading: false,
          capability,
          format,
          payload: null,
          error: payload?.error || (locale === "ko" ? "요청에 실패했습니다." : "请求失败。"),
        });
        return;
      }

      setState({ loading: false, capability, format, payload, error: null });
    } catch (error) {
      setState({
        loading: false,
        capability,
        format,
        payload: null,
        error: error instanceof Error ? error.message : locale === "ko" ? "알 수 없는 오류" : "未知错误",
      });
    }
  }

  return (
    <>
      <PageHeader
        eyebrow={t.pages.perplexity.eyebrow}
        title={t.pages.perplexity.title}
        description={t.pages.perplexity.description}
      />
      <div className="flex w-full flex-col gap-6 px-5 py-8 sm:px-8 lg:px-10 2xl:px-12">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {capabilityKeys.map((key) => {
            const item = capabilityLabels[key];
            return (
              <SectionCard
                key={key}
                title={item.title[locale]}
                description={item.description[locale]}
              >
                <div className="space-y-4">
                  <StatusBadge tone="neutral">
                    {t.pages.perplexity.storageTable}：{item.table}
                  </StatusBadge>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => run(key, "json")} disabled={state.loading}>
                      JSON
                    </Button>
                    <Button variant="outline" onClick={() => run(key, "markdown")} disabled={state.loading}>
                      Markdown
                    </Button>
                    <Button variant="outline" onClick={() => run(key, "csv")} disabled={state.loading}>
                      CSV
                    </Button>
                  </div>
                </div>
              </SectionCard>
            );
          })}
        </section>

        <SectionCard title={t.pages.perplexity.statusTitle} description={t.pages.perplexity.statusDescription}>
          {state.loading ? <p className="text-sm text-slate-500">{t.pages.perplexity.standby}</p> : null}
          {state.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}
          {!state.loading && !state.error && state.payload ? (
            <pre className="max-h-[560px] overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-700">
              {typeof state.payload === "string" ? state.payload : JSON.stringify(state.payload, null, 2)}
            </pre>
          ) : null}
          {!state.loading && !state.error && !state.payload ? (
            <EmptyState
              icon={<BrainCircuit className="h-6 w-6" />}
              title={t.pages.perplexity.emptyTitle}
              description={t.pages.perplexity.emptyDescription}
              primaryLabel={t.common.addProduct}
              primaryHref="/products/new"
            />
          ) : null}
        </SectionCard>
      </div>
    </>
  );
}

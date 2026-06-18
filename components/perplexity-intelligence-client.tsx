"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { PerplexityCapability, PerplexityOutputFormat } from "@/agents/perplexity/types";

const capabilities: Array<{ id: PerplexityCapability; title: string; description: string; table: string }> = [
  { id: "market-research", title: "Market Research", description: "市场研究、需求总结、价格带和用户关注点。", table: "market_reports" },
  { id: "trend-discovery", title: "Trend Discovery", description: "趋势发现、增长主题、平台热度变化。", table: "trend_reports" },
  { id: "competitor-analysis", title: "Competitor Analysis", description: "竞品品牌动作、卖点差异和评论缺口。", table: "competitor_reports" },
  { id: "new-product-discovery", title: "New Product Discovery", description: "新产品机会发现和可跟进方向。", table: "opportunity_reports" },
];

type ApiState = {
  loading: boolean;
  capability: PerplexityCapability;
  format: PerplexityOutputFormat;
  payload: unknown | null;
  error: string | null;
};

export function PerplexityIntelligenceClient() {
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
        setState({ loading: false, capability, format, payload: null, error: payload?.error || "Request failed" });
        return;
      }

      setState({ loading: false, capability, format, payload, error: null });
    } catch (error) {
      setState({
        loading: false,
        capability,
        format,
        payload: null,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-5 py-6 sm:px-8">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {capabilities.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <h2 className="text-base font-semibold">{item.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">保存表：`{item.table}`</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => run(item.id, "json")} disabled={state.loading}>
                  JSON
                </Button>
                <Button variant="outline" onClick={() => run(item.id, "markdown")} disabled={state.loading}>
                  Markdown
                </Button>
                <Button variant="outline" onClick={() => run(item.id, "csv")} disabled={state.loading}>
                  CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold">Perplexity Module Preview</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            当前为 mock 模式，API、数据库和输出格式已按真实 Perplexity 接入方向预留。
          </p>
        </CardHeader>
        <CardContent>
          {state.loading ? <p className="text-sm text-muted-foreground">Generating mock intelligence...</p> : null}
          {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
          {!state.loading && !state.error && state.payload ? (
            <pre className="max-h-[560px] overflow-auto rounded-md border bg-slate-50 p-4 text-xs leading-6">
              {typeof state.payload === "string" ? state.payload : JSON.stringify(state.payload, null, 2)}
            </pre>
          ) : null}
          {!state.loading && !state.error && !state.payload ? (
            <p className="text-sm text-muted-foreground">选择一个功能和输出格式后，这里会显示模拟结果预览。</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { AnySearchResponse } from "@/lib/anysearch";

type SearchState = {
  data: AnySearchResponse | null;
  error: string | null;
  loading: boolean;
};

const initialState: SearchState = {
  data: null,
  error: null,
  loading: false,
};

export function AnySearchTestClient() {
  const [query, setQuery] = useState("Korean curtain hooks");
  const [state, setState] = useState<SearchState>(initialState);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      setState({
        data: null,
        error: "请输入要搜索的关键词。",
        loading: false,
      });
      return;
    }

    setState((previous) => ({
      ...previous,
      loading: true,
      error: null,
    }));

    try {
      const response = await fetch("/api/anysearch/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: normalizedQuery,
          limit: 10,
        }),
      });

      const payload = (await response.json()) as
        | { ok: true; data: AnySearchResponse }
        | { ok: false; error?: string };

      if (!response.ok || !payload.ok) {
        setState({
          data: null,
          error: payload.ok ? "AnySearch 请求失败。" : payload.error || "AnySearch 请求失败。",
          loading: false,
        });
        return;
      }

      setState({
        data: payload.data,
        error: null,
        loading: false,
      });
    } catch (error) {
      setState({
        data: null,
        error: error instanceof Error ? error.message : "AnySearch 请求失败。",
        loading: false,
      });
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-5 py-6 sm:px-8">
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold">AnySearch 测试输入</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            输入关键词后会调用项目内 API 路由，再由服务端使用 `ANYSEARCH_API_KEY` 访问 AnySearch。
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium">关键词</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="例如：waterproof storage bags"
                className="w-full rounded-md border px-3 py-2 text-sm outline-none ring-0 transition-colors focus:border-foreground"
              />
            </label>
            <Button type="submit" disabled={state.loading}>
              {state.loading ? "搜索中..." : "调用 AnySearch"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {state.error ? (
        <Card className="border-red-200">
          <CardHeader>
            <h2 className="text-base font-semibold text-red-700">请求失败</h2>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-700">{state.error}</p>
          </CardContent>
        </Card>
      ) : null}

      {state.data ? (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">结构化返回结果</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  查询词：{state.data.query}，结果数：{state.data.total}，命中端点：{state.data.endpoint}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {state.data.results.length ? (
                state.data.results.map((result, index) => (
                  <article key={`${result.url}-${index}`} className="rounded-md border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold">{result.title || "Untitled result"}</h3>
                        <p className="text-sm leading-6 text-muted-foreground">
                          {result.summary || "No summary returned by AnySearch."}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        相关度：{result.relevance ?? "N/A"}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>来源：{result.source || "Unknown"}</span>
                      <a href={result.url} target="_blank" rel="noreferrer" className="underline">
                        {result.url || "No URL"}
                      </a>
                    </div>
                  </article>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">AnySearch 已响应，但没有返回可展示的结构化结果。</p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

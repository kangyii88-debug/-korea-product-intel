"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/components/locale-provider";
import { loadLocalAIProviders } from "@/lib/ai-workspace-local";
import type { AIProviderRecord, Locale } from "@/lib/ai-workspace";

const copy = {
  zh: {
    title: "AI 提供商状态",
    description: "管理 OpenAI、Claude、Gemini、Perplexity、Grok 的启用状态、默认模型和分析用途。",
    enabledCount: "已启用",
    defaultAnalysis: "默认分析模型",
    defaultSearch: "默认搜索模型",
    lastStatus: "最近状态",
    configured: "已配置",
    notConfigured: "未配置",
    open: "进入配置中心",
    noModel: "未配置",
    ready: "已就绪",
    missing: "缺少 Key",
  },
  ko: {
    title: "AI 제공업체 상태",
    description: "OpenAI, Claude, Gemini, Perplexity, Grok 의 활성 상태, 기본 모델, 분석 용도를 관리합니다.",
    enabledCount: "활성 공급사",
    defaultAnalysis: "기본 분석 모델",
    defaultSearch: "기본 검색 모델",
    lastStatus: "최근 상태",
    configured: "구성됨",
    notConfigured: "미구성",
    open: "설정 센터 열기",
    noModel: "미설정",
    ready: "준비 완료",
    missing: "키 필요",
  },
} as const;

export function AIProviderCard() {
  const { locale } = useLocale();
  const t = copy[locale as Locale];
  const [providers, setProviders] = useState<AIProviderRecord[]>([]);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch("/api/ai/providers", { cache: "no-store" });
        const payload = (await response.json()) as { items?: AIProviderRecord[] };
        if (active && payload.items) {
          setProviders(payload.items);
          return;
        }
      } catch {
        // Fall back to local state below.
      }

      if (active) {
        setProviders(loadLocalAIProviders());
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  const summary = useMemo(() => {
    const enabled = providers.filter((provider) => provider.enabled);
    const analysisModel =
      enabled.find((provider) => provider.usage_type.includes("general_analysis"))?.default_model ?? t.noModel;
    const searchModel =
      enabled.find((provider) => provider.usage_type.includes("web_search"))?.default_model ?? t.noModel;
    const ready = enabled.some((provider) => provider.status === "ready");

    return {
      enabledCount: enabled.length,
      analysisModel,
      searchModel,
      lastStatus: ready ? t.ready : t.missing,
      configuredCount: providers.filter((provider) => provider.api_key_configured).length,
    };
  }, [providers, t]);

  return (
    <Link href="/decisions#providers" className="block rounded-[18px] border border-slate-200 bg-slate-50/90 p-4 transition-colors hover:bg-white">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <Sparkles className="h-4 w-4 text-slate-500" />
        {t.title}
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-500">{t.description}</p>
      <div className="mt-4 grid gap-2 rounded-2xl border border-slate-200 bg-white p-3">
        <SummaryRow label={t.enabledCount} value={String(summary.enabledCount)} />
        <SummaryRow label={t.defaultAnalysis} value={summary.analysisModel} />
        <SummaryRow label={t.defaultSearch} value={summary.searchModel} />
        <SummaryRow label={t.lastStatus} value={summary.lastStatus} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {["OpenAI", "Claude", "Gemini", "Perplexity", "Grok"].map((item) => {
          const provider = providers.find((entry) => entry.provider_name === item);
          return (
            <Badge key={item} className="bg-white">
              {item} {provider?.api_key_configured ? t.configured : t.notConfigured}
            </Badge>
          );
        })}
      </div>
      <p className="mt-3 text-xs font-medium text-slate-500">{t.open}</p>
    </Link>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}

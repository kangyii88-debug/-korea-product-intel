"use client";

import { BrainCircuit, FileDown, FileJson, Files, SearchCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/locale-provider";
import { appendLocalPerplexityReport, loadLocalPerplexityReports } from "@/lib/ai-workspace-local";
import type {
  AIProviderRecord,
  Locale,
  PerplexityOutputFormat,
  PerplexityReportRecord,
  PerplexityReportType,
  PerplexitySavedTo,
} from "@/lib/ai-workspace";

const reportTypeOptions: Array<{ value: PerplexityReportType; savedTo: PerplexitySavedTo }> = [
  { value: "market_research", savedTo: "market_reports" },
  { value: "trend_discovery", savedTo: "trend_reports" },
  { value: "competitor_analysis", savedTo: "competitor_reports" },
  { value: "opportunity_discovery", savedTo: "opportunity_reports" },
  { value: "review_pain_research", savedTo: "market_reports" },
  { value: "seasonal_opportunity", savedTo: "trend_reports" },
  { value: "pb_proposal", savedTo: "opportunity_reports" },
  { value: "rocket_growth_proposal", savedTo: "opportunity_reports" },
];

const copy = {
  zh: {
    eyebrow: "PERPLEXITY INTELLIGENCE",
    title: "Perplexity 情报中心",
    description: "整合外部市场趋势、关键词信息和竞品资料，辅助商品机会判断。",
    queryLabel: "研究主题",
    queryPlaceholder: "例如：韩国 Coupang 浴室用品爆品趋势",
    reportType: "研究类型",
    outputLanguage: "输出语言",
    savedTo: "保存位置",
    outputFormat: "输出格式",
    generate: "生成情报报告",
    export: "下载报告",
    history: "历史报告列表",
    historyDescription: "保存已生成的 Perplexity 研究记录，并作为后续导入商品机会和生成任务的依据。",
    workspace: "研究工作区",
    workspaceDescription: "先定义研究主题、输出格式和保存位置，再生成报告。",
    emptyTitle: "当前还没有 Perplexity 研究报告",
    emptyDescription: "先输入一个研究主题并生成报告，后续可以从报告中继续提取商品机会和执行任务。",
    providerMissing: "当前还没有配置 Perplexity API，请先在 AI 提供商配置中心完成配置。",
    providerReady: "已检测到 Perplexity 提供商配置。当前版本已完成工作流与存储结构，后续只需要接入真实外部搜索调用。",
    importOpportunity: "提取商品机会",
    generateTask: "生成执行任务",
    reportTypes: {
      market_research: "市场研究",
      trend_discovery: "趋势发现",
      competitor_analysis: "竞品分析",
      opportunity_discovery: "新品机会发现",
      review_pain_research: "差评痛点研究",
      seasonal_opportunity: "季节品机会研究",
      pb_proposal: "PB 提案资料",
      rocket_growth_proposal: "Rocket Growth 提案资料",
    },
    saveLabels: {
      market_reports: "market_reports",
      trend_reports: "trend_reports",
      competitor_reports: "competitor_reports",
      opportunity_reports: "opportunity_reports",
    },
    formats: {
      markdown: "Markdown",
      json: "JSON",
      csv: "CSV",
    },
    languages: {
      zh: "中文",
      ko: "한국어",
    },
    stats: {
      reports: "累计研究报告",
      ready: "可用状态",
      latest: "最近生成",
      saved: "保存目录",
    },
    statsNotes: {
      reports: "当前已生成并保存的研究报告数量。",
      ready: "Perplexity 提供商是否已经完成配置。",
      latest: "最近一次生成报告的时间。",
      saved: "当前选择的默认保存位置。",
    },
  },
  ko: {
    eyebrow: "PERPLEXITY INTELLIGENCE",
    title: "Perplexity 인텔리전스 센터",
    description: "외부 시장 트렌드, 키워드 정보, 경쟁 자료를 통합해 상품 기회 판단을 보조합니다.",
    queryLabel: "연구 주제",
    queryPlaceholder: "예: 한국 Coupang 욕실용품 베스트셀러 트렌드",
    reportType: "연구 유형",
    outputLanguage: "출력 언어",
    savedTo: "저장 위치",
    outputFormat: "출력 형식",
    generate: "인텔리전스 보고서 생성",
    export: "보고서 다운로드",
    history: "보고서 이력",
    historyDescription: "생성된 Perplexity 연구 기록을 저장하고, 이후 상품 기회 추출과 작업 생성의 근거로 사용합니다.",
    workspace: "연구 작업 공간",
    workspaceDescription: "연구 주제, 출력 형식, 저장 위치를 정의한 뒤 보고서를 생성합니다.",
    emptyTitle: "아직 Perplexity 연구 보고서가 없습니다",
    emptyDescription: "먼저 연구 주제를 입력해 보고서를 생성하면 이후 상품 기회 추출과 실행 작업 생성으로 이어갈 수 있습니다.",
    providerMissing: "Perplexity API 가 아직 구성되지 않았습니다. 먼저 AI 제공업체 설정 센터에서 구성을 완료해 주세요.",
    providerReady: "Perplexity 제공업체 구성이 감지되었습니다. 현재 버전은 워크플로우와 저장 구조를 완성했고, 다음 단계에서 실제 외부 검색 호출만 연결하면 됩니다.",
    importOpportunity: "상품 기회 추출",
    generateTask: "실행 작업 생성",
    reportTypes: {
      market_research: "시장 조사",
      trend_discovery: "트렌드 발견",
      competitor_analysis: "경쟁 상품 분석",
      opportunity_discovery: "신규 상품 기회 발견",
      review_pain_research: "부정 리뷰 문제점 연구",
      seasonal_opportunity: "계절 상품 기회 연구",
      pb_proposal: "PB 제안 자료",
      rocket_growth_proposal: "Rocket Growth 제안 자료",
    },
    saveLabels: {
      market_reports: "market_reports",
      trend_reports: "trend_reports",
      competitor_reports: "competitor_reports",
      opportunity_reports: "opportunity_reports",
    },
    formats: {
      markdown: "Markdown",
      json: "JSON",
      csv: "CSV",
    },
    languages: {
      zh: "中文",
      ko: "한국어",
    },
    stats: {
      reports: "누적 보고서",
      ready: "사용 가능 상태",
      latest: "최근 생성",
      saved: "저장 디렉터리",
    },
    statsNotes: {
      reports: "현재 생성되어 저장된 연구 보고서 수입니다.",
      ready: "Perplexity 제공업체 설정이 완료되었는지 여부입니다.",
      latest: "가장 최근 보고서 생성 시각입니다.",
      saved: "현재 선택된 기본 저장 위치입니다.",
    },
  },
} as const;

export function PerplexityIntelligenceClient() {
  const { locale } = useLocale();
  const t = copy[locale as Locale];
  const [providers, setProviders] = useState<AIProviderRecord[]>([]);
  const [reports, setReports] = useState<PerplexityReportRecord[]>([]);
  const [query, setQuery] = useState("");
  const [reportType, setReportType] = useState<PerplexityReportType>("market_research");
  const [outputLanguage, setOutputLanguage] = useState<Locale>(locale === "ko" ? "ko" : "zh");
  const [savedTo, setSavedTo] = useState<PerplexitySavedTo>("market_reports");
  const [outputFormat, setOutputFormat] = useState<PerplexityOutputFormat>("markdown");
  const [selectedReport, setSelectedReport] = useState<PerplexityReportRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    const match = reportTypeOptions.find((item) => item.value === reportType);
    if (match) setSavedTo(match.savedTo);
  }, [reportType]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const [providersRes, reportsRes] = await Promise.all([
          fetch("/api/ai/providers", { cache: "no-store" }).then((response) => response.json()),
          fetch("/api/perplexity/reports", { cache: "no-store" }).then((response) => response.json()),
        ]);

        if (!active) return;
        const providerItems = (providersRes.items as AIProviderRecord[] | undefined) ?? [];
        const reportItems = ((reportsRes.items as PerplexityReportRecord[] | undefined) ?? []).length
          ? (reportsRes.items as PerplexityReportRecord[])
          : loadLocalPerplexityReports();

        setProviders(providerItems);
        setReports(reportItems);
        setSelectedReport(reportItems[0] ?? null);
      } catch {
        if (!active) return;
        setReports(loadLocalPerplexityReports());
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  const providerReady = useMemo(
    () => providers.some((provider) => provider.provider_name === "Perplexity" && provider.enabled && provider.api_key_configured),
    [providers],
  );

  async function generateReport() {
    if (!query.trim()) return;
    setGenerating(true);
    try {
      const response = await fetch("/api/perplexity/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          report_type: reportType,
          output_format: outputFormat,
          saved_to: savedTo,
          response_language: outputLanguage,
        }),
      });
      const payload = (await response.json()) as { item?: PerplexityReportRecord };
      if (payload.item) {
        const next = [payload.item, ...reports.filter((entry) => entry.id !== payload.item!.id)];
        setReports(next);
        setSelectedReport(payload.item);
        appendLocalPerplexityReport(payload.item);
        setBanner(providerReady ? t.providerReady : t.providerMissing);
      }
    } finally {
      setGenerating(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow={t.eyebrow}
        title={t.title}
        description={t.description}
        action={
          <Button variant="outline" onClick={() => selectedReport && downloadReport(selectedReport)}>
            <FileDown className="h-4 w-4" />
            {t.export}
          </Button>
        }
      />
      <div className="flex w-full flex-col gap-6 px-5 py-8 sm:px-8 lg:px-10 2xl:px-12">
        {banner ? <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">{banner}</div> : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label={t.stats.reports} value={reports.length} note={t.statsNotes.reports} icon={<Files className="h-4 w-4" />} />
          <StatCard label={t.stats.ready} value={providerReady ? "Ready" : "Pending"} note={t.statsNotes.ready} icon={<BrainCircuit className="h-4 w-4" />} tone={providerReady ? "success" : "warning"} />
          <StatCard label={t.stats.latest} value={reports[0] ? formatDateTime(reports[0].created_at) : "-"} note={t.statsNotes.latest} icon={<SearchCheck className="h-4 w-4" />} />
          <StatCard label={t.stats.saved} value={savedTo} note={t.statsNotes.saved} icon={<FileJson className="h-4 w-4" />} />
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
          <SectionCard title={t.workspace} description={t.workspaceDescription}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={t.queryLabel} value={query} onChange={setQuery} placeholder={t.queryPlaceholder} className="md:col-span-2" />
              <SelectField
                label={t.reportType}
                value={reportType}
                onChange={(value) => setReportType(value as PerplexityReportType)}
                options={reportTypeOptions.map((item) => ({
                  value: item.value,
                  label: t.reportTypes[item.value],
                }))}
              />
              <SelectField
                label={t.outputLanguage}
                value={outputLanguage}
                onChange={(value) => setOutputLanguage(value as Locale)}
                options={[
                  { value: "zh", label: t.languages.zh },
                  { value: "ko", label: t.languages.ko },
                ]}
              />
              <SelectField
                label={t.savedTo}
                value={savedTo}
                onChange={(value) => setSavedTo(value as PerplexitySavedTo)}
                options={[
                  { value: "market_reports", label: t.saveLabels.market_reports },
                  { value: "trend_reports", label: t.saveLabels.trend_reports },
                  { value: "competitor_reports", label: t.saveLabels.competitor_reports },
                  { value: "opportunity_reports", label: t.saveLabels.opportunity_reports },
                ]}
              />
              <SelectField
                label={t.outputFormat}
                value={outputFormat}
                onChange={(value) => setOutputFormat(value as PerplexityOutputFormat)}
                options={[
                  { value: "markdown", label: t.formats.markdown },
                  { value: "json", label: t.formats.json },
                  { value: "csv", label: t.formats.csv },
                ]}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => void generateReport()} disabled={generating || !query.trim()}>
                {t.generate}
              </Button>
              <Button variant="outline" disabled>
                {t.importOpportunity}
              </Button>
              <Button variant="outline" disabled>
                {t.generateTask}
              </Button>
            </div>
            <div className="mt-4 rounded-[18px] border border-slate-200 bg-slate-50/55 p-4 text-sm leading-6 text-slate-600">
              {providerReady ? t.providerReady : t.providerMissing}
            </div>
          </SectionCard>

          <SectionCard title={selectedReport ? selectedReport.title : t.history} description={t.historyDescription}>
            {selectedReport ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <StatusBadge tone={selectedReport.status === "ready" ? "success" : "warning"}>{selectedReport.status}</StatusBadge>
                  <StatusBadge tone="neutral">{t.reportTypes[selectedReport.report_type]}</StatusBadge>
                  <StatusBadge tone="info">{selectedReport.saved_to}</StatusBadge>
                </div>
                <pre className="max-h-[420px] overflow-auto rounded-[18px] border border-slate-200 bg-white p-4 text-xs leading-6 text-slate-700 whitespace-pre-wrap">
                  {selectedReport.content}
                </pre>
              </div>
            ) : (
              <EmptyState title={t.emptyTitle} description={t.emptyDescription} primaryLabel={t.generate} primaryHref="/perplexity" />
            )}
          </SectionCard>
        </div>

        <SectionCard title={t.history} description={t.historyDescription}>
          {loading ? null : !reports.length ? (
            <EmptyState title={t.emptyTitle} description={t.emptyDescription} primaryLabel={t.generate} primaryHref="/perplexity" />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {reports.map((report) => (
                <button
                  type="button"
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className="rounded-[18px] border border-slate-200 bg-slate-50/55 p-5 text-left transition-colors hover:bg-white"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-slate-950">{report.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{t.reportTypes[report.report_type]}</p>
                    </div>
                    <StatusBadge tone={report.status === "ready" ? "success" : "warning"}>{report.status}</StatusBadge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusBadge tone="neutral">{report.saved_to}</StatusBadge>
                    <StatusBadge tone="info">{report.output_format}</StatusBadge>
                    <StatusBadge tone="neutral">{formatDateTime(report.created_at)}</StatusBadge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={`grid gap-1.5 text-sm ${className ?? ""}`}>
      <span className="text-slate-500">{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}-${`${date.getDate()}`.padStart(2, "0")} ${`${date.getHours()}`.padStart(2, "0")}:${`${date.getMinutes()}`.padStart(2, "0")}`;
}

function downloadReport(report: PerplexityReportRecord) {
  const blob = new Blob([report.content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${report.title.replace(/[\\/:*?"<>|]/g, "-")}.${report.output_format === "markdown" ? "md" : report.output_format}`;
  anchor.click();
  URL.revokeObjectURL(url);
}

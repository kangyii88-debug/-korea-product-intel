"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Download, Filter, Plus, Search } from "lucide-react";
import { DecisionPill } from "@/components/decision-pill";
import { useLocale } from "@/components/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  analyzeProduct,
  getDisplayName,
  loadLocalProducts,
  type LocalProduct,
  type ProductAnalysis,
  type ProductStatus,
  type RecommendationDirection,
  type RiskLevel,
} from "@/lib/local-products";
import { formatNumber } from "@/lib/utils";

type ProductRow = {
  product: LocalProduct;
  analysis: ProductAnalysis;
};

const copy = {
  zh: {
    searchPlaceholder: "搜索商品名、类目、负责人、推荐方向",
    addButton: "新增测试商品",
    exportButton: "导出当前视图",
    emptyTitle: "当前还没有商品数据。",
    emptyDescription: "请先添加第一个 Coupang 商品机会，系统将从市场分析、竞品分析、评论痛点、利润测算和 RG/PB 适合度开始判断。",
    emptyAction: "立即新增商品",
    filters: {
      direction: "推荐方向",
      status: "状态",
      risk: "风险等级",
      score: "评分区间",
      highPotential: "高潜力",
      highRisk: "高风险",
      rejected: "已淘汰",
      transferable: "可转项目",
    },
    columns: {
      product: "商品名称",
      category: "类目",
      direction: "推荐方向",
      totalScore: "总评分",
      rgScore: "RG 评分",
      pbScore: "PB 评分",
      margin: "利润率",
      risk: "风险等级",
      status: "当前状态",
      nextAction: "下一步动作",
      owner: "负责人",
      updatedAt: "更新时间",
    },
    metrics: {
      collected: "本月采集商品数",
      potential: "高潜力商品数",
      rg: "Rocket Growth 候选品数量",
      pb: "PB 候选品数量",
      dual: "RG + PB 双向候选品",
      risk: "高风险商品数",
      rejected: "已淘汰商品数",
      tasks: "待执行任务数量",
    },
  },
  ko: {
    searchPlaceholder: "상품명, 카테고리, 담당자, 추천 방향 검색",
    addButton: "테스트 상품 추가",
    exportButton: "현재 보기 내보내기",
    emptyTitle: "아직 등록된 상품 데이터가 없습니다.",
    emptyDescription: "첫 번째 Coupang 상품 기회를 추가하면 시장 분석, 경쟁 상품 분석, 리뷰 문제점, 수익성 계산, RG/PB 적합도 판단을 시작할 수 있습니다.",
    emptyAction: "지금 상품 추가",
    filters: {
      direction: "추천 방향",
      status: "상태",
      risk: "리스크 등급",
      score: "점수 구간",
      highPotential: "고잠재력",
      highRisk: "고위험",
      rejected: "탈락 포함",
      transferable: "프로젝트 전환 가능",
    },
    columns: {
      product: "상품명",
      category: "카테고리",
      direction: "추천 방향",
      totalScore: "총점",
      rgScore: "RG 점수",
      pbScore: "PB 점수",
      margin: "마진율",
      risk: "리스크",
      status: "현재 상태",
      nextAction: "다음 액션",
      owner: "담당자",
      updatedAt: "업데이트",
    },
    metrics: {
      collected: "이번 달 수집 상품 수",
      potential: "고잠재력 상품 수",
      rg: "Rocket Growth 후보 수",
      pb: "PB 후보 수",
      dual: "RG + PB 이중 후보 수",
      risk: "고위험 상품 수",
      rejected: "탈락 상품 수",
      tasks: "대기 작업 수",
    },
  },
} as const;

export function ProductWorkspace() {
  const { locale } = useLocale();
  const t = copy[locale];
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [query, setQuery] = useState("");
  const [directionFilter, setDirectionFilter] = useState<RecommendationDirection | "全部">("全部");
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "全部">("全部");
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "全部">("全部");
  const [scoreFilter, setScoreFilter] = useState<"全部" | "85+" | "70-84" | "60-69" | "<60">("全部");
  const [onlyHighPotential, setOnlyHighPotential] = useState(false);
  const [onlyHighRisk, setOnlyHighRisk] = useState(false);
  const [includeRejected, setIncludeRejected] = useState(true);
  const [onlyTransferable, setOnlyTransferable] = useState(false);

  useEffect(() => {
    setProducts(loadLocalProducts());
  }, []);

  const analyzed = useMemo<ProductRow[]>(
    () =>
      products.map((product) => ({
        product,
        analysis: analyzeProduct(product),
      })),
    [products],
  );

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return analyzed.filter(({ product, analysis }) => {
      const searchable = [
        product.productNameKo,
        product.productNameZh,
        getDisplayName(product.productNameZh, locale),
        getDisplayName(product.productNameKo, locale),
        product.category,
        product.brand,
        product.owner,
        analysis.direction,
        analysis.nextAction,
      ]
        .join(" ")
        .toLowerCase();

      const scoreMatch =
        scoreFilter === "全部" ||
        (scoreFilter === "85+" && analysis.totalScore >= 85) ||
        (scoreFilter === "70-84" && analysis.totalScore >= 70 && analysis.totalScore <= 84) ||
        (scoreFilter === "60-69" && analysis.totalScore >= 60 && analysis.totalScore <= 69) ||
        (scoreFilter === "<60" && analysis.totalScore < 60);

      const transferable = analysis.transferCheckRg.ready || analysis.transferCheckPb.ready;

      return (
        (!keyword || searchable.includes(keyword)) &&
        (directionFilter === "全部" || analysis.direction === directionFilter) &&
        (statusFilter === "全部" || product.status === statusFilter) &&
        (riskFilter === "全部" || analysis.riskLevel === riskFilter) &&
        scoreMatch &&
        (!onlyHighPotential || analysis.totalScore >= 85) &&
        (!onlyHighRisk || analysis.riskLevel === "高") &&
        (includeRejected || product.status !== "已淘汰") &&
        (!onlyTransferable || transferable)
      );
    });
  }, [
    analyzed,
    directionFilter,
    includeRejected,
    locale,
    onlyHighPotential,
    onlyHighRisk,
    onlyTransferable,
    query,
    riskFilter,
    scoreFilter,
    statusFilter,
  ]);

  const monthKey = new Date().toISOString().slice(0, 7);
  const metrics = [
    [t.metrics.collected, analyzed.filter((item) => item.product.createdAt.slice(0, 7) === monthKey).length],
    [t.metrics.potential, analyzed.filter((item) => item.analysis.totalScore >= 85).length],
    [t.metrics.rg, analyzed.filter((item) => item.analysis.direction === "Rocket Growth").length],
    [t.metrics.pb, analyzed.filter((item) => item.analysis.direction === "PB").length],
    [t.metrics.dual, analyzed.filter((item) => item.analysis.direction === "Rocket Growth + PB").length],
    [t.metrics.risk, analyzed.filter((item) => item.analysis.riskLevel === "高").length],
    [t.metrics.rejected, analyzed.filter((item) => item.product.status === "已淘汰").length],
    [t.metrics.tasks, analyzed.reduce((sum, item) => sum + item.analysis.generatedTasks.length, 0)],
  ];

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 px-5 py-6 sm:px-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value]) => (
          <Metric key={String(label)} label={String(label)} value={formatNumber(Number(value))} />
        ))}
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-lg flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.searchPlaceholder}
              className="h-10 w-full rounded-md border border-stone-200 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4" />
              {t.exportButton}
            </Button>
            <Link href="/products/new">
              <Button>
                <Plus className="h-4 w-4" />
                {t.addButton}
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-4">
          <SelectFilter
            label={t.filters.direction}
            value={directionFilter}
            onChange={(value) => setDirectionFilter(value as RecommendationDirection | "全部")}
            options={["全部", "Rocket Growth", "PB", "Rocket Growth + PB", "继续观察", "放弃"]}
          />
          <SelectFilter
            label={t.filters.status}
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as ProductStatus | "全部")}
            options={["全部", "新发现", "待分析", "分析中", "待供应商报价", "待利润测算", "待风险确认", "RG 候选", "PB 候选", "RG + PB 双向候选", "准备转项目", "已转入 RG/PB 项目系统", "继续观察", "已淘汰"]}
          />
          <SelectFilter
            label={t.filters.risk}
            value={riskFilter}
            onChange={(value) => setRiskFilter(value as RiskLevel | "全部")}
            options={["全部", "低", "中", "高"]}
          />
          <SelectFilter
            label={t.filters.score}
            value={scoreFilter}
            onChange={(value) => setScoreFilter(value as typeof scoreFilter)}
            options={["全部", "85+", "70-84", "60-69", "<60"]}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <ToggleChip label={t.filters.highPotential} checked={onlyHighPotential} onChange={setOnlyHighPotential} />
          <ToggleChip label={t.filters.highRisk} checked={onlyHighRisk} onChange={setOnlyHighRisk} />
          <ToggleChip label={t.filters.rejected} checked={includeRejected} onChange={setIncludeRejected} />
          <ToggleChip label={t.filters.transferable} checked={onlyTransferable} onChange={setOnlyTransferable} />
        </div>
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center shadow-sm">
          <p className="text-lg font-semibold">{t.emptyTitle}</p>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{t.emptyDescription}</p>
          <Link href="/products/new" className="mt-6 inline-flex">
            <Button>
              {t.emptyAction}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="grid grid-cols-[1.4fr_0.9fr_1fr_90px_90px_90px_90px_120px_1.2fr_90px_120px_120px_28px] border-b border-stone-200 bg-stone-50 px-4 py-3 text-xs font-medium text-muted-foreground">
            <span>{t.columns.product}</span>
            <span>{t.columns.category}</span>
            <span>{t.columns.direction}</span>
            <span>{t.columns.totalScore}</span>
            <span>{t.columns.rgScore}</span>
            <span>{t.columns.pbScore}</span>
            <span>{t.columns.margin}</span>
            <span>{t.columns.risk}</span>
            <span>{t.columns.status}</span>
            <span>{t.columns.owner}</span>
            <span>{t.columns.updatedAt}</span>
            <span>{t.columns.nextAction}</span>
            <span />
          </div>
          {filtered.map(({ product, analysis }) => (
            <Link
              href={`/reports/${product.id}`}
              key={product.id}
              className="grid grid-cols-[1.4fr_0.9fr_1fr_90px_90px_90px_90px_120px_1.2fr_90px_120px_120px_28px] items-center border-b border-stone-100 px-4 py-4 text-sm transition-colors last:border-b-0 hover:bg-stone-50"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {locale === "ko" ? product.productNameKo : product.productNameZh}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {product.brand || "N/A"} · {product.platform} · {analysis.totalJudgement}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <Badge>{analysis.biggestOpportunity}</Badge>
                  <Badge className="border-rose-200 bg-rose-50 text-rose-700">{analysis.biggestRisk}</Badge>
                </div>
              </div>
              <span className="text-muted-foreground">{product.category || "-"}</span>
              <DecisionPill decision={analysis.direction} />
              <ScorePill value={analysis.totalScore} />
              <ScorePill value={analysis.rgScore} />
              <ScorePill value={analysis.pbScore} />
              <span>{analysis.grossMarginPercent}%</span>
              <RiskPill level={analysis.riskLevel} redline={analysis.riskRedlineLevel} />
              <span className="text-sm">{product.status}</span>
              <span>{product.owner}</span>
              <span>{formatDate(product.updatedAt)}</span>
              <span className="line-clamp-2 text-xs text-muted-foreground">{analysis.nextAction}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function SelectFilter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="text-sm font-medium">
      <span className="mb-2 inline-flex items-center gap-2 text-muted-foreground">
        <Filter className="h-3.5 w-3.5" />
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-md border border-stone-200 bg-white px-3 text-sm"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function ToggleChip({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
        checked ? "border-slate-900 bg-slate-900 text-white" : "border-stone-200 bg-white text-muted-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function ScorePill({ value }: { value: number }) {
  const className =
    value >= 85
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : value >= 70
        ? "border-sky-200 bg-sky-50 text-sky-700"
        : value >= 60
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-rose-200 bg-rose-50 text-rose-700";

  return <Badge className={className}>{value}</Badge>;
}

function RiskPill({ level, redline }: { level: RiskLevel; redline: string }) {
  const className =
    level === "高"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : level === "中"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return <Badge className={className}>{`${level} · ${redline}`}</Badge>;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

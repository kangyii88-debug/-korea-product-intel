"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Download, Plus, Search } from "lucide-react";
import { getActionButtons, getDirectionFromLocalProduct } from "@/lib/business-positioning";
import { useLocale } from "@/components/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { analyzeProduct, getDisplayName, LOCAL_PRODUCTS_KEY, type LocalProduct } from "@/lib/local-products";
import { formatNumber } from "@/lib/utils";

const copy = {
  zh: {
    searchPlaceholder: "搜索商品名、平台、类目、品牌关键词",
    addButton: "新增测试商品",
    exportButton: "导出报告",
    emptyTitle: "当前还没有测试商品",
    emptyDescription: "先新增一个测试商品，系统就可以开始做销量评估、评论分析、利润测算和项目分流建议。",
    emptyAction: "立即新增商品",
    columns: {
      product: "商品",
      platform: "平台",
      direction: "推荐方向",
      sales: "月销量",
      review: "评分/评论",
      actions: "建议动作",
      brandFallback: "未填写品牌",
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
    searchPlaceholder: "상품명, 플랫폼, 카테고리, 브랜드 키워드 검색",
    addButton: "테스트 상품 추가",
    exportButton: "리포트 내보내기",
    emptyTitle: "현재 등록된 테스트 상품이 없습니다",
    emptyDescription: "테스트 상품을 먼저 추가하면 판매 평가, 리뷰 분석, 이익 계산, 프로젝트 분류 제안을 시작할 수 있습니다.",
    emptyAction: "지금 상품 추가",
    columns: {
      product: "상품",
      platform: "플랫폼",
      direction: "추천 방향",
      sales: "월판매량",
      review: "평점/리뷰",
      actions: "권장 액션",
      brandFallback: "브랜드 미입력",
    },
    metrics: {
      collected: "이번 달 수집 상품 수",
      potential: "고잠재 상품 수",
      rg: "Rocket Growth 후보 수",
      pb: "PB 후보 수",
      dual: "RG + PB 이중 후보 수",
      risk: "고위험 상품 수",
      rejected: "탈락 상품 수",
      tasks: "대기 액션 수",
    },
  },
} as const;

export function ProductWorkspace() {
  const { locale } = useLocale();
  const t = copy[locale];
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const raw = window.localStorage.getItem(LOCAL_PRODUCTS_KEY);
    setProducts(raw ? JSON.parse(raw) : []);
  }, []);

  const analyzed = useMemo(
    () =>
      products.map((product) => {
        const analysis = analyzeProduct(product);
        const direction = getDirectionFromLocalProduct(product, analysis);
        return { product, analysis, direction, actions: getActionButtons(direction) };
      }),
    [products],
  );

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return analyzed;
    return analyzed.filter(({ product, direction }) =>
      [product.name, getDisplayName(product.name), product.platform, product.category, getDisplayName(product.category), product.brand, direction, ...product.keywords]
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [analyzed, query]);

  const monthlyCollected = products.filter((item) => item.createdAt.slice(0, 7) === new Date().toISOString().slice(0, 7)).length;
  const highPotential = analyzed.filter((item) => item.analysis.totalScore >= 76).length;
  const rgCount = analyzed.filter((item) => item.direction === "Rocket Growth").length;
  const pbCount = analyzed.filter((item) => item.direction === "PB").length;
  const dualCount = analyzed.filter((item) => item.direction === "Rocket Growth + PB").length;
  const riskCount = analyzed.filter((item) => item.analysis.riskLevel === "高").length;
  const rejectedCount = analyzed.filter((item) => item.direction === "放弃").length;
  const pendingTasks = analyzed.reduce((sum, item) => sum + item.actions.length, 0);

  const metrics = [
    [t.metrics.collected, monthlyCollected],
    [t.metrics.potential, highPotential],
    [t.metrics.rg, rgCount],
    [t.metrics.pb, pbCount],
    [t.metrics.dual, dualCount],
    [t.metrics.risk, riskCount],
    [t.metrics.rejected, rejectedCount],
    [t.metrics.tasks, pendingTasks],
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-5 py-6 sm:px-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value]) => (
          <Metric key={String(label)} label={String(label)} value={formatNumber(Number(value))} />
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-lg border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.searchPlaceholder}
            className="h-10 w-full rounded-md border pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
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

      {products.length === 0 ? (
        <div className="rounded-xl border bg-white p-10 text-center">
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
        <div className="overflow-hidden rounded-lg border bg-white">
          <div className="grid grid-cols-[minmax(260px,1.3fr)_120px_170px_90px_120px_1fr_40px] border-b bg-muted/50 px-4 py-3 text-xs font-medium text-muted-foreground">
            <span>{t.columns.product}</span>
            <span>{t.columns.platform}</span>
            <span>{t.columns.direction}</span>
            <span>{t.columns.sales}</span>
            <span>{t.columns.review}</span>
            <span>{t.columns.actions}</span>
            <span />
          </div>
          {filtered.map(({ product, analysis, direction, actions }) => (
            <Link
              href={`/reports/${product.id}`}
              key={product.id}
              className="grid grid-cols-[minmax(260px,1.3fr)_120px_170px_90px_120px_1fr_40px] items-center border-b px-4 py-4 text-sm transition-colors last:border-b-0 hover:bg-muted/40"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{getDisplayName(product.name, locale)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {product.brand || t.columns.brandFallback} · {getDisplayName(product.category, locale)} · Rank #{product.rank || "-"}
                </p>
              </div>
              <span className="text-muted-foreground">{product.platform}</span>
              <Badge className="w-fit">{direction}</Badge>
              <span>{formatNumber(product.estimatedMonthlySales)}</span>
              <span>
                {product.rating || "-"}
                <span className="ml-1 text-muted-foreground">/ {formatNumber(product.reviewCount)}</span>
              </span>
              <div className="flex flex-wrap gap-1">
                {actions.slice(0, 2).map((action) => (
                  <Badge key={action}>{action}</Badge>
                ))}
                {actions.length > 2 ? <Badge>+{actions.length - 2}</Badge> : null}
              </div>
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
    <div className="rounded-lg border bg-white p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

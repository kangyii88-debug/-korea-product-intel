"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Plus, Search } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { analyzeProduct, getDisplayName, LOCAL_PRODUCTS_KEY, type LocalProduct } from "@/lib/local-products";
import { formatNumber } from "@/lib/utils";

const copy = {
  zh: {
    metrics: {
      total: "测试商品数",
      totalNote: "当前本地数据库中的商品总量",
      sales: "预计月销量",
      salesNote: "全部测试商品的销量汇总",
      top: "高分商品数",
      topNote: "AI 评分 S/A 的商品数量",
      risk: "高风险商品数",
      riskNote: "需要重点复核的商品数量",
    },
    searchPlaceholder: "搜索商品名、平台、类目、品牌或关键词",
    addButton: "新增测试商品",
    emptyTitle: "当前还没有测试商品",
    emptyDescription: "先新增一个测试商品，系统就可以开始做销量评估、评论分析和开发建议。",
    emptyAction: "立即新增商品",
    columns: {
      product: "商品",
      platform: "平台",
      sales: "月销量",
      review: "评分/评论",
      score: "AI 评分",
      brandFallback: "未填写品牌",
    },
  },
  ko: {
    metrics: {
      total: "테스트 상품 수",
      totalNote: "현재 로컬 데이터베이스에 저장된 상품 수",
      sales: "예상 월판매량",
      salesNote: "전체 테스트 상품의 판매량 합계",
      top: "고득점 상품 수",
      topNote: "AI 등급 S/A 상품 수",
      risk: "고위험 상품 수",
      riskNote: "우선 재검토가 필요한 상품 수",
    },
    searchPlaceholder: "상품명, 플랫폼, 카테고리, 브랜드, 키워드로 검색",
    addButton: "테스트 상품 추가",
    emptyTitle: "아직 등록된 테스트 상품이 없습니다",
    emptyDescription: "테스트 상품을 먼저 추가하면 판매량 평가, 리뷰 분석, 개발 제안을 바로 시작할 수 있습니다.",
    emptyAction: "상품 추가하기",
    columns: {
      product: "상품",
      platform: "플랫폼",
      sales: "월판매량",
      review: "평점/리뷰",
      score: "AI 점수",
      brandFallback: "브랜드 미입력",
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

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return products;
    return products.filter((product) =>
      [product.name, getDisplayName(product.name), product.platform, product.category, getDisplayName(product.category), product.brand, ...product.keywords]
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [products, query]);

  const analyses = products.map(analyzeProduct);
  const topCount = analyses.filter((item) => item.grade === "S" || item.grade === "A").length;
  const riskCount = analyses.filter((item) => item.riskLevel === "高").length;
  const totalSales = products.reduce((sum, product) => sum + product.estimatedMonthlySales, 0);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-5 py-6 sm:px-8">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label={t.metrics.total} value={String(products.length)} note={t.metrics.totalNote} />
        <Metric label={t.metrics.sales} value={formatNumber(totalSales)} note={t.metrics.salesNote} tone="good" />
        <Metric label={t.metrics.top} value={String(topCount)} note={t.metrics.topNote} tone="good" />
        <Metric label={t.metrics.risk} value={String(riskCount)} note={t.metrics.riskNote} tone="warn" />
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
        <Link href="/products/new">
          <Button>
            <Plus className="h-4 w-4" />
            {t.addButton}
          </Button>
        </Link>
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
          <div className="grid grid-cols-[minmax(300px,1fr)_120px_120px_120px_120px_80px] border-b bg-muted/50 px-4 py-3 text-xs font-medium text-muted-foreground">
            <span>{t.columns.product}</span>
            <span>{t.columns.platform}</span>
            <span>{t.columns.sales}</span>
            <span>{t.columns.review}</span>
            <span>{t.columns.score}</span>
            <span />
          </div>
          {filtered.map((product) => {
            const analysis = analyzeProduct(product);
            return (
              <Link
                href={`/reports/${product.id}`}
                key={product.id}
                className="grid grid-cols-[minmax(300px,1fr)_120px_120px_120px_120px_80px] items-center border-b px-4 py-4 text-sm transition-colors last:border-b-0 hover:bg-muted/40"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{getDisplayName(product.name, locale)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {product.brand || t.columns.brandFallback} · {getDisplayName(product.category, locale)} · Rank #{product.rank || "-"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {product.keywords.slice(0, 3).map((keyword) => (
                      <Badge key={keyword}>{keyword}</Badge>
                    ))}
                  </div>
                </div>
                <span className="text-muted-foreground">{product.platform}</span>
                <span>{formatNumber(product.estimatedMonthlySales)}</span>
                <span>
                  {product.rating || "-"}
                  <span className="ml-1 text-muted-foreground">/ {formatNumber(product.reviewCount)}</span>
                </span>
                <span>
                  <b>{analysis.totalScore}</b>
                  <span className="ml-1 text-muted-foreground">{analysis.grade}</span>
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, note, tone = "default" }: { label: string; value: string; note: string; tone?: "default" | "good" | "warn" }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tracking-tight ${tone === "good" ? "text-emerald-700" : tone === "warn" ? "text-amber-700" : ""}`}>
        {value}
      </p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{note}</p>
    </div>
  );
}

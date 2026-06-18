"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { analyzeProduct, loadLocalProducts, type LocalProduct } from "@/lib/local-products";
import { formatNumber } from "@/lib/utils";

export default function ReviewsPage() {
  const [products, setProducts] = useState<LocalProduct[]>([]);

  useEffect(() => {
    setProducts(loadLocalProducts());
  }, []);

  const reviewState = useMemo(() => {
    const analyzed = products.map((product) => ({ product, analysis: analyzeProduct(product) }));
    const totalReviews = analyzed.reduce((sum, item) => sum + item.product.reviewCount, 0);
    const issueRows = analyzed.flatMap((item) => item.analysis.negativeIssues);
    const uniqueIssues = new Set(issueRows.map((item) => item.label));
    const trackedReasons = issueRows.length;
    const optimizable = issueRows.filter((item) => item.count > 0).length;

    return {
      totalReviews,
      highFrequencyIssues: uniqueIssues.size,
      trackedReasons,
      optimizable,
      issueRows,
    };
  }, [products]);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Review Analysis"
        title="评论差评分析"
        description="聚焦尺寸、包装、外观、气味、物流、质量稳定性等负面主题，判断商品是否存在可改进机会。"
      />
      <div className="mx-auto max-w-7xl space-y-6 px-5 py-6 sm:px-8">
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard label="评论样本" value={formatNumber(reviewState.totalReviews)} note="真实评论样本总量" />
          <MetricCard label="高频差评点" value={`${reviewState.highFrequencyIssues}`} note="已识别差评主题数" tone="warn" />
          <MetricCard label="追踪原因" value={`${reviewState.trackedReasons}`} note="已追踪负面原因条数" tone="warn" />
          <MetricCard label="可转化优化项" value={`${reviewState.optimizable}`} note="可进入优化动作的项数" tone="good" />
        </div>

        {products.length === 0 ? (
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold">当前还没有评论数据</h2>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>所有统计现在都应为 0，不会显示任何示例差评点或示例主题。</p>
              <Link href="/products/new">
                <Button>新增测试商品</Button>
              </Link>
            </CardContent>
          </Card>
        ) : reviewState.issueRows.length === 0 ? (
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold">当前没有可分析的差评主题</h2>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              当前商品还没有足够的评论样本或负面主题，后续录入真实评论后这里会自动更新。
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold">真实差评主题</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              {reviewState.issueRows.map((item, index) => (
                <div key={`${item.label}-${index}`} className="rounded-xl border border-stone-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{item.label}</p>
                    <span className="text-sm text-muted-foreground">{item.count} 条</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{item.suggestion}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

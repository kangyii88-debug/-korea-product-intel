"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DecisionPill } from "@/components/decision-pill";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { analyzeProduct, loadLocalProducts, type LocalProduct } from "@/lib/local-products";

export default function DecisionsPage() {
  const [products, setProducts] = useState<LocalProduct[]>([]);

  useEffect(() => {
    setProducts(loadLocalProducts());
  }, []);

  const sorted = useMemo(
    () =>
      products
        .map((product) => ({ product, analysis: analyzeProduct(product) }))
        .sort((a, b) => b.analysis.totalScore - a.analysis.totalScore),
    [products],
  );

  const directions = sorted.map((item) => item.analysis.direction);

  return (
    <AppShell>
      <PageHeader
        eyebrow="AI Decision Center"
        title="AI 决策中心"
        description="统一查看商品是否适合 Rocket Growth、PB、双向推进、继续观察或放弃，并同步看到评分、利润和风险。"
      />
      <div className="mx-auto max-w-7xl space-y-6 px-5 py-6 sm:px-8">
        <div className="grid gap-4 md:grid-cols-5">
          <MetricCard label="Rocket Growth" value={`${directions.filter((item) => item === "Rocket Growth").length}`} note="优先导向 RG" tone="good" />
          <MetricCard label="PB" value={`${directions.filter((item) => item === "PB").length}`} note="优先导向 PB" />
          <MetricCard label="Rocket Growth + PB" value={`${directions.filter((item) => item === "Rocket Growth + PB").length}`} note="双向推进" tone="good" />
          <MetricCard label="继续观察" value={`${directions.filter((item) => item === "继续观察").length}`} note="数据继续补充" tone="warn" />
          <MetricCard label="放弃" value={`${directions.filter((item) => item === "放弃").length}`} note="建议淘汰" tone="warn" />
        </div>

        {sorted.length === 0 ? (
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold">当前还没有决策结果</h2>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>没有真实商品时，这里不会显示任何测试商品和假评分。</p>
              <Link href="/products/new">
                <Button>新增测试商品</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold">决策排序</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              {sorted.map(({ product, analysis }) => (
                <Link
                  href={`/reports/${product.id}`}
                  key={product.id}
                  className="grid gap-4 rounded-xl border border-stone-200 p-4 transition-colors hover:bg-stone-50 lg:grid-cols-[1.5fr_170px_110px_110px_110px_160px_24px] lg:items-center"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{product.productNameZh}</p>
                      <Badge>{product.platform}</Badge>
                      <Badge>{product.category}</Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {analysis.biggestOpportunity} 当前最大风险：{analysis.biggestRisk}
                    </p>
                  </div>
                  <DecisionPill decision={analysis.direction} />
                  <Score label="总分" value={analysis.totalScore} />
                  <Score label="RG" value={analysis.rgScore} />
                  <Score label="PB" value={analysis.pbScore} />
                  <Score label="毛利率" value={analysis.grossMarginPercent} suffix="%" />
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

function Score({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <div className="h-2 w-20 rounded-full bg-muted">
          <div className="h-2 rounded-full bg-slate-900" style={{ width: `${Math.min(value, 100)}%` }} />
        </div>
        <span className="text-sm font-medium">
          {value}
          {suffix}
        </span>
      </div>
    </div>
  );
}

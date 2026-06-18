"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { analyzeProduct, loadLocalProducts, type LocalProduct } from "@/lib/local-products";
import { formatNumber } from "@/lib/utils";

export default function Home() {
  const [products, setProducts] = useState<LocalProduct[]>([]);

  useEffect(() => {
    setProducts(loadLocalProducts());
  }, []);

  const analyzed = useMemo(() => products.map((product) => ({ product, analysis: analyzeProduct(product) })), [products]);

  const metrics = [
    ["本月采集商品数", analyzed.length],
    ["高潜力商品数", analyzed.filter((item) => item.analysis.totalScore >= 85).length],
    ["Rocket Growth 候选品数量", analyzed.filter((item) => item.analysis.direction === "Rocket Growth").length],
    ["PB 候选品数量", analyzed.filter((item) => item.analysis.direction === "PB").length],
    ["RG + PB 双向候选品", analyzed.filter((item) => item.analysis.direction === "Rocket Growth + PB").length],
    ["高风险商品数", analyzed.filter((item) => item.analysis.riskLevel === "高").length],
    ["已淘汰商品数", analyzed.filter((item) => item.product.status === "已淘汰").length],
    ["待执行任务数量", analyzed.reduce((sum, item) => sum + item.analysis.generatedTasks.length, 0)],
  ];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Coupang Intelligence Dashboard"
        title="选品情报看板"
        description="Coupang 商品情报与 B2B 项目筛选系统。这里只负责采集、分析、判断和分流商品机会，为 Rocket Growth 和 PB 项目提供决策支持。"
        action={
          <Link href="/products/new">
            <Button>新增测试商品</Button>
          </Link>
        }
      />
      <div className="mx-auto max-w-7xl space-y-6 px-5 py-6 sm:px-8">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map(([label, value]) => (
            <Card key={String(label)}>
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">{formatNumber(Number(value))}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        {analyzed.length === 0 ? (
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold">当前还没有商品数据</h2>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>请先添加第一个 Coupang 商品机会。</p>
              <p>系统会从市场分析、竞品分析、评论痛点、利润测算和 RG/PB 适合度开始判断。</p>
            </CardContent>
          </Card>
        ) : (
          <section className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <h2 className="text-base font-semibold">系统定位</h2>
              </CardHeader>
              <CardContent className="space-y-2 text-sm leading-6 text-muted-foreground">
                <p>只服务 Rocket Growth 和 PB 项目筛选，不进入 4locks 自有品牌 ERP。</p>
                <p>商品不是只被记录，而是会被评分、判断风险、测算利润和自动生成动作。</p>
                <p>成熟机会补齐资料后，再转入 Rocket Growth / PB 项目系统。</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-base font-semibold">当前推进规则</h2>
              </CardHeader>
              <CardContent className="space-y-2 text-sm leading-6 text-muted-foreground">
                <p>85-100 分：优先推进。</p>
                <p>70-84 分：可以推进。</p>
                <p>60-69 分：继续观察。</p>
                <p>0-59 分：不建议做。</p>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </AppShell>
  );
}

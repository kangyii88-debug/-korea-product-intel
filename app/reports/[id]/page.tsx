import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DecisionPill } from "@/components/decision-pill";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { fallbackReport, products, reports } from "@/lib/mock-data";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = products.find((item) => item.id === id) ?? products[0];
  const report = reports[product.id] ?? { ...fallbackReport, productId: product.id };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Module 02"
        title="单品 AI 情报报告"
        description="围绕销售原因、竞品优势、评论痛点、开发机会和风险给出可执行判断。"
        action={
          <Button variant="outline">
            <ExternalLink className="h-4 w-4" />
            查看原链接
          </Button>
        }
      />
      <div className="mx-auto max-w-7xl space-y-6 px-5 py-6 sm:px-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          返回产品库
        </Link>

        <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
              <Image src={product.image} alt={product.name} fill className="object-cover" priority />
            </div>
            <Card>
              <CardHeader>
                <h2 className="text-base font-semibold">基础信息</h2>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {[
                  ["平台", product.platform],
                  ["品牌", product.brand],
                  ["类目", product.category],
                  ["尺寸", product.size],
                  ["材质", product.material],
                  ["重量", product.weight],
                  ["包装尺寸", product.packageSize],
                  ["配送方式", product.deliveryType],
                  ["卖家类型", product.sellerType],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 border-b pb-2 last:border-b-0">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="text-right font-medium">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <DecisionPill decision={report.aiSummary.finalDecision} />
                <Badge>{product.status}</Badge>
                {product.sellingPoints.map((point) => (
                  <Badge key={point}>{point}</Badge>
                ))}
              </div>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">{product.name}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{report.aiSummary.worthDoing}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <MetricCard label="折扣价" value={formatCurrency(product.discountPrice)} note={`原价 ${formatCurrency(product.price)}`} />
              <MetricCard label="预计月销量" value={formatNumber(product.estimatedMonthlySales)} note={`当前排名 #${product.rank}`} tone="good" />
              <MetricCard label="评论/评分" value={`${formatNumber(product.reviewCount)} / ${product.rating}`} note="评论样本可用于痛点判断" />
              <MetricCard label="AI 机会分" value={`${product.score}`} note={`风险分 ${product.riskScore}`} tone="good" />
            </div>

            <Card>
              <CardHeader>
                <h2 className="text-base font-semibold">AI 总结</h2>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {[
                  ["为什么", report.aiSummary.why],
                  ["最大机会", report.aiSummary.biggestOpportunity],
                  ["最大风险", report.aiSummary.biggestRisk],
                  ["建议采购数量", report.aiSummary.suggestedPurchaseQty],
                  ["建议测试方式", report.aiSummary.suggestedTestMethod],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md border p-4">
                    <p className="text-xs font-medium text-muted-foreground">{label}</p>
                    <p className="mt-2 text-sm leading-6">{value}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold">销售分析</h2>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="text-sm font-medium">为什么卖得好</p>
                <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                  {report.salesAnalysis.whySelling.map((item) => (
                    <li key={item}>· {item}</li>
                  ))}
                </ul>
              </div>
              {[
                ["价格优势", report.salesAnalysis.priceAdvantage],
                ["销量趋势", report.salesAnalysis.salesTrend],
                ["是否季节产品", report.salesAnalysis.seasonality],
                ["是否长期需求", report.salesAnalysis.demandType],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{value}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold">竞品优势分析</h2>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {Object.entries(report.competitorAdvantages).map(([label, value]) => (
                <div key={label} className="rounded-md border p-3">
                  <p className="text-xs font-medium text-muted-foreground">{label}</p>
                  <p className="mt-2 text-sm leading-6">{value}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold">评论分析</h2>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {[
                ["用户喜欢什么", report.reviewAnalysis.likes],
                ["用户讨厌什么", report.reviewAnalysis.dislikes],
                ["购买原因", report.reviewAnalysis.purchaseReasons],
                ["退货原因", report.reviewAnalysis.returnReasons],
              ].map(([label, values]) => (
                <div key={label as string} className="rounded-md border p-4">
                  <p className="text-sm font-medium">{label as string}</p>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {(values as string[]).map((item) => (
                      <li key={item}>· {item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold">风险清单</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              {report.riskChecklist.map((risk) => (
                <div key={risk.title} className="rounded-md border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{risk.title}</p>
                    <Badge>{risk.level}风险</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{risk.mitigation}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}

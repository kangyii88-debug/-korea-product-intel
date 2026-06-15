import { AppShell } from "@/components/app-shell";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { products, reports } from "@/lib/mock-data";
import { formatNumber } from "@/lib/utils";

const reviewThemes = [
  { theme: "尺寸预期不一致", count: 214, impact: "导致退货", action: "主图增加真人/场景尺寸参照" },
  { theme: "包装破损", count: 168, impact: "影响评分", action: "外箱加厚并加入跌落测试要求" },
  { theme: "功能描述不清", count: 121, impact: "拉低转化", action: "详情页用对比图说明边界条件" },
  { theme: "耐用性担忧", count: 97, impact: "售后风险", action: "采购前要求供应商提供循环测试数据" },
];

export default function ReviewsPage() {
  const totalReviews = products.reduce((sum, product) => sum + product.reviewCount, 0);
  const dislikes = Object.values(reports).flatMap((report) => report.reviewAnalysis.dislikes);
  const returnReasons = Object.values(reports).flatMap((report) => report.reviewAnalysis.returnReasons);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Module 03"
        title="评论差评分析中心"
        description="把评论拆成喜欢点、讨厌点、购买原因、退货原因，直接反推产品升级、详情页修正和售后风险。"
      />
      <div className="mx-auto max-w-7xl space-y-6 px-5 py-6 sm:px-8">
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard label="评论样本" value={formatNumber(totalReviews)} note="来自当前采集库商品" />
          <MetricCard label="高频差评点" value={`${dislikes.length}`} note="用于生成开发约束" tone="warn" />
          <MetricCard label="退货原因" value={`${returnReasons.length}`} note="用于提前降低售后成本" tone="warn" />
          <MetricCard label="可转化优化项" value="12" note="主图、详情页、包装、规格说明" tone="good" />
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold">差评主题优先级</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              {reviewThemes.map((item) => (
                <div key={item.theme} className="grid gap-3 rounded-md border p-4 md:grid-cols-[1fr_120px_120px_1.2fr] md:items-center">
                  <div>
                    <p className="font-medium">{item.theme}</p>
                    <p className="mt-1 text-sm text-muted-foreground">出现 {item.count} 次</p>
                  </div>
                  <Badge>{item.impact}</Badge>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-amber-500" style={{ width: `${Math.min(item.count / 2.4, 100)}%` }} />
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">{item.action}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold">AI 归因</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border p-4">
                <p className="text-sm font-medium">用户真正喜欢</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  不是便宜本身，而是“省空间、省时间、少麻烦”的明确收益。详情页要把收益放在参数前。
                </p>
              </div>
              <div className="rounded-md border p-4">
                <p className="text-sm font-medium">用户真正讨厌</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  预期落差。尺寸、承重、材质、包装只要说不清，都会变成退货和低分。
                </p>
              </div>
              <div className="rounded-md border p-4">
                <p className="text-sm font-medium">下一步动作</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  把高频差评转成供应商验货表和详情页 FAQ，再决定是否进入小批量测试。
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}

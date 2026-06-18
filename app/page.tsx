import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getActionButtons, getDirectionFromMockProduct } from "@/lib/business-positioning";
import { products } from "@/lib/mock-data";
import { formatNumber } from "@/lib/utils";

export default function Home() {
  const directions = products.map((product) => getDirectionFromMockProduct(product));
  const metrics = [
    ["本月采集商品数", products.length],
    ["高潜力商品数", products.filter((item) => item.score >= 76).length],
    ["Rocket Growth 候选品数量", directions.filter((item) => item === "Rocket Growth").length],
    ["PB 候选品数量", directions.filter((item) => item === "PB").length],
    ["RG + PB 双向候选品", directions.filter((item) => item === "Rocket Growth + PB").length],
    ["高风险商品数", products.filter((item) => item.riskScore >= 70).length],
    ["已淘汰商品数", directions.filter((item) => item === "放弃").length],
    ["待执行任务数量", products.reduce((sum, item) => sum + getActionButtons(getDirectionFromMockProduct(item)).length, 0)],
  ];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Coupang Intelligence Dashboard"
        title="选品情报看板"
        description="Coupang 商品情报与 B2B 项目筛选系统。它不是 4locks ERP，也不是自有品牌管理系统，只负责为 Rocket Growth 和 PB 项目筛选、分析、判断和分流商品机会。"
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

        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold">系统最终定位</h2>
            </CardHeader>
            <CardContent className="space-y-2 text-sm leading-6 text-muted-foreground">
              <p>- 只负责 Coupang 商品机会采集、竞品分析、评论差评分析、利润测算和风险判断。</p>
              <p>- 只服务 Rocket Growth 和 PB 项目筛选，不进入 4locks 自有品牌 ERP。</p>
              <p>- 当机会成熟时，再转入 Rocket Growth / PB 项目管理系统。</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold">推荐方向说明</h2>
            </CardHeader>
            <CardContent className="space-y-2 text-sm leading-6 text-muted-foreground">
              <p>- Rocket Growth：适合平台扩量与快速验证。</p>
              <p>- PB：适合进入自营品牌供应链评估。</p>
              <p>- Rocket Growth + PB：同时适合双向推进。</p>
              <p>- 继续观察 / 放弃：保留观察或明确淘汰。</p>
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}

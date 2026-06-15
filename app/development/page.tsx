import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { products, reports } from "@/lib/mock-data";

export default function DevelopmentPage() {
  const target = products[0];
  const report = reports[target.id];
  const roadmap = [
    { step: "定位", owner: "老板/产品", output: report.developmentAdvice.positioning },
    { step: "结构升级", owner: "供应链", output: report.developmentAdvice.productChanges.join("；") },
    { step: "包装", owner: "采购/设计", output: report.developmentAdvice.packaging.join("；") },
    { step: "内容", owner: "运营", output: report.developmentAdvice.contentStrategy.join("；") },
  ];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Module 04"
        title="产品开发建议中心"
        description="把爆品和差评拆成开发任务：改哪里、问供应商什么、包装怎么做、内容怎么卖。"
      />
      <div className="mx-auto max-w-7xl space-y-6 px-5 py-6 sm:px-8">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">{target.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">当前推荐从该商品开始打样，因为评论痛点清晰且供应链改造难度中等。</p>
              </div>
              <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">优先开发</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 lg:grid-cols-4">
              {roadmap.map((item) => (
                <div key={item.step} className="rounded-md border p-4">
                  <p className="text-xs font-medium text-muted-foreground">{item.owner}</p>
                  <h3 className="mt-2 font-semibold">{item.step}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.output}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold">供应商必须回答</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              {report.developmentAdvice.supplierQuestions.map((question, index) => (
                <div key={question} className="flex gap-3 rounded-md border p-4">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6">{question}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold">打样验收标准</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                "样品必须通过实际装载测试，并拍摄测试视频留档。",
                "包装需模拟韩国本地配送破损风险，不只看工厂出厂外观。",
                "详情页承诺必须和测试数据一致，避免过度营销造成退货。",
                "首批只做 2 个颜色，减少库存复杂度。",
              ].map((item) => (
                <div key={item} className="rounded-md border p-4 text-sm leading-6 text-muted-foreground">
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}

import Link from "next/link";
import { ArrowUpRight, ClipboardList, Factory, FileText, Layers3, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getActionButtons, getDirectionFromMockProduct } from "@/lib/business-positioning";
import { products } from "@/lib/mock-data";

const actionIcons = {
  "转入 Rocket Growth 项目": <Layers3 className="h-4 w-4" />,
  "转入 PB 项目": <Factory className="h-4 w-4" />,
  "生成产品提案": <FileText className="h-4 w-4" />,
  "生成供应商开发任务": <ClipboardList className="h-4 w-4" />,
  "生成竞品分析报告": <FileText className="h-4 w-4" />,
  "标记为继续观察": <ClipboardList className="h-4 w-4" />,
  "标记为淘汰": <Trash2 className="h-4 w-4" />,
} as const;

export default function ActionsPage() {
  const topActions = products.slice(0, 8).map((product) => {
    const direction = getDirectionFromMockProduct(product);
    return { product, direction, actions: getActionButtons(direction) };
  });

  const allActions = topActions.flatMap((item) => item.actions);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Action Center"
        title="执行动作清单"
        description="把 AI 决策结果直接转成 Rocket Growth / PB 分流动作、提案动作和供应商开发动作。"
      />
      <div className="mx-auto max-w-7xl space-y-6 px-5 py-6 sm:px-8">
        <section className="grid gap-4 md:grid-cols-4">
          <SummaryCard label="转入 Rocket Growth 项目" value={allActions.filter((item) => item === "转入 Rocket Growth 项目").length} />
          <SummaryCard label="转入 PB 项目" value={allActions.filter((item) => item === "转入 PB 项目").length} />
          <SummaryCard label="标记为继续观察" value={allActions.filter((item) => item === "标记为继续观察").length} />
          <SummaryCard label="标记为淘汰" value={allActions.filter((item) => item === "标记为淘汰").length} />
        </section>

        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold">今日推荐动作</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {topActions.map(({ product, direction, actions }) => (
              <div key={product.id} className="grid gap-4 rounded-md border p-4 lg:grid-cols-[1fr_170px_1fr_24px] lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{product.name}</p>
                    <Badge>{product.platform}</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    依据当前销量、利润、竞品和风险信号，建议分流到：{direction}
                  </p>
                </div>
                <Badge>{direction}</Badge>
                <div className="flex flex-wrap gap-2">
                  {actions.map((action) => (
                    <Button key={action} variant="outline" className="h-9">
                      {actionIcons[action]}
                      {action}
                    </Button>
                  ))}
                </div>
                <Link href={`/reports/${product.id}`}>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

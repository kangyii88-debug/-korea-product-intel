"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, ClipboardList, Factory, FileText, Layers3, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getActionButtons } from "@/lib/business-positioning";
import { analyzeProduct, loadLocalProducts, type LocalProduct } from "@/lib/local-products";

const actionIcons: Record<string, React.ReactNode> = {
  "转入 Rocket Growth 项目": <Layers3 className="h-4 w-4" />,
  "转入 PB 项目": <Factory className="h-4 w-4" />,
  "生成产品提案": <FileText className="h-4 w-4" />,
  "生成供应商开发任务": <ClipboardList className="h-4 w-4" />,
  "生成竞品分析报告": <FileText className="h-4 w-4" />,
  "标记为继续观察": <ClipboardList className="h-4 w-4" />,
  "标记为淘汰": <Trash2 className="h-4 w-4" />,
};

export default function ActionsPage() {
  const [products, setProducts] = useState<LocalProduct[]>([]);

  useEffect(() => {
    setProducts(loadLocalProducts());
  }, []);

  const actionRows = useMemo(
    () =>
      products.map((product) => {
        const analysis = analyzeProduct(product);
        return { product, analysis, actions: getActionButtons(analysis.direction) };
      }),
    [products],
  );

  const allActions = actionRows.flatMap((item) => item.actions);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Action Center"
        title="执行动作清单"
        description="把 AI 决策结果转成 Rocket Growth / PB 转项、提案、供应商开发和淘汰动作。"
      />
      <div className="mx-auto max-w-7xl space-y-6 px-5 py-6 sm:px-8">
        <section className="grid gap-4 md:grid-cols-4">
          <SummaryCard label="转入 Rocket Growth 项目" value={allActions.filter((item) => item === "转入 Rocket Growth 项目").length} />
          <SummaryCard label="转入 PB 项目" value={allActions.filter((item) => item === "转入 PB 项目").length} />
          <SummaryCard label="标记为继续观察" value={allActions.filter((item) => item === "标记为继续观察").length} />
          <SummaryCard label="标记为淘汰" value={allActions.filter((item) => item === "标记为淘汰").length} />
        </section>

        {actionRows.length === 0 ? (
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold">当前还没有执行任务</h2>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>没有真实商品时，这里不会自动显示任何测试任务。</p>
              <Link href="/products/new">
                <Button>新增测试商品</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold">建议动作</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              {actionRows.map(({ product, analysis, actions }) => (
                <div key={product.id} className="grid gap-4 rounded-xl border border-stone-200 p-4 lg:grid-cols-[1fr_170px_1fr_24px] lg:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{product.productNameZh}</p>
                      <Badge>{product.platform}</Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      总分 {analysis.totalScore}，推荐方向 {analysis.direction}，下一步动作：{analysis.nextAction}
                    </p>
                  </div>
                  <Badge>{analysis.direction}</Badge>
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
        )}
      </div>
    </AppShell>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

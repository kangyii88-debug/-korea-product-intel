import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DecisionPill } from "@/components/decision-pill";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getDirectionFromMockProduct } from "@/lib/business-positioning";
import { getDisplayName } from "@/lib/local-products";
import { products } from "@/lib/mock-data";

export default function DecisionsPage() {
  const sorted = [...products].sort((a, b) => b.score - a.score);
  const directions = sorted.map((product) => getDirectionFromMockProduct(product));

  return (
    <AppShell>
      <PageHeader
        eyebrow="AI Decision Center"
        title="AI 决策中心"
        description="统一判断商品是否适合 Rocket Growth、PB、双向推进、继续观察或放弃。"
      />
      <div className="mx-auto max-w-7xl space-y-6 px-5 py-6 sm:px-8">
        <div className="grid gap-4 md:grid-cols-5">
          <MetricCard label="Rocket Growth" value={`${directions.filter((item) => item === "Rocket Growth").length}`} note="适合先进入 Rocket Growth" tone="good" />
          <MetricCard label="PB" value={`${directions.filter((item) => item === "PB").length}`} note="适合进入 PB 供应链评估" />
          <MetricCard label="Rocket Growth + PB" value={`${directions.filter((item) => item === "Rocket Growth + PB").length}`} note="双向候选" tone="good" />
          <MetricCard label="继续观察" value={`${directions.filter((item) => item === "继续观察").length}`} note="等待更多信号" tone="warn" />
          <MetricCard label="放弃" value={`${directions.filter((item) => item === "放弃").length}`} note="建议淘汰" tone="warn" />
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold">决策结果列表</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {sorted.map((product) => {
              const direction = getDirectionFromMockProduct(product);
              return (
                <Link
                  href={`/reports/${product.id}`}
                  key={product.id}
                  className="grid gap-4 rounded-md border p-4 transition-colors hover:bg-muted/40 lg:grid-cols-[1.3fr_170px_130px_130px_140px_24px] lg:items-center"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{getDisplayName(product.name)}</p>
                      <Badge>{product.platform}</Badge>
                      <Badge>{getDisplayName(product.category)}</Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      机会分 {product.score}，利润分 {product.marginScore}，风险分 {product.riskScore}。系统将按 Rocket Growth / PB 适配度进行分流。
                    </p>
                  </div>
                  <DecisionPill decision={direction} />
                  <Score label="机会分" value={product.score} />
                  <Score label="利润分" value={product.marginScore} />
                  <Score label="风险分" value={product.riskScore} reverse />
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function Score({ label, value, reverse = false }: { label: string; value: number; reverse?: boolean }) {
  const good = reverse ? value < 40 : value >= 70;
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <div className="h-2 w-20 rounded-full bg-muted">
          <div className={`h-2 rounded-full ${good ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${value}%` }} />
        </div>
        <span className="text-sm font-medium">{value}</span>
      </div>
    </div>
  );
}

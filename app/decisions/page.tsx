import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DecisionPill } from "@/components/decision-pill";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getDisplayName } from "@/lib/local-products";
import { products } from "@/lib/mock-data";

export default function DecisionsPage() {
  const sorted = [...products].sort((a, b) => b.score - a.score);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Module 05"
        title="AI 选品决策中心"
        description="把销量、评论、评分、价格、风险、毛利空间和开发难度合成最终选品动作。"
      />
      <div className="mx-auto max-w-7xl space-y-6 px-5 py-6 sm:px-8">
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard label="强烈建议开发" value={`${products.filter((p) => p.decision === "强烈建议开发").length}`} note="可进入供应商沟通" tone="good" />
          <MetricCard label="可以测试" value={`${products.filter((p) => p.decision === "可以测试").length}`} note="适合小批量验证" />
          <MetricCard label="继续观察" value={`${products.filter((p) => p.decision === "继续观察").length}`} note="等待趋势确认" tone="warn" />
          <MetricCard label="不建议开发" value={`${products.filter((p) => p.decision === "不建议开发").length}`} note="风险大于机会" tone="warn" />
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold">决策队列</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {sorted.map((product) => (
              <Link
                href={`/reports/${product.id}`}
                key={product.id}
                className="grid gap-4 rounded-md border p-4 transition-colors hover:bg-muted/40 lg:grid-cols-[1.3fr_130px_130px_130px_140px_24px] lg:items-center"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{getDisplayName(product.name)}</p>
                    <Badge>{product.platform}</Badge>
                    <Badge>{getDisplayName(product.category)}</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    机会分 {product.score}，毛利空间 {product.marginScore}，风险分 {product.riskScore}。下一步应由决策结论决定采购动作。
                  </p>
                </div>
                <DecisionPill decision={product.decision} />
                <Score label="机会" value={product.score} />
                <Score label="毛利" value={product.marginScore} />
                <Score label="风险" value={product.riskScore} reverse />
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
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

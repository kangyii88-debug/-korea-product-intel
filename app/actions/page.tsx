import Link from "next/link";
import { ArrowUpRight, CheckCircle2, CircleAlert, Clock3 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { mockReviews, products } from "@/lib/mock-data";
import { generateProductDecisionEngine } from "@/lib/product-decision-engine";
import { formatCurrency } from "@/lib/utils";

export default function ActionsPage() {
  const result = generateProductDecisionEngine(products, mockReviews);
  const topActions = result.profiles.slice(0, 8);

  return (
    <AppShell>
      <PageHeader
        eyebrow="SaaS Action Center"
        title="行动中心"
        description="把 AI 决策转成今天该做的动作：开发、测试、观察、放弃。"
      />
      <div className="mx-auto max-w-7xl space-y-6 px-5 py-6 sm:px-8">
        <section className="grid gap-4 md:grid-cols-4">
          <SummaryCard icon={<CheckCircle2 className="h-4 w-4" />} label="建议立即开发" value={topActions.filter((item) => item.action === "建议立即开发").length} />
          <SummaryCard icon={<ArrowUpRight className="h-4 w-4" />} label="建议小批量测试" value={topActions.filter((item) => item.action === "建议小批量测试").length} />
          <SummaryCard icon={<Clock3 className="h-4 w-4" />} label="建议观察" value={topActions.filter((item) => item.action === "建议观察").length} />
          <SummaryCard icon={<CircleAlert className="h-4 w-4" />} label="建议放弃" value={topActions.filter((item) => item.action === "建议放弃").length} />
        </section>

        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold">今日执行队列</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {topActions.map((profile) => (
              <Link
                key={profile.id}
                href={`/reports/${profile.productId}`}
                className="grid gap-4 rounded-md border p-4 transition-colors hover:bg-muted/40 lg:grid-cols-[1fr_120px_160px_160px_24px] lg:items-center"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{profile.productName}</p>
                    <Badge>{profile.platform}</Badge>
                    <Badge>{profile.developmentPriority}级</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{profile.nextStep}</p>
                </div>
                <Badge>{profile.action}</Badge>
                <div className="text-sm">
                  <p className="text-muted-foreground">建议采购</p>
                  <p className="mt-1 font-medium">{profile.suggestedFirstBatchQuantity} 件</p>
                </div>
                <div className="text-sm">
                  <p className="text-muted-foreground">售价 / 毛利</p>
                  <p className="mt-1 font-medium">
                    {formatCurrency(profile.suggestedSalePrice)} / {profile.estimatedMarginRate}%
                  </p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex items-center justify-between gap-3 text-muted-foreground">
        <p className="text-sm">{label}</p>
        {icon}
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

import { AppShell } from "@/components/app-shell";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { ProductTable } from "@/components/product-table";
import { Button } from "@/components/ui/button";
import { products } from "@/lib/mock-data";
import { formatNumber } from "@/lib/utils";

export default function Home() {
  const totalSales = products.reduce((sum, product) => sum + product.estimatedMonthlySales, 0);
  const developable = products.filter((product) => product.status === "可开发").length;
  const risky = products.filter((product) => product.decision === "不建议开发").length;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Module 01"
        title="爆款产品采集库"
        description="采集 Coupang、Naver Shopping、오늘의집、11번가、Gmarket、AliExpress Korea 的热销商品，筛出值得分析和开发的机会。"
        action={<Button>自动更新</Button>}
      />
      <div className="mx-auto max-w-7xl space-y-6 px-5 py-6 sm:px-8">
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard label="已采集商品" value={`${products.length}`} note="支持新增、批量导入、CSV导入、手动录入" />
          <MetricCard label="预计月销量" value={formatNumber(totalSales)} note="按当前采集样本汇总" tone="good" />
          <MetricCard label="可开发机会" value={`${developable}`} note="AI 判断供应链和评论痛点可切入" tone="good" />
          <MetricCard label="高风险商品" value={`${risky}`} note="季节性、售后或合规风险偏高" tone="warn" />
        </div>
        <ProductTable products={products} />
      </div>
    </AppShell>
  );
}

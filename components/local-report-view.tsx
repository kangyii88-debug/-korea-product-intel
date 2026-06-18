"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { analyzeProduct, getDisplayName, LOCAL_PRODUCTS_KEY, type LocalProduct } from "@/lib/local-products";
import { formatCurrency, formatNumber } from "@/lib/utils";

export function LocalReportView({ productId }: { productId: string }) {
  const [product, setProduct] = useState<LocalProduct | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(LOCAL_PRODUCTS_KEY);
    const products: LocalProduct[] = raw ? JSON.parse(raw) : [];
    setProduct(products.find((item) => item.id === productId) ?? null);
    setLoaded(true);
  }, [productId]);

  if (!loaded) return null;

  if (!product) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
        <div className="rounded-xl border bg-white p-10 text-center">
          <p className="text-lg font-semibold">没有找到这个商品</p>
          <p className="mt-3 text-sm text-muted-foreground">当前报告只读取你在本浏览器录入的真实商品数据。</p>
          <Link href="/" className="mt-6 inline-flex">
            <Button>返回产品工作台</Button>
          </Link>
        </div>
      </div>
    );
  }

  const analysis = analyzeProduct(product);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-5 py-6 sm:px-8">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        返回产品工作台
      </Link>

      <section className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <div className="space-y-4">
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border bg-muted">
            {product.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.image} alt={getDisplayName(product.name)} className="h-full w-full object-cover" />
            ) : (
              <div className="px-8 text-center text-sm text-muted-foreground">未填写图片 URL</div>
            )}
          </div>

          <Card title="基础信息">
            <Info label="平台" value={product.platform} />
            <Info label="品牌" value={product.brand || "未填写"} />
            <Info label="类目" value={product.category} />
            <Info label="尺寸" value={product.size || "未填写"} />
            <Info label="颜色" value={product.colors.join(", ") || "未填写"} />
            <Info label="材质" value={product.material || "未填写"} />
            <Info label="配送方式" value={product.deliveryType || "未填写"} />
          </Card>
        </div>

        <div className="space-y-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <DecisionBadge decision={analysis.decision} />
              <Badge>{analysis.grade}级</Badge>
              <Badge>风险：{analysis.riskLevel}</Badge>
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">{getDisplayName(product.name)}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              系统根据你录入的销量、评论、评分、价格和差评文本生成以下判断。数据越完整，结论越可靠。
            </p>
            {product.url ? (
              <a href={product.url} target="_blank" className="mt-3 inline-flex items-center gap-2 text-sm text-slate-700 underline" rel="noreferrer">
                查看原商品链接
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Metric label="机会指数" value={`${analysis.totalScore}`} note={`${analysis.grade}级 · ${analysis.decision}`} />
            <Metric label="折扣价" value={formatCurrency(product.discountPrice)} note={`原价 ${formatCurrency(product.price)}`} />
            <Metric label="预计月销量" value={formatNumber(product.estimatedMonthlySales)} note={`类目排名 #${product.rank || "-"}`} />
            <Metric label="预计利润率" value={`${analysis.estimatedMarginRate}%`} note={`建议售价 ${formatCurrency(analysis.suggestedSalePrice)}`} />
          </div>

          <Card title="AI 最终结论">
            <div className="grid gap-3 md:grid-cols-2">
              <Box label="这个产品能不能做" value={analysis.decision} />
              <Box label="建议采购价" value={formatCurrency(analysis.suggestedPurchasePrice)} />
              <Box label="建议销售价" value={formatCurrency(analysis.suggestedSalePrice)} />
              <Box label="建议测试数量" value={`${analysis.suggestedTestQuantity} 件`} />
            </div>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card title="评分依据">
          <Score label="市场需求" value={analysis.marketDemand} />
          <Score label="利润空间" value={analysis.profitMargin} />
          <Score label="竞争强度" value={analysis.competition} />
          <Score label="评论质量" value={analysis.reviewQuality} />
          <Score label="差评优化空间" value={analysis.optimizationSpace} />
          <Score label="物流友好度" value={analysis.logisticsFriendliness} />
          <Score label="供应链可行性" value={analysis.supplyChainFit} />
        </Card>

        <Card title="为什么这样判断">
          <List items={analysis.reasons} />
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card title="最大机会">
          <List items={analysis.opportunities} />
        </Card>
        <Card title="最大风险">
          <List items={analysis.risks} />
        </Card>
        <Card title="差评问题与优化建议">
          {analysis.negativeIssues.length ? (
            <div className="space-y-3">
              {analysis.negativeIssues.map((issue) => (
                <div key={issue.label} className="rounded-md border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{issue.label}</p>
                    <Badge>{issue.count} 次</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{issue.suggestion}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm leading-6 text-muted-foreground">还没有导入差评文本。建议粘贴 20 条以上评论，系统会自动归类尺寸、安装、颜色、包装、物流、质量等问题。</p>
          )}
        </Card>
      </section>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-white">
      <div className="border-b px-4 py-3">
        <h3 className="text-base font-semibold">{title}</h3>
      </div>
      <div className="space-y-3 p-4">{children}</div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b pb-2 text-sm last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{note}</p>
    </div>
  );
}

function Box({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-semibold">{value}</p>
    </div>
  );
}

function Score({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-slate-900" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
      {items.map((item) => (
        <li key={item}>• {item}</li>
      ))}
    </ul>
  );
}

function DecisionBadge({ decision }: { decision: string }) {
  const className =
    decision === "强烈建议开发"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : decision === "可以测试"
        ? "border-sky-200 bg-sky-50 text-sky-700"
        : decision === "继续观察"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-red-200 bg-red-50 text-red-700";

  return <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-sm font-semibold ${className}`}>{decision}</span>;
}

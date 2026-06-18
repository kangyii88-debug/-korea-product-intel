"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { analyzeProduct, loadLocalProducts, type LocalProduct } from "@/lib/local-products";

export default function DevelopmentPage() {
  const [products, setProducts] = useState<LocalProduct[]>([]);

  useEffect(() => {
    setProducts(loadLocalProducts());
  }, []);

  const candidates = useMemo(
    () =>
      products
        .map((product) => ({ product, analysis: analyzeProduct(product) }))
        .filter((item) => item.product.productDevelopmentDirection || item.product.sampleDevelopmentAdvice || item.product.categoryGapNote),
    [products],
  );

  return (
    <AppShell>
      <PageHeader
        eyebrow="Development Suggestions"
        title="产品开发建议"
        description="沉淀适合继续推进商品的开发方向、样品建议、包装改造点和供应商沟通要点。"
      />
      <div className="mx-auto max-w-7xl space-y-6 px-5 py-6 sm:px-8">
        {candidates.length === 0 ? (
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold">当前还没有产品开发建议</h2>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>没有真实商品和真实开发输入时，这里不会显示任何建议卡片。</p>
              <Link href="/products/new">
                <Button>新增测试商品</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {candidates.map(({ product, analysis }) => (
              <Card key={product.id}>
                <CardHeader>
                  <h2 className="text-base font-semibold">{product.productNameZh}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{analysis.direction}</p>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                  <p>开发方向：{product.productDevelopmentDirection || "-"}</p>
                  <p>样品建议：{product.sampleDevelopmentAdvice || "-"}</p>
                  <p>品类机会：{product.categoryGapNote || "-"}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

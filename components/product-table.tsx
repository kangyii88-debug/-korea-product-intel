"use client";

import Image from "next/image";
import Link from "next/link";
import { Bookmark, ChevronRight, Filter, Plus, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/types";
import { formatCurrency, formatNumber } from "@/lib/utils";

export function ProductTable({ products }: { products: Product[] }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border bg-white p-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {["平台", "类目", "销量", "评论", "评分", "价格"].map((filter) => (
            <button
              key={filter}
              className="flex h-9 items-center justify-between rounded-md border bg-white px-3 text-sm text-muted-foreground hover:bg-muted"
            >
              {filter}
              <Filter className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4" />
            CSV导入
          </Button>
          <Link
            href="/products/new"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            新增商品
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        <div className="grid grid-cols-[minmax(360px,1.4fr)_120px_120px_120px_120px_110px_56px] border-b bg-muted/50 px-4 py-3 text-xs font-medium text-muted-foreground">
          <span>商品</span>
          <span>平台</span>
          <span>销量</span>
          <span>评论/评分</span>
          <span>价格</span>
          <span>状态</span>
          <span />
        </div>
        {products.map((product) => (
          <Link
            href={`/reports/${product.id}`}
            key={product.id}
            className="grid grid-cols-[minmax(360px,1.4fr)_120px_120px_120px_120px_110px_56px] items-center border-b px-4 py-4 text-sm transition-colors last:border-b-0 hover:bg-muted/40"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-muted">
                <Image src={product.image} alt={product.name} fill className="object-cover" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{product.name}</p>
                  {product.bookmarked && <Bookmark className="h-3.5 w-3.5 fill-foreground" />}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {product.brand} · {product.category} · Rank #{product.rank}
                </p>
                <div className="mt-2 flex gap-1">
                  {product.keywords.slice(0, 3).map((keyword) => (
                    <Badge key={keyword}>{keyword}</Badge>
                  ))}
                </div>
              </div>
            </div>
            <span className="text-muted-foreground">{product.platform}</span>
            <span className="font-medium">{formatNumber(product.estimatedMonthlySales)}</span>
            <span>
              {formatNumber(product.reviewCount)}
              <span className="ml-1 text-muted-foreground">/ {product.rating}</span>
            </span>
            <span>{formatCurrency(product.discountPrice)}</span>
            <Badge
              className={
                product.status === "可开发"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : product.status === "不建议做"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : ""
              }
            >
              {product.status}
            </Badge>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}

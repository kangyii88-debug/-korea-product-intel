import { NextResponse } from "next/server";
import type { Platform, Product } from "@/lib/types";
import { saveProduct } from "@/lib/product-store";

export async function POST(request: Request) {
  const body = await request.json();
  const now = new Date().toISOString();

  const product: Product = {
    id: body.id || `manual-${Date.now()}`,
    platform: body.platform as Platform,
    url: body.url,
    image: body.image || "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?auto=format&fit=crop&w=900&q=80",
    name: body.name,
    brand: body.brand || "",
    category: body.category || "未分类",
    price: Number(body.price || 0),
    discountPrice: Number(body.discountPrice || body.price || 0),
    estimatedMonthlySales: Number(body.estimatedMonthlySales || 0),
    reviewCount: Number(body.reviewCount || 0),
    rating: Number(body.rating || 0),
    rank: Number(body.rank || 999),
    favorites: Number(body.favorites || 0),
    deliveryType: body.deliveryType || "",
    sellerType: body.sellerType || "",
    size: body.size || "",
    colors: split(body.colors),
    material: body.material || "",
    weight: body.weight || "",
    packageSize: body.packageSize || "",
    sellingPoints: split(body.sellingPoints),
    keywords: split(body.keywords),
    collectedAt: now,
    status: "待分析",
    bookmarked: false,
    decision: "继续观察",
    score: 0,
    marginScore: 0,
    riskScore: 50,
  };

  await saveProduct(product);

  return NextResponse.json({
    ok: true,
    product,
  });
}

function split(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value;
  return (value || "")
    .split(/[,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

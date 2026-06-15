import type { Product } from "@/lib/types";
import { createSupabaseBrowserClient } from "@/lib/supabase";

const memoryProducts: Product[] = [];

export async function saveProduct(product: Product) {
  memoryProducts.push(product);

  const supabase = createSupabaseBrowserClient();
  if (!supabase) return product;

  const { data: platform } = await supabase
    .from("platforms")
    .select("id")
    .eq("name", product.platform)
    .maybeSingle();

  const { data: insertedProduct } = await supabase
    .from("products")
    .insert({
      canonical_name: product.name,
      brand: product.brand,
      primary_image_url: product.image,
      status: "pending_analysis",
      decision: product.decision,
      bookmark: product.bookmarked,
      notes: product.keywords.join(", "),
    })
    .select("id")
    .single();

  if (insertedProduct) {
    await supabase.from("product_sources").insert({
      product_id: insertedProduct.id,
      platform_id: platform?.id,
      source_url: product.url,
      source_title: product.name,
      source_brand: product.brand,
      seller_type: product.sellerType,
      delivery_type: product.deliveryType,
      image_urls: [product.image],
      first_collected_at: product.collectedAt,
      last_collected_at: product.collectedAt,
    });

    await supabase.from("product_metrics").insert({
      product_id: insertedProduct.id,
      collected_at: product.collectedAt,
      price: product.price,
      discount_price: product.discountPrice,
      estimated_monthly_sales: product.estimatedMonthlySales,
      review_count: product.reviewCount,
      rating: product.rating,
      rank: product.rank,
      favorites: product.favorites,
      size: product.size,
      colors: product.colors,
      material: product.material,
      weight: product.weight,
      package_size: product.packageSize,
      selling_points: product.sellingPoints,
      keywords: product.keywords,
    });
  }

  return product;
}

export function getMemoryProducts() {
  return memoryProducts;
}

import type { CurtainIndustryDatabase } from "@/lib/types";
import { createSupabaseBrowserClient } from "@/lib/supabase";

export async function saveCurtainIndustryDatabase(database: CurtainIndustryDatabase) {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return database;

  if (database.profiles.length) {
    await supabase.from("curtain_product_profiles").upsert(
      database.profiles.map((profile) => ({
        id: isUuid(profile.id) ? profile.id : undefined,
        curtain_type: profile.curtainType,
        platform: profile.platform,
        product_name: profile.productName,
        brand: profile.brand,
        link: profile.link,
        image: profile.image,
        price: profile.price,
        discount_price: profile.discountPrice,
        rating: profile.rating,
        review_count: profile.reviewCount,
        review_growth: profile.reviewGrowth,
        sales_label: profile.salesLabel,
        colors: profile.colors,
        sizes: profile.sizes,
        material: profile.material,
        installation_method: profile.installationMethod,
        delivery_type: profile.deliveryType,
        seller_type: profile.sellerType,
        last_seen_at: profile.updatedAt,
        updated_at: profile.updatedAt,
      })),
      { onConflict: "platform,link" },
    );
  }

  await saveDimensionStats("curtain_size_stats", [
    ...database.sizeDatabase.hottest,
    ...database.sizeDatabase.fastestGrowing,
    ...database.sizeDatabase.mostNegative,
    ...database.sizeDatabase.mostReturned,
    ...database.sizeDatabase.recommended,
  ]);

  await saveDimensionStats("curtain_color_stats", [
    ...database.colorDatabase.hottest,
    ...database.colorDatabase.fastestGrowing,
    ...database.colorDatabase.mostNegative,
    ...database.colorDatabase.mostReturned,
    ...database.colorDatabase.recommended,
  ]);

  if (database.negativeCaseDatabase.length) {
    await supabase.from("curtain_negative_cases").insert(
      database.negativeCaseDatabase.flatMap((issue) =>
        issue.evidence.map((reviewText) => ({
          issue_type: issue.issueType,
          issue_label: issue.label,
          review_text: reviewText,
          sentiment: "negative",
          affects_purchase: issue.affectsPurchase,
          affects_repurchase: issue.affectsRepurchase,
          optimization_suggestion: issue.optimizationSuggestions[0],
        })),
      ),
    );
  }

  return database;
}

async function saveDimensionStats(table: "curtain_size_stats" | "curtain_color_stats", items: CurtainIndustryDatabase["sizeDatabase"]["hottest"]) {
  const supabase = createSupabaseBrowserClient();
  if (!supabase || !items.length) return;

  const deduped = [...new Map(items.map((item) => [item.value, item])).values()];
  await supabase.from(table).insert(
    deduped.map((item) => ({
      curtain_type: item.curtainType,
      [`${table === "curtain_size_stats" ? "size" : "color"}_value`]: item.value,
      product_count: item.productCount,
      estimated_sales: item.estimatedSales,
      review_count: item.reviewCount,
      negative_review_count: item.negativeReviewCount,
      return_mention_count: item.returnMentionCount,
      growth_score: item.growthScore,
      opportunity_score: item.opportunityScore,
      recommended_for_development: item.recommendedForDevelopment,
      reasons: item.reasons,
    })),
  );
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

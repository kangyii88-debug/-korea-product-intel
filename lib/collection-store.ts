import type { CollectionRunResult, CoupangCollectedProduct, ProductOpportunity } from "@/lib/types";
import { createSupabaseBrowserClient } from "@/lib/supabase";

const collectionRuns: CollectionRunResult[] = [];
const collectedProducts: CoupangCollectedProduct[] = [];
const opportunities: ProductOpportunity[] = [];

export async function saveCollectionRun(run: CollectionRunResult) {
  collectionRuns.push(run);
  collectedProducts.push(...run.collectedProducts);
  opportunities.push(...run.generatedOpportunities);

  const supabase = createSupabaseBrowserClient();
  if (!supabase) return run;

  await supabase.from("collection_runs").insert({
    id: run.id,
    started_at: run.startedAt,
    finished_at: run.finishedAt,
    duration_ms: run.durationMs,
    targets: run.targets,
    status: run.status,
    errors: run.errors,
    result_summary: {
      collectedProducts: run.collectedProducts.length,
      generatedOpportunities: run.generatedOpportunities.length,
    },
  });

  if (run.generatedOpportunities.length) {
    await supabase.from("product_opportunities").insert(
      run.generatedOpportunities.map((item) => ({
        id: item.id,
        product_id: null,
        product_name: item.productName,
        opportunity_type: item.type,
        opportunity_pool: item.pool,
        platform: item.platform,
        category: item.category,
        evidence: item.evidence,
        estimated_impact_score: item.estimatedImpactScore,
        opportunity_score: item.opportunityScore,
        opportunity_level: item.opportunityLevel,
        opportunity_reasons: item.opportunityReasons,
        why_worth_attention: item.whyWorthAttention,
        why_growing: item.whyGrowing,
        biggest_market_opportunity: item.biggestMarketOpportunity,
        biggest_risk: item.biggestRisk,
        china_supply_chain_fit: item.chinaSupplyChainFit,
        korea_market_fit: item.koreaMarketFit,
        test_fit: item.testFit,
        estimated_profit_margin: item.estimatedProfitMargin,
        competition_level: item.competitionLevel,
        development_difficulty: item.developmentDifficulty,
        risk_level: item.riskLevel,
        recommended_action: item.recommendedAction,
        discovered_at: item.discoveredAt,
        status: item.status,
      })),
    );
  }

  if (run.collectedProducts.length) {
    await supabase.from("collected_product_snapshots").insert(
      run.collectedProducts.map((item) => ({
        collection_run_id: run.id,
        platform: item.platform,
        source_url: item.sourceUrl,
        external_product_id: item.externalProductId,
        product_name: item.productName,
        link: item.link,
        price: item.price,
        discount_price: item.discountPrice,
        rating: item.rating,
        review_count: item.reviewCount,
        review_growth: item.reviewGrowth,
        sales_label: item.salesLabel,
        delivery_type: item.deliveryType,
        is_rocket: item.isRocket,
        images: item.images,
        title: item.title,
        detail_selling_points: item.detailSellingPoints,
        qna: item.qna,
        brand: item.brand,
        sizes: item.sizes,
        colors: item.colors,
        material: item.material,
        raw: item.raw,
        collected_at: item.collectedAt,
      })),
    );

    const curtainRecords = run.collectedProducts
      .map((item) => ({
        curtain_type: inferCurtainType(item.productName),
        product_name: item.productName,
        brand: item.brand,
        sizes: item.sizes,
        colors: item.colors,
        material: item.material,
        price: item.discountPrice ?? item.price,
        review_count: item.reviewCount,
        collected_at: item.collectedAt,
      }))
      .filter((item) => item.curtain_type);

    if (curtainRecords.length) {
      await supabase.from("curtain_industry_records").insert(curtainRecords);

      await supabase.from("curtain_product_profiles").upsert(
        run.collectedProducts
          .map((item) => ({
            curtain_type: inferCurtainType(item.productName),
            platform: item.platform,
            external_product_id: item.externalProductId,
            product_name: item.productName,
            brand: item.brand,
            link: item.link,
            image: item.images[0],
            price: item.price,
            discount_price: item.discountPrice,
            rating: item.rating,
            review_count: item.reviewCount,
            review_growth: item.reviewGrowth,
            sales_label: item.salesLabel,
            colors: item.colors,
            sizes: item.sizes,
            material: item.material,
            installation_method: inferInstallationMethod(item.productName, item.detailSellingPoints),
            delivery_type: item.deliveryType,
            seller_type: undefined,
            last_seen_at: item.collectedAt,
            updated_at: item.collectedAt,
          }))
          .filter((item) => item.curtain_type),
        { onConflict: "platform,link" },
      );
    }
  }

  return run;
}

export function getCollectionRuns() {
  return collectionRuns;
}

export function getCollectedProducts() {
  return collectedProducts;
}

export function getProductOpportunities() {
  return opportunities;
}

function inferCurtainType(name: string) {
  if (/蜂巢帘|honeycomb|허니콤/i.test(name)) return "honeycomb_blind";
  if (/百褶帘|pleated|플리츠/i.test(name)) return "pleated_blind";
  if (/卷帘|roller|롤스크린/i.test(name)) return "roller_blind";
  if (/斑马帘|zebra|콤비/i.test(name)) return "zebra_blind";
  if (/百叶帘|venetian|우드블라인드|알루미늄/i.test(name)) return "venetian_blind";
  if (/浴室帘|shower|샤워커튼/i.test(name)) return "bathroom_curtain";
  if (/配件|레일|브라켓|accessory/i.test(name)) return "curtain_accessory";
  return null;
}

function inferInstallationMethod(name: string, sellingPoints: string[]) {
  const text = `${name} ${sellingPoints.join(" ")}`;
  if (/免打孔|무타공|no drill/i.test(text)) return "免打孔";
  if (/打孔|나사|drill/i.test(text)) return "打孔安装";
  if (/粘贴|접착|adhesive/i.test(text)) return "粘贴安装";
  return "未识别";
}

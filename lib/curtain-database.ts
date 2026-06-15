import type {
  CurtainDatabaseStats,
  CurtainDimensionInsight,
  CurtainIndustryDatabase,
  CurtainProductProfile,
  CurtainType,
  Product,
  OpportunityPoolType,
  OpportunityLevel,
  CompetitionLevel,
  DevelopmentDifficulty,
  ProductOpportunity,
  ProductOpportunityType,
  ProductReview,
  Severity,
} from "@/lib/types";
import { analyzeReviews } from "@/lib/review-analysis";
import { discoverOpportunities } from "@/lib/opportunity-engine";

export function buildCurtainIndustryDatabase(products: Product[], reviews: ProductReview[]): CurtainIndustryDatabase {
  const profiles = products.filter(isCurtainProduct).map(toCurtainProfile);
  const curtainReviews = reviews.filter((review) => profiles.some((profile) => profile.id === review.productId));
  const negativeCaseDatabase = analyzeReviews(curtainReviews).filter((issue) =>
    ["size", "installation", "color", "material", "packaging", "logistics", "quality", "price"].includes(issue.issueType),
  );
  const opportunityDatabase = buildCurtainOpportunities(profiles, curtainReviews);

  return {
    stats: buildStats(profiles, curtainReviews, negativeCaseDatabase.length, opportunityDatabase.length),
    profiles,
    sizeDatabase: buildDimensionDatabase(profiles, curtainReviews, "sizes"),
    colorDatabase: buildDimensionDatabase(profiles, curtainReviews, "colors"),
    negativeCaseDatabase,
    opportunityDatabase,
  };
}

function toCurtainProfile(product: Product): CurtainProductProfile {
  return {
    id: product.id,
    curtainType: inferCurtainType(`${product.name} ${product.category} ${product.keywords.join(" ")}`),
    platform: product.platform,
    productName: product.name,
    brand: product.brand,
    link: product.url,
    image: product.image,
    price: product.price,
    discountPrice: product.discountPrice,
    rating: product.rating,
    reviewCount: product.reviewCount,
    reviewGrowth: estimateReviewGrowth(product),
    salesLabel: product.estimatedMonthlySales ? `월 ${product.estimatedMonthlySales} 예상 판매` : undefined,
    colors: product.colors,
    sizes: splitOptionValues(product.size),
    material: product.material,
    installationMethod: inferInstallationMethod(product),
    deliveryType: product.deliveryType,
    sellerType: product.sellerType,
    createdAt: product.collectedAt,
    updatedAt: new Date().toISOString(),
  };
}

function buildDimensionDatabase(
  profiles: CurtainProductProfile[],
  reviews: ProductReview[],
  field: "sizes" | "colors",
) {
  const insights = aggregateDimensionInsights(profiles, reviews, field);

  return {
    hottest: [...insights].sort((a, b) => b.estimatedSales - a.estimatedSales).slice(0, 20),
    fastestGrowing: [...insights].sort((a, b) => b.growthScore - a.growthScore).slice(0, 20),
    mostNegative: [...insights].sort((a, b) => b.negativeReviewCount - a.negativeReviewCount).slice(0, 20),
    mostReturned: [...insights].sort((a, b) => b.returnMentionCount - a.returnMentionCount).slice(0, 20),
    recommended: [...insights].filter((item) => item.recommendedForDevelopment).sort((a, b) => b.opportunityScore - a.opportunityScore).slice(0, 20),
  };
}

function aggregateDimensionInsights(
  profiles: CurtainProductProfile[],
  reviews: ProductReview[],
  field: "sizes" | "colors",
): CurtainDimensionInsight[] {
  const map = new Map<string, CurtainDimensionInsight>();

  profiles.forEach((profile) => {
    const values = profile[field].length ? profile[field] : ["unknown"];
    values.forEach((value) => {
      const key = normalizeDimensionValue(value);
      const productReviews = reviews.filter((review) => review.productId === profile.id);
      const negativeReviewCount = productReviews.filter((review) => review.rating <= 3 && mentionsDimension(review.text, key)).length;
      const returnMentionCount = productReviews.filter((review) => /退货|반품|返品|return/i.test(review.text) && mentionsDimension(review.text, key)).length;
      const current = map.get(key) ?? {
        value: key,
        curtainType: profile.curtainType,
        productCount: 0,
        estimatedSales: 0,
        reviewCount: 0,
        negativeReviewCount: 0,
        returnMentionCount: 0,
        growthScore: 0,
        opportunityScore: 0,
        recommendedForDevelopment: false,
        reasons: [],
      };

      current.productCount += 1;
      current.estimatedSales += estimateSalesFromLabel(profile.salesLabel);
      current.reviewCount += profile.reviewCount ?? 0;
      current.negativeReviewCount += negativeReviewCount;
      current.returnMentionCount += returnMentionCount;
      current.growthScore += profile.reviewGrowth ?? 0;
      current.opportunityScore =
        current.estimatedSales * 0.4 +
        current.growthScore * 2 +
        current.negativeReviewCount * 18 -
        current.productCount * 6;
      current.recommendedForDevelopment = current.estimatedSales > 0 || current.negativeReviewCount >= 1 || current.growthScore >= 10;
      current.reasons = buildDimensionReasons(field, current);
      map.set(key, current);
    });
  });

  return [...map.values()].filter((item) => item.value !== "unknown");
}

function buildCurtainOpportunities(profiles: CurtainProductProfile[], reviews: ProductReview[]): ProductOpportunity[] {
  return profiles
    .map((profile) => {
      const productReviews = reviews.filter((review) => review.productId === profile.id);
      const negativeCount = productReviews.filter((review) => review.rating <= 3).length;
      const sales = estimateSalesFromLabel(profile.salesLabel);
      const marginSignal = (profile.discountPrice ?? profile.price ?? 0) >= 25000 ? 18 : 8;
      const supplyChainSignal = /poly|fabric|aluminum|알루미늄|원단|布|铝|PVC/i.test(profile.material ?? "") ? 18 : 10;
      const score = sales * 0.4 + negativeCount * 20 + marginSignal + supplyChainSignal + (profile.reviewGrowth ?? 0);

      const type: ProductOpportunityType =
        negativeCount >= 2 ? "many_negative_reviews" : score >= 70 ? "curtain_development" : "growth_product";
      const pool: OpportunityPoolType = negativeCount >= 2 ? "optimization" : score >= 70 ? "innovation" : "growth";
      const opportunityLevel: OpportunityLevel = score >= 85 ? "S" : score >= 72 ? "A" : score >= 58 ? "B" : "C";
      const competitionLevel: CompetitionLevel = (profile.reviewCount ?? 0) > 5000 ? "高" : (profile.reviewCount ?? 0) > 1000 ? "中" : "低";
      const developmentDifficulty: DevelopmentDifficulty = negativeCount >= 5 ? "高" : negativeCount >= 2 ? "中" : "低";
      const riskLevel: Severity = negativeCount >= 5 ? "高" : negativeCount >= 2 ? "中" : "低";
      const recommendedAction: ProductOpportunity["recommendedAction"] =
        score >= 85 && negativeCount < 5 ? "立即测试开发" : score >= 70 ? "小批量测试" : score >= 58 ? "继续观察" : "放弃";

      return {
        id: `${profile.id}-curtain-db-opportunity`,
        productId: profile.id,
        productName: profile.productName,
        type,
        platform: profile.platform,
        evidence: [
          `窗饰分类：${profile.curtainType}`,
          `评论数：${profile.reviewCount ?? 0}`,
          `差评样本：${negativeCount}`,
          `价格带：${profile.discountPrice ?? profile.price ?? 0} KRW`,
        ],
        pool,
        estimatedImpactScore: Math.round(score),
        opportunityScore: {
          marketDemand: Math.min(100, Math.round(sales + (profile.reviewCount ?? 0) / 80)),
          competitionStrength: Math.min(100, Math.max(30, 90 - (profile.reviewCount ?? 0) / 120)),
          profitMargin: Math.min(100, Math.round(((profile.discountPrice ?? profile.price ?? 0) / 70000) * 70 + marginSignal)),
          negativeReviewOptimization: Math.min(100, negativeCount * 18),
          supplyChainFeasibility: supplyChainSignal >= 18 ? 82 : 64,
          logisticsFriendliness: profile.deliveryType?.toLowerCase().includes("rocket") ? 84 : 68,
          total: Math.round(score),
          reasons: [
            `窗饰分类：${profile.curtainType}`,
            `评论数 ${profile.reviewCount ?? 0}，差评样本 ${negativeCount}`,
            `价格带 ${profile.discountPrice ?? profile.price ?? 0} KRW`,
          ],
        },
        opportunityLevel,
        opportunityReasons: [
          `窗饰分类：${profile.curtainType}`,
          `评论数 ${profile.reviewCount ?? 0}，差评样本 ${negativeCount}`,
          negativeCount >= 2 ? "差评集中，存在优化切入空间。" : "需求信号存在，可继续观察增长。",
        ],
        whyWorthAttention: "属于窗饰行业数据库重点分类，可沉淀尺寸、颜色、材质和安装问题。",
        whyGrowing: profile.reviewGrowth ? `评论增长约 ${profile.reviewGrowth}。` : "增长需要继续采集历史评论和销量验证。",
        biggestMarketOpportunity: negativeCount >= 2 ? "通过解决差评问题切入已有需求。" : "围绕热销尺寸和颜色建立更完整 SKU。",
        biggestRisk: negativeCount >= 2 ? "差评问题若不解决，会影响购买和复购。" : "样本不足时可能误判真实需求。",
        chinaSupplyChainFit: supplyChainSignal >= 18,
        koreaMarketFit: (profile.reviewCount ?? 0) >= 100,
        testFit: score >= 70 && negativeCount < 5,
        estimatedProfitMargin: Math.max(0, Math.round(((profile.discountPrice ?? profile.price ?? 0) > 0 ? 34 : 0) + marginSignal / 2)),
        competitionLevel,
        developmentDifficulty,
        riskLevel,
        recommendedAction,
        discoveredAt: new Date().toISOString(),
        status: "new" as const,
      };
    })
    .filter((item) => item.estimatedImpactScore >= 30)
    .sort((a, b) => b.estimatedImpactScore - a.estimatedImpactScore)
    .slice(0, 1000);
}

function buildStats(
  profiles: CurtainProductProfile[],
  reviews: ProductReview[],
  negativeCases: number,
  opportunities: number,
): CurtainDatabaseStats {
  return {
    productProfilesTarget: 5000,
    reviewDatabaseTarget: 1000000,
    negativeCaseTarget: 10000,
    opportunityTarget: 1000,
    productProfiles: profiles.length,
    reviews: reviews.length,
    negativeCases,
    opportunities,
  };
}

function buildDimensionReasons(field: "sizes" | "colors", insight: CurtainDimensionInsight) {
  const label = field === "sizes" ? "尺寸" : "颜色";
  const reasons = [`${label} ${insight.value} 覆盖 ${insight.productCount} 个商品档案。`];
  if (insight.estimatedSales > 0) reasons.push(`估算销量信号 ${insight.estimatedSales}。`);
  if (insight.negativeReviewCount > 0) reasons.push(`相关差评 ${insight.negativeReviewCount} 条，可反向指导开发。`);
  if (insight.returnMentionCount > 0) reasons.push(`退货提及 ${insight.returnMentionCount} 次，需重点规避。`);
  return reasons;
}

function isCurtainProduct(product: Product) {
  return /蜂巢帘|百褶帘|斑马帘|卷帘|百叶帘|浴室帘|窗帘|blind|curtain|블라인드|커튼|허니콤|롤스크린|콤비/i.test(
    `${product.name} ${product.category} ${product.keywords.join(" ")}`,
  );
}

function inferCurtainType(text: string): CurtainType {
  if (/蜂巢帘|honeycomb|cellular|허니콤/i.test(text)) return "honeycomb_blind";
  if (/百褶帘|pleated|플리츠/i.test(text)) return "pleated_blind";
  if (/斑马帘|zebra|콤비/i.test(text)) return "zebra_blind";
  if (/卷帘|roller|롤스크린/i.test(text)) return "roller_blind";
  if (/百叶帘|venetian|우드블라인드|알루미늄/i.test(text)) return "venetian_blind";
  if (/浴室帘|shower|샤워커튼/i.test(text)) return "bathroom_curtain";
  return "curtain_accessory";
}

function splitOptionValues(value: string) {
  return value
    .split(/[,，/|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function inferInstallationMethod(product: Product) {
  const text = `${product.name} ${product.sellingPoints.join(" ")} ${product.keywords.join(" ")}`;
  if (/免打孔|무타공|no drill/i.test(text)) return "免打孔";
  if (/打孔|나사|drill/i.test(text)) return "打孔安装";
  if (/粘贴|접착|adhesive/i.test(text)) return "粘贴安装";
  return "未识别";
}

function estimateReviewGrowth(product: Product) {
  return Math.round(Math.max(1, product.reviewCount / 30) * (product.rating >= 4.4 ? 1.2 : 0.8));
}

function estimateSalesFromLabel(label?: string) {
  if (!label) return 0;
  const number = Number(label.match(/[0-9]+/)?.[0] ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function normalizeDimensionValue(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function mentionsDimension(text: string, value: string) {
  const compact = value.replace(/\s+/g, "");
  return text.includes(value) || (!!compact && text.replace(/\s+/g, "").includes(compact));
}

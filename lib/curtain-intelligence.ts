import type { CurtainIntelligence, CurtainType, Product, ProductReview, RankingItem } from "@/lib/types";
import { analyzeReviews } from "@/lib/review-analysis";

const curtainKeywords: Record<CurtainType, string[]> = {
  honeycomb_blind: ["蜂巢帘", "honeycomb", "cellular", "허니콤"],
  pleated_blind: ["百褶帘", "pleated", "플리츠"],
  roller_blind: ["卷帘", "roller", "롤스크린", "롤 블라인드"],
  zebra_blind: ["斑马帘", "zebra", "콤비블라인드"],
  venetian_blind: ["百叶帘", "venetian", "우드블라인드", "알루미늄블라인드"],
  bathroom_curtain: ["浴室帘", "shower curtain", "샤워커튼"],
  curtain_accessory: ["窗帘配件", "curtain accessory", "브라켓", "레일"],
};

export function generateCurtainIntelligence(products: Product[], reviews: ProductReview[]): CurtainIntelligence {
  const curtainProducts = products.filter(isCurtainProduct);
  const curtainReviews = reviews.filter((review) => curtainProducts.some((product) => product.id === review.productId));
  const issues = analyzeReviews(curtainReviews);

  return {
    curtainTypes: Object.keys(curtainKeywords) as CurtainType[],
    hotSizeRanking: rankText(curtainProducts.flatMap((product) => [product.size]), "热销尺寸"),
    hotColorRanking: rankText(curtainProducts.flatMap((product) => product.colors), "热销颜色"),
    hotMaterialRanking: rankText(curtainProducts.flatMap((product) => [product.material]), "热销材质"),
    hotPriceRanges: rankText(curtainProducts.map(getPriceRange), "热销价格区间"),
    reviewKeywordRanking: rankText(curtainReviews.flatMap(extractKeywords), "评论关键词"),
    negativeKeywordRanking: rankText(curtainReviews.filter((review) => review.rating <= 3).flatMap(extractKeywords), "差评关键词"),
    returnReasonRanking: issues.map((issue) => ({
      productId: "curtain-center",
      productName: issue.label,
      reason: issue.optimizationSuggestions[0],
      score: issue.count,
    })),
    developmentOpportunityRanking: curtainProducts
      .map((product) => ({
        productId: product.id,
        productName: product.name,
        reason: "窗饰品类优先看尺寸、颜色、材质和安装差评是否可被标准化解决",
        score: product.estimatedMonthlySales + product.favorites - product.riskScore * 100,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10),
  };
}

function isCurtainProduct(product: Product) {
  const text = `${product.name} ${product.category} ${product.keywords.join(" ")} ${product.sellingPoints.join(" ")}`.toLowerCase();
  return Object.values(curtainKeywords).flat().some((keyword) => text.includes(keyword.toLowerCase()));
}

function rankText(values: string[], reasonPrefix: string): RankingItem[] {
  const counts = new Map<string, number>();
  values
    .map((value) => value.trim())
    .filter(Boolean)
    .forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([value, count]) => ({
      productId: "curtain-center",
      productName: value,
      reason: `${reasonPrefix}出现 ${count} 次`,
      score: count,
    }));
}

function getPriceRange(product: Product) {
  const price = product.discountPrice;
  if (price < 10000) return "0-10,000 KRW";
  if (price < 30000) return "10,000-30,000 KRW";
  if (price < 60000) return "30,000-60,000 KRW";
  return "60,000 KRW+";
}

function extractKeywords(review: ProductReview) {
  return review.text
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 2)
    .slice(0, 12);
}

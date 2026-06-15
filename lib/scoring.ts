import type { AiScoreBreakdown, Decision, DecisionGrade, Product, ProductReview, ReviewIssueAnalysis } from "@/lib/types";

const weights = {
  marketDemand: 0.2,
  profitMargin: 0.2,
  competition: 0.15,
  reviewQuality: 0.15,
  reviewOptimizationSpace: 0.1,
  logisticsFriendliness: 0.1,
  supplyChainFeasibility: 0.1,
};

export function scoreProduct(product: Product, reviews: ProductReview[], issues: ReviewIssueAnalysis[]): AiScoreBreakdown {
  const marketDemand = clamp(
    product.estimatedMonthlySales / 160 + product.reviewCount / 180 + product.favorites / 400 - product.rank * 1.8,
  );
  const estimatedMarginRate = estimateMarginRate(product);
  const profitMargin = clamp(estimatedMarginRate * 1.35);
  const competition = clamp(100 - product.rank * 5 - Math.max(product.reviewCount - 5000, 0) / 250);
  const negativeRatio = reviews.length ? reviews.filter((review) => review.rating <= 3).length / reviews.length : 0.12;
  const reviewQuality = clamp(product.rating * 18 - negativeRatio * 35);
  const reviewOptimizationSpace = clamp(issues.reduce((sum, issue) => sum + issue.count * severityValue(issue.severity), 0) * 8);
  const logisticsFriendliness = scoreLogistics(product);
  const supplyChainFeasibility = scoreSupplyChain(product);

  const recommendationIndex = Math.round(
    marketDemand * weights.marketDemand +
      profitMargin * weights.profitMargin +
      competition * weights.competition +
      reviewQuality * weights.reviewQuality +
      reviewOptimizationSpace * weights.reviewOptimizationSpace +
      logisticsFriendliness * weights.logisticsFriendliness +
      supplyChainFeasibility * weights.supplyChainFeasibility,
  );

  const grade = getGrade(recommendationIndex);
  const finalDecision = getDecision(grade, product.riskScore, issues);

  return {
    marketDemand: Math.round(marketDemand),
    profitMargin: Math.round(profitMargin),
    competition: Math.round(competition),
    reviewQuality: Math.round(reviewQuality),
    reviewOptimizationSpace: Math.round(reviewOptimizationSpace),
    logisticsFriendliness: Math.round(logisticsFriendliness),
    supplyChainFeasibility: Math.round(supplyChainFeasibility),
    recommendationIndex,
    grade,
    finalDecision,
    reasons: [
      `市场需求分 ${Math.round(marketDemand)} 来自月销量 ${product.estimatedMonthlySales}、评论数 ${product.reviewCount}、排名 #${product.rank}。`,
      `利润空间分 ${Math.round(profitMargin)} 来自折扣价、建议采购价和预计毛利率。`,
      `评论质量分 ${Math.round(reviewQuality)} 来自评分 ${product.rating} 和负面评论占比。`,
      `差评优化空间分 ${Math.round(reviewOptimizationSpace)} 来自 ${issues.length} 类可改进问题。`,
      `最终推荐指数按 20/20/15/15/10/10/10 权重计算，非随机评分。`,
    ],
  };
}

export function estimatePurchasePrice(product: Product) {
  const base = product.discountPrice * 0.38;
  const logisticsPenalty = product.weight.includes("kg") ? 1.08 : 1;
  return Math.round((base * logisticsPenalty) / 100) * 100;
}

export function estimateSalePrice(product: Product) {
  return Math.round((product.discountPrice * 0.98) / 100) * 100;
}

export function estimateMarginRate(product: Product) {
  const salePrice = estimateSalePrice(product);
  const purchasePrice = estimatePurchasePrice(product);
  const platformFee = salePrice * 0.12;
  const fulfillment = product.weight.includes("2.") ? 4200 : product.weight.includes("0.") ? 2500 : 3200;
  return Math.max(0, Math.round(((salePrice - purchasePrice - platformFee - fulfillment) / salePrice) * 100));
}

function scoreLogistics(product: Product) {
  const packageText = `${product.weight} ${product.packageSize}`.toLowerCase();
  let score = 82;
  if (packageText.includes("2.") || packageText.includes("45")) score -= 18;
  if (packageText.includes("0.")) score += 8;
  if (product.deliveryType.toLowerCase().includes("rocket") || product.deliveryType.includes("오늘")) score += 6;
  return clamp(score);
}

function scoreSupplyChain(product: Product) {
  let score = 72;
  const text = `${product.material} ${product.category} ${product.keywords.join(" ")}`;
  if (/ABS|PP|硅油纸|铝合金|poly|plastic/i.test(text)) score += 12;
  if (/电池|认证|家电|battery/i.test(text)) score -= 22;
  if (/窗帘|帘|blind|curtain|收纳|厨房/.test(text)) score += 8;
  return clamp(score);
}

function severityValue(severity: string) {
  if (severity === "高") return 3;
  if (severity === "中") return 2;
  return 1;
}

function getGrade(score: number): DecisionGrade {
  if (score >= 82) return "S";
  if (score >= 70) return "A";
  if (score >= 58) return "B";
  return "C";
}

function getDecision(grade: DecisionGrade, riskScore: number, issues: ReviewIssueAnalysis[]): Decision {
  const highSeverityCount = issues.filter((issue) => issue.severity === "高").length;
  if (grade === "S" && riskScore < 55 && highSeverityCount <= 1) return "强烈建议开发";
  if (grade === "A") return "可以测试";
  if (grade === "B") return "继续观察";
  return "不建议开发";
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

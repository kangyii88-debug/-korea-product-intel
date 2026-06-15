import type {
  AiDevelopmentPlan,
  Product,
  ProductIntelligenceResult,
  ProductReview,
  ReviewIssueAnalysis,
  Severity,
} from "@/lib/types";
import { analyzeReviews } from "@/lib/review-analysis";
import { estimateMarginRate, estimatePurchasePrice, estimateSalePrice, scoreProduct } from "@/lib/scoring";

export function generateProductIntelligenceResult(
  product: Product,
  reviews: ProductReview[],
  version = 1,
  startedAt = Date.now(),
): ProductIntelligenceResult {
  const issues = analyzeReviews(reviews);
  const score = scoreProduct(product, reviews, issues);
  const worstIssue = issues[0];
  const purchasePrice = estimatePurchasePrice(product);
  const salePrice = estimateSalePrice(product);
  const marginRate = estimateMarginRate(product);
  const riskLevel = getRiskLevel(product.riskScore, issues);
  const developmentPlan = generateDevelopmentPlan(product, issues, version, purchasePrice, salePrice, marginRate, riskLevel);

  return {
    productId: product.id,
    generatedAt: new Date().toISOString(),
    analysisDurationMs: Date.now() - startedAt,
    version,
    whySellingWell: buildWhySellingWell(product),
    whyNotSellingWell: buildWhyNotSellingWell(product, issues),
    biggestPurchaseReason: inferPurchaseReason(product),
    biggestReturnReason: worstIssue
      ? `${worstIssue.label}：${worstIssue.optimizationSuggestions[0]}`
      : "当前评论样本未出现集中退货原因，需要继续导入评论验证。",
    biggestNegativeReviewReason: worstIssue
      ? `${worstIssue.label}出现 ${worstIssue.count} 次，占比 ${(worstIssue.ratio * 100).toFixed(1)}%。`
      : "当前负面样本不足，不能强行判断最大差评原因。",
    biggestCompetitiveAdvantage: inferCompetitiveAdvantage(product),
    biggestCompetitiveRisk: inferCompetitiveRisk(product, issues),
    suggestedPurchasePrice: purchasePrice,
    suggestedSalePrice: salePrice,
    suggestedTestQuantity: getSuggestedTestQuantity(score.recommendationIndex, product.estimatedMonthlySales),
    estimatedMarginRate: marginRate,
    estimatedRiskLevel: riskLevel,
    finalDecision: score.finalDecision,
    decisionReason: score.reasons.join(" "),
    reviewIssues: issues,
    score,
    developmentPlan,
  };
}

function generateDevelopmentPlan(
  product: Product,
  issues: ReviewIssueAnalysis[],
  version: number,
  purchasePrice: number,
  salePrice: number,
  marginRate: number,
  riskLevel: Severity,
): AiDevelopmentPlan {
  const issueSuggestions = issues.flatMap((issue) => issue.optimizationSuggestions).slice(0, 6);
  const coreSellingPoints = [...new Set([...product.sellingPoints.slice(0, 3), ...issueSuggestions.slice(0, 2)])];

  return {
    productId: product.id,
    version,
    positioning: `${product.category} 中解决 "${product.sellingPoints[0] ?? product.keywords[0]}" 的升级款，不做低价同款。`,
    targetCustomer: inferTargetCustomer(product),
    coreSellingPoints,
    suggestedSizes: inferSuggestedSizes(product, issues),
    suggestedColors: product.colors.length ? product.colors : ["White", "Cream", "Gray"],
    suggestedMaterial: product.material,
    suggestedPackaging: ["外箱加强抗压", "韩文说明卡", "关键规格贴纸前置"],
    suggestedSalePrice: salePrice,
    suggestedPurchasePrice: purchasePrice,
    suggestedFirstBatchQuantity: getFirstBatchQuantity(product, riskLevel),
    estimatedMarginRate: marginRate,
    estimatedPaybackCycleDays: marginRate >= 35 ? 35 : 55,
    developmentDifficulty: product.riskScore >= 65 ? "高" : product.riskScore >= 40 ? "中" : "低",
    riskLevel,
    finalDevelopmentAdvice: riskLevel === "高" ? "继续观察" : marginRate >= 28 ? "可以测试" : "不建议开发",
    editable: true,
    exportableToPdf: true,
  };
}

function buildWhySellingWell(product: Product) {
  return [
    `月销量约 ${product.estimatedMonthlySales}，说明需求不是单次偶发。`,
    `评论数 ${product.reviewCount} 且评分 ${product.rating}，已有足够购买验证。`,
    `核心卖点集中在 ${product.sellingPoints.slice(0, 3).join("、")}，用户能快速理解价值。`,
  ];
}

function buildWhyNotSellingWell(product: Product, issues: ReviewIssueAnalysis[]) {
  const result = [];
  if (product.rating < 4.4) result.push(`评分只有 ${product.rating}，会压低转化率。`);
  if (product.riskScore > 60) result.push(`风险分 ${product.riskScore}，可能存在认证、物流或售后压力。`);
  if (issues.length) result.push(`评论中 ${issues[0].label} 最集中，会直接影响购买信心。`);
  return result.length ? result : ["当前没有明显卖不好的主因，但仍需观察价格战和差评增长。"];
}

function inferPurchaseReason(product: Product) {
  return `${product.sellingPoints[0] ?? product.keywords[0]} 解决了 ${product.category} 用户的明确场景需求。`;
}

function inferCompetitiveAdvantage(product: Product) {
  if (product.deliveryType.toLowerCase().includes("rocket")) return "配送速度强，降低用户下单犹豫。";
  if (product.rank <= 3) return `平台排名 #${product.rank}，自然曝光和社会证明强。`;
  return `价格带 ${product.discountPrice} KRW，处在可小批量测试区间。`;
}

function inferCompetitiveRisk(product: Product, issues: ReviewIssueAnalysis[]) {
  if (product.reviewCount > 5000) return "头部竞品评论壁垒高，新品需要更强差异化。";
  if (issues.some((issue) => issue.severity === "高")) return "高频差评如果不改，会迅速变成退货和低分。";
  return "主要风险是同质化跟卖，必须通过规格、包装或内容做区别。";
}

function inferTargetCustomer(product: Product) {
  if (product.category.includes("家居") || product.keywords.some((keyword) => keyword.includes("收纳"))) {
    return "韩国小户型家庭、租房用户、重视整洁和省空间的用户。";
  }
  if (product.category.includes("厨房")) return "高频做饭、使用空气炸锅或需要减少清洁时间的家庭用户。";
  return "对功能明确、价格敏感但愿意为便利性付费的韩国电商用户。";
}

function inferSuggestedSizes(product: Product, issues: ReviewIssueAnalysis[]) {
  if (issues.some((issue) => issue.issueType === "size")) return [product.size, "增加小号/大号两个变体", "详情页展示实际测量图"];
  return [product.size];
}

function getFirstBatchQuantity(product: Product, riskLevel: Severity) {
  if (riskLevel === "高") return 100;
  if (product.estimatedMonthlySales > 8000) return 500;
  return 300;
}

function getSuggestedTestQuantity(score: number, monthlySales: number) {
  if (score >= 82) return Math.min(600, Math.max(300, Math.round(monthlySales * 0.05)));
  if (score >= 70) return 200;
  if (score >= 58) return 80;
  return 0;
}

function getRiskLevel(riskScore: number, issues: ReviewIssueAnalysis[]): Severity {
  if (riskScore >= 70 || issues.some((issue) => issue.severity === "高" && issue.affectsPurchase)) return "高";
  if (riskScore >= 40 || issues.length >= 3) return "中";
  return "低";
}

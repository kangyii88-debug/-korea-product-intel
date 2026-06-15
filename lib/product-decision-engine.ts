import type {
  CompetitionLevel,
  Decision,
  DecisionGrade,
  DevelopmentDifficulty,
  NewProductDiscoverySignal,
  NewProductDiscoverySignalType,
  Product,
  ProductDecisionAction,
  ProductDecisionEngineResult,
  ProductDecisionProfile,
  ProductDecisionRankingItem,
  ProductDecisionScoreBreakdown,
  ProductLifecycleForecast,
  ProductReview,
  ReviewIssueAnalysis,
  Severity,
} from "@/lib/types";
import { analyzeReviews } from "@/lib/review-analysis";
import { estimateMarginRate, estimatePurchasePrice, estimateSalePrice } from "@/lib/scoring";

export function generateProductDecisionEngine(products: Product[], reviews: ProductReview[]): ProductDecisionEngineResult {
  const profiles = products
    .map((product) => generateProductDecisionProfile(product, reviews.filter((review) => review.productId === product.id)))
    .sort((a, b) => b.productOpportunityIndex - a.productOpportunityIndex);

  return {
    generatedAt: new Date().toISOString(),
    bestProductToday: profiles.find((profile) => profile.canDo),
    profiles,
    rankings: {
      top100ProductOpportunities: rank(profiles, (profile) => profile.productOpportunityIndex),
      top100HighProfitProducts: rank(profiles, (profile) => profile.estimatedMarginRate),
      top100LowCompetitionProducts: rank(profiles, (profile) => profile.score.competitionStrength),
      top100NegativeReviewOptimizationProducts: rank(profiles, (profile) => profile.score.negativeReviewOptimization),
      top100ChinaSupplyChainProducts: rank(profiles, (profile) => profile.score.supplyChainFeasibility),
    },
    newProductDiscovery: discoverNewProductSignals(products, reviews),
  };
}

export function generateProductDecisionProfile(product: Product, reviews: ProductReview[]): ProductDecisionProfile {
  const issues = analyzeReviews(reviews);
  const score = scoreProductDecision(product, reviews, issues);
  const developmentPriority = getPriority(score.productOpportunityIndex);
  const riskLevel = getRiskLevel(product, issues, score);
  const decision = getDecision(developmentPriority, riskLevel, score);
  const action = getAction(decision);
  const suggestedSalePrice = estimateSalePrice(product);
  const suggestedPurchasePrice = estimatePurchasePrice(product);
  const estimatedMarginRate = estimateMarginRate(product);
  const suggestedFirstBatchQuantity = getFirstBatchQuantity(product, developmentPriority, riskLevel);
  const suggestedTestCycleDays = getTestCycleDays(developmentPriority, riskLevel);
  const estimatedPaybackCycleDays = getPaybackCycleDays(estimatedMarginRate, suggestedFirstBatchQuantity);
  const biggestIssue = issues[0];

  return {
    id: `${product.id}-decision-${new Date().toISOString().slice(0, 10)}`,
    productId: product.id,
    productName: product.name,
    platform: product.platform,
    category: product.category,
    generatedAt: new Date().toISOString(),
    productOpportunityIndex: score.productOpportunityIndex,
    developmentPriority,
    decision,
    action,
    canDo: decision === "强烈建议开发" || decision === "可以测试",
    why: buildWhy(product, score, issues),
    biggestOpportunity: biggestIssue
      ? `解决 ${biggestIssue.label}：${biggestIssue.optimizationSuggestions.join("、")}`
      : `利用 ${product.sellingPoints[0] ?? product.keywords[0]} 的明确需求做差异化版本。`,
    biggestRisk: buildBiggestRisk(product, issues, score),
    suggestedSalePrice,
    suggestedPurchasePrice,
    suggestedFirstBatchQuantity,
    suggestedTestCycleDays,
    estimatedMarginRate,
    estimatedPaybackCycleDays,
    score,
    lifecycleForecast: forecastLifecycle(product, reviews, issues, score),
    nextStep: buildNextStep(action, product, biggestIssue),
  };
}

function scoreProductDecision(product: Product, reviews: ProductReview[], issues: ReviewIssueAnalysis[]): ProductDecisionScoreBreakdown {
  const negativeReviews = reviews.filter((review) => review.rating <= 3);
  const negativeRatio = reviews.length ? negativeReviews.length / reviews.length : Math.max(0, (4.8 - product.rating) / 4.8);
  const returnMentions = reviews.filter((review) => /退货|반품|返品|return/i.test(review.text)).length;

  const marketDemand = clamp(product.estimatedMonthlySales / 140 + product.reviewCount / 150 + product.favorites / 380 - product.rank * 1.1);
  const competitionStrength = clamp(100 - product.rank * 4 - Math.max(product.reviewCount - 4500, 0) / 220);
  const profitMargin = clamp(estimateMarginRate(product) * 1.55);
  const logisticsDifficulty = clamp(100 - scoreLogisticsFriendliness(product));
  const supplyChainFeasibility = scoreSupplyChainFeasibility(product);
  const reviewQuality = clamp(product.rating * 18 - negativeRatio * 45);
  const negativeReviewOptimization = clamp(issues.reduce((sum, issue) => sum + issue.count * severityValue(issue.severity) * 9, 0));
  const returnRisk = clamp(returnMentions * 18 + negativeRatio * 55);
  const certificationRisk = scoreCertificationRisk(product);
  const seasonalityRisk = scoreSeasonalityRisk(product);

  const productOpportunityIndex = Math.round(
    marketDemand * 0.2 +
      competitionStrength * 0.13 +
      profitMargin * 0.17 +
      (100 - logisticsDifficulty) * 0.08 +
      supplyChainFeasibility * 0.1 +
      reviewQuality * 0.1 +
      negativeReviewOptimization * 0.1 +
      (100 - returnRisk) * 0.04 +
      (100 - certificationRisk) * 0.04 +
      (100 - seasonalityRisk) * 0.04,
  );

  return {
    marketDemand: Math.round(marketDemand),
    competitionStrength: Math.round(competitionStrength),
    profitMargin: Math.round(profitMargin),
    logisticsDifficulty: Math.round(logisticsDifficulty),
    supplyChainFeasibility: Math.round(supplyChainFeasibility),
    reviewQuality: Math.round(reviewQuality),
    negativeReviewOptimization: Math.round(negativeReviewOptimization),
    returnRisk: Math.round(returnRisk),
    certificationRisk: Math.round(certificationRisk),
    seasonalityRisk: Math.round(seasonalityRisk),
    productOpportunityIndex,
    reasons: [
      `市场需求来自月销量 ${product.estimatedMonthlySales}、评论数 ${product.reviewCount}、收藏 ${product.favorites}、排名 #${product.rank}。`,
      `利润空间来自建议售价、采购价、平台费用和履约成本估算，预计毛利率 ${estimateMarginRate(product)}%。`,
      `评论质量来自评分 ${product.rating}、负面评论占比 ${(negativeRatio * 100).toFixed(1)}%。`,
      `差评优化空间来自 ${issues.length} 类问题，退货风险来自 ${returnMentions} 条退货提及。`,
      `认证风险和季节风险会扣减最终产品机会指数。`,
    ],
  };
}

function forecastLifecycle(
  product: Product,
  reviews: ProductReview[],
  issues: ReviewIssueAnalysis[],
  score: ProductDecisionScoreBreakdown,
): ProductLifecycleForecast {
  const growthSignal = Math.round(product.reviewCount / 30 + product.favorites / 1200 + product.estimatedMonthlySales / 900);
  const riskSignal = issues.filter((issue) => issue.severity !== "低").length * 12 + score.returnRisk * 0.4 + score.seasonalityRisk * 0.3;
  const baseDemand = clamp(score.marketDemand + growthSignal * 0.5);

  return {
    days30: forecastWindow(baseDemand, riskSignal, 1, reviews.length ? "近期评论样本可用于短期判断。" : "短期需要补充评论样本。"),
    days90: forecastWindow(baseDemand, riskSignal, 0.92, "90 天重点看评论增长和价格变化。"),
    days180: forecastWindow(baseDemand, riskSignal, score.seasonalityRisk > 55 ? 0.72 : 0.86, "180 天会受到季节性和竞品跟进影响。"),
    days365: forecastWindow(baseDemand, riskSignal, score.seasonalityRisk > 55 ? 0.58 : 0.78, "365 天需要判断是否从短期爆款转为长期需求。"),
  };
}

function discoverNewProductSignals(products: Product[], reviews: ProductReview[]): NewProductDiscoverySignal[] {
  return products.flatMap((product) => {
    const productReviews = reviews.filter((review) => review.productId === product.id);
    const negativeReviews = productReviews.filter((review) => review.rating <= 3);
    const signals: NewProductDiscoverySignal[] = [];

    addSignal(signals, product, "new_growth_product", product.reviewCount < 500 && product.estimatedMonthlySales >= 3000, [
      `评论数 ${product.reviewCount} 仍低，但预计月销量 ${product.estimatedMonthlySales}。`,
    ]);
    addSignal(signals, product, "new_hot_product", product.rank <= 5 && product.estimatedMonthlySales >= 6000, [
      `排名 #${product.rank}，预计月销量 ${product.estimatedMonthlySales}。`,
    ]);
    addSignal(signals, product, "low_competition_product", product.rank >= 8 && product.reviewCount < 2500, [
      `排名 #${product.rank}，评论壁垒 ${product.reviewCount}，竞争压力较低。`,
    ]);
    addSignal(signals, product, "review_spike_product", product.reviewCount / 30 >= 50, [
      `估算日均评论增长 ${(product.reviewCount / 30).toFixed(0)}。`,
    ]);
    addSignal(signals, product, "negative_review_spike_product", negativeReviews.length >= 2, [
      `导入样本中差评 ${negativeReviews.length} 条，可进入优化机会池。`,
    ]);
    addSignal(signals, product, "price_increase_product", product.discountPrice / Math.max(product.price, 1) > 0.9, [
      "折扣幅度较低，可能存在价格上涨或高溢价空间。",
    ]);
    addSignal(signals, product, "price_decrease_product", product.discountPrice / Math.max(product.price, 1) < 0.75, [
      "折扣幅度较大，需要观察是否清库存或价格战。",
    ]);

    return signals;
  });
}

function addSignal(
  signals: NewProductDiscoverySignal[],
  product: Product,
  signalType: NewProductDiscoverySignalType,
  condition: boolean,
  evidence: string[],
) {
  if (!condition) return;
  signals.push({
    id: `${product.id}-${signalType}-${new Date().toISOString().slice(0, 10)}`,
    productId: product.id,
    productName: product.name,
    platform: product.platform,
    signalType,
    evidence,
    severity: signalType.includes("negative") || signalType.includes("price_decrease") ? "中" : "低",
    opportunityScore: signalType.includes("hot") || signalType.includes("growth") ? 82 : 68,
    discoveredAt: new Date().toISOString(),
    autoEnteredPool: signalType.includes("negative") ? "optimization" : signalType.includes("price") ? "supply_chain" : "growth",
  });
}

function rank(profiles: ProductDecisionProfile[], score: (profile: ProductDecisionProfile) => number): ProductDecisionRankingItem[] {
  return [...profiles]
    .sort((a, b) => score(b) - score(a))
    .slice(0, 100)
    .map((profile) => ({
      productId: profile.productId,
      productName: profile.productName,
      platform: profile.platform,
      category: profile.category,
      productOpportunityIndex: profile.productOpportunityIndex,
      developmentPriority: profile.developmentPriority,
      estimatedMarginRate: profile.estimatedMarginRate,
      competitionLevel: getCompetitionLevel(profile.score.competitionStrength),
      developmentDifficulty: getDevelopmentDifficulty(profile.score),
      riskLevel: getProfileRiskLevel(profile.score),
      action: profile.action,
      reason: profile.why,
    }));
}

function forecastWindow(baseDemand: number, riskSignal: number, multiplier: number, reason: string) {
  const expectedDemandIndex = Math.round(clamp(baseDemand * multiplier - riskSignal * 0.12));
  return {
    trend: expectedDemandIndex >= 72 ? "增长" : expectedDemandIndex <= 45 ? "下降" : "稳定",
    expectedDemandIndex,
    riskTrend: riskSignal >= 65 ? "风险升高" : riskSignal <= 28 ? "稳定" : "增长",
    reason,
  } as const;
}

function buildWhy(product: Product, score: ProductDecisionScoreBreakdown, issues: ReviewIssueAnalysis[]) {
  if (score.productOpportunityIndex >= 82) {
    return `可以做。产品机会指数 ${score.productOpportunityIndex}，需求、利润和供应链信号同时成立。`;
  }
  if (score.productOpportunityIndex >= 70) {
    return `可以小批量测试。产品机会指数 ${score.productOpportunityIndex}，但需要先处理 ${issues[0]?.label ?? "价格和内容差异化"}。`;
  }
  if (score.productOpportunityIndex >= 58) {
    return `先观察。产品机会指数 ${score.productOpportunityIndex}，数据还不足以支持立即开发。`;
  }
  return `不建议做。产品机会指数 ${score.productOpportunityIndex}，风险或竞争压力大于机会。`;
}

function buildBiggestRisk(product: Product, issues: ReviewIssueAnalysis[], score: ProductDecisionScoreBreakdown) {
  if (score.returnRisk >= 55) return "退货风险偏高，必须先解决详情页预期、尺寸、质量或安装问题。";
  if (score.certificationRisk >= 60) return "认证风险偏高，可能拉长开发周期并增加合规成本。";
  if (score.seasonalityRisk >= 65) return "季节风险偏高，容易错过销售窗口。";
  if (issues[0]) return `${issues[0].label} 是最大风险，会影响购买和复购。`;
  if (product.reviewCount > 5000) return "头部竞品评论壁垒较高，需要明显差异化。";
  return "最大风险是样本不足和同质化竞争。";
}

function buildNextStep(action: ProductDecisionAction, product: Product, issue?: ReviewIssueAnalysis) {
  if (action === "建议立即开发") return `马上找 2-3 家供应商报价，围绕 ${issue?.label ?? product.sellingPoints[0]} 做升级样。`;
  if (action === "建议小批量测试") return `先采购小批量测试，主图和详情页重点解释 ${issue?.label ?? "核心卖点"}。`;
  if (action === "建议观察") return "继续采集 14-30 天销量、评论增长和价格变化，再决定是否测试。";
  return "暂不进入开发，记录放弃原因并监控是否出现新增长信号。";
}

function getPriority(score: number): DecisionGrade {
  if (score >= 82) return "S";
  if (score >= 70) return "A";
  if (score >= 58) return "B";
  return "C";
}

function getDecision(priority: DecisionGrade, risk: Severity, score: ProductDecisionScoreBreakdown): Decision {
  if (priority === "S" && risk !== "高" && score.profitMargin >= 55) return "强烈建议开发";
  if (priority === "A" && risk !== "高") return "可以测试";
  if (priority === "B") return "继续观察";
  return "不建议开发";
}

function getAction(decision: Decision): ProductDecisionAction {
  if (decision === "强烈建议开发") return "建议立即开发";
  if (decision === "可以测试") return "建议小批量测试";
  if (decision === "继续观察") return "建议观察";
  return "建议放弃";
}

function getFirstBatchQuantity(product: Product, priority: DecisionGrade, risk: Severity) {
  if (risk === "高" || priority === "C") return 0;
  if (priority === "S") return Math.min(800, Math.max(300, Math.round(product.estimatedMonthlySales * 0.06)));
  if (priority === "A") return Math.min(300, Math.max(120, Math.round(product.estimatedMonthlySales * 0.03)));
  return 50;
}

function getTestCycleDays(priority: DecisionGrade, risk: Severity) {
  if (risk === "高") return 0;
  if (priority === "S") return 21;
  if (priority === "A") return 30;
  if (priority === "B") return 45;
  return 0;
}

function getPaybackCycleDays(marginRate: number, quantity: number) {
  if (!quantity || marginRate <= 0) return 0;
  if (marginRate >= 38) return 30;
  if (marginRate >= 28) return 45;
  return 70;
}

function getRiskLevel(product: Product, issues: ReviewIssueAnalysis[], score: ProductDecisionScoreBreakdown): Severity {
  if (product.riskScore >= 70 || score.returnRisk >= 70 || score.certificationRisk >= 70) return "高";
  if (product.riskScore >= 45 || issues.length >= 3 || score.seasonalityRisk >= 60) return "中";
  return "低";
}

function getProfileRiskLevel(score: ProductDecisionScoreBreakdown): Severity {
  if (score.returnRisk >= 70 || score.certificationRisk >= 70 || score.seasonalityRisk >= 75) return "高";
  if (score.returnRisk >= 40 || score.certificationRisk >= 45 || score.seasonalityRisk >= 55) return "中";
  return "低";
}

function getCompetitionLevel(score: number): CompetitionLevel {
  if (score >= 72) return "低";
  if (score >= 48) return "中";
  return "高";
}

function getDevelopmentDifficulty(score: ProductDecisionScoreBreakdown): DevelopmentDifficulty {
  if (score.logisticsDifficulty >= 65 || score.certificationRisk >= 65) return "高";
  if (score.logisticsDifficulty >= 42 || score.returnRisk >= 45) return "中";
  return "低";
}

function scoreLogisticsFriendliness(product: Product) {
  let score = 78;
  const text = `${product.weight} ${product.packageSize} ${product.deliveryType}`;
  if (/Rocket|로켓|오늘/i.test(text)) score += 8;
  if (/2\.|45|60|90|kg/i.test(text)) score -= 10;
  return clamp(score);
}

function scoreSupplyChainFeasibility(product: Product) {
  let score = 66;
  const text = `${product.name} ${product.category} ${product.material} ${product.keywords.join(" ")}`;
  if (/ABS|PP|PVC|poly|fabric|원단|알루미늄|铝|布|塑料|窗帘|帘|blind|curtain|收纳|厨房/i.test(text)) score += 20;
  if (/电池|battery|认证|家电/i.test(text)) score -= 25;
  return clamp(score);
}

function scoreCertificationRisk(product: Product) {
  const text = `${product.name} ${product.category} ${product.material} ${product.keywords.join(" ")}`;
  if (/电池|battery|전자|家电|儿童|식품|화장품/i.test(text)) return 75;
  if (/ABS|PP|PVC|铝|布|fabric|收纳|窗帘|帘/i.test(text)) return 25;
  return 42;
}

function scoreSeasonalityRisk(product: Product) {
  const text = `${product.name} ${product.category} ${product.keywords.join(" ")}`;
  if (/夏季|风扇|선풍기|겨울|난방|크리스마스|露营|캠핑/i.test(text)) return 72;
  if (/窗帘|帘|收纳|厨房|办公|블라인드|커튼/i.test(text)) return 28;
  return 45;
}

function severityValue(severity: Severity) {
  if (severity === "高") return 3;
  if (severity === "中") return 2;
  return 1;
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

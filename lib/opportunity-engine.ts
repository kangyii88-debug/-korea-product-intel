import type {
  CompetitionLevel,
  CoupangCollectedProduct,
  DevelopmentDifficulty,
  OpportunityCenterResult,
  OpportunityLevel,
  OpportunityRankingItem,
  OpportunityScoreBreakdown,
  Platform,
  Product,
  ProductOpportunity,
  ProductOpportunityType,
  ProductReview,
  ReviewIssueAnalysis,
  Severity,
} from "@/lib/types";
import { analyzeReviews } from "@/lib/review-analysis";
import { estimateMarginRate } from "@/lib/scoring";

type OpportunitySource = {
  productId: string;
  productName: string;
  platform: Platform;
  category?: string;
  price?: number;
  discountPrice?: number;
  rating?: number;
  reviewCount?: number;
  reviewGrowth?: number;
  estimatedMonthlySales?: number;
  rank?: number;
  favorites?: number;
  deliveryType?: string;
  material?: string;
  colors?: string[];
  sizes?: string[];
  keywords?: string[];
  riskScore?: number;
  sourceType: "product" | "collected";
};

export function discoverOpportunities(products: CoupangCollectedProduct[]): ProductOpportunity[] {
  return buildOpportunitiesFromSources(products.map(fromCollectedProduct), []);
}

export function generateOpportunityCenter(products: Product[], reviews: ProductReview[]): OpportunityCenterResult {
  const sources = products.map(fromProduct);
  const opportunities = buildOpportunitiesFromSources(sources, reviews);

  return {
    generatedAt: new Date().toISOString(),
    reports: opportunities.slice(0, 50).map(toReport),
    pools: {
      growth: opportunities.filter((item) => item.pool === "growth").slice(0, 50),
      optimization: opportunities.filter((item) => item.pool === "optimization").slice(0, 50),
      supplyChain: opportunities.filter((item) => item.pool === "supply_chain").slice(0, 50),
      innovation: opportunities.filter((item) => item.pool === "innovation").slice(0, 50),
    },
    rankings: {
      todayTop10: rank(opportunities, (item) => item.opportunityScore.total),
      weeklyTop10: rank(opportunities, (item) => item.opportunityScore.total + item.opportunityScore.marketDemand * 0.12),
      monthlyTop10: rank(opportunities, (item) => item.opportunityScore.total + item.estimatedProfitMargin * 0.2),
      productOpportunitiesTop10: rank(opportunities, (item) => item.opportunityScore.total),
      optimizationTop10: rank(opportunities.filter((item) => item.pool === "optimization"), (item) => item.opportunityScore.negativeReviewOptimization),
      profitTop10: rank(opportunities, (item) => item.estimatedProfitMargin + item.opportunityScore.profitMargin),
      curtainTop10: rank(opportunities.filter(isCurtainOpportunity), (item) => item.opportunityScore.total),
      chinaSupplyChainTop10: rank(opportunities.filter((item) => item.chinaSupplyChainFit), (item) => item.opportunityScore.supplyChainFeasibility),
    },
    curtainSpecial: {
      hotSizeOpportunities: opportunities.filter((item) => item.type === "size_opportunity").slice(0, 10),
      hotColorOpportunities: opportunities.filter((item) => item.type === "color_opportunity").slice(0, 10),
      hotMaterialOpportunities: opportunities.filter((item) => /材质|material|소재|재질/i.test(item.opportunityReasons.join(" "))).slice(0, 10),
      returnOptimizationOpportunities: opportunities.filter((item) => /退货|반품|return/i.test(item.opportunityReasons.join(" "))).slice(0, 10),
      installationOptimizationOpportunities: opportunities.filter((item) => item.type === "installation_optimization").slice(0, 10),
      packagingOptimizationOpportunities: opportunities.filter((item) => item.type === "packaging_optimization").slice(0, 10),
    },
  };
}

function buildOpportunitiesFromSources(sources: OpportunitySource[], reviews: ProductReview[]) {
  return sources
    .flatMap((source) => {
      const productReviews = reviews.filter((review) => review.productId === source.productId);
      const issues = analyzeReviews(productReviews);
      const candidates = detectOpportunityTypes(source, issues);
      return candidates.map((type) => buildOpportunity(source, type, issues, productReviews));
    })
    .sort((a, b) => b.opportunityScore.total - a.opportunityScore.total);
}

function buildOpportunity(
  source: OpportunitySource,
  type: ProductOpportunityType,
  issues: ReviewIssueAnalysis[],
  reviews: ProductReview[],
): ProductOpportunity {
  const score = scoreOpportunity(source, issues, reviews);
  const level = getOpportunityLevel(score.total);
  const estimatedProfitMargin = estimateOpportunityMargin(source);
  const competitionLevel = getCompetitionLevel(score.competitionStrength);
  const developmentDifficulty = getDevelopmentDifficulty(source, issues);
  const riskLevel = getRiskLevel(source, issues);
  const pool = getPool(type);
  const biggestIssue = issues[0];

  return {
    id: `${source.productId}-${type}`,
    productId: source.productId,
    productName: source.productName,
    type,
    pool,
    platform: source.platform,
    category: source.category,
    evidence: buildEvidence(source, type, issues),
    estimatedImpactScore: score.total,
    opportunityScore: score,
    opportunityLevel: level,
    opportunityReasons: score.reasons,
    whyWorthAttention: buildWorthAttentionReason(source, type),
    whyGrowing: buildGrowthReason(source),
    biggestMarketOpportunity: buildMarketOpportunity(source, type, biggestIssue),
    biggestRisk: buildBiggestRisk(source, issues),
    chinaSupplyChainFit: score.supplyChainFeasibility >= 70,
    koreaMarketFit: score.marketDemand >= 65 && score.logisticsFriendliness >= 55,
    testFit: score.total >= 70 && riskLevel !== "高",
    estimatedProfitMargin,
    competitionLevel,
    developmentDifficulty,
    riskLevel,
    recommendedAction: getRecommendedAction(level, riskLevel),
    discoveredAt: new Date().toISOString(),
    status: "new",
  };
}

function scoreOpportunity(source: OpportunitySource, issues: ReviewIssueAnalysis[], reviews: ProductReview[]): OpportunityScoreBreakdown {
  const marketDemand = clamp(
    (source.estimatedMonthlySales ?? 0) / 150 +
      (source.reviewCount ?? 0) / 160 +
      (source.favorites ?? 0) / 450 +
      (source.reviewGrowth ?? 0) * 1.5 -
      (source.rank ?? 20) * 1.2,
  );
  const competitionStrength = clamp(100 - (source.rank ?? 15) * 4 - Math.max((source.reviewCount ?? 0) - 4000, 0) / 250);
  const profitMargin = clamp(estimateOpportunityMargin(source) * 1.5);
  const negativeReviewOptimization = clamp(issues.reduce((sum, issue) => sum + issue.count * severityValue(issue.severity) * 8, 0));
  const supplyChainFeasibility = scoreSupplyChainFit(source);
  const logisticsFriendliness = scoreLogisticsFit(source);

  const total = Math.round(
    marketDemand * 0.25 +
      competitionStrength * 0.2 +
      profitMargin * 0.2 +
      negativeReviewOptimization * 0.15 +
      supplyChainFeasibility * 0.1 +
      logisticsFriendliness * 0.1,
  );

  return {
    marketDemand: Math.round(marketDemand),
    competitionStrength: Math.round(competitionStrength),
    profitMargin: Math.round(profitMargin),
    negativeReviewOptimization: Math.round(negativeReviewOptimization),
    supplyChainFeasibility: Math.round(supplyChainFeasibility),
    logisticsFriendliness: Math.round(logisticsFriendliness),
    total,
    reasons: [
      `市场需求 ${Math.round(marketDemand)}：由销量、评论数、评论增长、收藏和排名计算。`,
      `竞争强度 ${Math.round(competitionStrength)}：评论壁垒和排名越高，竞争分越低。`,
      `利润空间 ${Math.round(profitMargin)}：由售价区间、采购估算和履约成本推算。`,
      `差评优化空间 ${Math.round(negativeReviewOptimization)}：来自 ${issues.length} 类差评问题，非随机评分。`,
      `供应链可行性 ${Math.round(supplyChainFeasibility)}，物流友好度 ${Math.round(logisticsFriendliness)}。`,
      reviews.length ? `本次纳入 ${reviews.length} 条评论样本。` : "当前评论样本不足，后续应补充评论库验证。",
    ],
  };
}

function detectOpportunityTypes(source: OpportunitySource, issues: ReviewIssueAnalysis[]): ProductOpportunityType[] {
  const types = new Set<ProductOpportunityType>();
  if ((source.reviewGrowth ?? 0) >= 20 || (source.estimatedMonthlySales ?? 0) >= 5000) types.add("growth_product");
  if ((source.rank ?? 99) >= 8 && (source.reviewCount ?? 0) < 2500) types.add("low_competition");
  if (estimateOpportunityMargin(source) >= 28) types.add("high_profit");
  if ((source.reviewCount ?? 0) < 100) types.add("new_product");
  if (issues.length >= 2 || issues.some((issue) => issue.count >= 2)) types.add("many_negative_reviews");
  if (issues.some((issue) => issue.issueType === "size")) types.add("size_opportunity");
  if (issues.some((issue) => issue.issueType === "color")) types.add("color_opportunity");
  if (issues.some((issue) => issue.issueType === "installation")) types.add("installation_optimization");
  if (issues.some((issue) => issue.issueType === "packaging")) types.add("packaging_optimization");
  if (issues.some((issue) => issue.issueType === "quality" || issue.issueType === "material")) types.add("feature_upgrade");
  if (isCurtainSource(source)) types.add("curtain_development");
  return [...types];
}

function fromProduct(product: Product): OpportunitySource {
  return {
    productId: product.id,
    productName: product.name,
    platform: product.platform,
    category: product.category,
    price: product.price,
    discountPrice: product.discountPrice,
    rating: product.rating,
    reviewCount: product.reviewCount,
    reviewGrowth: Math.round(product.reviewCount / 30),
    estimatedMonthlySales: product.estimatedMonthlySales,
    rank: product.rank,
    favorites: product.favorites,
    deliveryType: product.deliveryType,
    material: product.material,
    colors: product.colors,
    sizes: [product.size],
    keywords: product.keywords,
    riskScore: product.riskScore,
    sourceType: "product",
  };
}

function fromCollectedProduct(product: CoupangCollectedProduct): OpportunitySource {
  return {
    productId: product.externalProductId ?? stableId(product.link),
    productName: product.productName,
    platform: product.platform,
    category: inferCategory(product),
    price: product.price,
    discountPrice: product.discountPrice,
    rating: product.rating,
    reviewCount: product.reviewCount,
    reviewGrowth: product.reviewGrowth,
    estimatedMonthlySales: inferSalesFromLabel(product.salesLabel),
    deliveryType: product.deliveryType,
    material: product.material,
    colors: product.colors,
    sizes: product.sizes,
    keywords: product.detailSellingPoints,
    sourceType: "collected",
  };
}

function toReport(opportunity: ProductOpportunity) {
  return {
    productName: opportunity.productName,
    platform: opportunity.platform,
    category: opportunity.category ?? "未分类",
    opportunityScore: opportunity.opportunityScore.total,
    opportunityLevel: opportunity.opportunityLevel,
    opportunityReasons: opportunity.opportunityReasons,
    whyWorthAttention: opportunity.whyWorthAttention,
    whyGrowing: opportunity.whyGrowing,
    biggestMarketOpportunity: opportunity.biggestMarketOpportunity,
    biggestRisk: opportunity.biggestRisk,
    chinaSupplyChainFit: opportunity.chinaSupplyChainFit,
    koreaMarketFit: opportunity.koreaMarketFit,
    testFit: opportunity.testFit,
  };
}

function rank(opportunities: ProductOpportunity[], score: (item: ProductOpportunity) => number): OpportunityRankingItem[] {
  return [...opportunities]
    .sort((a, b) => score(b) - score(a))
    .slice(0, 10)
    .map((item) => ({
      productId: item.productId,
      productName: item.productName,
      platform: item.platform,
      category: item.category,
      opportunityScore: item.opportunityScore.total,
      profitEstimate: item.estimatedProfitMargin,
      competitionLevel: item.competitionLevel,
      developmentDifficulty: item.developmentDifficulty,
      riskLevel: item.riskLevel,
      opportunityLevel: item.opportunityLevel,
      reason: item.opportunityReasons[0] ?? item.whyWorthAttention,
    }));
}

function buildEvidence(source: OpportunitySource, type: ProductOpportunityType, issues: ReviewIssueAnalysis[]) {
  const evidence = [
    `平台：${source.platform}`,
    `评论数：${source.reviewCount ?? 0}`,
    `评分：${source.rating ?? "未知"}`,
    `预计月销量：${source.estimatedMonthlySales ?? 0}`,
  ];
  if (source.reviewGrowth) evidence.push(`评论增长：${source.reviewGrowth}`);
  if (issues[0]) evidence.push(`最大问题：${issues[0].label} ${issues[0].count} 次`);
  evidence.push(`机会类型：${type}`);
  return evidence;
}

function buildWorthAttentionReason(source: OpportunitySource, type: ProductOpportunityType) {
  if (type === "growth_product") return "销量或评论增长信号明确，说明需求正在被市场验证。";
  if (type === "many_negative_reviews") return "销量存在但体验差评集中，说明有通过改良切入的空间。";
  if (type === "high_profit") return "价格带允许覆盖采购、履约和平台费用，具备利润测试价值。";
  if (type === "curtain_development") return "属于窗饰重点品类，可沉淀为韩国窗饰行业数据库资产。";
  return `${source.productName} 出现可被数据解释的机会信号，值得进入机会池。`;
}

function buildGrowthReason(source: OpportunitySource) {
  if ((source.reviewGrowth ?? 0) > 0) return `评论增长约 ${source.reviewGrowth}，说明近期购买反馈增加。`;
  if ((source.estimatedMonthlySales ?? 0) >= 5000) return `预计月销量 ${source.estimatedMonthlySales}，说明市场需求已经存在。`;
  return "当前增长需要继续补充销量历史和搜索量数据验证。";
}

function buildMarketOpportunity(source: OpportunitySource, type: ProductOpportunityType, issue?: ReviewIssueAnalysis) {
  if (issue) return `最大机会是解决 ${issue.label}，建议：${issue.optimizationSuggestions.join("、")}。`;
  if (type === "size_opportunity") return "最大机会是补齐热销尺寸和缺口尺寸，降低退货。";
  if (type === "color_opportunity") return "最大机会是增加韩国市场偏好的实拍颜色，降低色差投诉。";
  return "最大机会是用更清晰定位、更好供应链和更低风险测试切入现有需求。";
}

function buildBiggestRisk(source: OpportunitySource, issues: ReviewIssueAnalysis[]) {
  if (issues.some((issue) => issue.severity === "高")) return "高严重度差评会影响购买和复购，必须先改再测。";
  if ((source.reviewCount ?? 0) > 5000) return "头部竞品评论壁垒高，新品需要明显差异化。";
  if ((source.riskScore ?? 0) >= 65) return "产品风险分偏高，可能存在物流、售后或认证风险。";
  return "主要风险是同质化竞争和数据样本不足。";
}

function getPool(type: ProductOpportunityType) {
  if (type === "growth_product" || type === "new_product") return "growth";
  if (type === "many_negative_reviews" || type === "size_opportunity" || type === "color_opportunity" || type === "installation_optimization" || type === "packaging_optimization") return "optimization";
  if (type === "high_profit" || type === "low_competition") return "supply_chain";
  return "innovation";
}

function getOpportunityLevel(score: number): OpportunityLevel {
  if (score >= 85) return "S";
  if (score >= 72) return "A";
  if (score >= 58) return "B";
  return "C";
}

function getCompetitionLevel(score: number): CompetitionLevel {
  if (score >= 72) return "低";
  if (score >= 48) return "中";
  return "高";
}

function getDevelopmentDifficulty(source: OpportunitySource, issues: ReviewIssueAnalysis[]): DevelopmentDifficulty {
  if ((source.riskScore ?? 0) >= 65 || issues.some((issue) => issue.severity === "高")) return "高";
  if (/电池|家电|认证|battery/i.test(source.material ?? "")) return "高";
  if (issues.length >= 3) return "中";
  return "低";
}

function getRiskLevel(source: OpportunitySource, issues: ReviewIssueAnalysis[]): Severity {
  if ((source.riskScore ?? 0) >= 70 || issues.some((issue) => issue.severity === "高" && issue.affectsPurchase)) return "高";
  if ((source.riskScore ?? 0) >= 40 || issues.length >= 2) return "中";
  return "低";
}

function getRecommendedAction(level: OpportunityLevel, risk: Severity) {
  if (level === "S" && risk !== "高") return "立即测试开发";
  if (level === "A" && risk !== "高") return "小批量测试";
  if (level === "B") return "继续观察";
  return "放弃";
}

function estimateOpportunityMargin(source: OpportunitySource) {
  if (source.sourceType === "product") {
    return estimateMarginRate({
      discountPrice: source.discountPrice ?? source.price ?? 0,
      weight: "",
    } as Product);
  }

  const salePrice = source.discountPrice ?? source.price ?? 0;
  if (!salePrice) return 0;
  const purchase = salePrice * 0.38;
  const fee = salePrice * 0.12;
  const logistics = scoreLogisticsFit(source) >= 75 ? 2500 : 4200;
  return Math.max(0, Math.round(((salePrice - purchase - fee - logistics) / salePrice) * 100));
}

function scoreSupplyChainFit(source: OpportunitySource) {
  let score = 62;
  const text = `${source.productName} ${source.category ?? ""} ${source.material ?? ""} ${source.keywords?.join(" ") ?? ""}`;
  if (/ABS|PP|PVC|poly|fabric|원단|알루미늄|铝|布|塑料|窗帘|帘|blind|curtain/i.test(text)) score += 22;
  if (/电池|battery|认证|家电/i.test(text)) score -= 25;
  return clamp(score);
}

function scoreLogisticsFit(source: OpportunitySource) {
  let score = 76;
  if (/Rocket|로켓|오늘/i.test(source.deliveryType ?? "")) score += 8;
  if ((source.discountPrice ?? source.price ?? 0) > 70000) score -= 6;
  if (/卷帘|百叶|blind|curtain|블라인드/i.test(source.productName)) score -= 4;
  return clamp(score);
}

function severityValue(severity: Severity) {
  if (severity === "高") return 3;
  if (severity === "中") return 2;
  return 1;
}

function inferCategory(product: CoupangCollectedProduct) {
  if (isCurtainSource(fromCollectedProduct(product))) return "窗饰";
  return "未分类";
}

function inferSalesFromLabel(label?: string) {
  if (!label) return undefined;
  const value = Number(label.match(/[0-9,.]+/)?.[0]?.replace(/,/g, ""));
  return Number.isFinite(value) ? value : undefined;
}

function isCurtainOpportunity(item: ProductOpportunity) {
  return item.type === "curtain_development" || /窗饰|窗帘|帘|blind|curtain|블라인드|커튼/i.test(`${item.category ?? ""} ${item.productName}`);
}

function isCurtainSource(source: OpportunitySource) {
  return /蜂巢帘|百褶帘|卷帘|斑马帘|百叶帘|浴室帘|窗帘|blind|curtain|블라인드|커튼|허니콤|롤스크린|콤비/i.test(
    `${source.productName} ${source.category ?? ""} ${source.keywords?.join(" ") ?? ""}`,
  );
}

function stableId(input: string) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }
  return `collected-${Math.abs(hash)}`;
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

export type Platform =
  | "Coupang"
  | "Naver Shopping"
  | "오늘의집"
  | "11번가"
  | "Gmarket"
  | "AliExpress Korea";

export type ProductStatus =
  | "待分析"
  | "已分析"
  | "可开发"
  | "观察中"
  | "不建议做";

export type Decision = "强烈建议开发" | "可以测试" | "继续观察" | "不建议开发";

export type ProductDecisionAction = "建议立即开发" | "建议小批量测试" | "建议观察" | "建议放弃";

export type DecisionGrade = "S" | "A" | "B" | "C";

export type ReviewIssueType =
  | "size"
  | "material"
  | "installation"
  | "packaging"
  | "color"
  | "logistics"
  | "quality"
  | "price"
  | "manual"
  | "photo_mismatch";

export type Severity = "低" | "中" | "高";

export type Product = {
  id: string;
  platform: Platform;
  url: string;
  image: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  discountPrice: number;
  estimatedMonthlySales: number;
  reviewCount: number;
  rating: number;
  rank: number;
  favorites: number;
  deliveryType: string;
  sellerType: string;
  size: string;
  colors: string[];
  material: string;
  weight: string;
  packageSize: string;
  sellingPoints: string[];
  keywords: string[];
  collectedAt: string;
  status: ProductStatus;
  bookmarked: boolean;
  decision: Decision;
  score: number;
  marginScore: number;
  riskScore: number;
};

export type CoupangCollectedProduct = {
  platform: "Coupang";
  sourceUrl: string;
  externalProductId?: string;
  productName: string;
  link: string;
  price?: number;
  discountPrice?: number;
  rating?: number;
  reviewCount?: number;
  reviewGrowth?: number;
  salesLabel?: string;
  deliveryType?: string;
  isRocket: boolean;
  images: string[];
  title: string;
  detailSellingPoints: string[];
  qna: {
    question: string;
    answer?: string;
  }[];
  brand?: string;
  sizes: string[];
  colors: string[];
  material?: string;
  collectedAt: string;
  raw: {
    jsonLd?: unknown;
    meta: Record<string, string>;
    textSignals: string[];
  };
};

export type CollectionTaskTarget = {
  platform: Platform;
  url?: string;
  keyword?: string;
  category?: string;
  curtainType?: CurtainType;
};

export type CollectionRunResult = {
  id: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  targets: CollectionTaskTarget[];
  collectedProducts: CoupangCollectedProduct[];
  generatedOpportunities: ProductOpportunity[];
  status: "completed" | "partial" | "failed";
  errors: string[];
};

export type ProductReview = {
  id: string;
  productId: string;
  rating: number;
  text: string;
  language: "ko" | "zh" | "mixed";
  createdAt: string;
  source?: Platform;
};

export type ReviewCorpusStats = {
  totalReviews: number;
  koreanReviews: number;
  translatedChineseReviews: number;
  analyzedReviews: number;
  keywordExtractedReviews: number;
  sentimentAnalyzedReviews: number;
  issueClassifiedReviews: number;
  milestone: "10万" | "50万" | "100万";
};

export type ReviewIssueAnalysis = {
  issueType: ReviewIssueType;
  label: string;
  count: number;
  ratio: number;
  severity: Severity;
  affectsPurchase: boolean;
  affectsRepurchase: boolean;
  evidence: string[];
  optimizationSuggestions: string[];
};

export type AiScoreBreakdown = {
  marketDemand: number;
  profitMargin: number;
  competition: number;
  reviewQuality: number;
  reviewOptimizationSpace: number;
  logisticsFriendliness: number;
  supplyChainFeasibility: number;
  recommendationIndex: number;
  grade: DecisionGrade;
  finalDecision: Decision;
  reasons: string[];
};

export type ProductDecisionScoreBreakdown = {
  marketDemand: number;
  competitionStrength: number;
  profitMargin: number;
  logisticsDifficulty: number;
  supplyChainFeasibility: number;
  reviewQuality: number;
  negativeReviewOptimization: number;
  returnRisk: number;
  certificationRisk: number;
  seasonalityRisk: number;
  productOpportunityIndex: number;
  reasons: string[];
};

export type LifecycleTrend = "增长" | "下降" | "稳定" | "风险升高";

export type MarketTrendDirection = "增长" | "下降" | "稳定";

export type MarketGrowthLevel = "爆发" | "快速增长" | "稳步增长" | "观察";

export type MarketAlertType =
  | "new_hot_product"
  | "growth_product"
  | "high_risk_product"
  | "competition_intensified";

export type MarketAlert = {
  id: string;
  type: MarketAlertType;
  severity: Severity;
  title: string;
  message: string;
  productId?: string;
  platform?: Platform;
  createdAt: string;
  evidence: string[];
};

export type MarketSnapshot = {
  id: string;
  snapshotDate: string;
  platform: Platform | "ALL";
  category?: string;
  productCount: number;
  averagePrice: number;
  averageDiscountPrice: number;
  averageRating: number;
  totalReviewCount: number;
  totalEstimatedSales: number;
  averageRank: number;
  priceChangeIndex: number;
  reviewChangeIndex: number;
  rankChangeIndex: number;
};

export type ProductGrowthInsight = {
  productId: string;
  productName: string;
  platform: Platform;
  category: string;
  growthWindowDays: 7 | 30 | 90;
  growthSpeed: number;
  growthLevel: MarketGrowthLevel;
  growthReasons: string[];
};

export type MarketOpportunityRadar = {
  newOpportunities: string[];
  newTrends: string[];
  newCategories: string[];
  growingCategories: string[];
  decliningCategories: string[];
};

export type CurtainTrendCenter = {
  hotSizeTrends: RankingItem[];
  hotColorTrends: RankingItem[];
  hotMaterialTrends: RankingItem[];
  hotPriceTrends: RankingItem[];
};

export type BrandCompetitorInsight = {
  brand: string;
  platform?: Platform;
  productCount: number;
  estimatedSales: number;
  reviewGrowth: number;
  rankChangeIndex: number;
  priceChangeIndex: number;
  direction: MarketTrendDirection;
  reasons: string[];
};

export type CompetitorIntelligence = {
  growingBrands: BrandCompetitorInsight[];
  decliningBrands: BrandCompetitorInsight[];
  reviewGrowthLeaders: BrandCompetitorInsight[];
  rankingMovers: BrandCompetitorInsight[];
  priceMovers: BrandCompetitorInsight[];
};

export type MarketIntelligenceResult = {
  generatedAt: string;
  monitoredPlatforms: Platform[];
  snapshots: MarketSnapshot[];
  trendCenter: {
    fastestGrowing7Days: ProductGrowthInsight[];
    fastestGrowing30Days: ProductGrowthInsight[];
    fastestGrowing90Days: ProductGrowthInsight[];
  };
  opportunityRadar: MarketOpportunityRadar;
  curtainTrendCenter: CurtainTrendCenter;
  competitorIntelligence: CompetitorIntelligence;
  alerts: MarketAlert[];
  executiveBrief: {
    whatIsHappening: string[];
    growingProducts: string[];
    decliningProducts: string[];
    worthWatching: string[];
    worthDeveloping: string[];
    shouldAbandon: string[];
  };
};

export type ProductLifecycleForecast = {
  days30: {
    trend: LifecycleTrend;
    expectedDemandIndex: number;
    riskTrend: LifecycleTrend;
    reason: string;
  };
  days90: {
    trend: LifecycleTrend;
    expectedDemandIndex: number;
    riskTrend: LifecycleTrend;
    reason: string;
  };
  days180: {
    trend: LifecycleTrend;
    expectedDemandIndex: number;
    riskTrend: LifecycleTrend;
    reason: string;
  };
  days365: {
    trend: LifecycleTrend;
    expectedDemandIndex: number;
    riskTrend: LifecycleTrend;
    reason: string;
  };
};

export type ProductDecisionProfile = {
  id: string;
  productId: string;
  productName: string;
  platform: Platform;
  category: string;
  generatedAt: string;
  productOpportunityIndex: number;
  developmentPriority: DecisionGrade;
  decision: Decision;
  action: ProductDecisionAction;
  canDo: boolean;
  why: string;
  biggestOpportunity: string;
  biggestRisk: string;
  suggestedSalePrice: number;
  suggestedPurchasePrice: number;
  suggestedFirstBatchQuantity: number;
  suggestedTestCycleDays: number;
  estimatedMarginRate: number;
  estimatedPaybackCycleDays: number;
  score: ProductDecisionScoreBreakdown;
  lifecycleForecast: ProductLifecycleForecast;
  nextStep: string;
};

export type ProductDecisionRankingItem = {
  productId: string;
  productName: string;
  platform: Platform;
  category: string;
  productOpportunityIndex: number;
  developmentPriority: DecisionGrade;
  estimatedMarginRate: number;
  competitionLevel: CompetitionLevel;
  developmentDifficulty: DevelopmentDifficulty;
  riskLevel: Severity;
  action: ProductDecisionAction;
  reason: string;
};

export type NewProductDiscoverySignalType =
  | "new_growth_product"
  | "new_hot_product"
  | "low_competition_product"
  | "review_spike_product"
  | "negative_review_spike_product"
  | "price_increase_product"
  | "price_decrease_product";

export type NewProductDiscoverySignal = {
  id: string;
  productId: string;
  productName: string;
  platform: Platform;
  signalType: NewProductDiscoverySignalType;
  evidence: string[];
  severity: Severity;
  opportunityScore: number;
  discoveredAt: string;
  autoEnteredPool: OpportunityPoolType;
};

export type ProductDecisionEngineResult = {
  generatedAt: string;
  bestProductToday?: ProductDecisionProfile;
  profiles: ProductDecisionProfile[];
  rankings: {
    top100ProductOpportunities: ProductDecisionRankingItem[];
    top100HighProfitProducts: ProductDecisionRankingItem[];
    top100LowCompetitionProducts: ProductDecisionRankingItem[];
    top100NegativeReviewOptimizationProducts: ProductDecisionRankingItem[];
    top100ChinaSupplyChainProducts: ProductDecisionRankingItem[];
  };
  newProductDiscovery: NewProductDiscoverySignal[];
};

export type ProductIntelligenceResult = {
  productId: string;
  generatedAt: string;
  analysisDurationMs: number;
  version: number;
  whySellingWell: string[];
  whyNotSellingWell: string[];
  biggestPurchaseReason: string;
  biggestReturnReason: string;
  biggestNegativeReviewReason: string;
  biggestCompetitiveAdvantage: string;
  biggestCompetitiveRisk: string;
  suggestedPurchasePrice: number;
  suggestedSalePrice: number;
  suggestedTestQuantity: number;
  estimatedMarginRate: number;
  estimatedRiskLevel: Severity;
  finalDecision: Decision;
  decisionReason: string;
  reviewIssues: ReviewIssueAnalysis[];
  score: AiScoreBreakdown;
  developmentPlan: AiDevelopmentPlan;
};

export type AiDevelopmentPlan = {
  productId: string;
  version: number;
  positioning: string;
  targetCustomer: string;
  coreSellingPoints: string[];
  suggestedSizes: string[];
  suggestedColors: string[];
  suggestedMaterial: string;
  suggestedPackaging: string[];
  suggestedSalePrice: number;
  suggestedPurchasePrice: number;
  suggestedFirstBatchQuantity: number;
  estimatedMarginRate: number;
  estimatedPaybackCycleDays: number;
  developmentDifficulty: Severity;
  riskLevel: Severity;
  finalDevelopmentAdvice: Decision;
  editable: boolean;
  exportableToPdf: boolean;
};

export type RankingItem = {
  productId: string;
  productName: string;
  reason: string;
  score: number;
};

export type RankingSystem = {
  todayHotProducts: RankingItem[];
  weeklyHighPotentialProducts: RankingItem[];
  lowCompetitionHighProfitProducts: RankingItem[];
  highGrowthProducts: RankingItem[];
  optimizableNegativeReviewProducts: RankingItem[];
  chinaSupplyChainFitProducts: RankingItem[];
  highRiskProducts: RankingItem[];
};

export type CurtainType =
  | "honeycomb_blind"
  | "pleated_blind"
  | "roller_blind"
  | "zebra_blind"
  | "venetian_blind"
  | "bathroom_curtain"
  | "curtain_accessory";

export type CurtainIntelligence = {
  curtainTypes: CurtainType[];
  hotSizeRanking: RankingItem[];
  hotColorRanking: RankingItem[];
  hotMaterialRanking: RankingItem[];
  hotPriceRanges: RankingItem[];
  reviewKeywordRanking: RankingItem[];
  negativeKeywordRanking: RankingItem[];
  returnReasonRanking: RankingItem[];
  developmentOpportunityRanking: RankingItem[];
};

export type CurtainIndustryRecord = {
  id: string;
  curtainType: CurtainType;
  productId: string;
  productName: string;
  brand?: string;
  sizes: string[];
  colors: string[];
  material?: string;
  price?: number;
  reviewCount?: number;
  negativeReviewCount?: number;
  estimatedMonthlySales?: number;
  collectedAt: string;
};

export type CurtainProductProfile = {
  id: string;
  curtainType: CurtainType;
  platform: Platform;
  productName: string;
  brand?: string;
  link: string;
  image?: string;
  price?: number;
  discountPrice?: number;
  rating?: number;
  reviewCount?: number;
  reviewGrowth?: number;
  salesLabel?: string;
  colors: string[];
  sizes: string[];
  material?: string;
  installationMethod?: string;
  deliveryType?: string;
  sellerType?: string;
  createdAt: string;
  updatedAt: string;
};

export type CurtainDimensionInsight = {
  value: string;
  curtainType?: CurtainType;
  productCount: number;
  estimatedSales: number;
  reviewCount: number;
  negativeReviewCount: number;
  returnMentionCount: number;
  growthScore: number;
  opportunityScore: number;
  recommendedForDevelopment: boolean;
  reasons: string[];
};

export type CurtainDatabaseStats = {
  productProfilesTarget: 5000;
  reviewDatabaseTarget: 1000000;
  negativeCaseTarget: 10000;
  opportunityTarget: 1000;
  productProfiles: number;
  reviews: number;
  negativeCases: number;
  opportunities: number;
};

export type CurtainIndustryDatabase = {
  stats: CurtainDatabaseStats;
  profiles: CurtainProductProfile[];
  sizeDatabase: {
    hottest: CurtainDimensionInsight[];
    fastestGrowing: CurtainDimensionInsight[];
    mostNegative: CurtainDimensionInsight[];
    mostReturned: CurtainDimensionInsight[];
    recommended: CurtainDimensionInsight[];
  };
  colorDatabase: {
    hottest: CurtainDimensionInsight[];
    fastestGrowing: CurtainDimensionInsight[];
    mostNegative: CurtainDimensionInsight[];
    mostReturned: CurtainDimensionInsight[];
    recommended: CurtainDimensionInsight[];
  };
  negativeCaseDatabase: ReviewIssueAnalysis[];
  opportunityDatabase: ProductOpportunity[];
};

export type ProductOpportunityType =
  | "new_product"
  | "growth_product"
  | "low_competition"
  | "many_negative_reviews"
  | "high_profit"
  | "curtain_development"
  | "size_opportunity"
  | "color_opportunity"
  | "feature_upgrade"
  | "installation_optimization"
  | "packaging_optimization";

export type OpportunityPoolType =
  | "growth"
  | "optimization"
  | "supply_chain"
  | "innovation";

export type OpportunityLevel = "S" | "A" | "B" | "C";

export type CompetitionLevel = "低" | "中" | "高";

export type DevelopmentDifficulty = "低" | "中" | "高";

export type OpportunityScoreBreakdown = {
  marketDemand: number;
  competitionStrength: number;
  profitMargin: number;
  negativeReviewOptimization: number;
  supplyChainFeasibility: number;
  logisticsFriendliness: number;
  total: number;
  reasons: string[];
};

export type ProductOpportunity = {
  id: string;
  productId: string;
  productName: string;
  type: ProductOpportunityType;
  pool: OpportunityPoolType;
  platform: Platform;
  category?: string;
  evidence: string[];
  estimatedImpactScore: number;
  opportunityScore: OpportunityScoreBreakdown;
  opportunityLevel: OpportunityLevel;
  opportunityReasons: string[];
  whyWorthAttention: string;
  whyGrowing: string;
  biggestMarketOpportunity: string;
  biggestRisk: string;
  chinaSupplyChainFit: boolean;
  koreaMarketFit: boolean;
  testFit: boolean;
  estimatedProfitMargin: number;
  competitionLevel: CompetitionLevel;
  developmentDifficulty: DevelopmentDifficulty;
  riskLevel: Severity;
  recommendedAction: "立即测试开发" | "小批量测试" | "继续观察" | "放弃";
  discoveredAt: string;
  status: "new" | "analyzing" | "confirmed" | "rejected";
};

export type OpportunityReport = {
  productName: string;
  platform: Platform;
  category: string;
  opportunityScore: number;
  opportunityLevel: OpportunityLevel;
  opportunityReasons: string[];
  whyWorthAttention: string;
  whyGrowing: string;
  biggestMarketOpportunity: string;
  biggestRisk: string;
  chinaSupplyChainFit: boolean;
  koreaMarketFit: boolean;
  testFit: boolean;
};

export type OpportunityRankingItem = {
  productId: string;
  productName: string;
  platform: Platform;
  category?: string;
  opportunityScore: number;
  profitEstimate: number;
  competitionLevel: CompetitionLevel;
  developmentDifficulty: DevelopmentDifficulty;
  riskLevel: Severity;
  opportunityLevel: OpportunityLevel;
  reason: string;
};

export type OpportunityCenterResult = {
  generatedAt: string;
  reports: OpportunityReport[];
  pools: {
    growth: ProductOpportunity[];
    optimization: ProductOpportunity[];
    supplyChain: ProductOpportunity[];
    innovation: ProductOpportunity[];
  };
  rankings: {
    todayTop10: OpportunityRankingItem[];
    weeklyTop10: OpportunityRankingItem[];
    monthlyTop10: OpportunityRankingItem[];
    productOpportunitiesTop10: OpportunityRankingItem[];
    optimizationTop10: OpportunityRankingItem[];
    profitTop10: OpportunityRankingItem[];
    curtainTop10: OpportunityRankingItem[];
    chinaSupplyChainTop10: OpportunityRankingItem[];
  };
  curtainSpecial: {
    hotSizeOpportunities: ProductOpportunity[];
    hotColorOpportunities: ProductOpportunity[];
    hotMaterialOpportunities: ProductOpportunity[];
    returnOptimizationOpportunities: ProductOpportunity[];
    installationOptimizationOpportunities: ProductOpportunity[];
    packagingOptimizationOpportunities: ProductOpportunity[];
  };
};

export type AiAgentCode =
  | "data_collector"
  | "trend_analyzer"
  | "review_analyzer"
  | "product_developer"
  | "profit_risk"
  | "listing_optimizer";

export type AiVersionRecord<TOutput> = {
  id: string;
  productId: string;
  version: number;
  agentCode: AiAgentCode;
  inputSnapshot: unknown;
  output: TOutput;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
};

export type InsightReport = {
  productId: string;
  salesAnalysis: {
    whySelling: string[];
    priceAdvantage: string;
    salesTrend: string;
    seasonality: string;
    demandType: string;
  };
  competitorAdvantages: {
    title: string;
    mainImage: string;
    detailPage: string;
    function: string;
    size: string;
    color: string;
    brand: string;
    delivery: string;
  };
  reviewAnalysis: {
    likes: string[];
    dislikes: string[];
    purchaseReasons: string[];
    returnReasons: string[];
  };
  aiSummary: {
    worthDoing: string;
    why: string;
    biggestOpportunity: string;
    biggestRisk: string;
    suggestedPurchaseQty: string;
    suggestedTestMethod: string;
    finalDecision: Decision;
  };
  developmentAdvice: {
    positioning: string;
    productChanges: string[];
    packaging: string[];
    contentStrategy: string[];
    supplierQuestions: string[];
  };
  riskChecklist: {
    level: Severity;
    title: string;
    mitigation: string;
  }[];
};

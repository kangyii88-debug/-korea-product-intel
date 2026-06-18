"use client";

export type ProductStatus =
  | "新发现"
  | "待分析"
  | "分析中"
  | "待供应商报价"
  | "待利润测算"
  | "待风险确认"
  | "RG 候选"
  | "PB 候选"
  | "RG + PB 双向候选"
  | "准备转项目"
  | "已转入 RG/PB 项目系统"
  | "继续观察"
  | "已淘汰";

export type RecommendationDirection = "Rocket Growth" | "PB" | "Rocket Growth + PB" | "继续观察" | "放弃";

export type RiskRedlineLevel = "无红线" | "轻度风险" | "中度风险" | "高风险红线" | "禁止推进";
export type RiskLevel = "低" | "中" | "高";
export type ProfitSafetyResult = "通过" | "不通过";

export type RejectionReason =
  | "利润太低"
  | "认证风险高"
  | "物流成本太高"
  | "体积太大"
  | "重量太重"
  | "竞争太激烈"
  | "差评不可改进"
  | "供应链没有优势"
  | "市场需求不足"
  | "Coupang 不适合"
  | "PB 不适合"
  | "RG 不适合"
  | "其他";

export type GeneratedTask = {
  id: string;
  title: string;
  owner: string;
  dueLabel: string;
  dueDate: string;
  reason: string;
  status: "待执行" | "进行中" | "已完成";
};

export type TransferCheck = {
  ready: boolean;
  missing: string[];
};

export type ScoreDimension = {
  label: string;
  score: number;
  max: number;
  note: string;
};

export type LocalProduct = {
  id: string;
  platform: string;
  productNameKo: string;
  productNameZh: string;
  brand: string;
  category: string;
  competitorUrl: string;
  sourceUrl: string;
  image: string;
  owner: string;
  supplierQuoteCount: number;
  supplierNames: string[];
  price: number;
  discountPrice: number;
  competitorSalePriceKrw: number;
  targetSupplyPriceKrw: number;
  chinaCostRmb: number;
  internationalShippingKrw: number;
  koreaShippingKrw: number;
  coupangFeePercent: number;
  adCostKrw: number;
  returnLossKrw: number;
  otherCostKrw: number;
  estimatedMonthlySales: number;
  reviewCount: number;
  rating: number;
  rank: number;
  deliveryType: string;
  sellerType: string;
  size: string;
  colors: string[];
  material: string;
  weight: string;
  packageSize: string;
  sellingPoints: string[];
  keywords: string[];
  reviews: string[];
  marketAnalysis: string;
  priceRange: string;
  reviewSummary: string;
  consumerPainPoints: string;
  productDevelopmentDirection: string;
  recommendationReason: string;
  sampleDevelopmentAdvice: string;
  categoryGapNote: string;
  fileReferences: string[];
  notes: string;
  status: ProductStatus;
  rejectionReason?: RejectionReason;
  needsKcCertification: boolean;
  kcDocsReady: boolean;
  childrenProduct: boolean;
  foodProduct: boolean;
  electronicsProduct: boolean;
  cosmeticsProduct: boolean;
  medicalProduct: boolean;
  fragile: boolean;
  possibleHighReturn: boolean;
  uncertainRegulation: boolean;
  coupangRestricted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProductAnalysis = {
  totalScore: number;
  totalJudgement: "优先推进" | "可以推进" | "继续观察" | "不建议做";
  direction: RecommendationDirection;
  riskLevel: RiskLevel;
  riskRedlineLevel: RiskRedlineLevel;
  riskSummary: string;
  profitSafety: ProfitSafetyResult;
  profitSafetyNote: string;
  grossProfitKrw: number;
  grossMarginPercent: number;
  suggestedTargetSupplyPriceKrw: number;
  minimumAcceptableSupplyPriceKrw: number;
  scoreDimensions: ScoreDimension[];
  rgScore: number;
  rgJudgement: "强烈推荐 RG" | "可以作为 RG 候选" | "暂时不适合 RG" | "不建议 RG";
  pbScore: number;
  pbJudgement: "强烈推荐 PB" | "可以作为 PB 候选" | "暂时不适合 PB" | "不建议 PB";
  rgDimensions: ScoreDimension[];
  pbDimensions: ScoreDimension[];
  biggestOpportunity: string;
  biggestRisk: string;
  negativeIssues: {
    label: string;
    count: number;
    suggestion: string;
  }[];
  generatedTasks: GeneratedTask[];
  nextAction: string;
  transferCheckRg: TransferCheck;
  transferCheckPb: TransferCheck;
  statusSuggestions: ProductStatus[];
};

export const LOCAL_PRODUCTS_KEY = "kpi_local_products_v3";
export const LEGACY_LOCAL_PRODUCTS_KEY = "kpi_local_products_v1";
export const PREVIOUS_LOCAL_PRODUCTS_KEY = "kpi_local_products_v2";
const DATA_RESET_FLAG = "kpi_data_reset_2026_06_clean";
export const RMB_TO_KRW = 190;

export const platformOptions = ["Coupang", "Naver Shopping", "11st", "Gmarket", "AliExpress Korea"];

export const PRODUCT_STATUS_OPTIONS: ProductStatus[] = [
  "新发现",
  "待分析",
  "分析中",
  "待供应商报价",
  "待利润测算",
  "待风险确认",
  "RG 候选",
  "PB 候选",
  "RG + PB 双向候选",
  "准备转项目",
  "已转入 RG/PB 项目系统",
  "继续观察",
  "已淘汰",
];

export const REJECTION_REASONS: RejectionReason[] = [
  "利润太低",
  "认证风险高",
  "物流成本太高",
  "体积太大",
  "重量太重",
  "竞争太激烈",
  "差评不可改进",
  "供应链没有优势",
  "市场需求不足",
  "Coupang 不适合",
  "PB 不适合",
  "RG 不适合",
  "其他",
];

const DISPLAY_NAME_MAP = {
  BZG: {
    ko: "반차광 허니콤 블라인드",
    zh: "半遮光蜂巢帘",
  },
} as const;

export function getDisplayName(value: string, locale: "ko" | "zh" = "zh") {
  const normalized = value.trim();
  if (!normalized) return value;
  return DISPLAY_NAME_MAP[normalized as keyof typeof DISPLAY_NAME_MAP]?.[locale] ?? value;
}

export function loadLocalProducts(): LocalProduct[] {
  if (typeof window === "undefined") return [];

  performOneTimeLocalCleanup();

  const raw = window.localStorage.getItem(LOCAL_PRODUCTS_KEY);
  if (raw) {
    return normalizeProducts(JSON.parse(raw));
  }
  return [];
}

export function saveLocalProducts(products: LocalProduct[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(products));
}

export function upsertLocalProduct(product: LocalProduct) {
  const products = loadLocalProducts();
  const index = products.findIndex((item) => item.id === product.id);
  const next = [...products];

  if (index >= 0) {
    next[index] = { ...product, updatedAt: new Date().toISOString() };
  } else {
    next.unshift({ ...product, updatedAt: new Date().toISOString() });
  }

  saveLocalProducts(next);
  return next;
}

export function updateLocalProduct(
  productId: string,
  updater: (product: LocalProduct) => LocalProduct,
) {
  const products = loadLocalProducts();
  const next = products.map((product) =>
    product.id === productId ? { ...updater(product), updatedAt: new Date().toISOString() } : product,
  );
  saveLocalProducts(next);
  return next;
}

export function getProductById(productId: string) {
  return loadLocalProducts().find((item) => item.id === productId) ?? null;
}

export function buildProductFromForm(input: Record<string, FormDataEntryValue>): LocalProduct {
  const now = new Date().toISOString();
  const productNameKo = getDisplayName(String(input.productNameKo || input.productNameZh || input.name || "").trim(), "ko");
  const productNameZh = getDisplayName(String(input.productNameZh || input.productNameKo || input.name || "").trim(), "zh");

  const competitorSalePriceKrw = toNumber(input.competitorSalePriceKrw || input.discountPrice || input.price);
  const targetSupplyPriceKrw = toNumber(input.targetSupplyPriceKrw) || estimateTargetSupplyPrice(input);
  const chinaCostRmb = toNumber(input.chinaCostRmb) || Math.max(0, Math.round(targetSupplyPriceKrw / RMB_TO_KRW / 1.15));

  return {
    id: `product-${Date.now()}`,
    platform: String(input.platform || "Coupang"),
    productNameKo,
    productNameZh,
    brand: String(input.brand || "").trim(),
    category: String(input.category || "").trim(),
    competitorUrl: String(input.competitorUrl || input.url || "").trim(),
    sourceUrl: String(input.sourceUrl || input.url || "").trim(),
    image: String(input.image || "").trim(),
    owner: String(input.owner || "").trim() || "待分配",
    supplierQuoteCount: toNumber(input.supplierQuoteCount),
    supplierNames: splitList(String(input.supplierNames || "")),
    price: toNumber(input.price),
    discountPrice: toNumber(input.discountPrice || input.price),
    competitorSalePriceKrw,
    targetSupplyPriceKrw,
    chinaCostRmb,
    internationalShippingKrw: toNumber(input.internationalShippingKrw) || estimateInternationalShipping(input),
    koreaShippingKrw: toNumber(input.koreaShippingKrw) || 3200,
    coupangFeePercent: toNumber(input.coupangFeePercent) || 11.9,
    adCostKrw: toNumber(input.adCostKrw) || 500,
    returnLossKrw: toNumber(input.returnLossKrw) || 700,
    otherCostKrw: toNumber(input.otherCostKrw) || 300,
    estimatedMonthlySales: toNumber(input.estimatedMonthlySales),
    reviewCount: toNumber(input.reviewCount),
    rating: toNumber(input.rating),
    rank: toNumber(input.rank),
    deliveryType: String(input.deliveryType || "").trim(),
    sellerType: String(input.sellerType || "").trim(),
    size: String(input.size || "").trim(),
    colors: splitList(String(input.colors || "")),
    material: String(input.material || "").trim(),
    weight: String(input.weight || "").trim(),
    packageSize: String(input.packageSize || "").trim(),
    sellingPoints: splitList(String(input.sellingPoints || "")),
    keywords: splitList(String(input.keywords || "")),
    reviews: splitList(String(input.reviews || "")),
    marketAnalysis: String(input.marketAnalysis || "").trim(),
    priceRange: String(input.priceRange || "").trim(),
    reviewSummary: String(input.reviewSummary || "").trim(),
    consumerPainPoints: String(input.consumerPainPoints || "").trim(),
    productDevelopmentDirection: String(input.productDevelopmentDirection || "").trim(),
    recommendationReason: String(input.recommendationReason || "").trim(),
    sampleDevelopmentAdvice: String(input.sampleDevelopmentAdvice || "").trim(),
    categoryGapNote: String(input.categoryGapNote || "").trim(),
    fileReferences: splitList(String(input.fileReferences || "")),
    notes: String(input.notes || "").trim(),
    status: "新发现",
    needsKcCertification: isChecked(input.needsKcCertification),
    kcDocsReady: isChecked(input.kcDocsReady),
    childrenProduct: isChecked(input.childrenProduct),
    foodProduct: isChecked(input.foodProduct),
    electronicsProduct: isChecked(input.electronicsProduct),
    cosmeticsProduct: isChecked(input.cosmeticsProduct),
    medicalProduct: isChecked(input.medicalProduct),
    fragile: isChecked(input.fragile),
    possibleHighReturn: isChecked(input.possibleHighReturn),
    uncertainRegulation: isChecked(input.uncertainRegulation),
    coupangRestricted: isChecked(input.coupangRestricted),
    createdAt: now,
    updatedAt: now,
  };
}

export function normalizeProducts(input: unknown): LocalProduct[] {
  if (!Array.isArray(input)) return [];
  return input.map(normalizeLegacyProduct);
}

export function analyzeProduct(product: LocalProduct): ProductAnalysis {
  const negativeIssues = detectNegativeIssues(product.reviews);
  const riskSignals = buildRiskSignals(product, negativeIssues);
  const riskRedlineLevel = resolveRiskRedlineLevel(riskSignals);
  const riskLevel: RiskLevel =
    riskRedlineLevel === "高风险红线" || riskRedlineLevel === "禁止推进"
      ? "高"
      : riskRedlineLevel === "中度风险"
        ? "中"
        : "低";

  const grossProfitKrw = computeGrossProfit(product);
  const grossMarginPercent = computeGrossMargin(product, grossProfitKrw);
  const profitSafety = grossMarginPercent >= 20 ? "通过" : "不通过";
  const profitSafetyNote = describeProfitSafety(grossMarginPercent);
  const suggestedTargetSupplyPriceKrw = getSupplyPriceForMargin(product, 35);
  const minimumAcceptableSupplyPriceKrw = getSupplyPriceForMargin(product, 20);

  const marketDemand = clampScore(
    Math.round(product.estimatedMonthlySales / 250 + product.reviewCount / 500 + product.rating * 2.4),
    0,
    20,
  );
  const competitionOpportunity = clampScore(
    Math.round(
      12 -
        Math.min(product.rank || 8, 8) +
        Math.min(product.estimatedMonthlySales / 1000, 4) -
        Math.min(Math.max(product.reviewCount - 1500, 0) / 1000, 4),
    ),
    0,
    15,
  );
  const profitSpace = clampScore(Math.round(Math.max(grossMarginPercent, 0) / 2.2), 0, 20);
  const certificationSafety = clampScore(15 - riskSignals.certificationPenalty, 0, 15);
  const logisticsSafety = clampScore(10 - riskSignals.logisticsPenalty, 0, 10);
  const reviewImprovement = clampScore(
    negativeIssues.length === 0
      ? 5
      : Math.round(
          4 +
            Math.min(negativeIssues[0].count, 3) * 2 +
            (negativeIssues.some((issue) => issue.label === "尺寸/安装问题" || issue.label === "包装破损问题") ? 2 : 0),
        ),
    0,
    10,
  );
  const supplyChainAdvantage = clampScore(
    Math.round(
      3 +
        Math.min(product.supplierQuoteCount, 3) * 2 +
        (hasFriendlyMaterial(product) ? 2 : 0) +
        (product.categoryGapNote ? 1 : 0),
    ),
    0,
    10,
  );

  let totalScore =
    marketDemand +
    competitionOpportunity +
    profitSpace +
    certificationSafety +
    logisticsSafety +
    reviewImprovement +
    supplyChainAdvantage;

  if (riskRedlineLevel === "高风险红线") totalScore = Math.max(0, totalScore - 10);
  if (riskRedlineLevel === "禁止推进") totalScore = Math.max(0, totalScore - 25);

  const totalJudgement =
    totalScore >= 85 ? "优先推进" : totalScore >= 70 ? "可以推进" : totalScore >= 60 ? "继续观察" : "不建议做";

  const rgDimensions = buildRgDimensions(product, grossMarginPercent, riskLevel);
  const rgScore = rgDimensions.reduce((sum, item) => sum + item.score, 0);
  const rgJudgement =
    rgScore >= 85 ? "强烈推荐 RG" : rgScore >= 70 ? "可以作为 RG 候选" : rgScore >= 55 ? "暂时不适合 RG" : "不建议 RG";

  const pbDimensions = buildPbDimensions(product, grossMarginPercent, riskLevel, negativeIssues);
  const pbScore = pbDimensions.reduce((sum, item) => sum + item.score, 0);
  const pbJudgement =
    pbScore >= 85 ? "强烈推荐 PB" : pbScore >= 70 ? "可以作为 PB 候选" : pbScore >= 55 ? "暂时不适合 PB" : "不建议 PB";

  let direction: RecommendationDirection;
  if (riskRedlineLevel === "禁止推进" || totalScore < 60) {
    direction = "放弃";
  } else if (riskRedlineLevel === "高风险红线") {
    direction = "继续观察";
  } else if (rgScore >= 78 && pbScore >= 78) {
    direction = "Rocket Growth + PB";
  } else if (rgScore >= 72 && rgScore >= pbScore) {
    direction = "Rocket Growth";
  } else if (pbScore >= 72) {
    direction = "PB";
  } else {
    direction = "继续观察";
  }

  const scoreDimensions: ScoreDimension[] = [
    { label: "市场需求", score: marketDemand, max: 20, note: "看月销、评论量和星级。" },
    { label: "竞争机会", score: competitionOpportunity, max: 15, note: "看类目位次和评论拥挤度。" },
    { label: "利润空间", score: profitSpace, max: 20, note: "看毛利率是否达到安全线。" },
    { label: "认证风险", score: certificationSafety, max: 15, note: "资料越完整，分数越高。" },
    { label: "物流风险", score: logisticsSafety, max: 10, note: "大件、重货、易碎品会扣分。" },
    { label: "差评可改进性", score: reviewImprovement, max: 10, note: "差评是否集中且可优化。" },
    { label: "供应链优势", score: supplyChainAdvantage, max: 10, note: "看报价数量、材料和开发空间。" },
  ];

  const biggestOpportunity = pickBiggestOpportunity({
    marketDemand,
    competitionOpportunity,
    profitSpace,
    reviewImprovement,
    supplyChainAdvantage,
  });
  const biggestRisk = pickBiggestRisk(product, riskSignals, grossMarginPercent, riskRedlineLevel);

  const generatedTasks = buildGeneratedTasks(product, {
    totalScore,
    direction,
    rgScore,
    pbScore,
    riskRedlineLevel,
    negativeIssues,
    grossMarginPercent,
  });

  const transferCheckRg = buildTransferCheckRg(product);
  const transferCheckPb = buildTransferCheckPb(product);
  const nextAction = generatedTasks[0]?.title ?? getFallbackNextAction(direction, riskRedlineLevel, product.status);

  return {
    totalScore,
    totalJudgement,
    direction,
    riskLevel,
    riskRedlineLevel,
    riskSummary: describeRiskRedline(riskRedlineLevel, riskSignals, product),
    profitSafety,
    profitSafetyNote,
    grossProfitKrw,
    grossMarginPercent,
    suggestedTargetSupplyPriceKrw,
    minimumAcceptableSupplyPriceKrw,
    scoreDimensions,
    rgScore,
    rgJudgement,
    pbScore,
    pbJudgement,
    rgDimensions,
    pbDimensions,
    biggestOpportunity,
    biggestRisk,
    negativeIssues,
    generatedTasks,
    nextAction,
    transferCheckRg,
    transferCheckPb,
    statusSuggestions: buildStatusSuggestions(direction, product.status),
  };
}

function normalizeLegacyProduct(raw: Record<string, unknown>): LocalProduct {
  const now = new Date().toISOString();
  const productNameKo = getDisplayName(String(raw.productNameKo || raw.name || ""), "ko");
  const productNameZh = getDisplayName(String(raw.productNameZh || raw.name || ""), "zh");
  const competitorSalePriceKrw = toNumber(raw.competitorSalePriceKrw || raw.discountPrice || raw.price);
  const targetSupplyPriceKrw = toNumber(raw.targetSupplyPriceKrw) || Math.round(competitorSalePriceKrw * 0.38);

  return {
    id: String(raw.id || `product-${Date.now()}`),
    platform: String(raw.platform || "Coupang"),
    productNameKo,
    productNameZh,
    brand: String(raw.brand || ""),
    category: String(raw.category || "未分类"),
    competitorUrl: String(raw.competitorUrl || raw.url || ""),
    sourceUrl: String(raw.sourceUrl || raw.url || ""),
    image: String(raw.image || ""),
    owner: String(raw.owner || "待分配"),
    supplierQuoteCount: toNumber(raw.supplierQuoteCount),
    supplierNames: normalizeStringArray(raw.supplierNames),
    price: toNumber(raw.price),
    discountPrice: toNumber(raw.discountPrice || raw.price),
    competitorSalePriceKrw,
    targetSupplyPriceKrw,
    chinaCostRmb: toNumber(raw.chinaCostRmb) || Math.max(0, Math.round(targetSupplyPriceKrw / RMB_TO_KRW / 1.15)),
    internationalShippingKrw: toNumber(raw.internationalShippingKrw) || estimateLegacyShipping(raw),
    koreaShippingKrw: toNumber(raw.koreaShippingKrw) || 3200,
    coupangFeePercent: toNumber(raw.coupangFeePercent) || 11.9,
    adCostKrw: toNumber(raw.adCostKrw) || 500,
    returnLossKrw: toNumber(raw.returnLossKrw) || 700,
    otherCostKrw: toNumber(raw.otherCostKrw) || 300,
    estimatedMonthlySales: toNumber(raw.estimatedMonthlySales),
    reviewCount: toNumber(raw.reviewCount),
    rating: toNumber(raw.rating),
    rank: toNumber(raw.rank),
    deliveryType: String(raw.deliveryType || ""),
    sellerType: String(raw.sellerType || ""),
    size: String(raw.size || ""),
    colors: normalizeStringArray(raw.colors),
    material: String(raw.material || ""),
    weight: String(raw.weight || ""),
    packageSize: String(raw.packageSize || ""),
    sellingPoints: normalizeStringArray(raw.sellingPoints),
    keywords: normalizeStringArray(raw.keywords),
    reviews: normalizeStringArray(raw.reviews),
    marketAnalysis: String(raw.marketAnalysis || ""),
    priceRange: String(raw.priceRange || ""),
    reviewSummary: String(raw.reviewSummary || ""),
    consumerPainPoints: String(raw.consumerPainPoints || ""),
    productDevelopmentDirection: String(raw.productDevelopmentDirection || ""),
    recommendationReason: String(raw.recommendationReason || ""),
    sampleDevelopmentAdvice: String(raw.sampleDevelopmentAdvice || ""),
    categoryGapNote: String(raw.categoryGapNote || ""),
    fileReferences: normalizeStringArray(raw.fileReferences),
    notes: String(raw.notes || ""),
    status: normalizeStatus(raw.status),
    rejectionReason: normalizeRejectionReason(raw.rejectionReason),
    needsKcCertification: Boolean(raw.needsKcCertification),
    kcDocsReady: Boolean(raw.kcDocsReady),
    childrenProduct: Boolean(raw.childrenProduct),
    foodProduct: Boolean(raw.foodProduct),
    electronicsProduct: Boolean(raw.electronicsProduct),
    cosmeticsProduct: Boolean(raw.cosmeticsProduct),
    medicalProduct: Boolean(raw.medicalProduct),
    fragile: Boolean(raw.fragile),
    possibleHighReturn: Boolean(raw.possibleHighReturn),
    uncertainRegulation: Boolean(raw.uncertainRegulation),
    coupangRestricted: Boolean(raw.coupangRestricted),
    createdAt: String(raw.createdAt || now),
    updatedAt: String(raw.updatedAt || raw.createdAt || now),
  };
}

function performOneTimeLocalCleanup() {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(DATA_RESET_FLAG) === "done") return;

  window.localStorage.removeItem(LEGACY_LOCAL_PRODUCTS_KEY);
  window.localStorage.removeItem(PREVIOUS_LOCAL_PRODUCTS_KEY);
  window.localStorage.removeItem(LOCAL_PRODUCTS_KEY);
  window.localStorage.setItem(DATA_RESET_FLAG, "done");
}

function buildRiskSignals(
  product: LocalProduct,
  negativeIssues: ProductAnalysis["negativeIssues"],
) {
  const volumePenalty = isLargePackage(product.packageSize, product.size) ? 3 : 0;
  const weightPenalty = isHeavy(product.weight) ? 3 : 0;
  const returnPenalty = product.possibleHighReturn || negativeIssues.some((issue) => issue.label === "尺寸/安装问题") ? 2 : 0;

  return {
    certificationPenalty:
      (product.needsKcCertification && !product.kcDocsReady ? 8 : 0) +
      (product.childrenProduct ? 2 : 0) +
      (product.foodProduct ? 3 : 0) +
      (product.electronicsProduct ? 3 : 0) +
      (product.cosmeticsProduct ? 3 : 0) +
      (product.medicalProduct ? 5 : 0) +
      (product.uncertainRegulation ? 3 : 0),
    logisticsPenalty: volumePenalty + weightPenalty + (product.fragile ? 2 : 0) + returnPenalty,
    blockers: [
      product.coupangRestricted ? "Coupang 平台限制" : "",
      product.medicalProduct ? "医疗相关风险" : "",
      product.needsKcCertification && !product.kcDocsReady ? "需要 KC 认证但资料不完整" : "",
      product.childrenProduct ? "儿童用品风险高" : "",
      product.foodProduct ? "食品类风险高" : "",
      product.electronicsProduct ? "电器类风险高" : "",
      product.cosmeticsProduct ? "化妆品类风险高" : "",
      isLargePackage(product.packageSize, product.size) ? "体积过大" : "",
      isHeavy(product.weight) ? "重量过重" : "",
      product.fragile ? "易破损" : "",
      product.possibleHighReturn ? "退货率可能高" : "",
      product.uncertainRegulation ? "韩国法规不确定" : "",
    ].filter(Boolean),
  };
}

function resolveRiskRedlineLevel(riskSignals: ReturnType<typeof buildRiskSignals>): RiskRedlineLevel {
  if (riskSignals.blockers.includes("Coupang 平台限制")) return "禁止推进";
  if (
    riskSignals.blockers.includes("医疗相关风险") ||
    riskSignals.blockers.includes("需要 KC 认证但资料不完整")
  ) {
    return "高风险红线";
  }
  if (riskSignals.blockers.length >= 4) return "高风险红线";
  if (riskSignals.blockers.length >= 2) return "中度风险";
  if (riskSignals.blockers.length >= 1) return "轻度风险";
  return "无红线";
}

function buildRgDimensions(product: LocalProduct, grossMarginPercent: number, riskLevel: RiskLevel): ScoreDimension[] {
  const monthlySales = product.estimatedMonthlySales;
  const quoteReady = product.supplierQuoteCount >= 2;
  return [
    scoreOutOf("是否适合快速放量", monthlySales >= 4000 ? 13 : monthlySales >= 2000 ? 10 : monthlySales >= 1000 ? 7 : 4, 13, "看月销和增速信号。"),
    scoreOutOf("是否有稳定供货能力", quoteReady ? 13 : product.supplierQuoteCount >= 1 ? 9 : 4, 13, "至少有 2 家报价更稳。"),
    scoreOutOf("是否容易标准化包装", product.fragile ? 5 : 12, 12, "易碎品不利于标准化。"),
    scoreOutOf("是否适合平台仓储配送", isLargePackage(product.packageSize, product.size) || isHeavy(product.weight) ? 5 : 12, 12, "大件重货会拖累仓配。"),
    scoreOutOf("是否有价格优势", grossMarginPercent >= 35 ? 12 : grossMarginPercent >= 25 ? 9 : 5, 12, "毛利越健康越适合放量。"),
    scoreOutOf("是否有低售后风险", riskLevel === "低" ? 12 : riskLevel === "中" ? 8 : 4, 12, "风险越低越适合 RG。"),
    scoreOutOf("是否有足够市场需求", monthlySales >= 3000 ? 13 : monthlySales >= 1500 ? 10 : 6, 13, "需求高才值得快速补货。"),
    scoreOutOf("是否适合批量补货", quoteReady && !product.uncertainRegulation ? 13 : 8, 13, "看供应和合规确定性。"),
  ];
}

function buildPbDimensions(
  product: LocalProduct,
  grossMarginPercent: number,
  riskLevel: RiskLevel,
  negativeIssues: ProductAnalysis["negativeIssues"],
): ScoreDimension[] {
  const improvable = negativeIssues.length > 0;
  const seriesPotential = /(套装|系列|组合|size|尺寸|颜色|blind|curtain|窗帘|百叶)/i.test(
    `${product.category} ${product.size} ${product.colors.join(" ")} ${product.productNameZh} ${product.productNameKo}`,
  );
  return [
    scoreOutOf("是否有品类空白", product.categoryGapNote ? 13 : 8, 13, "有空白证据更适合 PB。"),
    scoreOutOf("是否能做差异化开发", improvable || product.productDevelopmentDirection ? 13 : 7, 13, "差评集中且可优化最有价值。"),
    scoreOutOf("是否有供应链成本优势", grossMarginPercent >= 35 ? 13 : grossMarginPercent >= 25 ? 9 : 5, 13, "成本空间是核心前提。"),
    scoreOutOf("是否适合 Coupang 自营品牌", riskLevel === "低" ? 12 : riskLevel === "中" ? 8 : 4, 12, "高风险品类不宜 PB。"),
    scoreOutOf("是否能长期稳定供货", product.supplierQuoteCount >= 2 ? 13 : 8, 13, "PB 更看长期供货。"),
    scoreOutOf("是否有包装/规格优化空间", product.sampleDevelopmentAdvice || product.productDevelopmentDirection ? 12 : 7, 12, "有明确优化方案更高分。"),
    scoreOutOf("是否可以做系列化产品", seriesPotential ? 12 : 6, 12, "可系列化才容易放大。"),
    scoreOutOf("是否有高复购或高需求", product.estimatedMonthlySales >= 2500 ? 12 : 7, 12, "高需求提高 PB 成功率。"),
  ];
}

function buildGeneratedTasks(
  product: LocalProduct,
  signals: {
    totalScore: number;
    direction: RecommendationDirection;
    rgScore: number;
    pbScore: number;
    riskRedlineLevel: RiskRedlineLevel;
    negativeIssues: ProductAnalysis["negativeIssues"];
    grossMarginPercent: number;
  },
): GeneratedTask[] {
  const tasks: GeneratedTask[] = [];

  if (signals.totalScore >= 70 && product.supplierQuoteCount === 0) {
    tasks.push(makeTask("中国团队寻找 3 家供应商报价", "中国团队", 3, "评分高但暂无供应商报价。"));
  }

  if (signals.negativeIssues.length > 0) {
    tasks.push(makeTask("韩国团队整理差评痛点和改进方向", "韩国团队", 2, "差评问题集中且存在优化空间。"));
  }

  if (signals.direction === "Rocket Growth" || signals.direction === "Rocket Growth + PB") {
    tasks.push(makeTask("准备 Rocket Growth 产品提案资料", "项目经理", 5, "RG 适合度达到推进阈值。"));
  }

  if (signals.direction === "PB" || signals.direction === "Rocket Growth + PB") {
    tasks.push(makeTask("整理 PB 产品开发方案和供应链开发要求", "开发团队", 7, "PB 适合度达到推进阈值。"));
  }

  if (signals.riskRedlineLevel === "中度风险" || signals.riskRedlineLevel === "高风险红线") {
    tasks.push(makeTask("确认认证、物流、法规风险", "合规团队", 2, "存在需要先核实的风险红线。"));
  }

  if (signals.grossMarginPercent < 30) {
    tasks.push(makeTask("重新测算目标供货价与毛利结构", "采购团队", 2, "利润安全线不足。"));
  }

  return dedupeTasks(tasks);
}

function buildTransferCheckRg(product: LocalProduct): TransferCheck {
  const missing = [
    [product.productNameKo || product.productNameZh, "商品名称"],
    [product.competitorUrl, "Coupang 竞品链接"],
    [product.marketAnalysis, "市场分析"],
    [product.priceRange, "价格区间"],
    [product.reviewSummary || product.reviews.length > 0, "评论分析"],
    [product.targetSupplyPriceKrw > 0, "利润测算"],
    [hasRiskInfo(product), "风险判断"],
    [product.recommendationReason, "推荐理由"],
    [product.productDevelopmentDirection || product.sampleDevelopmentAdvice, "下一步动作"],
  ]
    .filter(([ok]) => !ok)
    .map(([, label]) => String(label));

  return { ready: missing.length === 0, missing };
}

function buildTransferCheckPb(product: LocalProduct): TransferCheck {
  const missing = [
    [product.productNameKo || product.productNameZh, "商品名称"],
    [product.categoryGapNote, "品类机会"],
    [product.consumerPainPoints, "消费者痛点"],
    [product.productDevelopmentDirection, "产品开发方向"],
    [product.supplierQuoteCount > 0 || product.supplierNames.length > 0, "供应链优势"],
    [product.targetSupplyPriceKrw > 0, "成本测算"],
    [hasRiskInfo(product), "风险判断"],
    [product.recommendationReason, "PB 推荐理由"],
    [product.sampleDevelopmentAdvice, "样品开发建议"],
  ]
    .filter(([ok]) => !ok)
    .map(([, label]) => String(label));

  return { ready: missing.length === 0, missing };
}

function buildStatusSuggestions(direction: RecommendationDirection, status: ProductStatus): ProductStatus[] {
  if (status === "已淘汰" || status === "已转入 RG/PB 项目系统") return [];

  const baseline: ProductStatus[] = ["分析中", "待供应商报价", "待利润测算", "待风险确认", "继续观察"];

  if (direction === "Rocket Growth") return [...baseline, "RG 候选", "准备转项目"];
  if (direction === "PB") return [...baseline, "PB 候选", "准备转项目"];
  if (direction === "Rocket Growth + PB") return [...baseline, "RG + PB 双向候选", "准备转项目"];
  if (direction === "放弃") return ["已淘汰"];
  return baseline;
}

function detectNegativeIssues(reviews: string[]) {
  const rules = [
    { label: "尺寸/安装问题", words: ["尺寸", "安装", "太短", "太长", "small", "size"], suggestion: "先做尺寸策略和安装说明优化。" },
    { label: "包装破损问题", words: ["包装", "破损", "压坏", "box", "damaged"], suggestion: "优先改包装结构和保护方案。" },
    { label: "颜色/外观落差", words: ["颜色", "色差", "外观", "照片", "design"], suggestion: "完善主图和详情页，降低预期落差。" },
    { label: "气味/材质问题", words: ["气味", "材质", "味道", "냄새", "material"], suggestion: "补充材质说明，筛选更稳定的工厂。" },
    { label: "物流配送问题", words: ["物流", "配送", "送达", "破碎", "late"], suggestion: "核实体积重量与包装适配度。" },
    { label: "质量稳定性问题", words: ["质量", "故障", "不良", "返修", "problem"], suggestion: "先做样品测试，再决定是否推进。" },
  ];

  return rules
    .map((rule) => ({
      label: rule.label,
      count: reviews.filter((review) => rule.words.some((word) => review.toLowerCase().includes(word.toLowerCase()))).length,
      suggestion: rule.suggestion,
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);
}

function pickBiggestOpportunity(scores: {
  marketDemand: number;
  competitionOpportunity: number;
  profitSpace: number;
  reviewImprovement: number;
  supplyChainAdvantage: number;
}) {
  const candidates = [
    { label: "市场需求强，适合加快验证。", value: scores.marketDemand / 20 },
    { label: "竞争窗口存在，类目还没有被完全堵死。", value: scores.competitionOpportunity / 15 },
    { label: "利润空间健康，具备继续推进基础。", value: scores.profitSpace / 20 },
    { label: "差评痛点集中，可通过优化切入。", value: scores.reviewImprovement / 10 },
    { label: "供应链有一定开发和报价优势。", value: scores.supplyChainAdvantage / 10 },
  ];
  return candidates.sort((a, b) => b.value - a.value)[0]?.label ?? "需要补充更多市场和利润数据。";
}

function pickBiggestRisk(
  product: LocalProduct,
  riskSignals: ReturnType<typeof buildRiskSignals>,
  grossMarginPercent: number,
  riskRedlineLevel: RiskRedlineLevel,
) {
  if (riskRedlineLevel === "禁止推进") return "存在平台限制，当前不适合继续推进。";
  if (riskSignals.blockers[0]) return riskSignals.blockers[0];
  if (grossMarginPercent < 20) return "毛利率低于 20%，利润安全线不通过。";
  if (product.supplierQuoteCount === 0) return "暂无供应商报价，供应链判断还不完整。";
  return "当前最大风险仍在利润和落地执行细节。";
}

function getFallbackNextAction(
  direction: RecommendationDirection,
  riskRedlineLevel: RiskRedlineLevel,
  status: ProductStatus,
) {
  if (status === "已淘汰") return "保留淘汰记录，进入复盘库。";
  if (riskRedlineLevel === "高风险红线" || riskRedlineLevel === "中度风险") return "先完成认证、物流、法规风险确认。";
  if (direction === "Rocket Growth") return "整理 RG 提案并补全转项目资料。";
  if (direction === "PB") return "整理 PB 开发方案并补全供应链信息。";
  if (direction === "Rocket Growth + PB") return "同步准备 RG 和 PB 两套提案路径。";
  return "继续补充市场、利润和差评数据。";
}

function describeRiskRedline(
  level: RiskRedlineLevel,
  riskSignals: ReturnType<typeof buildRiskSignals>,
  product: LocalProduct,
) {
  if (level === "无红线") return "当前没有明显红线，可以继续推进判断。";
  if (level === "轻度风险") return `需要补充确认：${riskSignals.blockers.join("、")}。`;
  if (level === "中度风险") return `存在多项风险项：${riskSignals.blockers.join("、")}。`;
  if (level === "高风险红线") return `高风险红线触发：${riskSignals.blockers.join("、")}。建议暂停。`;
  if (product.coupangRestricted) return "存在 Coupang 平台限制，直接禁止推进。";
  return "当前合规风险过高，直接禁止推进。";
}

function describeProfitSafety(grossMarginPercent: number) {
  if (grossMarginPercent < 20) return "毛利率低于 20%，不建议做。";
  if (grossMarginPercent < 30) return "毛利率 20%-30%，谨慎测试。";
  if (grossMarginPercent < 40) return "毛利率 30%-40%，可以推进。";
  return "毛利率超过 40%，优先推进。";
}

function computeGrossProfit(product: LocalProduct) {
  const salePrice = product.competitorSalePriceKrw || product.discountPrice || product.price || 0;
  const fee = Math.round(salePrice * (product.coupangFeePercent / 100));
  return Math.round(
    salePrice -
      product.targetSupplyPriceKrw -
      product.internationalShippingKrw -
      product.koreaShippingKrw -
      fee -
      product.adCostKrw -
      product.returnLossKrw -
      product.otherCostKrw,
  );
}

function computeGrossMargin(product: LocalProduct, grossProfitKrw: number) {
  const salePrice = product.competitorSalePriceKrw || product.discountPrice || product.price || 0;
  if (!salePrice) return 0;
  return Math.round((grossProfitKrw / salePrice) * 1000) / 10;
}

function getSupplyPriceForMargin(product: LocalProduct, targetMarginPercent: number) {
  const salePrice = product.competitorSalePriceKrw || product.discountPrice || product.price || 0;
  const fee = Math.round(salePrice * (product.coupangFeePercent / 100));
  const marginTarget = salePrice * (targetMarginPercent / 100);
  const result =
    salePrice -
    fee -
    product.internationalShippingKrw -
    product.koreaShippingKrw -
    product.adCostKrw -
    product.returnLossKrw -
    product.otherCostKrw -
    marginTarget;
  return Math.max(0, Math.round(result));
}

function scoreOutOf(label: string, score: number, max: number, note: string): ScoreDimension {
  return {
    label,
    score: clampScore(Math.round(score), 0, max),
    max,
    note,
  };
}

function makeTask(title: string, owner: string, dueInDays: number, reason: string): GeneratedTask {
  const dueDate = addDays(new Date(), dueInDays);
  return {
    id: `${title}-${dueDate.toISOString()}`,
    title,
    owner,
    dueLabel: `${dueInDays}天内`,
    dueDate: dueDate.toISOString(),
    reason,
    status: "待执行",
  };
}

function dedupeTasks(tasks: GeneratedTask[]) {
  const seen = new Set<string>();
  return tasks.filter((task) => {
    if (seen.has(task.title)) return false;
    seen.add(task.title);
    return true;
  });
}

function hasFriendlyMaterial(product: LocalProduct) {
  return /ABS|PP|PET|poly|fabric|铝|布|blind|curtain|蜂巢|百叶|窗帘/i.test(
    `${product.material} ${product.category} ${product.productNameZh} ${product.productNameKo}`,
  );
}

function hasRiskInfo(product: LocalProduct) {
  return (
    product.needsKcCertification ||
    product.childrenProduct ||
    product.foodProduct ||
    product.electronicsProduct ||
    product.cosmeticsProduct ||
    product.medicalProduct ||
    product.fragile ||
    product.possibleHighReturn ||
    product.uncertainRegulation ||
    product.coupangRestricted ||
    product.kcDocsReady
  );
}

function normalizeStatus(status: unknown): ProductStatus {
  if (typeof status !== "string") return "新发现";
  return PRODUCT_STATUS_OPTIONS.includes(status as ProductStatus) ? (status as ProductStatus) : "新发现";
}

function normalizeRejectionReason(reason: unknown) {
  if (typeof reason !== "string") return undefined;
  return REJECTION_REASONS.includes(reason as RejectionReason) ? (reason as RejectionReason) : undefined;
}

function normalizeStringArray(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string") return splitList(value);
  return [];
}

function splitList(value: string) {
  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function isChecked(value: FormDataEntryValue | undefined) {
  return value === "on" || value === "true" || value === "1";
}

function toNumber(value: unknown) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function clampScore(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function isLargePackage(packageSize: string, size: string) {
  const text = `${packageSize} ${size}`;
  const numbers = (text.match(/\d+(\.\d+)?/g) ?? []).map(Number);
  return numbers.some((value) => value >= 180) || numbers.filter((value) => value >= 80).length >= 2;
}

function isHeavy(weight: string) {
  const match = weight.match(/(\d+(\.\d+)?)/);
  if (!match) return false;
  return Number(match[1]) >= 8;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function estimateTargetSupplyPrice(input: Record<string, FormDataEntryValue>) {
  const price = toNumber(input.competitorSalePriceKrw || input.discountPrice || input.price);
  return price ? Math.round(price * 0.38) : 0;
}

function estimateInternationalShipping(input: Record<string, FormDataEntryValue>) {
  const packageSize = String(input.packageSize || "");
  const weight = String(input.weight || "");
  if (isLargePackage(packageSize, packageSize)) return 7200;
  if (isHeavy(weight)) return 6500;
  return 3800;
}

function estimateLegacyShipping(raw: Record<string, unknown>) {
  const packageSize = String(raw.packageSize || "");
  const weight = String(raw.weight || "");
  if (isLargePackage(packageSize, packageSize)) return 7200;
  if (isHeavy(weight)) return 6500;
  return 3800;
}

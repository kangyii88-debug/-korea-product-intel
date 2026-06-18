export type LocalProduct = {
  id: string;
  platform: string;
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
  createdAt: string;
};

export type ProductDecision = "强烈建议开发" | "可以测试" | "继续观察" | "不建议开发";

export type ProductAnalysis = {
  marketDemand: number;
  profitMargin: number;
  competition: number;
  reviewQuality: number;
  optimizationSpace: number;
  logisticsFriendliness: number;
  supplyChainFit: number;
  totalScore: number;
  grade: "S" | "A" | "B" | "C";
  decision: ProductDecision;
  riskLevel: "低" | "中" | "高";
  suggestedPurchasePrice: number;
  suggestedSalePrice: number;
  suggestedTestQuantity: number;
  estimatedMarginRate: number;
  reasons: string[];
  opportunities: string[];
  risks: string[];
  negativeIssues: {
    label: string;
    count: number;
    suggestion: string;
  }[];
};

export const LOCAL_PRODUCTS_KEY = "kpi_local_products_v1";

const DISPLAY_NAME_MAP = {
  BZG: {
    ko: "반차광 허니콤 블라인드",
    zh: "半遮光蜂巢帘",
  },
} as const;

export const platformOptions = [
  "Coupang",
  "Naver Shopping",
  "오늘의집",
  "11번가",
  "Gmarket",
  "AliExpress Korea",
];

export function getDisplayName(value: string, locale: "ko" | "zh" = "ko") {
  const normalized = value.trim();
  if (!normalized) return value;
  return DISPLAY_NAME_MAP[normalized as keyof typeof DISPLAY_NAME_MAP]?.[locale] ?? value;
}

export function buildProductFromForm(input: Record<string, FormDataEntryValue>): LocalProduct {
  const name = String(input.name || "").trim();
  return {
    id: `product-${Date.now()}`,
    platform: String(input.platform || "Coupang"),
    url: String(input.url || "").trim(),
    image: String(input.image || "").trim(),
    name,
    brand: String(input.brand || "").trim(),
    category: String(input.category || "").trim() || "未分类",
    price: toNumber(input.price),
    discountPrice: toNumber(input.discountPrice || input.price),
    estimatedMonthlySales: toNumber(input.estimatedMonthlySales),
    reviewCount: toNumber(input.reviewCount),
    rating: toNumber(input.rating),
    rank: toNumber(input.rank) || 999,
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
    createdAt: new Date().toISOString(),
  };
}

export function analyzeProduct(product: LocalProduct): ProductAnalysis {
  const salePrice = product.discountPrice || product.price || 0;
  const purchasePrice = roundToHundred(salePrice * 0.38);
  const fulfillmentCost = estimateFulfillmentCost(product);
  const platformFee = salePrice * 0.12;
  const estimatedMarginRate = salePrice
    ? Math.max(0, Math.round(((salePrice - purchasePrice - fulfillmentCost - platformFee) / salePrice) * 100))
    : 0;

  const marketDemand = clamp(product.estimatedMonthlySales / 120 + product.reviewCount / 180 - product.rank * 1.5 + 25);
  const profitMargin = clamp(estimatedMarginRate * 1.45);
  const competition = clamp(95 - product.rank * 4 - Math.max(product.reviewCount - 3000, 0) / 180);
  const reviewQuality = clamp((product.rating || 0) * 18);
  const negativeIssues = detectNegativeIssues(product.reviews);
  const optimizationSpace = clamp(negativeIssues.reduce((sum, item) => sum + item.count * 12, 0));
  const logisticsFriendliness = scoreLogistics(product);
  const supplyChainFit = scoreSupplyChain(product);

  const totalScore = Math.round(
    marketDemand * 0.2 +
      profitMargin * 0.2 +
      competition * 0.15 +
      reviewQuality * 0.15 +
      optimizationSpace * 0.1 +
      logisticsFriendliness * 0.1 +
      supplyChainFit * 0.1,
  );

  const grade = totalScore >= 82 ? "S" : totalScore >= 70 ? "A" : totalScore >= 58 ? "B" : "C";
  const decision: ProductDecision =
    grade === "S" ? "强烈建议开发" : grade === "A" ? "可以测试" : grade === "B" ? "继续观察" : "不建议开发";
  const riskLevel = totalScore < 58 || product.rating < 4.1 ? "高" : totalScore < 72 ? "中" : "低";

  return {
    marketDemand: Math.round(marketDemand),
    profitMargin: Math.round(profitMargin),
    competition: Math.round(competition),
    reviewQuality: Math.round(reviewQuality),
    optimizationSpace: Math.round(optimizationSpace),
    logisticsFriendliness: Math.round(logisticsFriendliness),
    supplyChainFit: Math.round(supplyChainFit),
    totalScore,
    grade,
    decision,
    riskLevel,
    suggestedPurchasePrice: purchasePrice,
    suggestedSalePrice: roundToHundred(salePrice * 1.03 || product.price),
    suggestedTestQuantity: getTestQuantity(totalScore, product.estimatedMonthlySales),
    estimatedMarginRate,
    reasons: [
      `月销量 ${product.estimatedMonthlySales || 0}、评论 ${product.reviewCount || 0}、排名 #${product.rank || "-"} 共同决定市场需求分。`,
      `按售价、采购价、平台费和履约成本估算，毛利率约 ${estimatedMarginRate}%。`,
      `评分 ${product.rating || 0} 和差评问题数量决定评论质量与优化空间。`,
    ],
    opportunities: buildOpportunities(product, negativeIssues, estimatedMarginRate),
    risks: buildRisks(product, negativeIssues, riskLevel),
    negativeIssues,
  };
}

function detectNegativeIssues(reviews: string[]) {
  const rules = [
    { label: "尺寸问题", words: ["尺寸", "사이즈", "크기", "不合适", "작아요", "커요"], suggestion: "增加尺寸指南、测量图和适配范围说明。" },
    { label: "安装问题", words: ["安装", "설치", "붙이기", "难装", "설명서"], suggestion: "增加安装视频、安装辅助工具和更清晰说明书。" },
    { label: "颜色问题", words: ["颜色", "색상", "色差", "사진", "实物"], suggestion: "增加实拍图、自然光对比图和颜色命名规范。" },
    { label: "材质问题", words: ["材质", "재질", "薄", "냄새", "质感"], suggestion: "升级材质，详情页明确厚度、触感和安全信息。" },
    { label: "包装物流", words: ["包装", "배송", "破损", "늦", "박스"], suggestion: "加强外箱、防压包装，并标注配送时效。" },
    { label: "质量问题", words: ["质量", "고장", "불량", "坏", "耐用"], suggestion: "增加出厂质检、关键部位加固和售后承诺。" },
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

function buildOpportunities(product: LocalProduct, issues: ProductAnalysis["negativeIssues"], margin: number) {
  const result = [];
  if (product.estimatedMonthlySales >= 3000) result.push("已有明确需求，可以用小批量测试验证转化。");
  if (margin >= 30) result.push("毛利空间可接受，适合继续核算采购和物流成本。");
  if (issues.length) result.push(`${issues[0].label}高频，存在通过产品改良拉开竞争差距的机会。`);
  if (/blind|curtain|帘|블라인드|커튼/i.test(`${product.name} ${product.category} ${product.keywords.join(" ")}`)) {
    result.push("属于窗饰重点行业，可沉淀到窗饰情报库持续跟踪尺寸、颜色和差评。");
  }
  return result.length ? result : ["先补充销量、评论和差评数据，再判断机会强度。"];
}

function buildRisks(product: LocalProduct, issues: ProductAnalysis["negativeIssues"], riskLevel: string) {
  const result = [];
  if (product.rating && product.rating < 4.2) result.push("评分偏低，可能存在质量或预期管理问题。");
  if (product.reviewCount > 5000) result.push("竞品评论资产较厚，新品冷启动难度较高。");
  if (issues.length) result.push(`${issues[0].label}可能影响购买和复购，需要在打样阶段解决。`);
  if (riskLevel === "高") result.push("综合分偏低，不建议直接大批量采购。");
  return result.length ? result : ["当前主要风险来自数据不足，建议先补充真实评论和竞品价格。"];
}

function scoreLogistics(product: LocalProduct) {
  let score = 78;
  const text = `${product.weight} ${product.packageSize} ${product.deliveryType}`.toLowerCase();
  if (text.includes("rocket")) score += 8;
  if (text.includes("kg")) score -= 8;
  if (text.includes("2.") || text.includes("3.") || text.includes("45")) score -= 10;
  return clamp(score);
}

function scoreSupplyChain(product: LocalProduct) {
  let score = 70;
  const text = `${product.name} ${product.category} ${product.material} ${product.keywords.join(" ")}`;
  if (/ABS|PP|poly|plastic|알루미늄|铝|布|fabric|curtain|blind|帘|블라인드|커튼/i.test(text)) score += 14;
  if (/battery|电池|배터리|化妆品|식품|食品/i.test(text)) score -= 24;
  return clamp(score);
}

function estimateFulfillmentCost(product: LocalProduct) {
  const text = `${product.weight} ${product.packageSize}`.toLowerCase();
  if (text.includes("2.") || text.includes("3.") || text.includes("45")) return 4200;
  if (text.includes("0.")) return 2400;
  return 3200;
}

function getTestQuantity(score: number, monthlySales: number) {
  if (score >= 82) return Math.max(200, Math.min(600, Math.round(monthlySales * 0.05)));
  if (score >= 70) return 100;
  if (score >= 58) return 50;
  return 0;
}

function splitList(value: string) {
  return value
    .split(/[,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function toNumber(value: FormDataEntryValue | undefined) {
  return Number(value || 0);
}

function roundToHundred(value: number) {
  return Math.round(value / 100) * 100;
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

import type {
  BrandCompetitorInsight,
  CompetitorIntelligence,
  CurtainTrendCenter,
  MarketAlert,
  MarketGrowthLevel,
  MarketIntelligenceResult,
  MarketOpportunityRadar,
  MarketSnapshot,
  Platform,
  Product,
  ProductGrowthInsight,
  ProductReview,
  RankingItem,
} from "@/lib/types";
import { generateCurtainIntelligence } from "@/lib/curtain-intelligence";

const monitoredPlatforms: Platform[] = [
  "Coupang",
  "Naver Shopping",
  "오늘의집",
  "11번가",
  "Gmarket",
  "AliExpress Korea",
];

export function generateMarketIntelligence(products: Product[], reviews: ProductReview[]): MarketIntelligenceResult {
  const snapshots = buildMarketSnapshots(products);
  const growth7 = buildGrowthInsights(products, 7);
  const growth30 = buildGrowthInsights(products, 30);
  const growth90 = buildGrowthInsights(products, 90);
  const opportunityRadar = buildOpportunityRadar(products, reviews);
  const curtainTrendCenter = buildCurtainTrendCenter(products, reviews);
  const competitorIntelligence = buildCompetitorIntelligence(products);
  const alerts = buildMarketAlerts(products, reviews, competitorIntelligence);

  return {
    generatedAt: new Date().toISOString(),
    monitoredPlatforms,
    snapshots,
    trendCenter: {
      fastestGrowing7Days: growth7,
      fastestGrowing30Days: growth30,
      fastestGrowing90Days: growth90,
    },
    opportunityRadar,
    curtainTrendCenter,
    competitorIntelligence,
    alerts,
    executiveBrief: buildExecutiveBrief(products, growth7, growth30, alerts),
  };
}

function buildMarketSnapshots(products: Product[]): MarketSnapshot[] {
  const groups = new Map<string, Product[]>();
  groups.set("ALL", products);
  monitoredPlatforms.forEach((platform) => groups.set(platform, products.filter((product) => product.platform === platform)));

  return [...groups.entries()].map(([key, items]) => {
    const count = Math.max(items.length, 1);
    return {
      id: `market-snapshot-${key}-${new Date().toISOString().slice(0, 10)}`,
      snapshotDate: new Date().toISOString().slice(0, 10),
      platform: key as Platform | "ALL",
      productCount: items.length,
      averagePrice: round(items.reduce((sum, product) => sum + product.price, 0) / count),
      averageDiscountPrice: round(items.reduce((sum, product) => sum + product.discountPrice, 0) / count),
      averageRating: round(items.reduce((sum, product) => sum + product.rating, 0) / count, 1),
      totalReviewCount: items.reduce((sum, product) => sum + product.reviewCount, 0),
      totalEstimatedSales: items.reduce((sum, product) => sum + product.estimatedMonthlySales, 0),
      averageRank: round(items.reduce((sum, product) => sum + product.rank, 0) / count, 1),
      priceChangeIndex: round(items.reduce((sum, product) => sum + getPriceChangeIndex(product), 0) / count),
      reviewChangeIndex: round(items.reduce((sum, product) => sum + getReviewGrowth(product), 0) / count),
      rankChangeIndex: round(items.reduce((sum, product) => sum + getRankChangeIndex(product), 0) / count),
    };
  });
}

function buildGrowthInsights(products: Product[], days: 7 | 30 | 90): ProductGrowthInsight[] {
  return [...products]
    .map((product) => {
      const speed = getGrowthSpeed(product, days);
      return {
        productId: product.id,
        productName: product.name,
        platform: product.platform,
        category: product.category,
        growthWindowDays: days,
        growthSpeed: speed,
        growthLevel: getGrowthLevel(speed),
        growthReasons: [
          `评论增长指数 ${getReviewGrowth(product)}，收藏 ${product.favorites}，预计月销量 ${product.estimatedMonthlySales}。`,
          `排名 #${product.rank}，评分 ${product.rating}，说明增长质量${product.rating >= 4.4 ? "较好" : "需要谨慎"}。`,
        ],
      };
    })
    .sort((a, b) => b.growthSpeed - a.growthSpeed)
    .slice(0, 20);
}

function buildOpportunityRadar(products: Product[], reviews: ProductReview[]): MarketOpportunityRadar {
  const categories = groupBy(products, (product) => product.category);
  const categoryScores = [...categories.entries()].map(([category, items]) => ({
    category,
    score: items.reduce((sum, product) => sum + product.estimatedMonthlySales + product.favorites * 0.2, 0),
    risk: items.reduce((sum, product) => sum + product.riskScore, 0) / Math.max(items.length, 1),
  }));
  const negativeProducts = products.filter((product) => reviews.some((review) => review.productId === product.id && review.rating <= 3));

  return {
    newOpportunities: products
      .filter((product) => product.reviewCount < 2500 && product.estimatedMonthlySales >= 5000)
      .map((product) => `${product.name}：销量高但评论壁垒不深。`)
      .slice(0, 10),
    newTrends: categoryScores
      .sort((a, b) => b.score - a.score)
      .map((item) => `${item.category} 需求指数 ${round(item.score)}。`)
      .slice(0, 10),
    newCategories: categoryScores
      .filter((item) => item.score > 5000 && item.risk < 55)
      .map((item) => item.category)
      .slice(0, 10),
    growingCategories: categoryScores.sort((a, b) => b.score - a.score).map((item) => item.category).slice(0, 10),
    decliningCategories: categoryScores.sort((a, b) => b.risk - a.risk).map((item) => `${item.category}：风险指数 ${round(item.risk)}。`).slice(0, 10),
  };
}

function buildCurtainTrendCenter(products: Product[], reviews: ProductReview[]): CurtainTrendCenter {
  const curtain = generateCurtainIntelligence(products, reviews);
  return {
    hotSizeTrends: curtain.hotSizeRanking,
    hotColorTrends: curtain.hotColorRanking,
    hotMaterialTrends: curtain.hotMaterialRanking,
    hotPriceTrends: curtain.hotPriceRanges,
  };
}

function buildCompetitorIntelligence(products: Product[]): CompetitorIntelligence {
  const brandInsights = [...groupBy(products, (product) => product.brand || "Unknown").entries()]
    .map(([brand, items]) => toBrandInsight(brand, items))
    .sort((a, b) => b.estimatedSales - a.estimatedSales);

  return {
    growingBrands: brandInsights.filter((brand) => brand.direction === "增长").slice(0, 20),
    decliningBrands: brandInsights.filter((brand) => brand.direction === "下降").slice(0, 20),
    reviewGrowthLeaders: [...brandInsights].sort((a, b) => b.reviewGrowth - a.reviewGrowth).slice(0, 20),
    rankingMovers: [...brandInsights].sort((a, b) => Math.abs(b.rankChangeIndex) - Math.abs(a.rankChangeIndex)).slice(0, 20),
    priceMovers: [...brandInsights].sort((a, b) => Math.abs(b.priceChangeIndex) - Math.abs(a.priceChangeIndex)).slice(0, 20),
  };
}

function buildMarketAlerts(products: Product[], reviews: ProductReview[], competitors: CompetitorIntelligence): MarketAlert[] {
  const alerts: MarketAlert[] = [];

  products.forEach((product) => {
    if (product.reviewCount < 2500 && product.estimatedMonthlySales >= 6000) {
      alerts.push(alert("new_hot_product", "中", `发现新品爆款：${product.name}`, "销量高但评论壁垒尚未极深。", product, [
        `预计月销量 ${product.estimatedMonthlySales}`,
        `评论数 ${product.reviewCount}`,
      ]));
    }
    if (getGrowthSpeed(product, 30) >= 75) {
      alerts.push(alert("growth_product", "低", `发现增长产品：${product.name}`, "30 天增长指数较高，值得关注。", product, [
        `增长速度 ${getGrowthSpeed(product, 30)}`,
      ]));
    }
    if (product.riskScore >= 70 || reviews.filter((review) => review.productId === product.id && review.rating <= 3).length >= 2) {
      alerts.push(alert("high_risk_product", "高", `发现高风险产品：${product.name}`, "风险或差评信号偏高。", product, [
        `风险分 ${product.riskScore}`,
      ]));
    }
  });

  competitors.growingBrands.slice(0, 3).forEach((brand) => {
    if (brand.productCount >= 1 && brand.reviewGrowth >= 50) {
      alerts.push({
        id: `alert-competition-${brand.brand}-${new Date().toISOString().slice(0, 10)}`,
        type: "competition_intensified",
        severity: "中",
        title: `竞争加剧：${brand.brand}`,
        message: "品牌评论增长较快，需要监控价格和排名。",
        platform: brand.platform,
        createdAt: new Date().toISOString(),
        evidence: brand.reasons,
      });
    }
  });

  return alerts.slice(0, 50);
}

function buildExecutiveBrief(products: Product[], growth7: ProductGrowthInsight[], growth30: ProductGrowthInsight[], alerts: MarketAlert[]) {
  return {
    whatIsHappening: [
      `监控 ${monitoredPlatforms.length} 个平台，当前样本 ${products.length} 个产品。`,
      `发现 ${alerts.length} 条市场预警。`,
      `7 天增长榜第一：${growth7[0]?.productName ?? "暂无"}。`,
    ],
    growingProducts: growth30.slice(0, 5).map((item) => `${item.productName}：${item.growthLevel}，速度 ${item.growthSpeed}`),
    decliningProducts: products
      .filter((product) => product.riskScore >= 65 || product.rating < 4.2)
      .map((product) => `${product.name}：风险 ${product.riskScore}，评分 ${product.rating}`)
      .slice(0, 5),
    worthWatching: products
      .filter((product) => product.estimatedMonthlySales >= 5000 && product.reviewCount < 3000)
      .map((product) => `${product.name}：销量高且评论壁垒未完全形成`)
      .slice(0, 5),
    worthDeveloping: products
      .filter((product) => product.riskScore < 55 && product.marginScore >= 65)
      .map((product) => `${product.name}：毛利空间 ${product.marginScore}，风险 ${product.riskScore}`)
      .slice(0, 5),
    shouldAbandon: products
      .filter((product) => product.riskScore >= 70)
      .map((product) => `${product.name}：风险分 ${product.riskScore}`)
      .slice(0, 5),
  };
}

function toBrandInsight(brand: string, products: Product[]): BrandCompetitorInsight {
  const estimatedSales = products.reduce((sum, product) => sum + product.estimatedMonthlySales, 0);
  const reviewGrowth = products.reduce((sum, product) => sum + getReviewGrowth(product), 0);
  const rankChangeIndex = products.reduce((sum, product) => sum + getRankChangeIndex(product), 0) / Math.max(products.length, 1);
  const priceChangeIndex = products.reduce((sum, product) => sum + getPriceChangeIndex(product), 0) / Math.max(products.length, 1);
  const direction = reviewGrowth >= 60 || estimatedSales >= 8000 ? "增长" : rankChangeIndex < -20 ? "下降" : "稳定";

  return {
    brand,
    platform: products[0]?.platform,
    productCount: products.length,
    estimatedSales,
    reviewGrowth: round(reviewGrowth),
    rankChangeIndex: round(rankChangeIndex),
    priceChangeIndex: round(priceChangeIndex),
    direction,
    reasons: [
      `产品数 ${products.length}`,
      `预计销量 ${estimatedSales}`,
      `评论增长指数 ${round(reviewGrowth)}`,
      `价格变化指数 ${round(priceChangeIndex)}`,
    ],
  };
}

function alert(type: MarketAlert["type"], severity: MarketAlert["severity"], title: string, message: string, product: Product, evidence: string[]): MarketAlert {
  return {
    id: `alert-${type}-${product.id}-${new Date().toISOString().slice(0, 10)}`,
    type,
    severity,
    title,
    message,
    productId: product.id,
    platform: product.platform,
    createdAt: new Date().toISOString(),
    evidence,
  };
}

function getGrowthSpeed(product: Product, days: 7 | 30 | 90) {
  const windowFactor = days === 7 ? 1.4 : days === 30 ? 1 : 0.72;
  return round(clamp((getReviewGrowth(product) * 0.45 + product.estimatedMonthlySales / 220 + product.favorites / 700 - product.rank * 1.5) * windowFactor));
}

function getReviewGrowth(product: Product) {
  return round(product.reviewCount / 30);
}

function getRankChangeIndex(product: Product) {
  return round(100 - product.rank * 8);
}

function getPriceChangeIndex(product: Product) {
  return round(((product.price - product.discountPrice) / Math.max(product.price, 1)) * 100);
}

function getGrowthLevel(speed: number): MarketGrowthLevel {
  if (speed >= 90) return "爆发";
  if (speed >= 70) return "快速增长";
  if (speed >= 50) return "稳步增长";
  return "观察";
}

function groupBy<T>(items: T[], getKey: (item: T) => string) {
  const map = new Map<string, T[]>();
  items.forEach((item) => {
    const key = getKey(item);
    map.set(key, [...(map.get(key) ?? []), item]);
  });
  return map;
}

function round(value: number, digits = 0) {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

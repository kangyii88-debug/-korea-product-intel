import type { Product, ProductIntelligenceResult, RankingItem, RankingSystem } from "@/lib/types";

export function generateRankingSystem(products: Product[], analyses: ProductIntelligenceResult[]): RankingSystem {
  const byProductId = new Map(analyses.map((analysis) => [analysis.productId, analysis]));

  return {
    todayHotProducts: top(products, (product) => product.estimatedMonthlySales + product.favorites * 0.25 - product.rank * 200).map(
      toRanking("今日销量、收藏和排名综合领先"),
    ),
    weeklyHighPotentialProducts: top(products, (product) => {
      const analysis = byProductId.get(product.id);
      return (analysis?.score.recommendationIndex ?? product.score) + product.estimatedMonthlySales / 400;
    }).map(toRanking("推荐指数和销量验证同时较强")),
    lowCompetitionHighProfitProducts: top(products, (product) => {
      const analysis = byProductId.get(product.id);
      return (analysis?.score.profitMargin ?? product.marginScore) + (analysis?.score.competition ?? 50);
    }).map(toRanking("利润空间高且竞争压力相对低")),
    highGrowthProducts: top(products, (product) => product.favorites / Math.max(product.reviewCount, 1) + product.estimatedMonthlySales / 1000).map(
      toRanking("收藏/评论比和销量信号显示增长潜力"),
    ),
    optimizableNegativeReviewProducts: top(products, (product) => {
      const analysis = byProductId.get(product.id);
      return analysis?.score.reviewOptimizationSpace ?? 0;
    }).map(toRanking("差评集中在可通过产品或内容修复的问题")),
    chinaSupplyChainFitProducts: top(products, (product) => {
      const analysis = byProductId.get(product.id);
      return (analysis?.score.supplyChainFeasibility ?? 60) + (analysis?.score.logisticsFriendliness ?? 60);
    }).map(toRanking("材质、结构和物流条件适合中国供应链开发")),
    highRiskProducts: top(products, (product) => product.riskScore).map(toRanking("风险分较高，需要谨慎或放弃")),
  };
}

function top(products: Product[], score: (product: Product) => number) {
  return [...products]
    .map((product) => ({ product, score: Math.round(score(product)) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

function toRanking(reason: string) {
  return ({ product, score }: { product: Product; score: number }): RankingItem => ({
    productId: product.id,
    productName: product.name,
    reason,
    score,
  });
}

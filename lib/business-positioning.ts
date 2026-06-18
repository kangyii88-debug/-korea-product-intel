import type { LocalProduct, ProductAnalysis } from "@/lib/local-products";
import type { Product } from "@/lib/types";

export type RecommendationDirection =
  | "Rocket Growth"
  | "PB"
  | "Rocket Growth + PB"
  | "继续观察"
  | "放弃";

export type ActionButtonLabel =
  | "转入 Rocket Growth 项目"
  | "转入 PB 项目"
  | "生成产品提案"
  | "生成供应商开发任务"
  | "生成竞品分析报告"
  | "标记为继续观察"
  | "标记为淘汰";

type DirectionSignal = {
  score: number;
  margin: number;
  risk: number;
  supplyChain: number;
  logistics: number;
};

function resolveDirection(signal: DirectionSignal): RecommendationDirection {
  if (signal.score >= 84 && signal.margin >= 60 && signal.risk <= 35 && signal.supplyChain >= 72) {
    return "Rocket Growth + PB";
  }
  if (signal.score >= 76 && signal.risk <= 45 && signal.logistics >= 65) {
    return "Rocket Growth";
  }
  if (signal.supplyChain >= 75 && signal.margin >= 52 && signal.risk <= 55) {
    return "PB";
  }
  if (signal.score >= 58) {
    return "继续观察";
  }
  return "放弃";
}

export function getDirectionFromLocalProduct(product: LocalProduct, analysis: ProductAnalysis): RecommendationDirection {
  return resolveDirection({
    score: analysis.totalScore,
    margin: analysis.estimatedMarginRate,
    risk: analysis.riskLevel === "高" ? 80 : analysis.riskLevel === "中" ? 50 : 25,
    supplyChain: analysis.supplyChainFit,
    logistics: analysis.logisticsFriendliness,
  });
}

export function getDirectionFromMockProduct(product: Product): RecommendationDirection {
  return resolveDirection({
    score: product.score,
    margin: product.marginScore,
    risk: product.riskScore,
    supplyChain: Math.max(40, 100 - product.riskScore + 10),
    logistics: Math.max(45, 100 - product.riskScore),
  });
}

export function getActionButtons(direction: RecommendationDirection): ActionButtonLabel[] {
  switch (direction) {
    case "Rocket Growth + PB":
      return ["转入 Rocket Growth 项目", "转入 PB 项目", "生成产品提案", "生成供应商开发任务"];
    case "Rocket Growth":
      return ["转入 Rocket Growth 项目", "生成产品提案", "生成竞品分析报告"];
    case "PB":
      return ["转入 PB 项目", "生成供应商开发任务", "生成产品提案"];
    case "继续观察":
      return ["标记为继续观察", "生成竞品分析报告"];
    case "放弃":
      return ["标记为淘汰"];
  }
}

export function getDirectionTone(direction: RecommendationDirection) {
  switch (direction) {
    case "Rocket Growth + PB":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Rocket Growth":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "PB":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "继续观察":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "放弃":
      return "border-red-200 bg-red-50 text-red-700";
  }
}

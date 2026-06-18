import type { LocalProduct, ProductAnalysis, RecommendationDirection } from "@/lib/local-products";
import type { Product } from "@/lib/types";

export type ActionButtonLabel =
  | "转入 Rocket Growth 项目"
  | "转入 PB 项目"
  | "生成产品提案"
  | "生成供应商开发任务"
  | "生成竞品分析报告"
  | "标记为继续观察"
  | "标记为淘汰";

export function getDirectionFromLocalProduct(_product: LocalProduct, analysis: ProductAnalysis): RecommendationDirection {
  return analysis.direction;
}

export function getDirectionFromMockProduct(product: Product): RecommendationDirection {
  if (product.score >= 84 && product.marginScore >= 70 && product.riskScore <= 35) {
    return "Rocket Growth + PB";
  }
  if (product.score >= 75 && product.riskScore <= 45) {
    return "Rocket Growth";
  }
  if (product.marginScore >= 65 && product.riskScore <= 55) {
    return "PB";
  }
  if (product.score >= 60) {
    return "继续观察";
  }
  return "放弃";
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
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "继续观察":
      return "border-stone-200 bg-stone-50 text-stone-700";
    case "放弃":
      return "border-rose-200 bg-rose-50 text-rose-700";
  }
}

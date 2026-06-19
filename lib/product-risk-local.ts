"use client";

import type { LocalProduct } from "@/lib/local-products";
import type { ProductOpportunityRecord } from "@/lib/product-opportunities";

type SampleRow = Record<string, unknown>;

export type RiskLevel = "low" | "medium" | "high";
export type RiskAction = "push" | "conditional" | "observe" | "pause";

export type ProductRiskAssessmentRecord = {
  id: string;
  source_type: "testing_db" | "opportunity_board";
  source_id: string;
  product_name_ko: string;
  product_name_zh: string;
  coupang_url: string;
  image_url: string;
  category: string;
  brand: string;
  material: string;
  usage_description: string;
  size: string;
  weight: string;
  package_size: string;
  competitor_price_krw: number;
  monthly_purchase_badge: string;
  review_count: number;
  rating: number;
  consumer_pain_points: string;
  risk_need_kc: boolean;
  risk_kc_documents_ready: boolean;
  risk_children_product: boolean;
  risk_food: boolean;
  risk_electronics: boolean;
  risk_cosmetics: boolean;
  risk_medical: boolean;
  risk_skin_contact: boolean;
  risk_battery: boolean;
  risk_plug: boolean;
  risk_liquid: boolean;
  risk_chemical: boolean;
  risk_korea_regulation_uncertain: boolean;
  risk_fragile: boolean;
  risk_heavy: boolean;
  risk_large_volume: boolean;
  risk_package_unknown: boolean;
  international_logistics_risk: RiskLevel;
  korea_local_logistics_risk: RiskLevel;
  risk_high_return: boolean;
  risk_size_issue: boolean;
  risk_installation_issue: boolean;
  risk_quality_issue: boolean;
  risk_color_difference: boolean;
  risk_smell_issue: boolean;
  risk_image_mismatch: boolean;
  risk_coupang_platform_limit: boolean;
  certification_risk_level: RiskLevel;
  logistics_risk_level: RiskLevel;
  return_risk_level: RiskLevel;
  platform_risk_level: RiskLevel;
  overall_risk_level: RiskLevel;
  risk_reason: string;
  required_documents: string[];
  recommended_action: RiskAction;
  next_action: string;
  current_status: string;
  action_items: string[];
  created_at: string;
  updated_at: string;
};

const STORAGE_KEY = "kpi-product-risk-assessments-v1";

export function loadLocalRiskAssessments(): ProductRiskAssessmentRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ProductRiskAssessmentRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalRiskAssessments(items: ProductRiskAssessmentRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function replaceLocalRiskAssessments(items: ProductRiskAssessmentRecord[]) {
  saveLocalRiskAssessments(items);
}

export function buildRiskAssessmentFromLocalProduct(product: LocalProduct): ProductRiskAssessmentRecord {
  const pain = `${product.consumerPainPoints} ${product.reviewSummary} ${product.reviews.join(" ")}`.trim();
  return finalizeRiskRecord({
    id: `testing-${product.id}`,
    source_type: "testing_db",
    source_id: product.id,
    product_name_ko: product.productNameKo,
    product_name_zh: product.productNameZh,
    coupang_url: product.competitorUrl,
    image_url: product.image,
    category: product.category,
    brand: product.brand,
    material: product.material,
    usage_description: product.marketAnalysis,
    size: product.size,
    weight: product.weight,
    package_size: product.packageSize,
    competitor_price_krw: product.competitorSalePriceKrw || product.discountPrice || product.price || 0,
    monthly_purchase_badge: "",
    review_count: product.reviewCount,
    rating: product.rating,
    consumer_pain_points: pain,
    risk_need_kc: product.needsKcCertification,
    risk_kc_documents_ready: product.kcDocsReady,
    risk_children_product: product.childrenProduct,
    risk_food: product.foodProduct,
    risk_electronics: product.electronicsProduct,
    risk_cosmetics: product.cosmeticsProduct,
    risk_medical: product.medicalProduct,
    risk_skin_contact: /skin|face|body|贴肤|피부|착용/i.test(`${product.category} ${product.productNameZh} ${product.productNameKo}`),
    risk_battery: /battery|电池|배터리/i.test(`${product.productNameZh} ${product.productNameKo}`),
    risk_plug: /plug|插头|콘센트|전기/i.test(`${product.productNameZh} ${product.productNameKo}`),
    risk_liquid: /liquid|液体|세제|喷雾|스프레이/i.test(`${product.productNameZh} ${product.productNameKo}`),
    risk_chemical: /chemical|化学|향|접착|胶|세정/i.test(`${product.material} ${product.productNameZh} ${product.productNameKo}`),
    risk_korea_regulation_uncertain: product.uncertainRegulation,
    risk_fragile: product.fragile,
    risk_heavy: isHeavy(product.weight),
    risk_large_volume: isLargeVolume(product.packageSize, product.size),
    risk_package_unknown: !product.packageSize,
    risk_high_return: product.possibleHighReturn || /return|退货|반품/i.test(pain),
    risk_size_issue: /size|尺寸|작다|크다|大小/i.test(pain),
    risk_installation_issue: /install|安装|설치|조립/i.test(pain),
    risk_quality_issue: /quality|质量|불량|마감|내구/i.test(pain),
    risk_color_difference: /color|颜色|색상/i.test(pain),
    risk_smell_issue: /smell|味道|냄새/i.test(pain),
    risk_image_mismatch: /image|photo|图片|상세|다르/i.test(pain),
    risk_coupang_platform_limit: product.coupangRestricted,
  });
}

export function buildRiskAssessmentFromOpportunity(item: ProductOpportunityRecord): ProductRiskAssessmentRecord {
  const pain = `${item.review_issue_summary || ""} ${item.negative_review_keywords || ""} ${item.notes || ""}`.trim();
  return finalizeRiskRecord({
    id: `opportunity-${item.id}`,
    source_type: "opportunity_board",
    source_id: item.id,
    product_name_ko: item.title,
    product_name_zh: item.title,
    coupang_url: item.coupang_url || "",
    image_url: item.image_url || "",
    category: item.category,
    brand: "",
    material: "",
    usage_description: item.improvement_points || item.notes || "",
    size: "",
    weight: "",
    package_size: "",
    competitor_price_krw: Number(item.price || 0),
    monthly_purchase_badge: item.demand_stability || "",
    review_count: Number(item.review_count || 0),
    rating: Number(item.rating || 0),
    consumer_pain_points: pain,
    risk_need_kc: item.kc_risk === "high",
    risk_kc_documents_ready: false,
    risk_children_product: /儿童|婴儿|kids|baby|아기|유아/i.test(item.title),
    risk_food: /food|食品|零食|먹거리/i.test(item.title),
    risk_electronics: /电|电子|usb|led|充电|가전|전기/i.test(item.title),
    risk_cosmetics: /化妆|cosmetic|mask|cream|护肤|뷰티/i.test(item.title),
    risk_medical: /medical|医|医疗|치료/i.test(item.title),
    risk_skin_contact: /贴肤|穿戴|face|body|피부|착용/i.test(item.title),
    risk_battery: /battery|电池|배터리/i.test(item.title),
    risk_plug: /plug|插头|전기|콘센트/i.test(item.title),
    risk_liquid: /liquid|喷雾|液体|세제/i.test(item.title),
    risk_chemical: /胶|化学|粘|세정|향/i.test(`${item.title} ${pain}`),
    risk_korea_regulation_uncertain: item.kc_risk === "medium" || item.supply_chain_risk === "high",
    risk_fragile: item.volume_weight_risk === "high",
    risk_heavy: item.volume_weight_risk === "high",
    risk_large_volume: item.volume_weight_risk !== "low",
    risk_package_unknown: true,
    risk_high_return: item.return_risk === "high",
    risk_size_issue: /size|尺寸|大小|小|大/i.test(pain),
    risk_installation_issue: /install|安装|조립|설치/i.test(pain),
    risk_quality_issue: /质量|불량|quality|마감/i.test(pain),
    risk_color_difference: /color|颜色|색/i.test(pain),
    risk_smell_issue: /smell|味|냄새/i.test(pain),
    risk_image_mismatch: /image|图片|详情|photo|상세/i.test(pain),
    risk_coupang_platform_limit: item.kc_risk === "high" && item.business_type === "rocket_growth",
  });
}

export function buildRiskAssessmentFromSampleRow(row: SampleRow): ProductRiskAssessmentRecord {
  const pain = `${text(row.consumer_pain_points)} ${text(row.bad_review_samples)} ${text(row.market_analysis)}`.trim();
  return finalizeRiskRecord({
    id: `sample-${text(row.coupang_url) || text(row.product_name_ko)}`,
    source_type: "opportunity_board",
    source_id: text(row.coupang_url) || text(row.product_name_ko),
    product_name_ko: text(row.product_name_ko),
    product_name_zh: text(row.product_name_zh),
    coupang_url: text(row.coupang_url),
    image_url: text(row.image_url),
    category: text(row.category),
    brand: text(row.brand),
    material: "",
    usage_description: text(row.market_analysis),
    size: "",
    weight: "",
    package_size: "",
    competitor_price_krw: toNumber(row.competitor_price_krw),
    monthly_purchase_badge: text(row.monthly_purchase_badge),
    review_count: toNumber(row.review_count),
    rating: toNumber(row.rating),
    consumer_pain_points: pain,
    risk_need_kc: /儿童|婴儿|baby|kids|아기|유아|电|充电|medical|医疗|化妆|食品/.test(
      `${text(row.product_name_ko)} ${text(row.product_name_zh)} ${text(row.category)}`,
    ),
    risk_kc_documents_ready: false,
    risk_children_product: /儿童|婴儿|baby|kids|유아|아기/i.test(`${text(row.product_name_ko)} ${text(row.product_name_zh)}`),
    risk_food: /food|食品|零食|먹/i.test(`${text(row.product_name_ko)} ${text(row.product_name_zh)}`),
    risk_electronics: /电|电子|led|usb|充电|전기/i.test(`${text(row.product_name_ko)} ${text(row.product_name_zh)}`),
    risk_cosmetics: /化妆|护肤|美妆|cosmetic|뷰티/i.test(`${text(row.product_name_ko)} ${text(row.product_name_zh)}`),
    risk_medical: /medical|医|医疗|치료/i.test(`${text(row.product_name_ko)} ${text(row.product_name_zh)}`),
    risk_skin_contact: /贴肤|face|body|피부|착용/i.test(`${text(row.product_name_ko)} ${text(row.product_name_zh)}`),
    risk_battery: /battery|电池|배터리/i.test(`${text(row.product_name_ko)} ${text(row.product_name_zh)}`),
    risk_plug: /plug|插头|전기|콘센트/i.test(`${text(row.product_name_ko)} ${text(row.product_name_zh)}`),
    risk_liquid: /liquid|喷雾|液体|세제/i.test(`${text(row.product_name_ko)} ${text(row.product_name_zh)}`),
    risk_chemical: /胶|化学|세정|향|접착/i.test(`${text(row.product_name_ko)} ${text(row.product_name_zh)} ${pain}`),
    risk_korea_regulation_uncertain: !text(row.category),
    risk_fragile: /易碎|fragile|깨짐/i.test(pain),
    risk_heavy: false,
    risk_large_volume: false,
    risk_package_unknown: true,
    risk_high_return: /退货|반품/i.test(pain),
    risk_size_issue: /尺寸|size|작다|크다/i.test(pain),
    risk_installation_issue: /安装|설치|조립/i.test(pain),
    risk_quality_issue: /质量|불량|quality|내구|마감/i.test(pain),
    risk_color_difference: /颜色|color|색상/i.test(pain),
    risk_smell_issue: /味|smell|냄새/i.test(pain),
    risk_image_mismatch: /图片|image|photo|상세/i.test(pain),
    risk_coupang_platform_limit: false,
  });
}

export function mergeRiskAssessmentRecords(
  current: ProductRiskAssessmentRecord[],
  incoming: ProductRiskAssessmentRecord[],
) {
  const next = [...current];
  for (const item of incoming) {
    const index = next.findIndex(
      (existing) =>
        existing.id === item.id ||
        (existing.coupang_url && existing.coupang_url === item.coupang_url) ||
        (existing.source_type === item.source_type && existing.source_id === item.source_id),
    );
    if (index >= 0) {
      next[index] = { ...next[index], ...item, updated_at: new Date().toISOString() };
    } else {
      next.unshift(item);
    }
  }
  return next;
}

type RiskSeed = Omit<
  ProductRiskAssessmentRecord,
  | "international_logistics_risk"
  | "korea_local_logistics_risk"
  | "certification_risk_level"
  | "logistics_risk_level"
  | "return_risk_level"
  | "platform_risk_level"
  | "overall_risk_level"
  | "risk_reason"
  | "required_documents"
  | "recommended_action"
  | "next_action"
  | "current_status"
  | "action_items"
  | "created_at"
  | "updated_at"
>;

function finalizeRiskRecord(seed: RiskSeed): ProductRiskAssessmentRecord {
  const now = new Date().toISOString();
  const certification_risk_level = deriveCertificationRisk(seed);
  const international_logistics_risk = seed.risk_fragile || seed.risk_large_volume || seed.risk_heavy ? "high" : seed.risk_package_unknown ? "medium" : "low";
  const korea_local_logistics_risk = seed.risk_large_volume || seed.risk_heavy ? "high" : seed.risk_fragile ? "medium" : "low";
  const logistics_risk_level = maxRiskLevel(international_logistics_risk, korea_local_logistics_risk);
  const return_risk_level = deriveReturnRisk(seed);
  const platform_risk_level = derivePlatformRisk(seed);
  const overall_risk_level = maxRiskLevel(certification_risk_level, logistics_risk_level, return_risk_level, platform_risk_level);
  const required_documents = buildRequiredDocuments(seed);
  const recommended_action = deriveRiskAction(overall_risk_level, certification_risk_level, platform_risk_level);
  const action_items = buildRiskActionItems(seed, { certification_risk_level, logistics_risk_level, return_risk_level, platform_risk_level, overall_risk_level });

  return {
    ...seed,
    international_logistics_risk,
    korea_local_logistics_risk,
    certification_risk_level,
    logistics_risk_level,
    return_risk_level,
    platform_risk_level,
    overall_risk_level,
    risk_reason: buildRiskReason(seed, {
      certification_risk_level,
      logistics_risk_level,
      return_risk_level,
      platform_risk_level,
      overall_risk_level,
    }),
    required_documents,
    recommended_action,
    next_action: action_items[0] || "继续观察",
    current_status: buildCurrentStatus(recommended_action),
    action_items,
    created_at: now,
    updated_at: now,
  };
}

function deriveCertificationRisk(seed: RiskSeed): RiskLevel {
  if (
    (seed.risk_need_kc && !seed.risk_kc_documents_ready) ||
    seed.risk_medical ||
    seed.risk_children_product ||
    seed.risk_food
  ) {
    return "high";
  }
  if (
    seed.risk_electronics ||
    seed.risk_cosmetics ||
    seed.risk_skin_contact ||
    seed.risk_battery ||
    seed.risk_plug ||
    seed.risk_liquid ||
    seed.risk_chemical ||
    seed.risk_korea_regulation_uncertain
  ) {
    return "medium";
  }
  return "low";
}

function deriveReturnRisk(seed: RiskSeed): RiskLevel {
  const count = [
    seed.risk_high_return,
    seed.risk_size_issue,
    seed.risk_installation_issue,
    seed.risk_quality_issue,
    seed.risk_color_difference,
    seed.risk_smell_issue,
    seed.risk_image_mismatch,
  ].filter(Boolean).length;

  if (count >= 4 || seed.rating > 0 && seed.rating < 4) return "high";
  if (count >= 2) return "medium";
  return "low";
}

function derivePlatformRisk(seed: RiskSeed): RiskLevel {
  if (seed.risk_coupang_platform_limit) return "high";
  if (seed.risk_korea_regulation_uncertain || seed.risk_need_kc || seed.risk_battery || seed.risk_plug) return "medium";
  return "low";
}

function maxRiskLevel(...levels: RiskLevel[]): RiskLevel {
  if (levels.includes("high")) return "high";
  if (levels.includes("medium")) return "medium";
  return "low";
}

function buildRequiredDocuments(seed: RiskSeed) {
  const docs: string[] = [];
  if (seed.risk_need_kc) docs.push("KC certification or exemption note");
  if (seed.risk_children_product) docs.push("Children product compliance proof");
  if (seed.risk_food) docs.push("Food / hygiene import approval");
  if (seed.risk_cosmetics) docs.push("Cosmetics registration proof");
  if (seed.risk_electronics || seed.risk_battery || seed.risk_plug) docs.push("Electrical safety / battery transport documents");
  if (seed.risk_liquid || seed.risk_chemical) docs.push("MSDS or ingredient statement");
  return docs;
}

function deriveRiskAction(overall: RiskLevel, certification: RiskLevel, platform: RiskLevel): RiskAction {
  if (platform === "high" || certification === "high") return "pause";
  if (overall === "high") return "observe";
  if (overall === "medium") return "conditional";
  return "push";
}

function buildRiskReason(
  seed: RiskSeed,
  levels: {
    certification_risk_level: RiskLevel;
    logistics_risk_level: RiskLevel;
    return_risk_level: RiskLevel;
    platform_risk_level: RiskLevel;
    overall_risk_level: RiskLevel;
  },
) {
  const reasons: string[] = [];
  if (levels.certification_risk_level !== "low") reasons.push(`certification ${levels.certification_risk_level}`);
  if (levels.logistics_risk_level !== "low") reasons.push(`logistics ${levels.logistics_risk_level}`);
  if (levels.return_risk_level !== "low") reasons.push(`return ${levels.return_risk_level}`);
  if (levels.platform_risk_level !== "low") reasons.push(`platform ${levels.platform_risk_level}`);
  if (seed.risk_need_kc && !seed.risk_kc_documents_ready) reasons.push("KC docs missing");
  if (seed.risk_fragile) reasons.push("fragile packaging");
  if (seed.risk_large_volume) reasons.push("large volume");
  if (seed.risk_high_return) reasons.push("return-related complaint");
  return reasons.join(" | ") || "low risk";
}

function buildRiskActionItems(
  seed: RiskSeed,
  levels: {
    certification_risk_level: RiskLevel;
    logistics_risk_level: RiskLevel;
    return_risk_level: RiskLevel;
    platform_risk_level: RiskLevel;
    overall_risk_level: RiskLevel;
  },
) {
  const items: string[] = [];
  if (seed.risk_need_kc && !seed.risk_kc_documents_ready) items.push("先确认 KC / 豁免文件");
  if (seed.risk_children_product || seed.risk_food || seed.risk_medical) items.push("先做韩国法规核验");
  if (seed.risk_fragile || seed.risk_large_volume || seed.risk_heavy) items.push("重测包装与国际物流费用");
  if (seed.risk_high_return || levels.return_risk_level === "high") items.push("复盘差评并先改文案 / 尺寸说明");
  if (seed.risk_coupang_platform_limit) items.push("确认 Coupang 平台是否允许上架");
  if (!items.length && levels.overall_risk_level === "low") items.push("可以进入下一步供应链验证");
  return items;
}

function buildCurrentStatus(action: RiskAction) {
  if (action === "push") return "可继续推进";
  if (action === "conditional") return "有条件推进";
  if (action === "observe") return "继续观察";
  return "建议暂停";
}

function isLargeVolume(packageSize: string, size: string) {
  const text = `${packageSize} ${size}`;
  const nums = (text.match(/\d+(\.\d+)?/g) ?? []).map(Number);
  return nums.some((value) => value >= 180) || nums.filter((value) => value >= 90).length >= 2;
}

function isHeavy(weight: string) {
  const match = weight.match(/(\d+(\.\d+)?)/);
  return match ? Number(match[1]) >= 8 : false;
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
}

function toNumber(value: unknown) {
  const n = Number(String(value ?? 0).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

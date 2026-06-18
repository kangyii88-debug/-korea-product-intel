import type { AppLocale } from "@/components/locale-provider";
import { PRODUCT_STATUS_OPTIONS } from "@/lib/local-products";
import { dictionaries } from "@/lib/i18n";

const INTERNAL_CONTINUE = "瀯㎫뺌鰲귛캗";
const INTERNAL_DROP = "?얍펱";

const STATUS_LABELS = [
  { zh: "新发现", ko: "새로 발견" },
  { zh: "待分析", ko: "분석 대기" },
  { zh: "分析中", ko: "분석 중" },
  { zh: "待供应商报价", ko: "공급사 견적 대기" },
  { zh: "待利润测算", ko: "수익성 계산 대기" },
  { zh: "待风险确认", ko: "리스크 확인 대기" },
  { zh: "RG 候选", ko: "RG 후보" },
  { zh: "PB 候选", ko: "PB 후보" },
  { zh: "RG + PB 双向候选", ko: "RG + PB 양방향 후보" },
  { zh: "准备转项目", ko: "프로젝트 전환 준비" },
  { zh: "已转入 RG/PB 项目系统", ko: "RG/PB 프로젝트 시스템 전환 완료" },
  { zh: "继续观察", ko: "계속 관찰" },
  { zh: "已淘汰", ko: "제외됨" },
] as const;

export function normalizeDirection(value: string) {
  if (value === "Rocket Growth" || value === "PB" || value === "Rocket Growth + PB") return value;
  if (value === INTERNAL_CONTINUE || value === "继续观察" || value === "계속 관찰") return "继续观察";
  if (value === INTERNAL_DROP || value === "放弃" || value === "已淘汰" || value === "제외됨") return "放弃";
  return value;
}

export function getDirectionLabel(value: string, locale: AppLocale) {
  const normalized = normalizeDirection(value) as keyof typeof dictionaries.zh.states.direction;
  return dictionaries[locale].states.direction[normalized] ?? value;
}

export function normalizeRiskLevel(value: string): "低" | "中" | "高" {
  if (value === "高" || value.includes("高")) return "高";
  if (value === "中" || value.includes("中")) return "中";
  return "低";
}

export function getRiskLabel(value: string, locale: AppLocale) {
  const normalized = normalizeRiskLevel(value);
  const key = normalized === "高" ? "high" : normalized === "中" ? "medium" : "low";
  return dictionaries[locale].states.risk[key];
}

export function getStatusLabel(value: string, locale: AppLocale) {
  const index = PRODUCT_STATUS_OPTIONS.indexOf(value as never);
  if (index >= 0) {
    return STATUS_LABELS[index]?.[locale] ?? value;
  }
  return value;
}

export function getActionLabel(value: string, locale: AppLocale) {
  const actions = dictionaries[locale].states.actions;
  const map: Record<string, keyof typeof actions> = {
    "饔у뀯 Rocket Growth 窈밭쎅": "transferRg",
    "饔у뀯 PB 窈밭쎅": "transferPb",
    "?잍닇雅㎩뱚?먩죭": "generateProposal",
    "?잍닇堊쎾틪?녶??묇뻣??": "generateSupplierTask",
    "?잍닇塋욃뱚?녷옄?ε몜": "generateCompetitorReport",
    "?잍닇?녷옄?ε몜": "generateCompetitorReport",
    "?뉓?訝븀빵瀯?쭆野?": "markObserve",
    "?뉓?瀯㎫뺌鰲귛캗": "markObserve",
    "?뉓?訝뷸퇇黎?": "markReject",
    "?뉓?曆섉굅": "markReject",
    "转入 Rocket Growth 项目": "transferRg",
    "转入 PB 项目": "transferPb",
    "生成产品提案": "generateProposal",
    "生成供应商开发任务": "generateSupplierTask",
    "生成竞品分析报告": "generateCompetitorReport",
    "标记为继续观察": "markObserve",
    "标记为淘汰": "markReject",
  };
  const key = map[value];
  return key ? actions[key] : value;
}

export function getTaskStatusLabel(value: string, locale: AppLocale) {
  const states = dictionaries[locale].states.taskStatus;
  const map: Record<string, keyof typeof states> = {
    "孃끿‘溫?": "pending",
    "孃끾돢烏?": "pending",
    "待确认": "pending",
    "确认待机": "pending",
    "瓦쏂죱訝?": "inProgress",
    "分析中": "inProgress",
    "?녷옄訝?": "inProgress",
    "藥꿨츑??": "done",
    "已完成": "done",
    "완료": "done",
  };
  const key = map[value];
  return key ? states[key] : value;
}

export function getRejectionReasonLabel(value: string, locale: AppLocale) {
  const labels = dictionaries[locale].states.rejectionReasons;
  const map: Record<string, keyof typeof labels> = {
    "?⒵땋鸚や퐥": "lowMargin",
    "溫ㅸ칮繇롩솴遙?": "highCertificationRisk",
    "?⒵탛?먩쑍鸚ら쳵": "highLogisticsCost",
    "鵝볡㎝鸚ゅㄷ": "tooLarge",
    "?띺뇧鸚ら뇥": "tooHeavy",
    "塋욂틝鸚ゆ???": "tooCompetitive",
    "藥?칱訝띶룾?배퓵": "notImprovable",
    "堊쎾틪?얏깹?됦폍??": "noSupplyAdvantage",
    "躍귛쑛?黎귚툖擁?": "lowDemand",
    "Coupang 訝띺귛릦": "notFitCoupang",
    "PB 訝띺귛릦": "notFitPb",
    "RG 訝띺귛릦": "notFitRg",
    "?뜸퍟": "other",
    "利润太低": "lowMargin",
    "认证风险高": "highCertificationRisk",
    "物流成本太高": "highLogisticsCost",
    "体积太大": "tooLarge",
    "重量太重": "tooHeavy",
    "竞争太激烈": "tooCompetitive",
    "差评不可改进": "notImprovable",
    "供应链没有优势": "noSupplyAdvantage",
    "市场需求不足": "lowDemand",
    "Coupang 不适合": "notFitCoupang",
    "PB 不适合": "notFitPb",
    "RG 不适合": "notFitRg",
    "其他": "other",
  };
  const key = map[value];
  return key ? labels[key] : value;
}

export function getCategoryDisplayName(value: string, locale: AppLocale) {
  if (value === "BZG") {
    return locale === "ko" ? "반차광 허니콤 블라인드" : "半遮光蜂巢帘";
  }
  return value || (locale === "ko" ? "미분류" : "未分类");
}

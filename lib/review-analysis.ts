import type { ProductReview, ReviewIssueAnalysis, ReviewIssueType, Severity } from "@/lib/types";

type IssueRule = {
  issueType: ReviewIssueType;
  label: string;
  keywords: string[];
  suggestions: string[];
};

const issueRules: IssueRule[] = [
  {
    issueType: "size",
    label: "尺寸问题",
    keywords: ["尺寸", "大小", "太小", "太大", "不合适", "길이", "사이즈", "작아요", "커요", "맞지"],
    suggestions: ["增加尺寸规格表", "增加尺寸测量图", "主图加入实际安装或使用参照"],
  },
  {
    issueType: "material",
    label: "材质问题",
    keywords: ["材质", "材料", "塑料感", "薄", "廉价", "소재", "재질", "얇", "싸구려"],
    suggestions: ["升级关键接触部位材质", "详情页明确材质等级", "增加材质近景实拍图"],
  },
  {
    issueType: "installation",
    label: "安装问题",
    keywords: ["安装", "装不上", "难装", "打孔", "설치", "조립", "어려워", "안 맞"],
    suggestions: ["增加安装视频", "优化安装结构", "包装内加入韩文安装说明卡"],
  },
  {
    issueType: "packaging",
    label: "包装问题",
    keywords: ["包装", "破损", "压坏", "盒子", "포장", "박스", "파손", "찌그러"],
    suggestions: ["加强外箱和边角保护", "增加跌落测试标准", "易损部件独立固定"],
  },
  {
    issueType: "color",
    label: "颜色问题",
    keywords: ["颜色", "色差", "偏黄", "偏灰", "컬러", "색상", "색감", "달라"],
    suggestions: ["增加自然光实拍图", "优化主图颜色校准", "按平台展示真实色卡"],
  },
  {
    issueType: "logistics",
    label: "物流问题",
    keywords: ["物流", "配送", "太慢", "快递", "배송", "늦", "택배"],
    suggestions: ["优先配置本地仓或快速配送", "详情页明确发货时效", "高峰期增加安全库存"],
  },
  {
    issueType: "quality",
    label: "质量问题",
    keywords: ["质量", "坏了", "异响", "松动", "掉", "품질", "고장", "불량", "소음", "흔들"],
    suggestions: ["建立出厂质检清单", "要求供应商提供循环测试数据", "高投诉部件升级结构"],
  },
  {
    issueType: "price",
    label: "价格问题",
    keywords: ["贵", "不值", "价格", "性价比", "비싸", "가격", "가성비"],
    suggestions: ["拆分基础款和升级款", "强化价值点对比", "测试优惠券后的真实转化价格"],
  },
  {
    issueType: "manual",
    label: "说明书问题",
    keywords: ["说明书", "看不懂", "没有说明", "설명서", "안내", "이해"],
    suggestions: ["增加韩文图文说明书", "用二维码链接安装视频", "详情页增加 FAQ"],
  },
  {
    issueType: "photo_mismatch",
    label: "照片不符问题",
    keywords: ["实物不符", "图片不一样", "照片", "상세페이지", "사진", "실물", "달라요"],
    suggestions: ["增加无滤镜实拍图", "详情页标注拍摄环境", "减少过度渲染图"],
  },
];

export function analyzeReviews(reviews: ProductReview[]): ReviewIssueAnalysis[] {
  const total = Math.max(reviews.length, 1);

  return issueRules
    .map((rule) => {
      const matched = reviews.filter((review) => {
        const text = review.text.toLowerCase();
        return rule.keywords.some((keyword) => text.includes(keyword.toLowerCase()));
      });
      const negativeMatches = matched.filter((review) => review.rating <= 3);
      const ratio = matched.length / total;

      return {
        issueType: rule.issueType,
        label: rule.label,
        count: matched.length,
        ratio,
        severity: getSeverity(ratio, negativeMatches.length),
        affectsPurchase: ratio >= 0.12 || negativeMatches.length >= 2,
        affectsRepurchase: ratio >= 0.08 || negativeMatches.length >= 1,
        evidence: matched.slice(0, 3).map((review) => review.text),
        optimizationSuggestions: rule.suggestions,
      } satisfies ReviewIssueAnalysis;
    })
    .filter((issue) => issue.count > 0)
    .sort((a, b) => b.count - a.count);
}

export function normalizePastedReviews(productId: string, rawText: string): ProductReview[] {
  return rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((text, index) => ({
      id: `${productId}-pasted-${index + 1}`,
      productId,
      rating: inferRating(text),
      text,
      language: /[가-힣]/.test(text) ? "ko" : "zh",
      createdAt: new Date().toISOString(),
    }));
}

function getSeverity(ratio: number, negativeCount: number): Severity {
  if (ratio >= 0.2 || negativeCount >= 5) return "高";
  if (ratio >= 0.08 || negativeCount >= 2) return "中";
  return "低";
}

function inferRating(text: string) {
  const negativeWords = ["差", "坏", "退货", "破损", "不符", "비싸", "불량", "파손", "반품", "별로"];
  return negativeWords.some((word) => text.includes(word)) ? 2 : 4;
}

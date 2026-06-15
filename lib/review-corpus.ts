import type { ProductReview, ReviewCorpusStats } from "@/lib/types";
import { analyzeReviews } from "@/lib/review-analysis";

export type ReviewKeywordExtraction = {
  reviewId: string;
  keyword: string;
  language: ProductReview["language"];
  sentiment: "positive" | "neutral" | "negative";
  issueType?: string;
  weight: number;
};

export type ReviewSentimentResult = {
  reviewId: string;
  sentiment: "positive" | "neutral" | "negative";
  score: number;
  purchaseImpact: boolean;
  repurchaseImpact: boolean;
};

export function buildReviewCorpusAnalysis(reviews: ProductReview[]) {
  const issues = analyzeReviews(reviews);
  const sentiments = reviews.map(analyzeSentiment);
  const keywords = reviews.flatMap((review) => extractReviewKeywords(review, sentiments.find((item) => item.reviewId === review.id)));

  return {
    stats: buildReviewCorpusStats(reviews, keywords, sentiments),
    issues,
    keywords,
    sentiments,
  };
}

export function buildReviewCorpusStats(
  reviews: ProductReview[],
  keywords: ReviewKeywordExtraction[],
  sentiments: ReviewSentimentResult[],
): ReviewCorpusStats {
  const totalReviews = reviews.length;

  return {
    totalReviews,
    koreanReviews: reviews.filter((review) => review.language === "ko").length,
    translatedChineseReviews: 0,
    analyzedReviews: sentiments.length,
    keywordExtractedReviews: new Set(keywords.map((keyword) => keyword.reviewId)).size,
    sentimentAnalyzedReviews: sentiments.length,
    issueClassifiedReviews: reviews.length,
    milestone: totalReviews >= 1000000 ? "100万" : totalReviews >= 500000 ? "50万" : "10万",
  };
}

function analyzeSentiment(review: ProductReview): ReviewSentimentResult {
  const negativeWords = ["差", "坏", "退货", "破损", "不符", "太小", "难", "비싸", "불량", "파손", "반품", "별로", "어려워"];
  const positiveWords = ["好", "方便", "喜欢", "满意", "추천", "좋아요", "편해", "만족", "빠른"];
  const negative = negativeWords.filter((word) => review.text.includes(word)).length;
  const positive = positiveWords.filter((word) => review.text.includes(word)).length;
  const score = Math.max(-1, Math.min(1, (positive - negative) / Math.max(positive + negative, 1)));
  const sentiment = score < -0.2 || review.rating <= 2 ? "negative" : score > 0.2 || review.rating >= 4 ? "positive" : "neutral";

  return {
    reviewId: review.id,
    sentiment,
    score,
    purchaseImpact: sentiment === "negative" || review.rating <= 3,
    repurchaseImpact: sentiment === "negative" || review.rating <= 2,
  };
}

function extractReviewKeywords(review: ProductReview, sentiment?: ReviewSentimentResult): ReviewKeywordExtraction[] {
  return review.text
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 2)
    .filter((word) => !["그리고", "하지만", "너무", "정말", "입니다", "그리고", "这个", "但是", "有点"].includes(word))
    .slice(0, 16)
    .map((keyword) => ({
      reviewId: review.id,
      keyword,
      language: review.language,
      sentiment: sentiment?.sentiment ?? "neutral",
      issueType: inferIssueType(keyword),
      weight: sentiment?.sentiment === "negative" ? 1.5 : 1,
    }));
}

function inferIssueType(keyword: string) {
  if (/사이즈|尺寸|大小/.test(keyword)) return "size";
  if (/색상|颜色|色差/.test(keyword)) return "color";
  if (/설치|安装|조립/.test(keyword)) return "installation";
  if (/포장|包装|파손|破损/.test(keyword)) return "packaging";
  if (/배송|物流|快递/.test(keyword)) return "logistics";
  if (/품질|质量|불량|坏/.test(keyword)) return "quality";
  if (/가격|价格|贵|비싸/.test(keyword)) return "price";
  return undefined;
}

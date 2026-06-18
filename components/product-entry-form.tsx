"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/lib/i18n";
import { buildProductFromForm, loadLocalProducts, platformOptions, saveLocalProducts, type LocalProduct } from "@/lib/local-products";

const copy = {
  zh: {
    groups: {
      basic: "基础信息",
      market: "价格与市场",
      development: "分析与开发输入",
      risk: "风险检查项",
    },
    fields: {
      productNameKo: "商品名称韩文",
      productNameZh: "商品名称中文",
      platform: "平台",
      competitorUrl: "Coupang 竞品链接",
      image: "商品图片 URL",
      brand: "品牌",
      category: "类目",
      owner: "负责人",
      supplierQuoteCount: "供应商报价数",
      supplierNames: "供应商名称",
      competitorSalePriceKrw: "竞品售价 KRW",
      targetSupplyPriceKrw: "目标供货价 KRW",
      chinaCostRmb: "中国预估成本 RMB",
      internationalShippingKrw: "国际物流 KRW",
      koreaShippingKrw: "韩国本地物流 KRW",
      coupangFeePercent: "Coupang 手续费 %",
      adCostKrw: "广告费 KRW",
      returnLossKrw: "退货损耗 KRW",
      otherCostKrw: "其他费用 KRW",
      estimatedMonthlySales: "预计月销量",
      reviewCount: "评论数",
      rating: "评分",
      rank: "类目排名",
      deliveryType: "配送类型",
      sellerType: "卖家类型",
      size: "尺寸",
      colors: "颜色",
      material: "材质",
      weight: "重量",
      packageSize: "包装尺寸",
      sellingPoints: "核心卖点",
      keywords: "关键词",
      reviews: "评论 / 差评样本",
      marketAnalysis: "市场分析",
      priceRange: "价格区间",
      reviewSummary: "评论分析总结",
      consumerPainPoints: "消费者痛点",
      productDevelopmentDirection: "产品开发方向",
      recommendationReason: "推荐理由",
      sampleDevelopmentAdvice: "样品开发建议",
      categoryGapNote: "品类机会说明",
      fileReferences: "文件资料",
      notes: "备注",
    },
    checks: {
      needsKcCertification: "需要 KC 认证",
      kcDocsReady: "KC 资料齐全",
      childrenProduct: "儿童用品",
      foodProduct: "食品类",
      electronicsProduct: "电器类",
      cosmeticsProduct: "化妆品类",
      medicalProduct: "医疗相关",
      fragile: "易破损",
      possibleHighReturn: "可能高退货",
      uncertainRegulation: "韩国法规不确定",
      coupangRestricted: "Coupang 平台限制",
    },
  },
  ko: {
    sectionTitle: "테스트 상품 추가",
    sectionDescription: "실제 상품을 등록하면 점수, 수익성, 리스크, RG/PB 적합도 판단이 자동으로 시작됩니다.",
    success: "상품이 생성되었습니다. 상세 페이지로 이동합니다.",
    submitIdle: "상품 생성",
    submitLoading: "생성 중...",
    groups: {
      basic: "기본 정보",
      market: "가격 및 시장",
      development: "분석 및 개발 입력",
      risk: "리스크 체크",
    },
    fields: {
      productNameKo: "상품명 한국어",
      productNameZh: "상품명 중국어",
      platform: "플랫폼",
      competitorUrl: "Coupang 경쟁 상품 링크",
      image: "상품 이미지 URL",
      brand: "브랜드",
      category: "카테고리",
      owner: "담당자",
      supplierQuoteCount: "공급사 견적 수",
      supplierNames: "공급사 이름",
      competitorSalePriceKrw: "경쟁 상품 판매가 KRW",
      targetSupplyPriceKrw: "목표 공급가 KRW",
      chinaCostRmb: "중국 예상 원가 RMB",
      internationalShippingKrw: "국제 물류 KRW",
      koreaShippingKrw: "국내 물류 KRW",
      coupangFeePercent: "Coupang 수수료 %",
      adCostKrw: "광고비 KRW",
      returnLossKrw: "반품 손실 KRW",
      otherCostKrw: "기타 비용 KRW",
      estimatedMonthlySales: "예상 월판매량",
      reviewCount: "리뷰 수",
      rating: "평점",
      rank: "카테고리 순위",
      deliveryType: "배송 유형",
      sellerType: "판매자 유형",
      size: "사이즈",
      colors: "색상",
      material: "소재",
      weight: "중량",
      packageSize: "포장 크기",
      sellingPoints: "핵심 판매 포인트",
      keywords: "키워드",
      reviews: "리뷰 / 불만 샘플",
      marketAnalysis: "시장 분석",
      priceRange: "가격대",
      reviewSummary: "리뷰 분석 요약",
      consumerPainPoints: "소비자 페인포인트",
      productDevelopmentDirection: "제품 개발 방향",
      recommendationReason: "추천 이유",
      sampleDevelopmentAdvice: "샘플 개발 제안",
      categoryGapNote: "카테고리 기회 메모",
      fileReferences: "파일 자료",
      notes: "메모",
    },
    checks: {
      needsKcCertification: "KC 인증 필요",
      kcDocsReady: "KC 자료 준비 완료",
      childrenProduct: "아동용",
      foodProduct: "식품류",
      electronicsProduct: "전기 / 전자류",
      cosmeticsProduct: "화장품류",
      medicalProduct: "의료 관련",
      fragile: "파손 우려",
      possibleHighReturn: "반품률 우려",
      uncertainRegulation: "한국 규정 불확실",
      coupangRestricted: "Coupang 제한 품목",
    },
  },
} as const;

export function ProductEntryForm() {
  const router = useRouter();
  const { locale } = useLocale();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const t = copy[locale];
  const dict = getDictionary(locale);

  function submit(formData: FormData) {
    setLoading(true);
    setMessage("");

    const product = buildProductFromForm(Object.fromEntries(formData.entries()));
    const products: LocalProduct[] = loadLocalProducts();
    saveLocalProducts([product, ...products]);

    setMessage(dict.productForm.success);
    router.push(`/reports/${product.id}`);
  }

  return (
    <form action={submit} className="space-y-6 rounded-[22px] border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-8">
      <div>
        <h2 className="text-lg font-semibold tracking-[-0.02em] text-slate-950">{dict.productForm.newTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{dict.productForm.formDescription}</p>
      </div>

      <Section title={t.groups.basic}>
        <div className="grid gap-4 lg:grid-cols-2">
          <Field name="productNameKo" label={t.fields.productNameKo} required />
          <Field name="productNameZh" label={t.fields.productNameZh} required />
          <SelectField name="platform" label={t.fields.platform} options={platformOptions} />
          <Field name="competitorUrl" label={t.fields.competitorUrl} required />
          <Field name="image" label={t.fields.image} />
          <Field name="brand" label={t.fields.brand} />
          <Field name="category" label={t.fields.category} required />
          <Field name="owner" label={t.fields.owner} />
          <Field name="supplierQuoteCount" label={t.fields.supplierQuoteCount} type="number" />
          <Field name="supplierNames" label={t.fields.supplierNames} />
          <Field name="deliveryType" label={t.fields.deliveryType} />
          <Field name="sellerType" label={t.fields.sellerType} />
          <Field name="size" label={t.fields.size} />
          <Field name="colors" label={t.fields.colors} />
          <Field name="material" label={t.fields.material} />
          <Field name="weight" label={t.fields.weight} />
          <Field name="packageSize" label={t.fields.packageSize} />
        </div>
      </Section>

      <Section title={t.groups.market}>
        <div className="grid gap-4 lg:grid-cols-3">
          <Field name="competitorSalePriceKrw" label={t.fields.competitorSalePriceKrw} type="number" />
          <Field name="targetSupplyPriceKrw" label={t.fields.targetSupplyPriceKrw} type="number" />
          <Field name="chinaCostRmb" label={t.fields.chinaCostRmb} type="number" />
          <Field name="internationalShippingKrw" label={t.fields.internationalShippingKrw} type="number" />
          <Field name="koreaShippingKrw" label={t.fields.koreaShippingKrw} type="number" />
          <Field name="coupangFeePercent" label={t.fields.coupangFeePercent} type="number" step="0.1" />
          <Field name="adCostKrw" label={t.fields.adCostKrw} type="number" />
          <Field name="returnLossKrw" label={t.fields.returnLossKrw} type="number" />
          <Field name="otherCostKrw" label={t.fields.otherCostKrw} type="number" />
          <Field name="estimatedMonthlySales" label={t.fields.estimatedMonthlySales} type="number" />
          <Field name="reviewCount" label={t.fields.reviewCount} type="number" />
          <Field name="rating" label={t.fields.rating} type="number" step="0.1" />
          <Field name="rank" label={t.fields.rank} type="number" />
        </div>
      </Section>

      <Section title={t.groups.development}>
        <div className="grid gap-4 lg:grid-cols-2">
          <TextArea name="sellingPoints" label={t.fields.sellingPoints} />
          <TextArea name="keywords" label={t.fields.keywords} />
          <TextArea name="reviews" label={t.fields.reviews} />
          <TextArea name="marketAnalysis" label={t.fields.marketAnalysis} />
          <TextArea name="priceRange" label={t.fields.priceRange} />
          <TextArea name="reviewSummary" label={t.fields.reviewSummary} />
          <TextArea name="consumerPainPoints" label={t.fields.consumerPainPoints} />
          <TextArea name="productDevelopmentDirection" label={t.fields.productDevelopmentDirection} />
          <TextArea name="recommendationReason" label={t.fields.recommendationReason} />
          <TextArea name="sampleDevelopmentAdvice" label={t.fields.sampleDevelopmentAdvice} />
          <TextArea name="categoryGapNote" label={t.fields.categoryGapNote} />
          <TextArea name="fileReferences" label={t.fields.fileReferences} />
          <TextArea name="notes" label={t.fields.notes} />
        </div>
      </Section>

      <Section title={t.groups.risk}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Object.entries(t.checks).map(([name, label]) => (
            <CheckField key={name} name={name} label={label} />
          ))}
        </div>
      </Section>

      {message ? <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">{message}</p> : null}
      <div className="flex justify-end">
        <Button disabled={loading}>{loading ? dict.productForm.submitLoading : dict.productForm.submitIdle}</Button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[18px] border border-slate-200 bg-slate-50/55 p-5">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = false,
  step,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  step?: string;
}) {
  return (
    <label className="text-sm font-medium text-slate-700">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        step={step}
        className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition-shadow focus:ring-2 focus:ring-slate-900/10"
      />
    </label>
  );
}

function SelectField({ name, label, options }: { name: string; label: string; options: string[] }) {
  return (
    <label className="text-sm font-medium text-slate-700">
      {label}
      <select
        name={name}
        className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition-shadow focus:ring-2 focus:ring-slate-900/10"
      >
        {options.map((platform) => (
          <option key={platform}>{platform}</option>
        ))}
      </select>
    </label>
  );
}

function TextArea({ name, label }: { name: string; label: string }) {
  return (
    <label className="text-sm font-medium text-slate-700">
      {label}
      <textarea
        name={name}
        rows={4}
        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition-shadow focus:ring-2 focus:ring-slate-900/10"
      />
    </label>
  );
}

function CheckField({ name, label }: { name: string; label: string }) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
      <input name={name} type="checkbox" className="h-4 w-4 rounded border-slate-300" />
      <span>{label}</span>
    </label>
  );
}

import type { CoupangCollectedProduct } from "@/lib/types";

type CollectOptions = {
  timeoutMs?: number;
  userAgent?: string;
};

export async function collectCoupangProduct(url: string, options: CollectOptions = {}): Promise<CoupangCollectedProduct> {
  const startedAt = Date.now();
  const html = await fetchHtml(url, options);
  const meta = extractMeta(html);
  const jsonLd = extractJsonLd(html);
  const textSignals = extractTextSignals(html);
  const allText = normalizeText(stripTags(html));

  const productName = getFirstString([
    readJsonLdString(jsonLd, ["name"]),
    meta["og:title"],
    meta["twitter:title"],
    textSignals.find((signal) => signal.length > 8),
    "Unknown Coupang Product",
  ]);
  const images = unique([
    readJsonLdString(jsonLd, ["image"]),
    meta["og:image"],
    meta["twitter:image"],
    ...extractImageUrls(html),
  ]).filter(Boolean);
  const price = readJsonLdNumber(jsonLd, ["offers", "price"]) ?? extractWonPrice(allText);
  const rating = readJsonLdNumber(jsonLd, ["aggregateRating", "ratingValue"]) ?? extractNumberNear(allText, ["평점", "rating"]);
  const reviewCount =
    readJsonLdNumber(jsonLd, ["aggregateRating", "reviewCount"]) ?? extractNumberNear(allText, ["상품평", "리뷰", "review"]);
  const detailSellingPoints = extractSellingPoints(allText);
  const qna = extractQna(allText);
  const sizes = extractOptionValues(allText, ["사이즈", "size", "尺寸"]);
  const colors = extractOptionValues(allText, ["색상", "color", "颜色"]);
  const material = extractMaterial(allText);

  return {
    platform: "Coupang",
    sourceUrl: url,
    externalProductId: extractCoupangProductId(url),
    productName,
    link: meta["og:url"] || url,
    price,
    discountPrice: extractDiscountPrice(allText, price),
    rating,
    reviewCount,
    reviewGrowth: undefined,
    salesLabel: extractSalesLabel(allText),
    deliveryType: extractDeliveryType(allText),
    isRocket: /rocket|로켓|로켓배송/i.test(allText),
    images,
    title: productName,
    detailSellingPoints,
    qna,
    brand: readJsonLdString(jsonLd, ["brand", "name"]) ?? extractBrand(allText),
    sizes,
    colors,
    material,
    collectedAt: new Date(startedAt).toISOString(),
    raw: {
      jsonLd,
      meta,
      textSignals,
    },
  };
}

async function fetchHtml(url: string, options: CollectOptions) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 12000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent":
          options.userAgent ??
          "Mozilla/5.0 (compatible; KoreaProductIntel/0.1; +https://localhost; respectful-data-collection)",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "ko-KR,ko;q=0.9,en;q=0.6",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Coupang request failed: ${response.status} ${response.statusText}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function extractMeta(html: string) {
  const meta: Record<string, string> = {};
  const regex = /<meta\s+([^>]+)>/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html))) {
    const attrs = parseAttributes(match[1]);
    const key = attrs.property || attrs.name;
    if (key && attrs.content) meta[key] = decodeHtml(attrs.content);
  }

  return meta;
}

function extractJsonLd(html: string) {
  const matches = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) ?? [];

  for (const block of matches) {
    const content = block.replace(/^<script[^>]*>/i, "").replace(/<\/script>$/i, "").trim();
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        const product = parsed.find((item) => item?.["@type"] === "Product");
        if (product) return product;
      }
      if (parsed?.["@type"] === "Product") return parsed;
      if (parsed?.["@graph"]) {
        const product = parsed["@graph"].find((item: Record<string, unknown>) => item?.["@type"] === "Product");
        if (product) return product;
      }
    } catch {
      continue;
    }
  }

  return undefined;
}

function readJsonLdString(source: unknown, path: string[]) {
  const value = readPath(source, path);
  if (Array.isArray(value)) return String(value[0] ?? "");
  if (typeof value === "object" && value && "url" in value) return String((value as { url?: string }).url ?? "");
  return typeof value === "string" || typeof value === "number" ? String(value) : undefined;
}

function readJsonLdNumber(source: unknown, path: string[]) {
  const value = readPath(source, path);
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function readPath(source: unknown, path: string[]) {
  return path.reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[key];
  }, source);
}

function parseAttributes(input: string) {
  const attrs: Record<string, string> = {};
  const regex = /([\w:-]+)=["']([^"']*)["']/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(input))) {
    attrs[match[1].toLowerCase()] = match[2];
  }

  return attrs;
}

function extractImageUrls(html: string) {
  const urls = new Set<string>();
  const regex = /<img[^>]+(?:src|data-src)=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html))) {
    if (/\/\/|https?:\/\//.test(match[1])) urls.add(match[1].startsWith("//") ? `https:${match[1]}` : match[1]);
  }

  return [...urls].slice(0, 12);
}

function extractTextSignals(html: string) {
  return unique(
    [
      ...Array.from(html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)).map((match) => normalizeText(stripTags(match[1]))),
      ...Array.from(html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)).map((match) => normalizeText(stripTags(match[1]))),
    ].filter((value) => value.length >= 4),
  ).slice(0, 40);
}

function extractSellingPoints(text: string) {
  const candidates = text
    .split(/[.!?\n。！？]/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 8 && item.length <= 80)
    .filter((item) => /배송|로켓|무료|색상|사이즈|재질|설치|구성|포함|특징|장점|尺寸|颜色|材质|安装|配送/.test(item));

  return unique(candidates).slice(0, 8);
}

function extractQna(text: string) {
  const chunks = text.split(/Q[:：]|질문|문의/).slice(1, 6);
  return chunks.map((chunk) => {
    const [question, answer] = chunk.split(/A[:：]|답변/);
    return {
      question: normalizeText(question).slice(0, 160),
      answer: answer ? normalizeText(answer).slice(0, 220) : undefined,
    };
  });
}

function extractOptionValues(text: string, labels: string[]) {
  const result = new Set<string>();

  labels.forEach((label) => {
    const regex = new RegExp(`${label}\\s*[:：]?\\s*([^\\n|/]{2,80})`, "gi");
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text))) {
      match[1]
        .split(/[,，/|]/)
        .map((item) => item.trim())
        .filter((item) => item.length >= 2 && item.length <= 30)
        .forEach((item) => result.add(item));
    }
  });

  return [...result].slice(0, 12);
}

function extractWonPrice(text: string) {
  const match = text.match(/([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{4,8})\s*원/);
  return match ? Number(match[1].replace(/,/g, "")) : undefined;
}

function extractDiscountPrice(text: string, fallback?: number) {
  const prices = Array.from(text.matchAll(/([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{4,8})\s*원/g))
    .map((match) => Number(match[1].replace(/,/g, "")))
    .filter((value) => Number.isFinite(value));
  if (!prices.length) return fallback;
  return Math.min(...prices);
}

function extractNumberNear(text: string, labels: string[]) {
  for (const label of labels) {
    const regex = new RegExp(`${label}[^0-9]{0,12}([0-9.,]+)`, "i");
    const match = text.match(regex);
    if (match) {
      const value = Number(match[1].replace(/,/g, ""));
      if (Number.isFinite(value)) return value;
    }
  }
  return undefined;
}

function extractSalesLabel(text: string) {
  return text.match(/([0-9,.]+\s*(?:개|명)?\s*(?:구매|판매|sold))/i)?.[0];
}

function extractDeliveryType(text: string) {
  if (/로켓배송|Rocket Delivery/i.test(text)) return "Rocket Delivery";
  if (/무료배송/.test(text)) return "무료배송";
  if (/일반배송/.test(text)) return "일반배송";
  return undefined;
}

function extractBrand(text: string) {
  return text.match(/브랜드\s*[:：]?\s*([^\s|/]{2,40})/)?.[1];
}

function extractMaterial(text: string) {
  return text.match(/(?:재질|소재|材质|material)\s*[:：]?\s*([^\n|/]{2,80})/i)?.[1]?.trim();
}

function extractCoupangProductId(url: string) {
  return url.match(/\/products\/([0-9]+)/)?.[1] ?? url.match(/[?&]itemId=([0-9]+)/)?.[1];
}

function stripTags(value: string) {
  return value.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ");
}

function normalizeText(value: string) {
  return decodeHtml(value).replace(/\s+/g, " ").trim();
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function unique(values: Array<string | undefined>) {
  return [...new Set(values.filter(Boolean) as string[])];
}

function getFirstString(values: Array<string | undefined>) {
  return values.find((value) => value && value.trim()) ?? "";
}

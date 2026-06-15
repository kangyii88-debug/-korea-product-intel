import * as XLSX from "xlsx";
import type { ProductReview } from "@/lib/types";
import { normalizePastedReviews } from "@/lib/review-analysis";

type ReviewRow = {
  text?: string;
  review?: string;
  comment?: string;
  rating?: string | number;
  date?: string;
};

export function parsePastedReviewText(productId: string, text: string): ProductReview[] {
  return normalizePastedReviews(productId, text);
}

export function parseReviewCsv(productId: string, csv: string): ProductReview[] {
  const rows = parseCsv(csv);
  return rowsToReviews(productId, rows);
}

export function parseReviewExcel(productId: string, buffer: ArrayBuffer): ProductReview[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<ReviewRow>(firstSheet, { defval: "" });
  return rowsToReviews(productId, rows);
}

function rowsToReviews(productId: string, rows: ReviewRow[]): ProductReview[] {
  return rows
    .map((row, index) => {
      const text = String(row.text || row.review || row.comment || "").trim();
      if (!text) return null;

      return {
        id: `${productId}-import-${index + 1}`,
        productId,
        rating: Number(row.rating || inferRating(text)),
        text,
        language: /[가-힣]/.test(text) ? "ko" : /[\u4e00-\u9fff]/.test(text) ? "zh" : "mixed",
        createdAt: row.date ? new Date(row.date).toISOString() : new Date().toISOString(),
      } satisfies ProductReview;
    })
    .filter(Boolean) as ProductReview[];
}

function parseCsv(csv: string): ReviewRow[] {
  const lines = csv.split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return [];
  const headers = splitCsvLine(lines[0]).map((header) => header.trim().toLowerCase());

  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    return headers.reduce<ReviewRow>((row, header, index) => {
      row[header as keyof ReviewRow] = cells[index] ?? "";
      return row;
    }, {});
  });
}

function splitCsvLine(line: string) {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function inferRating(text: string) {
  const negativeWords = ["差", "坏", "退货", "破损", "不符", "비싸", "불량", "파손", "반품", "별로"];
  return negativeWords.some((word) => text.includes(word)) ? 2 : 4;
}

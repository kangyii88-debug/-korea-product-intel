const ANYSEARCH_ENDPOINT_CANDIDATES = [
  "https://api.anysearch.ai/v1/search",
  "https://api.anysearch.ai/search",
];

export type AnySearchResult = {
  title: string;
  summary: string;
  url: string;
  source: string | null;
  relevance: number | null;
  raw: unknown;
};

export type AnySearchResponse = {
  query: string;
  total: number;
  results: AnySearchResult[];
  endpoint: string;
  raw: unknown;
};

type AnySearchRequest = {
  query: string;
  limit?: number;
};

type RequestOptions = {
  method: "GET" | "POST";
  endpoint: string;
};

export class AnySearchError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AnySearchError";
  }
}

export async function searchAnySearch({ query, limit = 10 }: AnySearchRequest): Promise<AnySearchResponse> {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    throw new AnySearchError("Search query is required.");
  }

  const apiKey = process.env.ANYSEARCH_API_KEY;
  if (!apiKey) {
    throw new AnySearchError("Missing ANYSEARCH_API_KEY environment variable.");
  }

  let lastError: AnySearchError | null = null;

  for (const endpoint of ANYSEARCH_ENDPOINT_CANDIDATES) {
    for (const method of ["POST", "GET"] as const) {
      try {
        const raw = await requestAnySearch(
          { query: normalizedQuery, limit },
          { endpoint, method },
          apiKey,
        );

        return normalizeAnySearchResponse(raw, normalizedQuery, endpoint);
      } catch (error) {
        const normalizedError = normalizeAnySearchError(error);

        if (normalizedError.status && normalizedError.status !== 404 && normalizedError.status !== 405) {
          throw normalizedError;
        }

        lastError = normalizedError;
      }
    }
  }

  throw (
    lastError ??
    new AnySearchError(
      "Unable to find a working AnySearch endpoint. Verify the API host or update the endpoint candidates in lib/anysearch.ts.",
    )
  );
}

async function requestAnySearch(
  request: AnySearchRequest,
  options: RequestOptions,
  apiKey: string,
): Promise<unknown> {
  const url = buildUrl(options.endpoint, request, options.method);
  const response = await fetch(url, {
    method: options.method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: options.method === "POST" ? JSON.stringify({ query: request.query, limit: request.limit }) : undefined,
    cache: "no-store",
  });

  const payload = await parseResponseBody(response);
  if (!response.ok) {
    throw new AnySearchError(
      extractErrorMessage(payload) || `AnySearch request failed with status ${response.status}.`,
      response.status,
      payload,
    );
  }

  return payload;
}

function buildUrl(endpoint: string, request: AnySearchRequest, method: RequestOptions["method"]) {
  if (method === "POST") {
    return endpoint;
  }

  const url = new URL(endpoint);
  url.searchParams.set("q", request.query);
  url.searchParams.set("limit", String(request.limit ?? 10));
  return url.toString();
}

async function parseResponseBody(response: Response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

function normalizeAnySearchResponse(raw: unknown, query: string, endpoint: string): AnySearchResponse {
  const collection = extractResultsArray(raw);
  const results = collection.map(normalizeResult).filter((item) => item.title || item.summary || item.url);

  return {
    query,
    total: extractTotal(raw, results.length),
    results,
    endpoint,
    raw,
  };
}

function extractResultsArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) {
    return raw;
  }

  if (!raw || typeof raw !== "object") {
    return [];
  }

  const record = raw as Record<string, unknown>;
  const candidates = [
    record.results,
    record.items,
    record.data,
    isRecord(record.data) ? record.data.results : undefined,
    isRecord(record.data) ? record.data.items : undefined,
    isRecord(record.data) ? record.data.data : undefined,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

function extractTotal(raw: unknown, fallback: number) {
  if (!raw || typeof raw !== "object") {
    return fallback;
  }

  const record = raw as Record<string, unknown>;
  const candidates = [
    record.total,
    record.count,
    record.totalCount,
    isRecord(record.data) ? record.data.total : undefined,
    isRecord(record.data) ? record.data.count : undefined,
    isRecord(record.data) ? record.data.totalCount : undefined,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return candidate;
    }
  }

  return fallback;
}

function normalizeResult(raw: unknown): AnySearchResult {
  const record = isRecord(raw) ? raw : {};

  return {
    title: readString(record.title, record.name, record.headline),
    summary: readString(record.summary, record.snippet, record.description, record.content),
    url: readString(record.url, record.link, record.sourceUrl),
    source: readNullableString(record.source, record.sourceName, record.domain),
    relevance: readNumber(record.relevance, record.score, record.rank),
    raw,
  };
}

function extractErrorMessage(payload: unknown) {
  if (typeof payload === "string") {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  return readNullableString(record.message, record.error, record.detail);
}

function normalizeAnySearchError(error: unknown) {
  if (error instanceof AnySearchError) {
    return error;
  }

  if (error instanceof Error) {
    return new AnySearchError(error.message);
  }

  return new AnySearchError("Unknown AnySearch error.");
}

function readString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function readNullableString(...values: unknown[]) {
  const value = readString(...values);
  return value || null;
}

function readNumber(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

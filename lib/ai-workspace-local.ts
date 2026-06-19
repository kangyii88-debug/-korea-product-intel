"use client";

import type {
  AIAnalysisRecord,
  AIGeneratedTaskRecord,
  AIProviderRecord,
  PerplexityReportRecord,
} from "@/lib/ai-workspace";

const KEYS = {
  providers: "kpi-ai-providers",
  analyses: "kpi-ai-analyses",
  tasks: "kpi-ai-generated-tasks",
  reports: "kpi-perplexity-reports",
} as const;

function loadJson<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveJson<T>(key: string, value: T[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function loadLocalAIProviders() {
  return loadJson<AIProviderRecord>(KEYS.providers);
}

export function saveLocalAIProviders(items: AIProviderRecord[]) {
  saveJson(KEYS.providers, items);
}

export function loadLocalAIAnalysisRecords() {
  return loadJson<AIAnalysisRecord>(KEYS.analyses);
}

export function saveLocalAIAnalysisRecords(items: AIAnalysisRecord[]) {
  saveJson(KEYS.analyses, items);
}

export function appendLocalAIAnalysisRecord(item: AIAnalysisRecord) {
  const items = loadLocalAIAnalysisRecords();
  const next = [item, ...items.filter((entry) => entry.id !== item.id)];
  saveLocalAIAnalysisRecords(next);
  return next;
}

export function loadLocalAIGeneratedTasks() {
  return loadJson<AIGeneratedTaskRecord>(KEYS.tasks);
}

export function saveLocalAIGeneratedTasks(items: AIGeneratedTaskRecord[]) {
  saveJson(KEYS.tasks, items);
}

export function appendLocalAIGeneratedTasks(items: AIGeneratedTaskRecord[]) {
  const current = loadLocalAIGeneratedTasks();
  const deduped = [...items, ...current.filter((entry) => !items.some((newItem) => newItem.id === entry.id))];
  saveLocalAIGeneratedTasks(deduped);
  return deduped;
}

export function loadLocalPerplexityReports() {
  return loadJson<PerplexityReportRecord>(KEYS.reports);
}

export function saveLocalPerplexityReports(items: PerplexityReportRecord[]) {
  saveJson(KEYS.reports, items);
}

export function appendLocalPerplexityReport(item: PerplexityReportRecord) {
  const items = loadLocalPerplexityReports();
  const next = [item, ...items.filter((entry) => entry.id !== item.id)];
  saveLocalPerplexityReports(next);
  return next;
}

import type { AIProviderName } from "@/lib/ai-workspace";

const providerEnvKeys: Record<AIProviderName, string[]> = {
  OpenAI: ["OPENAI_API_KEY"],
  Claude: ["ANTHROPIC_API_KEY", "CLAUDE_API_KEY"],
  Gemini: ["GOOGLE_API_KEY", "GEMINI_API_KEY"],
  Perplexity: ["PERPLEXITY_API_KEY"],
  Grok: ["XAI_API_KEY", "GROK_API_KEY"],
};

export function getProviderEnvKeys(providerName: AIProviderName) {
  return providerEnvKeys[providerName];
}

export function getPrimaryProviderEnvKey(providerName: AIProviderName) {
  return providerEnvKeys[providerName][0];
}

export function getProviderApiKey(providerName: AIProviderName) {
  for (const envKey of providerEnvKeys[providerName]) {
    const value = process.env[envKey]?.trim();
    if (value) return value;
  }

  return null;
}

export function hasProviderApiKey(providerName: AIProviderName) {
  return Boolean(getProviderApiKey(providerName));
}

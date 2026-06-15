export type AiProvider = "openai" | "claude" | "gemini" | "perplexity" | "grok" | "custom";

export type AiProviderConfig = {
  provider: AiProvider;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
};

export const providerDefaults: Record<AiProvider, Pick<AiProviderConfig, "baseUrl" | "model">> = {
  openai: { baseUrl: "https://api.openai.com/v1", model: "gpt-4.1" },
  claude: { model: "claude-sonnet-4" },
  gemini: { model: "gemini-2.5-pro" },
  perplexity: { model: "sonar-pro" },
  grok: { model: "grok-3" },
  custom: { model: "custom-product-intelligence-model" },
};

export async function generateProductIntelligence() {
  throw new Error("AI generation is not connected yet. Add provider credentials and route handlers before production use.");
}

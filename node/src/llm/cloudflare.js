// Cloudflare Workers AI client.
// Cloudflare's chat completions endpoint is OpenAI-shaped and lives at:
//   POST https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/v1/chat/completions
// (Some older docs use /ai/run/{model}; v0.1 uses the OpenAI-compat chat path.)

import { createOpenAICompat } from "./openai.js";

export function createCloudflare(cfg) {
  const accountId = cfg.accountId || "";
  if (!accountId) {
    throw new Error("cloudflare: accountId is missing. Set CLOUDFLARE_ACCOUNT_ID or add accountId to config.");
  }
  const baseUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1`;
  return createOpenAICompat({
    ...cfg,
    baseUrl,
  });
}

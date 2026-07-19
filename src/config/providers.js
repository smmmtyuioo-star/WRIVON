import { ensureUserDir } from "./load.js";
import fs from "node:fs";
import path from "node:path";

export const WELL_KNOWN_PROVIDERS = [
  {
    id: "openai",
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    kind: "openai",
    defaultModel: "gpt-4o-mini",
    envKey: "OPENAI_API_KEY",
    docsUrl: "https://platform.openai.com/api-keys",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    baseUrl: "https://api.anthropic.com/v1",
    kind: "openai",
    defaultModel: "claude-sonnet-4-20250514",
    envKey: "ANTHROPIC_API_KEY",
    docsUrl: "https://console.anthropic.com/settings/keys",
  },
  {
    id: "groq",
    name: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    kind: "openai",
    defaultModel: "llama-3.3-70b-versatile",
    envKey: "GROQ_API_KEY",
    docsUrl: "https://console.groq.com/keys",
  },
  {
    id: "together",
    name: "Together AI",
    baseUrl: "https://api.together.xyz/v1",
    kind: "openai",
    defaultModel: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
    envKey: "TOGETHER_API_KEY",
    docsUrl: "https://api.together.ai/settings/api-keys",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    kind: "openai",
    defaultModel: "deepseek-chat",
    envKey: "DEEPSEEK_API_KEY",
    docsUrl: "https://platform.deepseek.com/api_keys",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    kind: "openai",
    defaultModel: "openai/gpt-4o-mini",
    envKey: "OPENROUTER_API_KEY",
    docsUrl: "https://openrouter.ai/keys",
  },
  {
    id: "perplexity",
    name: "Perplexity",
    baseUrl: "https://api.perplexity.ai",
    kind: "openai",
    defaultModel: "sonar-pro",
    envKey: "PERPLEXITY_API_KEY",
    docsUrl: "https://www.perplexity.ai/settings/api",
  },
  {
    id: "google-gemini",
    name: "Google Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    kind: "openai",
    defaultModel: "gemini-2.0-flash",
    envKey: "GEMINI_API_KEY",
    docsUrl: "https://aistudio.google.com/apikey",
  },
  {
    id: "github-models",
    name: "GitHub Models",
    baseUrl: "https://models.inference.ai.azure.com",
    kind: "openai",
    defaultModel: "gpt-4o-mini",
    envKey: "GITHUB_TOKEN",
    docsUrl: "https://github.com/settings/tokens",
  },
  {
    id: "cohere",
    name: "Cohere",
    baseUrl: "https://api.cohere.com/v1",
    kind: "openai",
    defaultModel: "command-r-plus",
    envKey: "COHERE_API_KEY",
    docsUrl: "https://dashboard.cohere.com/api-keys",
  },
  {
    id: "mistral",
    name: "Mistral",
    baseUrl: "https://api.mistral.ai/v1",
    kind: "openai",
    defaultModel: "mistral-large-latest",
    envKey: "MISTRAL_API_KEY",
    docsUrl: "https://console.mistral.ai/api-keys/",
  },
  {
    id: "xai",
    name: "xAI",
    baseUrl: "https://api.x.ai/v1",
    kind: "openai",
    defaultModel: "grok-2-latest",
    envKey: "XAI_API_KEY",
    docsUrl: "https://console.x.ai/",
  },
];

// ALL Nvidia NIM free-endpoint models cataloged from Nvidia's API (2026-07-19).
// Each model is classified by kind (chat/vision/embedding/safety/other) and speed tier (1=fast, 2=balanced, 3=power).
// Live-tested timing is included where available. Failed models are retained for discoverability.
export const NVIDIA_MODELS = [
  // ── Tier 1 — Fast (<3s response) ⚡ ──────────────────────────────────
  // Ordered by capability (best first) — first is used by /model fast.
  { id: "deepseek-ai/deepseek-v4-flash",                           kind: "chat", tier: 1, timing: "1.7s", desc: "Best all-around — fast & capable, great default" },
  { id: "qwen/qwen3.5-122b-a10b",                                  kind: "chat", tier: 1, timing: "1.3s", desc: "Qwen 3.5 MoE — strong instruction following" },
  { id: "meta/llama-3.1-70b-instruct",                             kind: "chat", tier: 1, timing: "1.5s", desc: "70B flagship, fast on NIM infra" },
  { id: "nvidia/nemotron-3-ultra-550b-a55b",                       kind: "chat", tier: 1, timing: "1.3s", desc: "Largest NIM — 550B, surprisingly fast" },
  { id: "nvidia/nemotron-3-super-120b-a12b",                       kind: "chat", tier: 1, timing: "1.1s", desc: "Super 120B MoE — fast reasoning" },
  { id: "nvidia/llama-3.3-nemotron-super-49b-v1",                  kind: "chat", tier: 1, timing: "1.5s", desc: "Nemotron-tuned 49B, good tool-use" },
  { id: "abacusai/dracarys-llama-3.1-70b-instruct",                kind: "chat", tier: 1, timing: "1.5s", desc: "Abacus AI fine-tuned 70B" },
  { id: "mistralai/mistral-small-4-119b-2603",                     kind: "chat", tier: 1, timing: "2.9s", desc: "Mistral Small 4 119B" },
  { id: "meta/llama-3.1-8b-instruct",                              kind: "chat", tier: 1, timing: "1.2s", desc: "Reliable 8B workhorse" },
  { id: "qwen/qwen3-next-80b-a3b-instruct",                        kind: "chat", tier: 1, timing: "2.7s", desc: "Qwen3 Next 80B MoE" },
  { id: "mistralai/mistral-nemotron",                              kind: "chat", tier: 1, timing: "1.4s", desc: "Mistral-Nemotron collaboration" },
  { id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",           kind: "chat", tier: 1, timing: "1.6s", desc: "Nano omni with CoT reasoning" },
  { id: "nvidia/nemotron-3-nano-30b-a3b",                          kind: "chat", tier: 1, timing: "1.2s", desc: "30B nano, 1M context window" },
  { id: "meta/llama-3.2-90b-vision-instruct",                      kind: "vision", tier: 1, timing: "1.8s", desc: "Large vision model" },
  { id: "meta/llama-3.2-11b-vision-instruct",                      kind: "vision", tier: 1, timing: "1.1s", desc: "Vision-capable Llama" },
  { id: "upstage/solar-10.7b-instruct",                            kind: "chat", tier: 1, timing: "1.2s", desc: "Solar 10.7B, solid all-around" },
  { id: "sarvamai/sarvam-m",                                       kind: "chat", tier: 1, timing: "1.6s", desc: "Sarvam AI model" },
  { id: "google/gemma-3n-e2b-it",                                  kind: "chat", tier: 1, timing: "1.3s", desc: "Gemma 3 nano, efficient" },
  { id: "google/gemma-3n-e4b-it",                                  kind: "chat", tier: 1, timing: "1.4s", desc: "Gemma 3 nano, step up" },
  { id: "meta/llama-3.2-3b-instruct",                              kind: "chat", tier: 1, timing: "1.3s", desc: "Small Llama, fast & capable" },
  { id: "nvidia/nemotron-mini-4b-instruct",                        kind: "chat", tier: 1, timing: "1.1s", desc: "Nano-class, blazing fast" },
  { id: "google/gemma-2-2b-it",                                    kind: "chat", tier: 1, timing: "0.9s", desc: "Smallest Gemma, fastest possible" },
  { id: "meta/llama-3.2-1b-instruct",                              kind: "chat", tier: 1, timing: "1.1s", desc: "Tiny Llama, instant replies" },

  // ── Tier 2 — Balanced (3-30s) ◆ ─────────────────────────────────────
  { id: "minimaxai/minimax-m3",                                    kind: "chat", tier: 2, timing: "3.9s", desc: "MiniMax M3, good quality" },
  { id: "mistralai/mistral-medium-3.5-128b",                       kind: "chat", tier: 2, timing: "11.1s", desc: "Mistral Medium 128B, strong reasoning" },
  { id: "z-ai/glm-5.2",                                            kind: "chat", tier: 2, timing: "14.9s", desc: "GLM-5.2 from Zhipu AI" },
  { id: "poolside/laguna-xs-2.1",                                  kind: "chat", tier: 2, timing: "25s", desc: "Poolside coding model" },

  // ── Tier 3 — Power (>30s) 🔷 ────────────────────────────────────────
  // Ordered by capability (best first) — first is used by /model power.
  { id: "mistralai/mistral-large-3-675b-instruct-2512",            kind: "chat", tier: 3, timing: "229s", desc: "Mistral Large 3 675B — biggest, best quality" },
  { id: "qwen/qwen3.5-397b-a17b",                                  kind: "chat", tier: 3, timing: "86.5s", desc: "Qwen 3.5 397B MoE — massive, excellent quality" },
  { id: "meta/llama-3.3-70b-instruct",                             kind: "chat", tier: 3, timing: "122.7s", desc: "Llama 3.3 70B — strong general" },
  { id: "deepseek-ai/deepseek-v4-pro",                             kind: "chat", tier: 3, timing: "35.8s", desc: "DeepSeek V4 Pro — best coding, slower" },
  { id: "meta/llama-4-maverick-17b-128e-instruct",                 kind: "chat", tier: 3, timing: "303s", desc: "Llama 4 Maverick MoE" },
  { id: "google/gemma-4-31b-it",                                   kind: "chat", tier: 3, timing: "303s", desc: "Gemma 4 31B" },
  { id: "nvidia/llama-3.1-nemotron-nano-8b-v1",                    kind: "chat", tier: 3, timing: "303s", desc: "Nemotron Nano 8B (very slow on this endpoint)" },

  // ── Vision models ────────────────────────────────────────────────────
  { id: "adept/fuyu-8b",                                           kind: "vision", tier: 1, desc: "Adept Fuyu 8B vision" },
  { id: "google/deplot",                                           kind: "vision", tier: 1, desc: "Google DePlot chart-to-text" },
  { id: "microsoft/kosmos-2",                                      kind: "vision", tier: 1, desc: "Microsoft Kosmos-2 multimodal" },
  { id: "nvidia/cosmos-reason2-8b",                                kind: "vision", tier: 1, desc: "Nvidia Cosmos reasoning vision" },
  { id: "nvidia/neva-22b",                                         kind: "vision", tier: 1, desc: "Nvidia NeVA 22B vision" },
  { id: "nvidia/nemotron-nano-12b-v2-vl",                          kind: "vision", tier: 1, desc: "Nemotron Nano vision-language" },
  { id: "nvidia/vila",                                             kind: "vision", tier: 1, desc: "Nvidia VILA vision" },
  { id: "microsoft/phi-3-vision-128k-instruct",                    kind: "vision", tier: 2, desc: "Phi-3 Vision 128K" },

  // ── Embedding models ─────────────────────────────────────────────────
  { id: "baai/bge-m3",                                             kind: "embedding", desc: "BAAI BGE M3 embedding" },
  { id: "nvidia/embed-qa-4",                                       kind: "embedding", desc: "Nvidia Embed QA v4" },
  { id: "nvidia/llama-3.2-nemoretriever-1b-vlm-embed-v1",         kind: "embedding", desc: "Llama NemoRetriever VLM embed" },
  { id: "nvidia/llama-3.2-nv-embedqa-1b-v1",                      kind: "embedding", desc: "NV-EmbedQA 1B" },
  { id: "nvidia/llama-nemotron-embed-1b-v2",                       kind: "embedding", desc: "Llama Nemotron Embed 1B v2" },
  { id: "nvidia/llama-nemotron-embed-vl-1b-v2",                    kind: "embedding", desc: "Llama Nemotron Embed VL 1B v2" },
  { id: "nvidia/nemotron-3-embed-1b",                              kind: "embedding", desc: "Nemotron-3 Embed 1B" },
  { id: "nvidia/nv-embed-v1",                                      kind: "embedding", desc: "Nvidia NV-Embed v1" },
  { id: "nvidia/nv-embedcode-7b-v1",                               kind: "embedding", desc: "NV-EmbedCode 7B" },
  { id: "nvidia/nv-embedqa-e5-v5",                                 kind: "embedding", desc: "NV-EmbedQA E5 v5" },
  { id: "nvidia/nv-embedqa-mistral-7b-v2",                         kind: "embedding", desc: "NV-EmbedQA Mistral 7B v2" },
  { id: "nvidia/nvclip",                                           kind: "embedding", desc: "Nvidia NV-CLIP" },
  { id: "snowflake/arctic-embed-l",                                kind: "embedding", desc: "Snowflake Arctic Embed L" },

  // ── Safety / Guard models ────────────────────────────────────────────
  { id: "meta/llama-guard-4-12b",                                  kind: "safety", desc: "Llama Guard 4 12B content safety" },
  { id: "nvidia/llama-3.1-nemoguard-8b-content-safety",            kind: "safety", desc: "Nemoguard content safety 8B" },
  { id: "nvidia/llama-3.1-nemoguard-8b-topic-control",             kind: "safety", desc: "Nemoguard topic control 8B" },
  { id: "nvidia/llama-3.1-nemotron-safety-guard-8b-v3",            kind: "safety", desc: "Nemotron safety guard 8B v3" },
  { id: "nvidia/nemotron-3.5-content-safety",                      kind: "safety", desc: "Nemotron 3.5 content safety" },

  // ── Specialized / Other ──────────────────────────────────────────────
  { id: "bigcode/starcoder2-15b",                                  kind: "other", desc: "StarCoder2 15B code completion" },
  { id: "google/diffusiongemma-26b-a4b-it",                        kind: "other", desc: "Google Diffusion Gemma image gen" },
  { id: "google/gemma-2b",                                         kind: "other", desc: "Gemma 2B base (not instruct)" },
  { id: "google/recurrentgemma-2b",                                kind: "other", desc: "RecurrentGemma 2B base" },
  { id: "nvidia/ai-synthetic-video-detector",                      kind: "other", desc: "AI synthetic video detector" },
  { id: "nvidia/gliner-pii",                                       kind: "other", desc: "GLiNER PII redaction" },
  { id: "nvidia/ising-calibration-1-35b-a3b",                      kind: "other", desc: "Ising calibration model" },
  { id: "nvidia/llama3-chatqa-1.5-70b",                            kind: "other", desc: "Llama3 ChatQA 1.5 70B" },
  { id: "nvidia/nemoretriever-parse",                              kind: "other", desc: "NemoRetriever Parse" },
  { id: "nvidia/nemotron-4-340b-reward",                           kind: "other", desc: "Nemotron 4 340B reward model" },
  { id: "nvidia/nemotron-parse",                                   kind: "other", desc: "Nemotron Parse" },
  { id: "nvidia/riva-translate-4b-instruct",                       kind: "other", desc: "Riva Translate 4B" },
  { id: "nvidia/riva-translate-4b-instruct-v1.1",                  kind: "other", desc: "Riva Translate 4B v1.1" },

  // ── Deprecated / non-working (API listed but no longer serving chat) ─
  // These models are listed by Nvidia's API but returned errors during testing.
  // Kept for discoverability — may be restored or point to different endpoints.
  { id: "01-ai/yi-large",                                          kind: "chat", tier: 3, status: "deprecated" },
  { id: "ai21labs/jamba-1.5-large-instruct",                       kind: "chat", tier: 2, status: "deprecated" },
  { id: "aisingapore/sea-lion-7b-instruct",                        kind: "chat", tier: 1, status: "deprecated" },
  { id: "bytedance/seed-oss-36b-instruct",                         kind: "chat", tier: 2, status: "deprecated" },
  { id: "databricks/dbrx-instruct",                                kind: "chat", tier: 2, status: "deprecated" },
  { id: "deepseek-ai/deepseek-coder-6.7b-instruct",                kind: "chat", tier: 1, status: "deprecated" },
  { id: "google/codegemma-1.1-7b",                                 kind: "chat", tier: 1, status: "deprecated" },
  { id: "google/codegemma-7b",                                     kind: "chat", tier: 1, status: "deprecated" },
  { id: "google/gemma-3-12b-it",                                   kind: "chat", tier: 1, status: "deprecated" },
  { id: "google/gemma-3-4b-it",                                    kind: "chat", tier: 1, status: "deprecated" },
  { id: "ibm/granite-3.0-3b-a800m-instruct",                       kind: "chat", tier: 1, status: "deprecated" },
  { id: "ibm/granite-3.0-8b-instruct",                             kind: "chat", tier: 1, status: "deprecated" },
  { id: "ibm/granite-34b-code-instruct",                           kind: "chat", tier: 2, status: "deprecated" },
  { id: "ibm/granite-8b-code-instruct",                            kind: "chat", tier: 1, status: "deprecated" },
  { id: "meta/codellama-70b",                                      kind: "chat", tier: 3, status: "deprecated" },
  { id: "meta/llama2-70b",                                         kind: "chat", tier: 3, status: "deprecated" },
  { id: "microsoft/phi-3.5-moe-instruct",                          kind: "chat", tier: 1, status: "deprecated" },
  { id: "minimaxai/minimax-m2.7",                                  kind: "chat", tier: 2, status: "deprecated" },
  { id: "mistralai/codestral-22b-instruct-v0.1",                   kind: "chat", tier: 2, status: "deprecated" },
  { id: "mistralai/mistral-7b-instruct-v0.3",                      kind: "chat", tier: 1, status: "deprecated" },
  { id: "mistralai/mistral-large",                                  kind: "chat", tier: 3, status: "deprecated" },
  { id: "mistralai/mistral-large-2-instruct",                       kind: "chat", tier: 3, status: "deprecated" },
  { id: "mistralai/mixtral-8x7b-instruct-v0.1",                    kind: "chat", tier: 1, status: "deprecated" },
  { id: "mistralai/mixtral-8x22b-v0.1",                            kind: "chat", tier: 2, status: "deprecated" },
  { id: "moonshotai/kimi-k2.6",                                    kind: "chat", tier: 2, status: "deprecated" },
  { id: "nv-mistralai/mistral-nemo-12b-instruct",                  kind: "chat", tier: 1, status: "deprecated" },
  { id: "nvidia/llama-3.1-nemotron-51b-instruct",                  kind: "chat", tier: 2, status: "deprecated" },
  { id: "nvidia/llama-3.1-nemotron-70b-instruct",                  kind: "chat", tier: 3, status: "deprecated" },
  { id: "nvidia/llama-3.1-nemotron-ultra-253b-v1",                 kind: "chat", tier: 3, status: "deprecated" },
  { id: "nvidia/llama-3.3-nemotron-super-49b-v1.5",                kind: "chat", tier: 1, status: "deprecated" },
  { id: "nvidia/mistral-nemo-minitron-8b-8k-instruct",             kind: "chat", tier: 1, status: "deprecated" },
  { id: "nvidia/nemotron-4-340b-instruct",                         kind: "chat", tier: 3, status: "deprecated" },
  { id: "nvidia/nemotron-nano-3-30b-a3b",                          kind: "chat", tier: 1, status: "deprecated" },
  { id: "nvidia/nvidia-nemotron-nano-9b-v2",                       kind: "chat", tier: 1, status: "deprecated" },
  { id: "openai/gpt-oss-120b",                                     kind: "chat", tier: 3, status: "deprecated" },
  { id: "openai/gpt-oss-20b",                                      kind: "chat", tier: 1, status: "deprecated" },
  { id: "thinkingmachines/inkling",                                 kind: "chat", tier: 2, status: "deprecated" },
  { id: "writer/palmyra-creative-122b",                            kind: "chat", tier: 3, status: "deprecated" },
  { id: "writer/palmyra-fin-70b-32k",                              kind: "chat", tier: 3, status: "deprecated" },
  { id: "writer/palmyra-med-70b",                                  kind: "chat", tier: 3, status: "deprecated" },
  { id: "writer/palmyra-med-70b-32k",                              kind: "chat", tier: 3, status: "deprecated" },
  { id: "zyphra/zamba2-7b-instruct",                               kind: "chat", tier: 1, status: "deprecated" },
];

// Groq models — fast LPU inference, OpenAI-compatible API.
// Live-tested free-tier models (2026-07-19): all returned valid chat completions.
export const GROQ_MODELS = [
  {
    id: "llama-3.3-70b-versatile",
    label: "Llama 3.3 70B",
    desc: "Default — strong general-purpose coding, 280 t/s, 131K context",
    tier: "default",
  },
  {
    id: "llama-3.1-8b-instant",
    label: "Llama 3.1 8B Instant",
    desc: "Fast — lightweight, 560 t/s, great for quick code tasks",
    tier: "fast",
  },
  {
    id: "openai/gpt-oss-120b",
    label: "GPT-OSS 120B",
    desc: "Powerful — OpenAI open-weight flagship, 500 t/s, strong reasoning",
    tier: "powerful",
  },
  {
    id: "openai/gpt-oss-20b",
    label: "GPT-OSS 20B",
    desc: "Fastest — 1000 t/s, efficient for simple completions",
    tier: "fast",
  },
];

export function getWellKnownProvider(id) {
  return WELL_KNOWN_PROVIDERS.find((p) => p.id === id);
}

export function saveProviderToConfig(providerId, providerConfig) {
  const userDir = ensureUserDir();
  const cfgPath = path.join(userDir, "config.json");
  let cfg = {};
  try {
    if (fs.existsSync(cfgPath)) {
      let raw = fs.readFileSync(cfgPath, "utf8");
      if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
      cfg = JSON.parse(raw);
    }
  } catch {}
  if (!cfg.providers) cfg.providers = {};
  cfg.providers[providerId] = providerConfig;
  cfg.provider = providerId;
  fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + "\n", "utf8");
}

export function removeProviderFromConfig(providerId) {
  const userDir = ensureUserDir();
  const cfgPath = path.join(userDir, "config.json");
  let cfg = {};
  try {
    if (fs.existsSync(cfgPath)) {
      let raw = fs.readFileSync(cfgPath, "utf8");
      if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
      cfg = JSON.parse(raw);
    }
  } catch {}
  if (!cfg.providers || !cfg.providers[providerId]) return false;
  delete cfg.providers[providerId];
  if (cfg.provider === providerId) {
    const keys = Object.keys(cfg.providers);
    cfg.provider = keys.length ? keys[0] : "nvidia";
  }
  fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + "\n", "utf8");
  return true;
}

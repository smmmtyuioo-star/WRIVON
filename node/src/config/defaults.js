// Default config for WRIVON. User and project configs merge on top.
// Best models selected for speed + capability balance.

export const DEFAULT_CONFIG = {
  provider: "nvidia",
  model: "deepseek-ai/deepseek-v4-flash",
  providers: {
    nvidia: {
      baseUrl: process.env.WRIVON_NVIDIA_URL || "https://integrate.api.nvidia.com/v1",
      apiKey: process.env.NVIDIA_API_KEY ? `env:NVIDIA_API_KEY` : "",
      model: process.env.WRIVON_NVIDIA_MODEL || "deepseek-ai/deepseek-v4-flash",
      fastModel: "deepseek-ai/deepseek-v4-flash",
      powerfulModel: "mistralai/mistral-large-3-675b-instruct-2512",
      kind: "openai",
      supportsParallelTools: false,
    },
    cloudflare: {
      baseUrl: process.env.WRIVON_CLOUDFLARE_URL || "https://api.cloudflare.com/client/v4/accounts",
      apiKey: process.env.CLOUDFLARE_API_KEY ? `env:CLOUDFLARE_API_KEY` : "",
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID || "",
      model: process.env.WRIVON_CLOUDFLARE_MODEL || "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      fastModel: "@cf/meta/llama-3.1-8b-instruct-fp8",
      powerfulModel: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      kind: "cloudflare",
    },
    groq: {
      baseUrl: process.env.WRIVON_GROQ_URL || "https://api.groq.com/openai/v1",
      apiKey: process.env.GROQ_API_KEY ? `env:GROQ_API_KEY` : "",
      model: process.env.WRIVON_GROQ_MODEL || "llama-3.3-70b-versatile",
      fastModel: "llama-3.1-8b-instant",
      powerfulModel: "openai/gpt-oss-120b",
      kind: "openai",
      supportsParallelTools: true,
    },
  },
  tools: {
    bash: { timeoutMs: 120000 },
  },
  sandbox: {
    filesystem: "workspace-write",
    network: "allow",
  },
  ui: {
    stream: true,
    showTools: true,
  },
};

export function expandEnv(value) {
  if (typeof value !== "string") return value;
  if (!value.startsWith("env:")) return value;
  const name = value.slice(4);
  return process.env[name] || "";
}

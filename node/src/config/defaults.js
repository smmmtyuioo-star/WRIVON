import { loadSharedConfig } from "./shared.js";

function buildDefaults() {
  const shared = loadSharedConfig();
  const providers = {};

  for (const [name, def] of Object.entries(shared.providers)) {
    const env = def.env || {};
    const p = {
      baseUrl: process.env[env.baseUrl] || def.base_url,
      apiKey: process.env[env.apiKey] ? `env:${env.apiKey}` : "",
      model: process.env[env.model] || def.models.default,
      fastModel: def.models.fast,
      powerfulModel: def.models.powerful,
      kind: def.kind,
      supportsParallelTools: def.supports_parallel_tools || false,
    };
    if (env.accountId) {
      p.accountId = process.env[env.accountId] || "";
    }
    providers[name] = p;
  }

  const d = shared.defaults || {};
  return {
    provider: shared.default_provider || "nvidia",
    model: shared.default_model || "deepseek-ai/deepseek-v4-flash",
    providers,
    tools: { bash: { timeoutMs: d.bash_timeout_ms || 120000 } },
    sandbox: d.sandbox || { filesystem: "workspace-write", network: "allow" },
    ui: d.ui || { stream: true, showTools: true },
  };
}

export const DEFAULT_CONFIG = buildDefaults();

export function expandEnv(value) {
  if (typeof value !== "string") return value;
  if (!value.startsWith("env:")) return value;
  const name = value.slice(4);
  return process.env[name] || "";
}

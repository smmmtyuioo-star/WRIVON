// Provider factory. Returns a client object for the configured provider.
// Supports automatic fallback: if the primary provider's API call fails,
// falls back to the next configured provider and prints a warning.

import { createOllama } from "./ollama.js";
import { createOpenAICompat } from "./openai.js";
import { createCloudflare } from "./cloudflare.js";

export function createProvider(cfg) {
  const name = cfg.provider;
  const pcfg = cfg.providers?.[name];
  if (!pcfg) throw new Error(`wrivon: provider "${name}" not found in config.providers`);

  switch (pcfg.kind) {
    case "ollama":    return createOllama(pcfg);
    case "openai":    return createOpenAICompat(pcfg);
    case "cloudflare": return createCloudflare(pcfg);
    default: throw new Error(`wrivon: unknown provider kind "${pcfg.kind}"`);
  }
}

export function createProviderWithFallback(cfg) {
  const fallbackOrder = Object.keys(cfg.providers || {});
  const primary = cfg.provider;
  // Reorder: primary first, then any others in config order
  const ordered = [primary, ...fallbackOrder.filter(n => n !== primary)];

  let currentName = primary;
  let current;

  for (let i = 0; i < ordered.length; i++) {
    try {
      currentName = ordered[i];
      current = createProvider({ ...cfg, provider: currentName });
      if (i > 0) {
        console.warn(`\n  ⚠ Primary provider "${primary}" unavailable, fell back to "${currentName}"\n`);
      }
      break;
    } catch (e) {
      if (i === ordered.length - 1) {
        throw new Error(`wrivon: all providers failed. Last error: ${e.message}`);
      }
      console.warn(`  ⚠ ${ordered[i]}: ${e.message}`);
      console.warn(`  → Trying fallback: ${ordered[i + 1]}`);
    }
  }

  cfg.provider = currentName;

  return withFallbackOnError(current, cfg, ordered.filter(n => n !== currentName));
}

function withFallbackOnError(primaryClient, cfg, fallbacks) {
  let client = primaryClient;

  // Build model fallback list: fastModel -> model -> powerfulModel
  const pcfg = cfg.providers?.[cfg.provider] || {};
  const modelFallbacks = [
    pcfg.fastModel,
    pcfg.model,
    pcfg.powerfulModel,
  ].filter(Boolean).filter((m, i, a) => a.indexOf(m) === i); // deduplicate

  const wrap = {
    get kind() { return client.kind; },
    get model() { return client.model; },
    get baseUrl() { return client.baseUrl; },

    async listModels() {
      return client.listModels();
    },

    async chat(opts) {
      const tried = [];

      // First, try model fallbacks within same provider
      for (const m of modelFallbacks) {
        if (m === client.model) continue; // already tried current
        try {
          client.model = m;
          return await client.chat(opts);
        } catch (e) {
          tried.push(m);
          console.warn(`\n  ⚠ Model "${m}" failed: ${e.message}`);
        }
      }

      // Then try provider fallbacks
      while (true) {
        try {
          return await client.chat(opts);
        } catch (e) {
          tried.push(client.model || "?");
          const nextName = fallbacks.shift();
          if (!nextName) {
            const hint = `No working provider available — check your API keys are loaded (run .\\scripts\\env.ps1)`;
            throw new Error(`${hint}\n  Last error: ${e.message}`);
          }
          console.warn(`\n  ⚠ ${cfg.provider} API error: ${e.message}`);
          console.warn(`  → Falling back to ${nextName}\n`);
          cfg.provider = nextName;
          try {
            client = createProvider(cfg);
          } catch (e2) {
            console.warn(`  ⚠ ${nextName}: ${e2.message}`);
            // Continue the while loop — will try next fallback or throw original error
          }
        }
      }
    },
  };

  return wrap;
}

export function listProviders(cfg) {
  return Object.entries(cfg.providers || {}).map(([name, p]) => ({
    name, kind: p.kind, model: p.model, baseUrl: p.baseUrl,
  }));
}

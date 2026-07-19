// OpenAI-compatible client. Works against:
//   - OpenAI       : https://api.openai.com/v1
//   - NVIDIA NIM   : https://integrate.api.nvidia.com/v1
//   - vLLM / LM Studio / OpenRouter / etc.
// Streams from /chat/completions with SSE.
// Includes auto-retry for transient errors (rate limits, 5xx).

import { parseSSE, safeJson } from "./stream.js";

const RETRYABLE_CODES = new Set([429, 500, 502, 503, 504]);

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function createOpenAICompat(cfg) {
  const baseUrl = (cfg.baseUrl || "https://api.openai.com/v1").replace(/\/+$/, "");
  const apiKey = cfg.apiKey || "";

  return {
    kind: "openai",
    model: cfg.model,
    baseUrl,
    apiKey: apiKey ? `***${apiKey.slice(-4)}` : "(no key)",

    async listModels() {
      const r = await fetch(`${baseUrl}/models`, {
        headers: apiKey ? { authorization: `Bearer ${apiKey}` } : {},
      });
      if (!r.ok) throw new Error(`openai listModels: ${r.status} ${r.statusText}`);
      const j = await r.json();
      return (j.data || []).map((m) => m.id);
    },

    async chat({ messages, tools, tool_choice, stream = true, signal, onToken, onDone, onToolCall }) {
      const body = { model: cfg.model, messages, stream, max_tokens: cfg.maxTokens || 4096 };
      if (tools && tools.length) { 
        body.tools = tools; 
        body.tool_choice = tool_choice || "auto";
        if (cfg.supportsParallelTools === false) {
          body.parallel_tool_calls = false;
        }
      }

      let lastErr;
      const maxRetries = 2;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        if (attempt > 0) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
          console.warn(`  ⚡ Retry ${attempt}/${maxRetries} in ${delay}ms...`);
          await sleep(delay);
        }
        try {
          const r = await fetch(`${baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
            },
            body: JSON.stringify(body),
            signal,
          });
          if (!r.ok) {
            const t = await r.text();
            lastErr = new Error(`openai chat: ${r.status} ${r.statusText}: ${t}`);
            if (!RETRYABLE_CODES.has(r.status)) throw lastErr;
            console.warn(`  ⚠ ${lastErr.message}`);
            continue;
          }

          if (!stream) {
            const j = await r.json();
            const msg = j.choices?.[0]?.message || {};
            const content = msg.content || "";
            if (onToken) for (const ch of content) onToken(ch);
            if (onToolCall && msg.tool_calls) for (const tc of msg.tool_calls) onToolCall(tc);
            if (onDone) onDone({ content, toolCalls: msg.tool_calls || [], finishReason: j.choices?.[0]?.finish_reason || "stop" });
            return { content, toolCalls: msg.tool_calls || [], finishReason: j.choices?.[0]?.finish_reason || "stop" };
          }

          // Streaming response
          let content = "";
          const toolCalls = {};
          let finishReason = "stop";

          for await (const evt of parseSSE(r)) {
            if (evt.event === "ping") continue;
            const j = safeJson(evt.data);
            if (!j) continue;
            const choice = j.choices?.[0];
            if (!choice) continue;
            const delta = choice.delta || {};
            if (delta.content) { content += delta.content; if (onToken) onToken(delta.content); }
            if (Array.isArray(delta.tool_calls)) {
              for (const tc of delta.tool_calls) {
                const i = tc.index ?? 0;
                if (!toolCalls[i]) toolCalls[i] = { id: "", name: "", args: "" };
                if (tc.id) toolCalls[i].id = tc.id;
                if (tc.function?.name) toolCalls[i].name = tc.function.name;
                if (typeof tc.function?.arguments === "string") toolCalls[i].args += tc.function.arguments;
              }
            }
            if (choice.finish_reason) finishReason = choice.finish_reason;
          }

          const finalTools = Object.values(toolCalls).map((tc) => ({
            id: tc.id,
            type: "function",
            function: { name: tc.name, arguments: tc.args || "{}" },
          }));
          if (onToolCall) for (const tc of finalTools) onToolCall(tc);
          if (onDone) onDone({ content, toolCalls: finalTools, finishReason });
          return { content, toolCalls: finalTools, finishReason };
        } catch (e) {
          if (e.name === "AbortError") throw e;
          lastErr = e;
          if (!RETRYABLE_CODES.has(e.status) && !e.message?.includes("timeout") && !e.message?.includes("ETIMEDOUT") && !e.message?.includes("ECONNRESET")) {
            throw e;
          }
          console.warn(`  ⚠ ${e.message}`);
        }
      }
      throw lastErr || new Error("openai chat: max retries exceeded");
    },
  };
}

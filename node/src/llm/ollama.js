// Ollama client. Uses /api/chat (NDJSON streaming).
// Spec: https://github.com/ollama/ollama/blob/main/docs/api.md#generate-a-chat-completion
// Ollama does NOT support OpenAI-style `tools`; we send the system prompt only
// and let v0.1 use the no-tools chat path. Tool support for Ollama lands in v0.2
// (Ollama 0.5+ does support a tools field; we'll enable it when detected).

import { safeJson } from "./stream.js";

export function createOllama(cfg) {
  const baseUrl = (cfg.baseUrl || "http://127.0.0.1:11434").replace(/\/+$/, "");

  return {
    kind: "ollama",
    model: cfg.model,
    baseUrl,

    async listModels() {
      const r = await fetch(`${baseUrl}/api/tags`);
      if (!r.ok) throw new Error(`ollama listModels: ${r.status} ${r.statusText}`);
      const j = await r.json();
      return (j.models || []).map((m) => m.name);
    },

    async chat({ messages, stream = true, signal, onToken, onDone }) {
      const r = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ model: cfg.model, messages, stream }),
        signal,
      });
      if (!r.ok) {
        const t = await r.text();
        throw new Error(`ollama chat: ${r.status} ${r.statusText}: ${t}`);
      }

      if (!stream) {
        const j = await r.json();
        const content = j?.message?.content || "";
        if (onToken) for (const ch of content) onToken(ch);
        if (onDone) onDone({ content, finishReason: j?.done_reason || "stop", raw: j });
        return { content, finishReason: j?.done_reason || "stop" };
      }

      // NDJSON stream
      const reader = r.body.getReader();
      const dec = new TextDecoder("utf-8");
      let buf = "";
      let content = "";
      let finishReason = "stop";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let nl;
        while ((nl = buf.indexOf("\n")) !== -1) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line) continue;
          const j = safeJson(line);
          if (!j) continue;
          const delta = j?.message?.content || "";
          if (delta) { content += delta; if (onToken) onToken(delta); }
          if (j.done) {
            finishReason = j.done_reason || "stop";
            if (onDone) onDone({ content, finishReason, raw: j });
            return { content, finishReason };
          }
        }
      }
      if (onDone) onDone({ content, finishReason, raw: null });
      return { content, finishReason };
    },
  };
}

// Tiny SSE (Server-Sent Events) parser. Async iterator that yields
// { event: string, data: string } objects. Stops on the "data: [DONE]"
// sentinel that OpenAI and most compatible APIs use.

export async function* parseSSE(response) {
  if (!response.body) throw new Error("SSE: no response body");
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buf = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    let idx;
    while ((idx = buf.indexOf("\n\n")) !== -1) {
      const block = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      const lines = block.split("\n");
      let event = "message";
      let data = "";
      for (const line of lines) {
        if (line.startsWith(":")) continue;        // comment
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) data += line.slice(5).trim();
      }
      if (!data) continue;
      if (data === "[DONE]") return;
      yield { event, data };
    }
  }
  // flush trailing data
  if (buf.trim()) {
    const lines = buf.split("\n");
    let event = "message";
    let data = "";
    for (const line of lines) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) data += line.slice(5).trim();
    }
    if (data && data !== "[DONE]") yield { event, data };
  }
}

export function safeJson(s) {
  try { return JSON.parse(s); } catch { return null; }
}

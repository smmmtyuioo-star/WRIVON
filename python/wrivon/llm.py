import json
import httpx
from typing import Optional, AsyncGenerator


class LLMError(Exception):
    """Raised when an LLM call fails."""
    pass


class LLMClient:
    """Low-level HTTP client for OpenAI-compatible chat completion APIs."""

    def __init__(self, base_url: str, api_key: str, model: str, kind: str = "openai", account_id: str = ""):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.model = model
        self.kind = kind
        self.account_id = account_id
        self._endpoint = self._build_endpoint()

    def _build_endpoint(self) -> str:
        if self.kind == "cloudflare":
            return f"{self.base_url}/{self.account_id}/ai/v1/chat/completions"
        return f"{self.base_url}/chat/completions"

    def _headers(self) -> dict:
        headers = {
            "Content-Type": "application/json",
            "Accept": "text/event-stream",
        }
        if self.kind == "cloudflare":
            headers["Authorization"] = f"Bearer {self.api_key}"
        else:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    def chat(
        self,
        messages: list,
        tools: Optional[list] = None,
        temperature: float = 0.3,
        max_tokens: int = 8192,
        stream: bool = True,
    ) -> dict:
        """Send a chat completion request and return the full response."""
        body = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": stream,
        }
        if tools:
            body["tools"] = tools

        try:
            with httpx.Client(timeout=120.0) as client:
                response = client.post(self._endpoint, headers=self._headers(), json=body)

            if response.status_code != 200:
                detail = response.text[:500]
                raise LLMError(f"HTTP {response.status_code}: {detail}")

            if stream:
                return self._parse_sse(response.text)

            return response.json()

        except httpx.TimeoutException:
            raise LLMError("Request timed out after 120s")
        except httpx.RequestError as e:
            raise LLMError(f"Request failed: {e}")

    def _parse_sse(self, text: str) -> dict:
        """Parse SSE response and return the last complete delta."""
        content = ""
        tool_calls = None

        for line in text.split("\n"):
            line = line.strip()
            if not line or line.startswith(":"):
                continue
            if line == "data: [DONE]":
                break
            if line.startswith("data: "):
                try:
                    chunk = json.loads(line[6:])
                except json.JSONDecodeError:
                    continue

                choices = chunk.get("choices", [])
                if not choices:
                    continue
                delta = choices[0].get("delta", {})

                if delta.get("content"):
                    content += delta["content"]

                if "tool_calls" in delta:
                    tc = delta["tool_calls"]
                    if tool_calls is None:
                        tool_calls = []
                    for call in tc:
                        idx = call.get("index", len(tool_calls))
                        while len(tool_calls) <= idx:
                            tool_calls.append({
                                "id": "",
                                "type": "function",
                                "function": {"name": "", "arguments": ""}
                            })
                        if call.get("id"):
                            tool_calls[idx]["id"] += call["id"]
                        if call.get("function", {}).get("name"):
                            tool_calls[idx]["function"]["name"] += call["function"]["name"]
                        if call.get("function", {}).get("arguments"):
                            tool_calls[idx]["function"]["arguments"] += call["function"]["arguments"]

        result = {
            "choices": [{
                "message": {
                    "role": "assistant",
                    "content": content or None,
                },
                "finish_reason": "stop",
            }]
        }
        if tool_calls:
            result["choices"][0]["message"]["tool_calls"] = tool_calls

        return result

    def chat_stream(self, messages: list, tools: Optional[list] = None, temperature: float = 0.3, max_tokens: int = 8192):
        """Stream chat completion. Yields (content_chunk, tool_calls_accumulated, finish_reason)."""
        body = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True,
        }
        if tools:
            body["tools"] = tools

        try:
            with httpx.Client(timeout=300.0) as client:
                with client.stream("POST", self._endpoint, headers=self._headers(), json=body) as response:
                    if response.status_code != 200:
                        detail = response.read().decode()[:500]
                        raise LLMError(f"HTTP {response.status_code}: {detail}")

                    tool_calls = None
                    for line in response.iter_lines():
                        line = line.strip()
                        if not line or line.startswith(":"):
                            continue
                        if line == "data: [DONE]":
                            yield "", tool_calls, "stop"
                            return
                        if line.startswith("data: "):
                            try:
                                chunk = json.loads(line[6:])
                            except json.JSONDecodeError:
                                continue

                            choices = chunk.get("choices", [])
                            if not choices:
                                continue
                            delta = choices[0].get("delta", {})
                            finish = choices[0].get("finish_reason")

                            content = delta.get("content", "")

                            if "tool_calls" in delta:
                                tc = delta["tool_calls"]
                                if tool_calls is None:
                                    tool_calls = []
                                for call in tc:
                                    idx = call.get("index", len(tool_calls) if tool_calls else 0)
                                    while len(tool_calls) <= idx:
                                        tool_calls.append({
                                            "id": "",
                                            "type": "function",
                                            "function": {"name": "", "arguments": ""}
                                        })
                                    if call.get("id"):
                                        tool_calls[idx]["id"] += call["id"]
                                    if call.get("function", {}).get("name"):
                                        tool_calls[idx]["function"]["name"] += call["function"]["name"]
                                    if call.get("function", {}).get("arguments"):
                                        tool_calls[idx]["function"]["arguments"] += call["function"]["arguments"]

                            yield content, tool_calls, finish

        except httpx.TimeoutException:
            raise LLMError("Request timed out")
        except httpx.RequestError as e:
            raise LLMError(f"Request failed: {e}")

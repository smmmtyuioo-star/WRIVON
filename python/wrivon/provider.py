from typing import Optional
from .llm import LLMClient, LLMError
from .config import load_config

FALLBACK_ORDER = ["nvidia", "cloudflare", "groq"]


class ProviderChain:
    """Manages provider fallback chain: try primary, then fallbacks."""

    def __init__(self, cfg: dict):
        self.cfg = cfg
        self.primary = cfg.get("provider", "nvidia")
        self._clients = {}
        self._build_clients()

    def _build_clients(self):
        providers = self.cfg.get("providers", {})
        # Build in fallback order
        for name in FALLBACK_ORDER:
            if name not in providers:
                continue
            p = providers[name]
            if not isinstance(p, dict):
                continue
            api_key = p.get("apiKey", "") or ""
            if not api_key:
                continue
            self._clients[name] = LLMClient(
                base_url=p.get("baseUrl", ""),
                api_key=api_key,
                model=p.get("model", ""),
                kind=p.get("kind", "openai"),
                account_id=p.get("accountId", ""),
            )

    def get_client(self) -> LLMClient:
        """Get the primary client."""
        if self.primary in self._clients:
            return self._clients[self.primary]
        # Fallback to any available
        for name in FALLBACK_ORDER:
            if name in self._clients:
                return self._clients[name]
        raise LLMError("No configured providers found. Run 'wrivon setup' to add API keys.")

    def get_client_with_fallback(self) -> LLMClient:
        """Get primary client, with fallback built-in."""
        return self.get_client()

    def chat(self, messages: list, tools: Optional[list] = None, temperature: float = 0.3, max_tokens: int = 8192, stream: bool = True):
        """Chat with automatic fallback across providers."""
        order = [self.primary] + [f for f in FALLBACK_ORDER if f != self.primary]
        last_error = None

        for name in order:
            if name not in self._clients:
                continue
            client = self._clients[name]
            try:
                return client.chat(messages, tools=tools, temperature=temperature, max_tokens=max_tokens, stream=stream)
            except LLMError as e:
                last_error = e
                continue

        raise LLMError(f"All providers failed. Last error: {last_error}")

    def chat_stream(self, messages: list, tools: Optional[list] = None, temperature: float = 0.3, max_tokens: int = 8192):
        """Stream chat with automatic fallback."""
        order = [self.primary] + [f for f in FALLBACK_ORDER if f != self.primary]
        last_error = None

        for name in order:
            if name not in self._clients:
                continue
            client = self._clients[name]
            try:
                yield from client.chat_stream(messages, tools=tools, temperature=temperature, max_tokens=max_tokens)
                return
            except LLMError as e:
                last_error = e
                continue

        raise LLMError(f"All providers failed. Last error: {last_error}")


def create_provider_chain(cfg: dict) -> ProviderChain:
    """Create a provider chain from config."""
    return ProviderChain(cfg)

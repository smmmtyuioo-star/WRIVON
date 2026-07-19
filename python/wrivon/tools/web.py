"""Web fetch and search utilities."""

import json
import re
import httpx


def web_fetch(url: str, format: str = "markdown") -> str:
    """Fetch content from a URL."""
    try:
        response = httpx.get(url, timeout=30.0, follow_redirects=True)
        if response.status_code != 200:
            return f"Error: HTTP {response.status_code}"

        content = response.text

        if format == "text":
            import html
            text = html.unescape(re.sub(r"<[^>]+>", "", content))
            text = re.sub(r"\s+", " ", text).strip()
            return text[:10000]

        # Return as-is for markdown/html
        return content[:15000]

    except httpx.TimeoutException:
        return "Error: Request timed out after 30s"
    except httpx.RequestError as e:
        return f"Error: {e}"
    except Exception as e:
        return f"Error fetching URL: {e}"


def web_search(query: str, num_results: int = 8) -> str:
    """Search the web for information using a search provider.
    
    Falls back to a basic text-based approach.
    """
    try:
        url = f"https://html.duckduckgo.com/html/?q={httpx.utils.quote(query)}"
        response = httpx.get(url, timeout=30.0, follow_redirects=True,
                             headers={"User-Agent": "Mozilla/5.0"})
        if response.status_code != 200:
            return f"Search returned HTTP {response.status_code}"

        html = response.text

        # Extract result links and snippets (basic parsing)
        results = []
        for match in re.finditer(
            r'<a[^>]+class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)</a>',
            html, re.DOTALL
        ):
            url = match.group(1)
            title = re.sub(r"<[^>]+>", "", match.group(2)).strip()
            results.append(f"{title}\n  {url}")

        if not results:
            return f"No results found for '{query}'"

        return "\n\n".join(results[:num_results])

    except httpx.TimeoutException:
        return "Search timed out"
    except Exception as e:
        return f"Search error: {e}"

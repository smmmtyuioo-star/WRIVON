# WRIVON Benchmark

> Generated 2026-07-20 | win32 10.0.26200 | Node v24.18.0
> 5 runs per metric | TTFT skipped (no API keys) | Git available

## Startup (`--help` exit time)

| Metric    | Node.js             | Python              |
|---------|--------------------|--------------------|
| Average   | 739.0 ±256.9 ms    | 2881.4 ±708.7 ms   |
| Min / Max | 491.0 / 1017.4 ms      | 2070.4 / 3615.8 ms      |

## Time to First Token

| Metric    | Node.js             | Python              |
|---------|--------------------|--------------------|
| Average   | —                  | —                  |

## Memory (RSS after startup)

| Metric    | Node.js             | Python              |
|---------|--------------------|--------------------|
| Average   | 51.3 ±0.2 MB       | 14.7 ±0.0 MB       |
| Min / Max | 51.0 / 51.6 MB      | 14.7 / 14.8 MB      |

## Git Operations

| Operation | Node.js             | Python              |
|---------|--------------------|--------------------|
| diff --stat | 296.0 ±21.1 ms     | 296.0 ±21.1 ms     |
| add       | 316.3 ±5.8 ms      | 316.3 ±5.8 ms      |

## Summary

| | Node.js | Python | Winner |
|--|----------|----------|--------|
| Startup | 739 ms | 2881 ms | Node.js |
| Memory  | 51 MB | 15 MB | Python |

---
*Runner: `node benchmark.js`*

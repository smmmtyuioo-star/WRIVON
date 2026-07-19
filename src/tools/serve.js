import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const servers = new Map();

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".wasm": "application/wasm",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".map": "application/json",
  ".ts": "text/plain; charset=utf-8",
  ".tsx": "text/plain; charset=utf-8",
  ".jsx": "text/plain; charset=utf-8",
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

const SAFE_DIR_TRAVERSAL = /\.\.\//;

export async function startServer(port, directory) {
  const dir = path.resolve(process.cwd(), directory || ".");

  if (servers.has(port)) {
    return { ok: true, output: `Server already running on http://localhost:${port} (serving ${dir})` };
  }

  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      if (SAFE_DIR_TRAVERSAL.test(req.url)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }

      let filePath = path.join(dir, req.url === "/" ? "index.html" : req.url);

      fs.stat(filePath, (err, stats) => {
        if (err) {
          // Try index.html for SPA routing
          const spaPath = path.join(dir, "index.html");
          fs.stat(spaPath, (err2, stats2) => {
            if (err2) {
              res.writeHead(404);
              res.end("Not Found");
              return;
            }
            const mime = getMimeType(spaPath);
            res.writeHead(200, { "content-type": mime });
            fs.createReadStream(spaPath).pipe(res);
          });
          return;
        }

        if (stats.isDirectory()) {
          // Directory listing or serve index.html
          const indexPath = path.join(filePath, "index.html");
          fs.stat(indexPath, (err2, stats2) => {
            if (err2) {
              fs.readdir(filePath, (err3, files) => {
                if (err3) {
                  res.writeHead(500);
                  res.end("Internal Server Error");
                  return;
                }
                res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
                const listing = files
                  .map((f) => {
                    const fPath = path.join(filePath, f);
                    try {
                      const isDir = fs.statSync(fPath).isDirectory();
                      return `<li><a href="${req.url.replace(/\/?$/, "/")}${f}">${isDir ? "📁 " : "📄 "}${f}</a></li>`;
                    } catch {
                      return `<li>${f}</li>`;
                    }
                  })
                  .join("\n");
                res.end(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Directory: ${req.url}</title><style>body{font-family:sans-serif;margin:2rem;max-width:800px;line-height:1.6}h1{border-bottom:1px solid #eee;padding-bottom:.5rem}ul{list-style:none;padding:0}li{padding:.25rem 0}a{color:#0366d6;text-decoration:none}a:hover{text-decoration:underline}</style></head><body><h1>${req.url}</h1><ul>${listing}</ul></body></html>`);
              });
            } else {
              const mime = getMimeType(indexPath);
              res.writeHead(200, { "content-type": mime });
              fs.createReadStream(indexPath).pipe(res);
            }
          });
          return;
        }

        const mime = getMimeType(filePath);
        res.writeHead(200, { "content-type": mime });
        fs.createReadStream(filePath).pipe(res);
      });
    });

    server.listen(port, "127.0.0.1", () => {
      servers.set(port, server);
      resolve({ ok: true, output: `Serving ${dir} at http://localhost:${port}\nOpen in browser: http://127.0.0.1:${port}` });
    });

    server.on("error", (e) => {
      resolve({ ok: false, error: `Failed to start server on port ${port}: ${e.message}` });
    });
  });
}

export function stopServer(port) {
  const server = servers.get(port);
  if (!server) return { ok: false, error: `No server running on port ${port}` };
  server.close();
  servers.delete(port);
  return { ok: true, output: `Server on port ${port} stopped.` };
}

export function listServers() {
  if (servers.size === 0) return { ok: true, output: "No active servers." };
  const lines = [];
  for (const [port] of servers) {
    lines.push(`  http://localhost:${port}`);
  }
  return { ok: true, output: `Active servers:\n${lines.join("\n")}` };
}

export function stopAllServers() {
  const ports = [...servers.keys()];
  for (const port of ports) {
    const s = servers.get(port);
    if (s) {
      s.close();
      servers.delete(port);
    }
  }
  return { ok: true, output: `Stopped ${ports.length} server(s).` };
}

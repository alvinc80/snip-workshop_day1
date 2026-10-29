import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

const links = new Map();
const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const port = Number(process.env.PORT || 3000);
const configuredBaseUrl = process.env.BASE_URL
  || (process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : `http://localhost:${port}`);
const parsedBaseUrl = new URL(configuredBaseUrl);

if (!["http:", "https:"].includes(parsedBaseUrl.protocol)) {
  throw new Error("BASE_URL must use http or https");
}
if (!Number.isInteger(port) || port < 0 || port > 65535) {
  throw new Error("PORT must be an integer between 0 and 65535");
}

const baseUrl = parsedBaseUrl.origin;
const publicDir = process.env.PUBLIC_DIR
  ? resolve(process.cwd(), process.env.PUBLIC_DIR)
  : null;
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

function createCode() {
  let code = "";
  while (code.length < 6) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    for (const byte of bytes) {
      if (byte < 248) {
        code += alphabet[byte % alphabet.length];
        if (code.length === 6) break;
      }
    }
  }
  return code;
}

async function serveStatic(pathname) {
  if (!publicDir) return null;

  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    return new Response("Bad Request", { status: 400, headers: corsHeaders });
  }

  const relativePath = decodedPath === "/"
    ? "index.html"
    : decodedPath.replace(/^[/\\]+/, "");
  const filePath = resolve(publicDir, relativePath);
  if (filePath !== publicDir && !filePath.startsWith(`${publicDir}${sep}`)) {
    return null;
  }

  try {
    if (!(await stat(filePath)).isFile()) return null;
    const body = await readFile(filePath);
    return new Response(body, {
      headers: {
        ...corsHeaders,
        "Content-Type": contentTypes[extname(filePath).toLowerCase()] || "application/octet-stream",
      },
    });
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "ENOTDIR") return null;
    throw error;
  }
}

Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method === "POST" && pathname === "/api/links") {
      let body;
      try {
        body = await request.json();
      } catch {
        return jsonResponse({ error: "Invalid JSON" }, 400);
      }

      if (typeof body?.url !== "string") {
        return jsonResponse({ error: "A valid http(s) URL is required" }, 400);
      }

      let targetUrl;
      try {
        targetUrl = new URL(body.url);
      } catch {
        return jsonResponse({ error: "A valid http(s) URL is required" }, 400);
      }
      if (!["http:", "https:"].includes(targetUrl.protocol)) {
        return jsonResponse({ error: "A valid http(s) URL is required" }, 400);
      }

      let code;
      do {
        code = createCode();
      } while (links.has(code));

      const link = {
        code,
        url: targetUrl.href,
        shortUrl: `${baseUrl}/${code}`,
        hits: 0,
        createdAt: new Date().toISOString(),
      };
      links.set(code, link);
      return jsonResponse(link, 201);
    }

    if (request.method === "GET" && pathname === "/api/links") {
      return jsonResponse(Array.from(links.values()));
    }

    if (request.method === "GET") {
      const staticResponse = await serveStatic(pathname);
      if (staticResponse) return staticResponse;

      const code = pathname.slice(1);
      const link = links.get(code);
      if (!code || code.includes("/")) {
        return jsonResponse({ error: "Not found" }, 404);
      }
      if (!link) return jsonResponse({ error: "Not found" }, 404);

      link.hits += 1;
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, Location: link.url },
      });
    }

    return jsonResponse({ error: "Not found" }, 404);
  },
});

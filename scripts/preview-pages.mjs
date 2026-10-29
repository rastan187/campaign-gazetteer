import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";

const root = resolve("out");
const prefix = "/campaign-gazetteer";
const mime = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".txt": "text/plain", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2" };
createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://localhost");
    const pathname = decodeURIComponent(url.pathname);
    if (pathname === "/__preview/phone") {
      const page = url.searchParams.get("page") ?? "";
      if (!["", "map/", "house-rules/", "campaign-primer/"].includes(page)) throw new Error("Not found");
      response.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
      response.end(`<!doctype html><html lang="en"><title>Phone layout preview</title><body style="margin:0;background:#222;display:flex;justify-content:center"><iframe title="390 pixel phone preview" src="${prefix}/${page}" style="border:0;width:390px;height:844px;background:#f4eddb"></iframe></body></html>`);
      return;
    }
    if (pathname === "/" || pathname === prefix) { response.writeHead(302, { location: `${prefix}/` }); response.end(); return; }
    if (!pathname.startsWith(`${prefix}/`)) throw new Error("Not found");
    let path = resolve(root, `.${pathname.slice(prefix.length)}`);
    if (path !== root && !path.startsWith(root + sep)) throw new Error("Not found");
    if ((await stat(path)).isDirectory()) path = resolve(path, "index.html");
    const body = await readFile(path);
    response.writeHead(200, { "content-type": mime[extname(path)] ?? "application/octet-stream", "cache-control": "no-store" });
    response.end(body);
  } catch {
    response.writeHead(404, { "content-type": "text/html; charset=utf-8" });
    response.end(await readFile(resolve(root, "404.html")));
  }
}).listen(4173, "127.0.0.1", () => console.log(`Preview: http://127.0.0.1:4173${prefix}/`));

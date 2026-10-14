// Local preview with byte ranges, which the reels need to loop and seek.
// Run from the website folder: node tools/serve.mjs, then open http://127.0.0.1:8765
import { createServer } from "node:http";
import { statSync, createReadStream } from "node:fs";
import { join, extname, normalize } from "node:path";
const root = new URL("..", import.meta.url).pathname;
const port = process.argv[2] || 8765;
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".mp4": "video/mp4", ".woff": "font/woff", ".png": "image/png" };
createServer((req, res) => {
  let path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (path.endsWith("/")) path += "index.html";
  const file = join(root, path);
  let st;
  try { st = statSync(file); } catch { res.writeHead(404); return res.end(); }
  const type = types[extname(file)] || "application/octet-stream";
  const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range || "");
  if (range) {
    const start = range[1] ? +range[1] : 0;
    const end = range[2] ? +range[2] : st.size - 1;
    res.writeHead(206, { "Content-Type": type, "Content-Range": `bytes ${start}-${end}/${st.size}`, "Accept-Ranges": "bytes", "Content-Length": end - start + 1, "Cache-Control": "no-store" });
    return createReadStream(file, { start, end }).pipe(res);
  }
  res.writeHead(200, { "Content-Type": type, "Content-Length": st.size, "Accept-Ranges": "bytes", "Cache-Control": "no-store" });
  createReadStream(file).pipe(res);
}).listen(+port, "127.0.0.1");

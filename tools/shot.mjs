// Screenshot of the local preview after running some JS: node tools/shot.mjs <url> <out.png> [js] [wait ms]
import { spawn } from "node:child_process"; import { writeFileSync, mkdtempSync } from "node:fs"; import { tmpdir } from "node:os"; import { join } from "node:path";
const [url, out, js = "", waitMs = "3500"] = process.argv.slice(2); const PORT = 9800 + Math.floor(Math.random() * 100);
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", "--remote-debugging-port=" + PORT, "--user-data-dir=" + mkdtempSync(join(tmpdir(), "s")), "--hide-scrollbars", "--autoplay-policy=no-user-gesture-required", "--window-size=1440,900", "about:blank"], { stdio: "ignore" });
let w; for (let i = 0; i < 80 && !w; i++) { try { w = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find((t) => t.type === "page")?.webSocketDebuggerUrl; } catch {} await new Promise((r) => setTimeout(r, 100)); }
const ws = new WebSocket(w); await new Promise((r) => (ws.onopen = r)); let id = 0; const p = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && p.has(d.id)) { p.get(d.id)(d); p.delete(d.id); } };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; p.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url }); await new Promise((r) => setTimeout(r, 2000));
if (js) await send("Runtime.evaluate", { expression: js });
await new Promise((r) => setTimeout(r, +waitMs));
const r = await send("Page.captureScreenshot", { format: "png" }); writeFileSync(out, Buffer.from(r.result.data, "base64"));
ws.close(); chrome.kill(); process.exit(0);

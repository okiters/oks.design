// Live colour picker for trying the red and the background blue. Local only:
// open http://127.0.0.1:8765/?tune  (tools/ is never published)
(() => {
  if (!new URLSearchParams(location.search).has("tune")) return;
  const root = document.documentElement;
  const get = (v) => getComputedStyle(root).getPropertyValue(v).trim();
  const panel = document.createElement("div");
  panel.style.cssText = "position:fixed;right:16px;bottom:16px;z-index:100;background:#f6f1e8;border:3px solid #202327;border-radius:16px;box-shadow:6px 7px 0 #202327;padding:14px 16px;font:600 14px Switzer,sans-serif;color:#202327;display:grid;gap:10px;min-width:230px";
  const row = (label, v, ev) => {
    const r = document.createElement("label");
    r.style.cssText = "display:flex;align-items:center;gap:10px";
    const input = Object.assign(document.createElement("input"), { type: "color", value: get(v) });
    input.style.cssText = "width:44px;height:34px;border:0;padding:0;background:none;cursor:pointer";
    const code = document.createElement("code");
    code.style.cssText = "font:600 15px ui-monospace,monospace;user-select:all";
    code.textContent = input.value;
    input.addEventListener("input", () => {
      root.style.setProperty(v, input.value);
      code.textContent = input.value;
      if (ev) dispatchEvent(new Event(ev));
    });
    r.append(input, Object.assign(document.createElement("span"), { textContent: label, style: "flex:1" }), code);
    return r;
  };
  panel.append(row("Accent", "--accent", "accentchange"), row("Ground", "--ground"));
  const note = Object.assign(document.createElement("div"), { textContent: "Tell Claude the two codes." });
  note.style.cssText = "font-weight:500;font-size:12px;opacity:.6";
  panel.append(note);
  addEventListener("load", () => {
    document.body.append(panel);
    // show the red in use: turn a lid so the signal and dial light up
    document.querySelector('.lid[aria-label^="1"]')?.click();
  });
})();

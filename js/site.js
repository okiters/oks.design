/* oks.design: one device seen from the front. Four lids on axles, a split-flap
   board, a dot screen. Hover tips a lid, the first click turns it over and plays
   the project on the screen and board, a second click zooms into the project. */

document.documentElement.classList.add("js");

// The board is 17 letters wide: one row for the name, two for a one-line
// description, then one skill per row. url stays null until the project's website should be linked; the
// zoom then loops the logo instead of leaving the page. start: the second of the
// reel the screen begins at, past the pale openings.
const PROJECTS = [
  {
    id: "linpile", n: 1, col: 2, row: 1,
    name: "Linpile",
    about: "Learn words, grow a garden",
    skills: ["Product design", "Illustration"],
    bg: "#FAFAF8", ink: "#151515",
    video: "video/linpile.mp4",
    url: "https://linpile.com/",
  },
  {
    id: "wrapchat", n: 2, col: 3, row: 1,
    name: "WrapChat",
    about: "A mobile app that analyses chats",
    skills: ["UX writing", "AI prompt design"],
    bg: "#181F4E", ink: "#EDE8DC",
    video: "video/wrapchat.mp4", start: 8,
    url: "https://wrapchatapp.com/",
  },
  {
    id: "kitchen-guide", n: 3, col: 1, row: 2,
    name: "Kitchen Guide",
    about: "An allergy card for eating out",
    skills: ["Shopify store", "Design system"],
    bg: "#FFFFFF", ink: "#1C211C",
    video: "video/kitchen-guide.mp4", // the website's hero: the words, then the card
    url: null,
  },
  {
    id: "bramblewick", n: 4, col: 3, row: 2,
    name: "Bramblewick",
    about: "Role-playing game with an AI Keeper",
    skills: ["Game design", "Worldbuilding"],
    bg: "#241810", ink: "#E8DBBD",
    emblem: "img/logos/bramblewick-color.webp",
    video: "video/bramblewick.mp4", start: 12,
    url: "https://www.bramblewick.world/",
  },
];

const BLANKS = [
  { col: 1, row: 1, color: "orange" },
  { col: 2, row: 2, color: "blue" },
];

// whole boards, row by row: name, then two groups of two
const BOARDS = {
  idle: ["Welcome", "to my", "portfolio", "Pick a project", "to examine."],
  about: ["I design and", "build my own", "digital products,", "and yours if you", "want me to."],
  contact: ["Say hello", "There are", "several ways", "to reach me.", ""],
};
const EMAIL = "hello@oks.design";

// where the dial points for each project, and when none is open
const DIAL = { 1: -45, 2: -15, 3: 15, 4: 45, none: -80 };

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- split-flap board ---------- */

const CHARS = " ABCDEFGHIJKLMNOPQRSTUVWXYZÇĞİÖŞÜ0123456789.,:'-+&@/!?";
const COLS = 17;

class Flap {
  constructor(parent) {
    this.el = document.createElement("span");
    this.el.className = "flap";
    this.parts = ["flap-half is-up", "flap-half is-down", "flap-leaf is-up", "flap-leaf is-down"].map((name) => {
      const part = document.createElement("span");
      part.className = name;
      part.append(document.createElement("b"));
      this.el.append(part);
      return part.firstChild;
    });
    parent.append(this.el);
    this.cur = " ";
    this.target = " ";
    this.running = false;
  }

  paint(top, bottom, leafTop, leafBottom) {
    const [hu, hd, lu, ld] = this.parts;
    hu.textContent = top; hd.textContent = bottom; lu.textContent = leafTop; ld.textContent = leafBottom;
  }

  set(ch, delay) {
    this.target = CHARS.includes(ch) ? ch : " ";
    if (reduced) {
      this.cur = this.target;
      this.paint(this.cur, this.cur, this.cur, this.cur);
      return;
    }
    if (!this.running) this.run(delay);
  }

  async run(delay) {
    this.running = true;
    await wait(delay);
    while (this.cur !== this.target) {
      const at = CHARS.indexOf(this.cur);
      const to = CHARS.indexOf(this.target);
      const ahead = (to - at + CHARS.length) % CHARS.length;
      // a real board runs through every letter; past a dozen it only blurs, so skip ahead
      const next = ahead > 11 ? CHARS[(to - 9 + CHARS.length) % CHARS.length] : CHARS[(at + 1) % CHARS.length];
      await this.flip(next, next === this.target ? 170 : 52);
    }
    this.running = false;
  }

  async flip(next, ms) {
    const [, , lu, ld] = this.parts;
    this.paint(next, this.cur, this.cur, next);
    lu.parentNode.animate([{ transform: "rotateX(0deg)" }, { transform: "rotateX(-90deg)" }],
      { duration: ms / 2, easing: "ease-in", fill: "forwards" });
    const fall = ld.parentNode.animate([{ transform: "rotateX(90deg)" }, { transform: "rotateX(0deg)" }],
      { duration: ms / 2, delay: ms / 2, easing: ms > 100 ? "cubic-bezier(.3,1.7,.6,1)" : "ease-out", fill: "backwards" });
    await fall.finished.catch(() => {});
    this.cur = next;
    this.paint(next, next, next, next);
    lu.parentNode.getAnimations().forEach((a) => a.cancel());
  }
}

class Board {
  constructor(el) {
    this.el = el;
    this.rows = [];
    // five rows: the name, then two groups of two; a little air before rows 1 and 3
    [false, true, false, true, false].forEach((gap) => {
      const row = document.createElement("span");
      row.className = "board-row" + (gap ? " gap-before" : "");
      el.append(row);
      this.rows.push(Array.from({ length: COLS }, () => new Flap(row)));
    });
  }

  show(lines, isProject) {
    this.el.classList.toggle("project", isProject);
    lines.forEach((line, r) => {
      const text = line.toLocaleUpperCase("en").padEnd(COLS).slice(0, COLS);
      [...text].forEach((ch, c) => this.rows[r][c].set(ch, c * 28 + r * 70 + Math.random() * 60));
    });
  }
}

// words onto board rows, never splitting a word
function wrap(text, rows = 2) {
  const out = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (line && (line + " " + word).length > COLS) { out.push(line); line = word; }
    else line = line ? line + " " + word : word;
  }
  if (line) out.push(line);
  if (out.length > rows) console.warn("too long for the board:", text);
  while (out.length < rows) out.push("");
  return out.slice(0, rows);
}

/* ---------- dot screen ---------- */

// The reels play at full sharpness behind a fine mesh of round holes, so text in
// them stays readable. Drawings with no reel (the hand, @, Kitchen Guide) light
// whole dots of the same mesh. They are drawn in a 54 x 96 space, scaled up.
const DOTS_X = 101;
const DOTS_Y = 180;
const DRAW_X = 54;
const DRAW_Y = 96;
const OFF = "#25292e";
// the screen draws in the page's accent, read from --accent so the two never drift apart
let GLOW = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#3a72a0";
addEventListener("accentchange", () => { GLOW = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim(); });

class Screen {
  constructor(el) {
    this.el = el;
    this.canvas = el.querySelector("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.video = el.querySelector("video");
    this.buf = Object.assign(document.createElement("canvas"), { width: DOTS_X, height: DOTS_Y });
    this.bx = this.buf.getContext("2d");
    this.source = null;
    this.noiseUntil = 0;
    this.last = 0;
    new ResizeObserver(() => this.resize()).observe(el);
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = Math.round(this.el.clientWidth * dpr);
    const h = Math.round(this.el.clientHeight * dpr);
    if (!w || !h) return;
    this.canvas.width = w;
    this.canvas.height = h;
    // the mask: glass everywhere except round holes, one per dot
    this.mask = Object.assign(document.createElement("canvas"), { width: w, height: h });
    const m = this.mask.getContext("2d");
    m.fillStyle = "#121315";
    m.fillRect(0, 0, w, h);
    m.globalCompositeOperation = "destination-out";
    const px = w / DOTS_X;
    const py = h / DOTS_Y;
    const r = Math.min(px, py) * 0.46;
    m.beginPath();
    for (let y = 0; y < DOTS_Y; y++) {
      for (let x = 0; x < DOTS_X; x++) {
        m.moveTo((x + 0.5) * px + r, (y + 0.5) * py);
        m.arc((x + 0.5) * px, (y + 0.5) * py, r, 0, Math.PI * 2);
      }
    }
    m.fill();
  }

  show(source) {
    if (this.source === source) return;
    this.source = source;
    this.noiseUntil = performance.now() + (reduced ? 0 : 280);
    const v = this.video;
    if (source.video) {
      if (!v.src.endsWith(source.video)) { v.src = source.video; v.load(); }
      v.currentTime = source.start || 0;
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }

  // the low-resolution picture: static between sources, or a drawing
  fill(t) {
    const b = this.bx;
    b.fillStyle = "#000";
    b.fillRect(0, 0, DOTS_X, DOTS_Y);
    if (t < this.noiseUntil) {
      const img = b.createImageData(DOTS_X, DOTS_Y);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random() < 0.4 ? Math.random() * 200 : 0;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
      b.putImageData(img, 0, 0);
      return true;
    }
    const s = this.source;
    if (!s || s.video) return false;
    b.save();
    b.scale(DOTS_X / DRAW_X, DOTS_Y / DRAW_Y);
    s.draw(b, t);
    b.restore();
    return true;
  }

  loop(t) {
    requestAnimationFrame(this.loop);
    if (document.hidden || !this.mask || t - this.last < 33) return;
    this.last = t;
    const { ctx, canvas } = this;
    const { width: w, height: h } = canvas;
    ctx.fillStyle = OFF;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";
    if (this.fill(t)) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this.buf, 0, 0, w, h);
    } else if (this.video.readyState >= 2) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.filter = "saturate(1.1) contrast(1.05)";
      ctx.drawImage(this.video, 0, 0, w, h);
      ctx.filter = "none";
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(this.mask, 0, 0);
  }
}

/* what the screen draws when there is no reel, in the accent colour, like an LED */

let HAND = null; // Path2D list, from img/logos/oks-hand.svg
let KITCHEN = null; // { check, glass }

async function loadShapes() {
  const hand = await (await fetch("img/logos/oks-hand.svg")).text();
  HAND = [...hand.matchAll(/ d="([^"]+)"/g)].map((m) => new Path2D(m[1]));
  const kg = await (await fetch("img/logos/kitchen-guide-mono.svg")).text();
  const points = kg.match(/points="([^"]+)"/)[1].trim().split(/\s+/);
  let d = "";
  for (let i = 0; i < points.length; i += 2) d += (i ? "L" : "M") + points[i] + " " + points[i + 1];
  KITCHEN = { check: new Path2D(d + "Z"), glass: new Path2D(kg.match(/ d="([^"]+)"/)[1]) };
}

const SCREENS = {
  // the hand waves hello in short bursts
  idle: {
    draw(b, t) {
      if (!HAND) return;
      const cycle = (t % 3200) / 1600;
      const angle = cycle < 1 ? Math.sin(cycle * Math.PI * 3) * 0.2 * Math.sin(cycle * Math.PI) : 0;
      b.fillStyle = GLOW;
      b.translate(27, 62);
      b.rotate(angle);
      b.scale(0.094, 0.094);
      b.translate(-300, -420);
      HAND.forEach((p) => b.fill(p));
    },
  },
  // the hand, still, until a new clip is filmed (tools/about-video.py makes one)
  about: {
    draw(b) {
      if (!HAND) return;
      b.fillStyle = GLOW;
      b.translate(27, 48);
      b.scale(0.098, 0.098);
      b.translate(-290, -220);
      HAND.forEach((p) => b.fill(p));
    },
  },
  contact: {
    draw(b, t) {
      b.fillStyle = GLOW;
      b.globalAlpha = 0.75 + 0.25 * Math.sin(t / 380);
      b.font = "700 52px Switzer, Arial, sans-serif";
      b.textAlign = "center";
      b.textBaseline = "middle";
      b.fillText("@", 27, 46);
    },
  },
  // the magnifier circles over the check, searching
  "kitchen-guide": {
    draw(b, t) {
      if (!KITCHEN) return;
      const a = t / 420;
      b.fillStyle = GLOW;
      b.translate(27, 48);
      b.scale(0.62, 0.62);
      b.translate(-35.4, -35.4);
      b.fill(KITCHEN.check);
      b.translate(Math.cos(a) * 4, Math.sin(a) * 4);
      b.fill(KITCHEN.glass);
    },
  },
};

/* ---------- the device ---------- */

const deviceEl = document.querySelector(".device");
const lidsEl = document.querySelector(".lids");
const boardEl = document.querySelector(".board");
const said = document.querySelector(".said");
const keys = [...document.querySelectorAll(".key")];
const dial = document.querySelector(".dial");
const ticks = [...document.querySelectorAll(".dial-tick")];
const board = new Board(boardEl);
const screen = new Screen(document.querySelector(".screen-glass"));
const lids = {};
let open = null; // id of the turned lid
let mode = null;

/* hand-drawn ink: every outline is a slightly uneven path, drawn again when the size changes */

const NS = "http://www.w3.org/2000/svg";
const unitProbe = Object.assign(document.createElement("div"), { style: "position:absolute;visibility:hidden;width:calc(1000 * var(--u))" });
document.body.append(unitProbe);
const unit = () => unitProbe.offsetWidth / 1000;

// smooth, closed wobble: a few slow waves around the outline
const wave = (t, seed) =>
  Math.sin(2 * Math.PI * (3 * t + seed)) * 0.5 + Math.sin(2 * Math.PI * (7 * t + seed * 1.7)) * 0.3 + Math.sin(2 * Math.PI * (13 * t + seed * 2.3)) * 0.2;

// points around a rounded rectangle, each pushed in or out along its normal
function wobblyShape(w, h, r, amp, seed) {
  r = Math.min(r, w / 2, h / 2);
  const pts = [];
  const sides = [
    [r, 0, w - r, 0, 0, -1], [w, r, w, h - r, 1, 0], [w - r, h, r, h, 0, 1], [0, h - r, 0, r, -1, 0],
  ];
  const corners = [[w - r, r, -90], [w - r, h - r, 0], [r, h - r, 90], [r, r, 180]];
  const step = Math.max(4, amp * 5);
  sides.forEach(([x0, y0, x1, y1, nx, ny], i) => {
    const len = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.max(1, Math.round(len / step));
    for (let k = 0; k < n; k++) pts.push([x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n, nx, ny]);
    const [cx, cy, a0] = corners[i];
    const m = Math.max(2, Math.round((Math.PI * r / 2) / step));
    for (let k = 0; k < m; k++) {
      const a = (a0 + 90 * k / m) * Math.PI / 180;
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, Math.cos(a), Math.sin(a)]);
    }
  });
  const moved = pts.map(([x, y, nx, ny], i) => {
    const d = amp * wave(i / pts.length, seed);
    return [x + nx * d, y + ny * d];
  });
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let d = `M${mid(moved.at(-1), moved[0]).map((v) => v.toFixed(1))}`;
  moved.forEach((p, i) => {
    const m = mid(p, moved[(i + 1) % moved.length]);
    d += `Q${p[0].toFixed(1)} ${p[1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}`;
  });
  return d + "Z";
}

// a straight line, drawn by hand
function wobblyLine(x0, y0, x1, y1, amp, seed) {
  const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 40));
  let d = `M${x0.toFixed(1)} ${y0.toFixed(1)}`;
  const nx = -(y1 - y0), ny = x1 - x0, l = Math.hypot(nx, ny) || 1;
  for (let k = 1; k <= n; k++) {
    const t = k / n;
    const off = k === n ? 0 : amp * wave(t, seed);
    d += `L${(x0 + (x1 - x0) * t + nx / l * off).toFixed(1)} ${(y0 + (y1 - y0) * t + ny / l * off).toFixed(1)}`;
  }
  return d;
}

const inks = [];
let seedCount = 0;
// outline an element (or, with fill, draw its solid shadow into another element)
function ink(el, { r = 0, stroke = 4, amp = 1.2, fill = false, into = el, draw = null, color = null } = {}) {
  const svg = document.createElementNS(NS, "svg");
  svg.classList.add("ink");
  if (fill) svg.classList.add("fill");
  svg.append(document.createElementNS(NS, "path"));
  into.append(svg);
  inks.push({ el, svg, r, stroke, amp, draw, color, seed: (seedCount++ * 0.37) % 1 });
}
function drawInks() {
  const u = unit();
  for (const k of inks) {
    const w = k.el.offsetWidth, h = k.el.offsetHeight;
    if (!w || !h) continue;
    k.svg.setAttribute("width", w);
    k.svg.setAttribute("height", h);
    const path = k.svg.firstChild;
    path.setAttribute("d", k.draw ? k.draw(w, h, u, k.seed) : wobblyShape(w, h, k.r * u, k.amp * u, k.seed));
    path.style.strokeWidth = k.stroke * u + "px";
    if (k.color) path.style.stroke = k.color;
  }
}

// a lid: its shadow, then a body that turns, built from stacked slices with a face each side
const SLICES = 7;
function lidInner(front, back) {
  let slices = "";
  for (let i = 0; i < SLICES; i++) {
    const end = i === 0 || i === SLICES - 1 ? " end" : "";
    slices += `<span class="lid-slice${end}" style="--z:calc(var(--t) * ${(i / (SLICES - 1) - 0.5).toFixed(3)})"></span>`;
  }
  return `<span class="lid-shadow"></span><span class="lid-body">${slices}` +
    `<span class="lid-front"><span class="lid-shade"></span>${front}</span>` +
    `<span class="lid-back"><span class="lid-shade"></span><span class="lid-art">${back}</span></span></span><span class="lid-marks"></span>`;
}

function inkLid(el) {
  ink(el.querySelector(".lid-front"), { r: 20 });
  ink(el.querySelector(".lid-back"), { r: 20 });
  // two short strokes either side of the top corners
  ink(el.querySelector(".lid-marks"), {
    stroke: 3,
    draw: (w, h, u) => {
      let d = "";
      for (const [x, dir] of [[10 * u, -1], [w - 10 * u, 1]]) {
        for (const [y, l] of [[h * 0.55, 14 * u], [h * 0.95, 20 * u]]) d += `M${x} ${y}l${dir * l * 0.35} ${-l}`;
      }
      return d;
    },
  });
}

for (const row of [1, 2]) {
  for (const cls of ["axle", "bearing left", "bearing right"]) {
    const part = document.createElement("span");
    part.className = cls;
    part.style.setProperty("--row", row);
    lidsEl.append(part);
    if (cls === "axle") ink(part, { r: 6, stroke: 3.5, amp: 0.6 });
  }
}

for (const b of BLANKS) {
  const el = document.createElement("span");
  el.className = "lid blank";
  el.style.cssText = `--col:${b.col};--row:${b.row}`;
  el.dataset.row = b.row;
  el.dataset.col = b.col;
  el.innerHTML = lidInner("", "");
  inkLid(el);
  el.addEventListener("click", () => visit(el));
  el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); visit(el); } });
  lidsEl.append(el);
}

for (const p of PROJECTS) {
  const el = document.createElement("button");
  el.type = "button";
  el.className = "lid project";
  el.style.cssText = `--col:${p.col};--row:${p.row}`;
  el.dataset.row = p.row;
  el.dataset.col = p.col;
  el.dataset.cursor = "open";
  el.setAttribute("aria-label", `${p.n}: ${p.name}`);
  el.innerHTML = lidInner(
    `<span class="lid-num">${p.n}</span>`,
    `<img src="img/logos/${p.id}-mono.svg" alt="">`,
  );
  inkLid(el);
  el.addEventListener("click", () => {
    if (mode === "contact" || mode === "about") visit(el);
    else if (open === p.id) enter(p);
    else select(p);
  });
  lids[p.id] = el;
  lidsEl.append(el);
}

/* ---------- contact and about: every lid turns over to something else ---------- */

// given to the lids in reading order
const SOCIALS = [
  { id: "instagram", label: "Instagram", url: "https://www.instagram.com/by.kiter" },
  { id: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/in/ozgekiter" },
  { id: "github", label: "GitHub", url: "https://github.com/okiters" },
  { id: "discord", label: "Bramblewick on Discord", url: "https://discord.gg/aAEGYv6eC6" },
  { id: "behance", label: "Behance", url: "https://www.behance.net/zgekter" },
  { id: "email", label: "Email hello@oks.design", url: "mailto:hello@oks.design" },
];

// about: a click shows the lid's five rows on the board. Rows stay within 17 letters.
const FACTS = [
  { id: "map", label: "Where I am", lines: ["BASED IN", "IZMIR, TÜRKİYE", "BERLIN, GERMANY", "", ""] },
  { id: "disciplines", label: "What I do", lines: ["WHAT I DO", "BRAND IDENTITY", "APP DESIGN", "WEB DESIGN", "CODE & MOTION"] },
  { id: "tools", label: "Tools", lines: ["TOOLS", "FIGMA/PHOTOSHOP", "ILLUSTRATOR/XCODE", "VS CODE/CLAUDE", "SUPABASE/VERCEL"] },
  { id: "education", label: "Education", lines: ["EDUCATION", "M.ARCH, UPC", "BARCELONA 2022-23", "B.ARCH, IYTE", "IZMIR 2016-21"] },
  { id: "languages", label: "Languages", lines: ["LANGUAGES", "TURKISH   NATIVE", "ENGLISH   C1", "GERMAN    A2", "AND LEARNING"] },
  { id: "availability", label: "Availability", signal: true,
    lines: ["AVAILABLE", "FOR SMALL,", "FOCUSED PROJECTS.", "TELL ME YOURS.", "HELLO@OKS.DESIGN"] },
];

const BACKS = { contact: SOCIALS, about: FACTS };

const lidOrder = [...lidsEl.querySelectorAll(".lid")]
  .sort((a, b) => a.dataset.row - b.dataset.row || a.dataset.col - b.dataset.col);
for (const el of lidOrder) {
  el.dataset.art = el.querySelector(".lid-art").innerHTML;
  el.dataset.label = el.getAttribute("aria-label") || "";
  el.dataset.cursorIdle = el.dataset.cursor || "";
}
let backsShown = null; // "contact", "about" or null
let backsToken = 0;
let chosen = null;

function choose(el) {
  chosen?.classList.remove("chosen");
  const same = chosen === el;
  chosen = same ? null : el;
  chosen?.classList.add("chosen");
  const item = chosen?.item;
  board.show(item ? item.lines : BOARDS.about, false);
  deviceEl.classList.toggle("playing", !!item?.signal);
  said.textContent = (item ? item.lines : BOARDS.about).filter(Boolean).join(" ");
}

function visit(el) {
  if (!el.item) return;
  if (mode === "about") return choose(el);
  if (mode !== "contact") return;
  if (el.item.url.startsWith("mailto:")) location.href = el.item.url;
  else window.open(el.item.url, "_blank", "noopener");
}

function turnTo(el, item, i, token) {
  const art = el.querySelector(".lid-art");
  art.innerHTML = item ? `<img class="icon" src="img/icons/${item.id}.svg" alt="">` : "";
  el.item = item || null;
  el.classList.remove("leaving");
  el.classList.add("social");
  el.classList.toggle("linked", !!item);
  if (item) {
    el.setAttribute("aria-label", item.label);
    el.setAttribute("role", item.url ? "link" : "button");
    el.tabIndex = 0;
    el.dataset.cursor = item.url ? "visit" : "show";
    el.removeAttribute("aria-hidden");
  } else {
    el.tabIndex = -1;
    el.removeAttribute("data-cursor");
    el.setAttribute("aria-hidden", "true");
  }
}

function turnBackLid(el, token, then) {
  const art = el.querySelector(".lid-art");
  el.item = null;
  el.classList.remove("social", "linked", "chosen");
  el.classList.add("leaving");
  if (el.dataset.label) el.setAttribute("aria-label", el.dataset.label);
  else el.removeAttribute("aria-label");
  el.removeAttribute("role");
  el.removeAttribute("tabindex");
  el.removeAttribute("aria-hidden");
  if (el.dataset.cursorIdle) el.dataset.cursor = el.dataset.cursorIdle;
  else el.removeAttribute("data-cursor");
  // the back is out of sight again before it gets its logo back
  setTimeout(() => {
    el.classList.remove("leaving");
    if (token !== backsToken) return;
    art.innerHTML = el.dataset.art;
    then?.();
  }, 900);
}

function showBacks(name) {
  if (name === backsShown) return;
  const was = backsShown;
  backsShown = name;
  chosen = null;
  const token = ++backsToken;
  const list = BACKS[name];
  lidOrder.forEach((el, i) => {
    const wait = i * 90 + (list && el.classList.contains("closing") ? 750 : 0);
    setTimeout(() => {
      if (token !== backsToken) return;
      if (!list) turnBackLid(el, token);
      // from one set to the other: turn back, then over again with the new icon
      else if (was) turnBackLid(el, token, () => turnTo(el, list[i], i, token));
      else turnTo(el, list[i], i, token);
      refreshCursor();
    }, wait);
  });
}

function point(n) {
  dial.style.setProperty("--angle", `${DIAL[n ?? "none"]}deg`);
  ticks.forEach((t, i) => t.classList.toggle("on", i + 1 === n));
}

function turnBack() {
  if (!open) return;
  const el = lids[open];
  el.classList.remove("open");
  el.classList.add("closing");
  el.dataset.cursor = "open";
  el.setAttribute("aria-pressed", "false");
  setTimeout(() => el.classList.remove("closing"), 750);
  open = null;
}

function nudgeRow(row) {
  lidsEl.querySelectorAll(`.lid.blank[data-row="${row}"]`).forEach((el) => {
    el.classList.remove("nudge");
    void el.offsetWidth;
    el.classList.add("nudge");
  });
}

// once a lid is open, fetch its website ahead, so the second click lands quickly
const prefetched = new Set();
function prefetch(url) {
  if (!url || prefetched.has(url)) return;
  prefetched.add(url);
  document.head.append(Object.assign(document.createElement("link"), { rel: "prefetch", href: url }));
}

function select(p) {
  turnBack();
  prefetch(p.url);
  open = p.id;
  const el = lids[p.id];
  el.classList.add("open");
  el.dataset.cursor = "enter";
  el.setAttribute("aria-pressed", "true");
  nudgeRow(p.row);
  setMode("project");
  point(p.n);
  board.show([p.name, ...wrap(p.about), ...p.skills], true);
  screen.show(p.video ? { video: p.video, start: p.start } : SCREENS[p.id]);
  deviceEl.classList.add("playing");
  said.textContent = `${p.name}. ${p.about}. ${p.skills.join(", ")}.`;
  refreshCursor();
}

function setMode(m, lines) {
  mode = m;
  keys.forEach((k) => k.classList.toggle("on", k.dataset.mode === m));
  // on the contact board the whole board is the email link
  if (m === "contact") {
    boardEl.href = `mailto:${EMAIL}`;
    boardEl.dataset.cursor = "write";
    boardEl.setAttribute("aria-label", `Email ${EMAIL}`);
    boardEl.removeAttribute("aria-hidden");
  } else {
    boardEl.removeAttribute("href");
    boardEl.removeAttribute("data-cursor");
    boardEl.removeAttribute("aria-label");
    boardEl.setAttribute("aria-hidden", "true");
  }
  if (m === "project") return;
  turnBack();
  showBacks(BACKS[m] ? m : null);
  point(null);
  deviceEl.classList.remove("playing");
  board.show(lines, false);
  screen.show(SCREENS[m]);
  said.textContent = lines.filter(Boolean).join(" ");
}

keys.forEach((k) => k.addEventListener("click", () => {
  const m = mode === k.dataset.mode ? "idle" : k.dataset.mode;
  setMode(m, BOARDS[m]);
}));

document.querySelector(".badge").addEventListener("click", (e) => {
  e.preventDefault();
  setMode("idle", BOARDS.idle);
});

/* ---------- zooming into a project ---------- */

const portal = document.querySelector(".portal");
const portalMark = portal.querySelector(".portal-mark");
const portalExit = portal.querySelector(".portal-exit");
const ZOOM = { duration: reduced ? 1 : 900, easing: "cubic-bezier(0.7, 0, 0.2, 1)", fill: "forwards" };
const logos = {};
let inside = null;

// colour logos are inline SVG so their parts can move; Bramblewick's emblem is a picture
async function colorLogo(p) {
  if (p.emblem) return `<img src="${p.emblem}" alt="">`;
  logos[p.id] ??= fetch(`img/logos/${p.id}-color.svg`).then((r) => r.text());
  return logos[p.id];
}

function rects(p) {
  const face = lids[p.id].querySelector(".lid-back");
  const r = face.getBoundingClientRect();
  const w = innerWidth;
  const h = innerHeight;
  const size = Math.min(w, h) * 0.3;
  const k = 0.6; // the logo's share of the lid
  return {
    from: { left: r.left, top: r.top, width: r.width, height: r.height, borderRadius: getComputedStyle(face).borderRadius },
    to: { left: 0, top: 0, width: w, height: h, borderRadius: "0px" },
    markFrom: { left: r.width * (1 - k) / 2, top: r.height * (1 - k) / 2, width: r.width * k, height: r.height * k },
    markTo: { left: (w - size) / 2, top: (h - size) / 2, width: size, height: size },
    center: [r.left + r.width / 2, r.top + r.height / 2],
  };
}

const px = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === "number" ? v + "px" : v]));

// the monochrome logo from the lid turns into the colour logo while the background changes
function crossfade(back) {
  const fade = [{ opacity: 1 }, { opacity: 1, offset: 0.2 }, { opacity: 0, offset: 0.6 }, { opacity: 0 }];
  const show = [{ opacity: 0 }, { opacity: 0, offset: 0.3 }, { opacity: 1, offset: 0.7 }, { opacity: 1 }];
  const timing = { ...ZOOM, easing: "linear", direction: back ? "reverse" : "normal" };
  portalMark.querySelector(".portal-mono").animate(fade, timing);
  portalMark.querySelector(".portal-color").animate(show, timing);
}

async function enter(p) {
  if (inside) return;
  inside = p;
  hideCursor();
  const logo = await colorLogo(p);
  const r = rects(p);
  portal.className = `portal loop-${p.id}`;
  portal.style.setProperty("--portal-ink", p.ink);
  portalMark.innerHTML = `<div class="portal-mono"><img src="img/logos/${p.id}-mono.svg" alt=""></div><div class="portal-color">${logo}</div>`;
  portal.hidden = false;
  // the page may be scrolled: the origin is measured from the top of the page
  document.querySelector(".world").style.transformOrigin = `${r.center[0]}px ${r.center[1] + scrollY}px`;
  document.body.classList.add("entering");
  portal.animate([{ ...px(r.from), background: "#f6f1e8" }, { ...px(r.to), background: p.bg }], ZOOM);
  crossfade(false);
  await portalMark.animate([px(r.markFrom), px(r.markTo)], ZOOM).finished;
  portal.classList.add("arrived");
  portalExit.focus({ preventScroll: true });
  // the logo keeps looping on the project's colour until the website takes over
  if (p.url) setTimeout(() => (location.href = p.url), 700);
}

async function leave() {
  if (!inside) return;
  const p = inside;
  const r = rects(p);
  portal.classList.remove("arrived");
  document.body.classList.remove("entering");
  portal.animate([{ ...px(r.to), background: p.bg }, { ...px(r.from), background: "#f6f1e8" }], ZOOM);
  crossfade(true);
  await portalMark.animate([px(r.markTo), px(r.markFrom)], ZOOM).finished;
  portal.hidden = true;
  portal.getAnimations({ subtree: true }).forEach((a) => a.cancel());
  portalMark.innerHTML = "";
  inside = null;
  lids[p.id].focus({ preventScroll: true });
}

portalExit.addEventListener("click", leave);
addEventListener("keydown", (e) => { if (e.key === "Escape") inside ? leave() : setMode("idle", BOARDS.idle); });
// coming back with the browser's back button after a project website
addEventListener("pageshow", (e) => { if (e.persisted && inside) leave(); });

/* ---------- cursor: says what a click will do ---------- */

const cursor = document.querySelector(".cursor");
const fine = matchMedia("(pointer: fine)").matches;
let cx = -100, cy = -100, tx = -100, ty = -100, over = null;

function refreshCursor() {
  if (!fine) return;
  const label = over?.dataset.cursor;
  cursor.classList.toggle("show", !!label && !inside);
  cursor.classList.toggle("enter", label === "enter" || label === "visit" || label === "show");
  cursor.classList.toggle("write", label === "write");
  if (label) cursor.firstChild.textContent = label;
}
function hideCursor() { cursor.classList.remove("show"); }

if (fine) {
  addEventListener("pointermove", (e) => {
    tx = e.clientX; ty = e.clientY;
    const el = e.target.closest?.("[data-cursor]") || null;
    if (el !== over) { over = el; refreshCursor(); }
  });
  document.addEventListener("pointerleave", () => { over = null; refreshCursor(); });
  (function follow() {
    cx += (tx - cx) * 0.3;
    cy += (ty - cy) * 0.3;
    cursor.style.setProperty("--x", cx + "px");
    cursor.style.setProperty("--y", cy + "px");
    requestAnimationFrame(follow);
  })();
}

/* ---------- ink the device ---------- */

ink(deviceEl, { r: 40, fill: true, amp: 1.8, into: document.querySelector(".device-shadow") });
ink(deviceEl, { r: 40, stroke: 5, amp: 1.8 });
ink(lidsEl, { r: 22 });
ink(boardEl, { r: 22 });
ink(document.querySelector(".screen"), { r: 22 });
ink(document.querySelector(".grille"), { r: 16 });
ink(document.querySelector(".dial-knob"), { r: 38, amp: 0.8 });
keys.forEach((k) => ink(k, { r: 19, stroke: 3.5, amp: 0.8 }));
// the printed rule in the top strip
ink(document.querySelector(".strip-rule"), {
  stroke: 3,
  draw: (w, h, u, seed) => {
    let d = wobblyLine(0, h / 2, w, h / 2, 0.8 * u, seed);
    for (let x = 0; x <= w + 0.5; x += 24 * u) d += `M${x.toFixed(1)} ${(h / 2 - 7 * u).toFixed(1)}V${(h / 2 + 7 * u).toFixed(1)}`;
    return d;
  },
});
// printed scales either side of the screen
for (const s of document.querySelectorAll(".scale")) {
  const left = s.classList.contains("left");
  ink(s, {
    stroke: 2,
    color: "rgb(246 241 232 / 0.5)",
    draw: (w, h, u) => {
      let d = "";
      for (let i = 0; i * 13 * u <= h; i++) {
        const y = (i * 13 * u).toFixed(1), l = (i % 4 === 0 ? 12 : 7) * u;
        d += left ? `M0 ${y}h${l}` : `M${w} ${y}h${-l}`;
      }
      return d;
    },
  });
}
// the base's outline: up the left side, over the rounded top, down the right side
// and on past the bottom of the page, so it looks cut off by the page edge
ink(document.querySelector(".base"), {
  draw: (w, h, u, seed) => {
    const r = 26 * u, b = h + 20 * u;
    const go = (x0, y0, x1, y1) => wobblyLine(x0, y0, x1, y1, 0.9 * u, seed).replace(/^M[^L]*/, "");
    return `M0 ${b}` + go(0, b, 0, r) + `Q0 0 ${r} 0` + go(r, 0, w - r, 0) + `Q${w} 0 ${w} ${r}` + go(w, r, w, b);
  },
});
new ResizeObserver(drawInks).observe(deviceEl);

/* ---------- start ---------- */

point(null);
document.fonts.ready.then(drawInks);
loadShapes();
document.fonts.ready.then(() => setMode("idle", BOARDS.idle));

// the local colour picker (tools/tune.js, never published): add ?tune to the address
if (new URLSearchParams(location.search).has("tune")) {
  document.head.append(Object.assign(document.createElement("script"), { src: "tools/tune.js" }));
}

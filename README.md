# oks.design

The portfolio is one device drawn straight from the front: a front elevation, as
in the sketch. It is drawn in a print-illustration style, chosen from three
sketches (flat, pixel, print; deleted after the choice, 13 Oct 2026).
- Flat fills only, with no gradients.
- Hand-drawn ink outlines: `ink()` in js/site.js traces each one as a slightly
  uneven path and redraws it when the size changes.
- Solid ink shadows down and to the right, halftone dots for shade.
- Blue grid paper and a light paper grain behind and over everything.
- Lid numbers and the "OKS design" wordmark in the top strip are set in Londrina
  Solid (OKS 900, design 400), a free Google font saved in `fonts/`. The
  rest of the type is Switzer.

- The top strip holds the hand logo, a printed rule and two keys (contact, about).
- The lids bay holds four light grey project lids with orange numbers, and two plain
  blank lids, on two axles with no vertical links.
  Hover tips a lid back as a hint, with motion marks beside it. The first click
  turns it over to the monochrome logo, plays the reel on the dot screen, flips
  the board and swings the dial to its number. A second click zooms into the project: the lid grows to the website's
  colour and the colour logo loops.
- The board is split-flap, 17 letters wide with no labels: the name, two rows for
  a one-line description, then two skills, one per row. On contact the whole board is the mailto link.
- About turns every lid over to six icons from `FACTS` in js/site.js: where I'm
  based, what I do, tools, education, languages and availability. A click shows
  that lid's five rows on the board, and Availability also lights the SIGNAL. The
  about screen shows the still hand until a new clip is filmed (`tools/about-video.py`).
- Contact also turns every lid over in a wave. Their backs carry the socials from
  `SOCIALS` in js/site.js, in reading order, and a lid with a `url` opens it.
  Pressing contact again turns them back to the numbers. The icons are in `img/icons/`.
- Under the device sits its base, the same width. The device fills the first screen
  (`.fold`), and the base waits just below it, so it shows after a short scroll.
  Its top corners are rounded and it runs into the bottom of the page. On
  it: OKS design · Özge Kıter Sterl · Türkiye ● Germany, © 2026, and the links to
  `imprint.html` and `privacy.html` (styled by `css/page.css`). Nothing on the site
  is underlined: links are full ink or bold and turn orange on hover.
- The screen is a mesh of 101 × 180 dots. The reels play at full sharpness behind
  it, so their text stays readable.
  The drawings with no reel light whole dots. The controls column holds the dial,
  a grille and the signal light. On phones the device stands upright and the lids sit at the bottom.

## Preview

    node tools/serve.mjs

then open http://127.0.0.1:8765. Use this server and not `python3 -m http.server`,
because the reels need byte ranges to seek and loop.

## Publish

    ./deploy.sh

The code is on GitHub at okiters/oks.design. The Switzer font files are not in the
repository, because Fontshare's license lets you use them but not pass them on. A
clone shows Helvetica until they are put back in `fonts/` from fontshare.com.

puts the folder on Vercel (project `oks-design`, team okiters-projects, not
connected to git) as the live version. `.vercelignore` keeps `tools/` and
this README off the internet. `vercel.json` serves `/imprint` and
`/privacy` without `.html` and caches fonts and reels for a year.

oks.design and www.oks.design (308 to the apex) are on the project. DNS is at
Cloudflare since 13 Oct 2026: A @ → 216.198.79.1 and 64.29.17.1, CNAME www →
1bae090b0e27ac7c.vercel-dns-017.com, two `_vercel` TXT records that prove the domain
is ours, and the GoDaddy mail records (MX, SPF, DMARC, `email`, autodiscover).
Leave the mail records alone: hello@ and support@oks.design depend on them.

## Where things are

- `js/site.js` holds the projects (`PROJECTS`): numbers, board text, colours, reel,
  start second and `url`. It also holds the boards for idle, about and contact.
  Words are never split, and the console warns when a text is too long.
- `css/site.css` holds the colours and the sizes in design units (`--u`; the
  device is 1240 × 696 of them).
- `tools/build-assets.py` rebuilds `img/logos/` (monochrome for the blocks,
  colour for the zoom), `fonts/` (Switzer) and `video/` (the reels at 360 × 640).
  It reads straight from the project folders. Bramblewick's zoom uses the real
  emblem from `BramblewickTT/Favicon.png`, and its B lives in `tools/bramblewick-b.svg`.

## Open

- The board texts are drafts.
- `SOCIALS` has Instagram and LinkedIn with no `url` yet: their lids turn but don't link.
- The imprint is missing the postal address (shown in orange), which German law
  requires. Both legal pages are drafts, not checked by a lawyer.
- Kitchen Guide has no reel, real background colour or details yet.
- Linpile (https://linpile.com/), WrapChat (https://wrapchatapp.com/) and
  Bramblewick (https://www.bramblewick.world/) have a `url`, added 2026-10-13.
  Kitchen Guide's is null, so its zoom loops the logo and stays on the page. Once a lid
  is open, its website is prefetched, and the second click leaves for it.
- Published 13 Oct 2026 at https://oks.design (see Publish).

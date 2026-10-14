#!/usr/bin/env python3
"""Builds the portfolio's assets from the project folders next to personal-logo.

Run: python3 tools/build-assets.py
Writes img/logos/ (one monochrome logo per project for the blocks, one colour logo
for the zoom; Bramblewick's is the real emblem as a picture), fonts/ (Switzer as woff) and video/ (the reels made tiny for the dot
screen). Needs ffmpeg, fontTools and Pillow.
"""
import re
import subprocess
from pathlib import Path

from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw

SITE = Path(__file__).resolve().parent.parent
APPS = SITE.parent.parent  # Published-Apps
FONTS = Path.home() / "Library/Fonts"

# the portfolio's colours, from personal-logo/oks-design/build.py
INK = "#202327"
PAPER = "#fbf8f2"
LIGHT = "#d9d1c2"
MID = "#8f887c"


def svg(view_box, body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view_box}">{body}</svg>\n'


def oks_hand():
    paths = re.findall(r'<path d="([^"]+)"', (SITE.parent / "oks-design/oks-mark-source.svg").read_text())
    body = "".join(f'<path d="{d}"/>' for d in paths)
    return svg("38 12 480 412", f'<g fill="{INK}">{body}</g>')


def linpile(mono):
    src = (APPS / "LinpileApp/website/site/img/logo.svg").read_text()
    if not mono:
        return src
    # bottom card to top card: the yellow and coral turn into two greys
    fills = {"#DCDAD4": LIGHT, "#F26A2E": MID, "#F5C542": LIGHT, "#FAFAF8": PAPER, "#151515": INK}
    for old, new in fills.items():
        src = src.replace(old, new)
    return src


def wrapchat(mono):
    src = (APPS / "WrapchatApp/website/site/img/mark.svg").read_text()
    src = re.sub(r"<\?xml[^>]*>\s*", "", src)
    if mono:
        # the ribbon's face is ink, its folded back the grey
        src = src.replace("#FFFFFF", INK).replace("#7A90FF", MID)
    return src


def bramblewick_parts():
    """The B of the Bramblewick logo (the same letter as BramblewickTT/brand/bramblewick-B-512.png)."""
    letter = re.search(r'<path d="([^"]+)" transform="([^"]+)"', (SITE / "tools/bramblewick-b.svg").read_text())
    return letter.group(1), letter.group(2)


def bramblewick_emblem():
    """The real emblem (BramblewickTT/Favicon.png) cut out of its green square as a circle."""
    im = Image.open(APPS / "BramblewickTT/Favicon.png").convert("RGBA")
    size = im.width
    mask = Image.new("L", (size * 4, size * 4), 0)
    r = 453 * 4  # the emblem's outer ring, measured
    c = size * 2
    ImageDraw.Draw(mask).ellipse((c - r, c - r, c + r, c + r), fill=255)
    im.putalpha(mask.resize((size, size), Image.LANCZOS))
    im = im.crop((size // 2 - 455, size // 2 - 455, size // 2 + 455, size // 2 + 455)).resize((640, 640), Image.LANCZOS)
    im.save(SITE / "img/logos/bramblewick-color.webp", quality=88, method=6)


def bramblewick(mono):
    d, transform = bramblewick_parts()
    # the B alone, with one blackberry hanging off its lower bowl
    berry = []
    for cx, cy, dark in [(0, -26, 0), (-18, -12, 0), (18, -12, 0), (0, 2, 0), (-18, 16, 1), (18, 16, 1), (0, 30, 1)]:
        berry.append(f'<circle cx="{cx}" cy="{cy}" r="15" fill="{INK if dark else MID}" stroke="{INK}" stroke-width="5"/>')
        berry.append(f'<circle cx="{cx - 5}" cy="{cy - 5}" r="3.6" fill="{PAPER}"/>')
    stem = f'<path d="M0,-44 Q4,-70 -10,-92" fill="none" stroke="{INK}" stroke-width="9" stroke-linecap="round"/>'
    return svg(
        "300 220 500 570",
        f'<path d="{d}" transform="{transform}" fill="{INK}"/>'
        f'<g transform="translate(728 690) scale(1.55)">{stem}{"".join(berry)}</g>',
    )


def bramblewick_letter():
    d, transform = bramblewick_parts()
    return svg("300 220 410 570", f'<path d="{d}" transform="{transform}" fill="{INK}"/>')


def kitchen_guide(mono):
    src = (SITE.parent / "favicon.svg").read_text()
    src = re.sub(r"<\?xml[^>]*>\s*", "", src)
    return src.replace("#1C211C", INK) if mono else src


def logos():
    out = SITE / "img/logos"
    out.mkdir(parents=True, exist_ok=True)
    files = {"oks-hand.svg": oks_hand(), "bramblewick-letter.svg": bramblewick_letter()}
    for name, make in [("linpile", linpile), ("wrapchat", wrapchat), ("bramblewick", bramblewick), ("kitchen-guide", kitchen_guide)]:
        files[f"{name}-mono.svg"] = make(True)
        if name != "bramblewick":
            files[f"{name}-color.svg"] = make(False)
    for name, code in files.items():
        (out / name).write_text(code)
    bramblewick_emblem()
    print(len(files) + 1, "logos")


def fonts():
    out = SITE / "fonts"
    out.mkdir(exist_ok=True)
    for weight in ["Medium", "Semibold", "Bold"]:
        font = TTFont(FONTS / f"Switzer-{weight}.otf")
        font.flavor = "woff"
        font.save(out / f"switzer-{weight.lower()}.woff")
    print("3 fonts")


REELS = {
    "linpile": "LinpileApp/instagram/lemon-tree-reel/linpile-lemon-tree-reel.mp4",
    "wrapchat": "WrapchatApp/instagram/third-reel/wrapchat-third-reel.mp4",
    "bramblewick": "BramblewickTT/instagram/weave-reel/bramblewick-weave-reel.mp4",
}


def videos():
    """The reels play sharp behind the dot mesh, so they need some detail: 360 x 640."""
    out = SITE / "video"
    out.mkdir(exist_ok=True)
    for name, path in REELS.items():
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", str(APPS / path), "-an",
             "-vf", "fps=15,scale=360:640:flags=lanczos", "-c:v", "libx264", "-crf", "26",
             "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(out / f"{name}.mp4")],
            check=True,
        )
    print(len(REELS), "videos")


if __name__ == "__main__":
    logos()
    fonts()
    videos()

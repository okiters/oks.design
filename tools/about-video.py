#!/usr/bin/env python3
"""Makes video/about.mp4, the clip on the screen when "about" is pressed.

Run: python3 tools/about-video.py [source.mov]   (default ~/Downloads/IMG_8125.mov)

The source is a 4.8 s phone clip of Özge waving. Every frame is cut out with Apple's
person segmentation (tools/person-mask.swift), tinted from dark brown through the
screen's orange to a pale peach, faded out towards the bottom, and trimmed to a loop:
frames 8 to 105, whose last eight frames melt into the first eight. Needs ffmpeg,
Pillow, numpy and Swift (Xcode's command line tools).
"""
import glob
import os
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

SITE = Path(__file__).resolve().parent.parent
SRC = Path(sys.argv[1] if len(sys.argv) > 1 else Path.home() / "Downloads/IMG_8125.mov")
START, END, BLEND = 8, 105, 8  # loop points, found by comparing every frame pair
W, H = 360, 640

# dark brown -> the screen's orange -> pale peach
STOPS = np.array([[0.0, 0x30, 0x10, 0x08], [0.5, 0xE4, 0x57, 0x2E], [1.0, 0xFF, 0xD8, 0xBE]], np.float32)


def tone(t):
    out = np.zeros(t.shape + (3,), np.float32)
    for c in range(3):
        out[..., c] = np.interp(t, STOPS[:, 0], STOPS[:, c + 1]) / 255
    return out


def main():
    work = Path(tempfile.mkdtemp())
    (work / "frames").mkdir()
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(SRC), "-an",
                    "-vf", f"scale={W}:{H}:flags=lanczos", str(work / "frames/%03d.png")], check=True)
    subprocess.run(["swift", str(SITE / "tools/person-mask.swift"), str(work / "frames"), str(work / "masks")], check=True)

    names = sorted(os.path.basename(f) for f in glob.glob(str(work / "frames/*.png")))
    frames = [np.asarray(Image.open(work / "frames" / n).convert("RGB"), np.float32) / 255 for n in names]
    masks = [np.asarray(Image.open(work / "masks" / n).convert("L").filter(ImageFilter.GaussianBlur(1.2)), np.float32) / 255
             for n in names]
    n = len(frames)
    # steady the cut-out's edge over neighbouring frames
    masks = [(masks[max(i - 1, 0)] + 2 * masks[i] + masks[min(i + 1, n - 1)]) / 4 for i in range(n)]
    # fade the body out towards the bottom, so the desk's diagonal edge doesn't show
    y = np.linspace(0, 1, H, dtype=np.float32)[:, None]
    fade = np.clip((0.97 - y) / 0.3, 0, 1) ** 1.4
    lum = [0.3 * f[..., 0] + 0.59 * f[..., 1] + 0.11 * f[..., 2] for f in frames]
    person = np.concatenate([l[m > 0.6] for l, m in zip(lum, masks)])
    lo, hi = np.percentile(person, 2), np.percentile(person, 99.2)

    def style(i):
        t = 0.16 + 0.84 * np.clip((lum[i] - lo) / (hi - lo), 0, 1) ** 0.85  # dark hair still glows a little
        return tone(t) * (masks[i] * fade)[..., None]

    (work / "out").mkdir()
    for j, i in enumerate(range(START + BLEND, END + 1)):
        img = style(i)
        back = END - i
        if back < BLEND:  # the last frames melt into the first ones
            w = (BLEND - back) / (BLEND + 1)
            img = (1 - w) * img + w * style(START + BLEND - 1 - back)
        Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).save(work / f"out/{j:03d}.png")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", "24", "-i", str(work / "out/%03d.png"),
                    "-c:v", "libx264", "-crf", "24", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
                    str(SITE / "video/about.mp4")], check=True)
    print("video/about.mp4:", END - START - BLEND + 1, "frames")


if __name__ == "__main__":
    main()

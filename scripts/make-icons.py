"""Draws the app icons (a box of matches on felt) into app/icons/. Needs Pillow; run once, output is committed."""
from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "app" / "icons"
FELT, WOOD, HEAD, EDGE = (18, 81, 59), (239, 197, 124), (200, 53, 43), (126, 27, 20)
SCALE = 4  # draw big, downsample for smooth edges


def draw(size: int, inner: float) -> Image.Image:
    big = size * SCALE
    img = Image.new("RGB", (big, big), FELT)
    d = ImageDraw.Draw(img)
    pad = big * (1 - inner) / 2
    lo, hi = pad, big - pad
    w = int(big * 0.075 * inner)
    r = w * 0.95
    sticks = [((lo, hi), (lo, lo)), ((lo, lo), (hi, lo)), ((hi, lo), (hi, hi)), ((hi, hi), (lo, hi))]
    m = (hi - lo) * 0.17
    sticks.append(((lo + m, hi - m), (hi - m, lo + m)))
    for (x1, y1), (x2, y2) in sticks:
        d.line([(x1, y1 + w * 0.3), (x2, y2 + w * 0.3)], fill=(8, 40, 28), width=w + 4)
        d.line([(x1, y1), (x2, y2)], fill=WOOD, width=w)
    for (_, _), (x2, y2) in sticks:
        d.ellipse([x2 - r, y2 - r, x2 + r, y2 + r], fill=HEAD, outline=EDGE, width=max(2, w // 6))
    return img.resize((size, size), Image.LANCZOS)


OUT.mkdir(parents=True, exist_ok=True)
draw(192, 0.62).save(OUT / "icon-192.png")
draw(512, 0.62).save(OUT / "icon-512.png")
draw(512, 0.48).save(OUT / "icon-maskable-512.png")
draw(180, 0.62).save(OUT / "apple-touch-icon.png")

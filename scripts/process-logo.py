"""Generate PrepX logo + favicons from tmp/logo-source.png."""
from __future__ import annotations

import io
import struct
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


def write_png_ico(path: Path, images: list[Image.Image]) -> None:
    """Write a valid multi-size ICO with PNG frames (Pillow often emits corrupt ICO)."""
    blobs: list[bytes] = []
    for im in images:
        buf = io.BytesIO()
        im.save(buf, format="PNG")
        blobs.append(buf.getvalue())

    count = len(images)
    offset = 6 + 16 * count
    parts = [struct.pack("<HHH", 0, 1, count)]
    for im, blob in zip(images, blobs):
        w, h = im.size
        wb = 0 if w >= 256 else w
        hb = 0 if h >= 256 else h
        parts.append(struct.pack("<BBBBHHII", wb, hb, 0, 0, 1, 32, len(blob), offset))
        offset += len(blob)
    path.write_bytes(b"".join(parts) + b"".join(blobs))


def knock_out_background(img: Image.Image) -> Image.Image:
    """Make near-white or near-black canvas transparent; keep blue mark."""
    img = img.convert("RGBA")
    pixels = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            # White / light gray canvas (new logo)
            if r >= 245 and g >= 245 and b >= 245:
                pixels[x, y] = (r, g, b, 0)
            elif r >= 230 and g >= 230 and b >= 230 and abs(r - g) < 8 and abs(g - b) < 8:
                # Soft edge fade on light bg
                darkness = 255 - ((r + g + b) // 3)
                alpha = max(0, min(255, darkness * 8))
                pixels[x, y] = (r, g, b, alpha)
            # Black canvas (legacy source)
            elif r < 35 and g < 35 and b < 35:
                pixels[x, y] = (r, g, b, 0)
            elif r < 55 and g < 55 and b < 55 and max(r, g, b) < 70:
                if b > r + 10 and b > g + 10:
                    pixels[x, y] = (r, g, b, a)
                else:
                    alpha = max(0, min(255, int((max(r, g, b) - 20) * 6)))
                    pixels[x, y] = (r, g, b, alpha)
    return img


root = Path(__file__).resolve().parent.parent
src = root / "tmp" / "logo-source.png"
out_public = root / "public"
out_assets = root / "src" / "assets"
out_public.mkdir(exist_ok=True)
out_assets.mkdir(parents=True, exist_ok=True)

img = knock_out_background(Image.open(src))

bbox = img.getbbox()
if bbox:
    pad = 16
    left = max(0, bbox[0] - pad)
    top = max(0, bbox[1] - pad)
    right = min(img.size[0], bbox[2] + pad)
    bottom = min(img.size[1], bbox[3] + pad)
    img = img.crop((left, top, right, bottom))

side = max(img.size)
square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
ox = (side - img.size[0]) // 2
oy = (side - img.size[1]) // 2
square.paste(img, (ox, oy), img)

master = square.resize((512, 512), Image.Resampling.LANCZOS)
master.save(out_public / "logo.png", optimize=True)
master.save(out_assets / "logo.png", optimize=True)


def resize(size: int) -> Image.Image:
    return master.resize((size, size), Image.Resampling.LANCZOS)


for size, name in [
    (192, "icon-192.png"),
    (512, "icon-512.png"),
    (32, "favicon-32.png"),
    (16, "favicon-16.png"),
]:
    resize(size).save(out_public / name, optimize=True)

# iOS home-screen: solid slate behind mark (transparency looks black on iOS).
apple = Image.new("RGBA", (180, 180), (15, 23, 42, 255))
mark = resize(148)
apple.paste(mark, ((180 - 148) // 2, (180 - 148) // 2), mark)
apple.save(out_public / "apple-touch-icon.png", optimize=True)

write_png_ico(out_public / "favicon.ico", [resize(s) for s in (16, 32, 48)])

dark = Image.new("RGBA", (512, 512), (0, 0, 0, 255))
dark.paste(master, (0, 0), master)
dark.convert("RGB").save(out_public / "logo-dark.png", optimize=True)

# Social share card: opaque 1200×630.
OG_W, OG_H = 1200, 630
og = Image.new("RGBA", (OG_W, OG_H), (15, 23, 42, 255))
glow_draw = ImageDraw.Draw(og)
cx, cy = OG_W // 2, 250
glow_draw.ellipse((cx - 220, cy - 220, cx + 220, cy + 220), fill=(37, 99, 235, 70))
mark_og = resize(280)
og.paste(mark_og, ((OG_W - 280) // 2, 90), mark_og)

try:
    title_font = ImageFont.truetype("arial.ttf", 64)
    sub_font = ImageFont.truetype("arial.ttf", 28)
except OSError:
    title_font = ImageFont.load_default()
    sub_font = title_font

draw = ImageDraw.Draw(og)
title = "PrepX Nepal"
sub = "Nepal CEE Online Mock Tests & Entrance Prep"
tb = draw.textbbox((0, 0), title, font=title_font)
tw = tb[2] - tb[0]
draw.text(((OG_W - tw) // 2, 400), title, fill=(248, 250, 252, 255), font=title_font)
sb = draw.textbbox((0, 0), sub, font=sub_font)
sw = sb[2] - sb[0]
draw.text(((OG_W - sw) // 2, 480), sub, fill=(148, 163, 184, 255), font=sub_font)
og.convert("RGB").save(out_public / "og-image.png", optimize=True)

print("OK", sorted(p.name for p in out_public.iterdir() if p.suffix in {".png", ".ico"}))
print("master corner alpha", master.getpixel((0, 0))[3])

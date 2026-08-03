from PIL import Image
from pathlib import Path

src = Path(__file__).resolve().parent.parent / "tmp" / "logo-source.png"
root = Path(__file__).resolve().parent.parent
out_public = root / "public"
out_assets = root / "src" / "assets"
out_public.mkdir(exist_ok=True)
out_assets.mkdir(parents=True, exist_ok=True)

img = Image.open(src).convert("RGBA")
pixels = img.load()
w, h = img.size

for y in range(h):
    for x in range(w):
        r, g, b, a = pixels[x, y]
        if r < 35 and g < 35 and b < 35:
            pixels[x, y] = (r, g, b, 0)
        elif r < 55 and g < 55 and b < 55 and max(r, g, b) < 70:
            if b > r + 10 and b > g + 10:
                pixels[x, y] = (r, g, b, a)
            else:
                alpha = max(0, min(255, int((max(r, g, b) - 20) * 6)))
                pixels[x, y] = (r, g, b, alpha)

bbox = img.getbbox()
if bbox:
    pad = 24
    left = max(0, bbox[0] - pad)
    top = max(0, bbox[1] - pad)
    right = min(w, bbox[2] + pad)
    bottom = min(h, bbox[3] + pad)
    img = img.crop((left, top, right, bottom))

side = max(img.size)
square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
ox = (side - img.size[0]) // 2
oy = (side - img.size[1]) // 2
square.paste(img, (ox, oy), img)

master = square.resize((512, 512), Image.Resampling.LANCZOS)
master.save(out_public / "logo.png", optimize=True)
master.save(out_assets / "logo.png", optimize=True)

for size, name in [
    (192, "icon-192.png"),
    (512, "icon-512.png"),
    (32, "favicon-32.png"),
    (16, "favicon-16.png"),
    (180, "apple-touch-icon.png"),
]:
    master.resize((size, size), Image.Resampling.LANCZOS).save(out_public / name, optimize=True)

ico_sizes = [(16, 16), (32, 32), (48, 48)]
ico_imgs = [master.resize(s, Image.Resampling.LANCZOS) for s in ico_sizes]
ico_imgs[0].save(out_public / "favicon.ico", format="ICO", sizes=ico_sizes, append_images=ico_imgs[1:])

dark = Image.new("RGBA", (512, 512), (0, 0, 0, 255))
dark.paste(master, (0, 0), master)
dark.convert("RGB").save(out_public / "logo-dark.png", optimize=True)

print("OK", sorted(p.name for p in out_public.iterdir()))

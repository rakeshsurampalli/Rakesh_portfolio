"""One-time asset optimization. Run: python tools/optimize-images.py
Outputs are committed; this never runs as part of a build."""
from PIL import Image
import os

SPEC = [
    # source,                variants [(suffix, width)],   webp_q, png_colors
    ("hero-avatar.png",      [("-380", 380), ("-760", 760)], 82, 128),
    ("finai_nobg.png",       [("", 640)],                    82,  96),
    ("tudu_logo.png",        [("", 640)],                    82,  96),
    ("Bhuchakra_logo.png",   [("", 640)],                    82,  96),
    ("manas_logo.png",       [("", 196)],                    82,  96),  # native; upscaling makes it larger
]

RENAME = {"Bhuchakra_logo.png": "atharva_logo"}

os.makedirs("img", exist_ok=True)
total_in = total_out = 0
for src, variants, q, colors in SPEC:
    if not os.path.exists(src):
        print(f"  skip (missing): {src}")
        continue
    base = RENAME.get(src, os.path.splitext(src)[0].lower())
    im = Image.open(src).convert("RGBA")
    total_in += os.path.getsize(src)
    for suffix, w in variants:
        h = round(im.height * w / im.width)
        out = im.resize((w, h), Image.LANCZOS) if w != im.width else im
        wp = f"img/{base}{suffix}.webp"
        out.save(wp, "WEBP", quality=q, method=6)
        total_out += os.path.getsize(wp)
        print(f"  {src:24s} -> {wp:34s} {w}x{h:<5} {os.path.getsize(wp)/1024:6.1f} KB")
        if suffix in ("", "-380"):
            pf = f"img/{base}.png"
            out.convert("RGB").quantize(colors=colors, method=Image.FASTOCTREE).save(pf, "PNG", optimize=True)
            total_out += os.path.getsize(pf)
            print(f"  {'':24s}    {pf:34s} {'fallback':11s} {os.path.getsize(pf)/1024:6.1f} KB")

print(f"\n  {total_in/1048576:.2f} MB -> {total_out/1024:.0f} KB  ({100 - 100*total_out/total_in:.1f}% reduction)")

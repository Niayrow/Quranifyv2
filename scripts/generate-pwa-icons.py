from PIL import Image
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public" / "icons" / "sansfond.png"

# App UI background — used only where OS icons need an opaque canvas
APP_BG = (2, 6, 23)  # #020617

public = ROOT / "public"
icons = public / "icons"

im = Image.open(SRC).convert("RGBA")
side = min(im.size)
left = (im.width - side) // 2
top = (im.height - side) // 2
im = im.crop((left, top, left + side, top + side))


def resize_rgba(img: Image.Image, size: int) -> Image.Image:
    return img.resize((size, size), Image.Resampling.LANCZOS)


def on_bg(img: Image.Image, size: int, bg=APP_BG) -> Image.Image:
    """Transparent logo centered on solid brand background."""
    layer = resize_rgba(img, size)
    base = Image.new("RGBA", (size, size), (*bg, 255))
    return Image.alpha_composite(base, layer).convert("RGB")


def on_bg_padded(img: Image.Image, size: int, content_ratio: float, bg=APP_BG) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), (*bg, 255))
    content = resize_rgba(img, int(size * content_ratio))
    offset = ((size - content.width) // 2, (size - content.height) // 2)
    canvas.alpha_composite(content, dest=offset)
    return canvas.convert("RGB")


# --- Transparent assets (in-app logo, favicons) ---
transparent_targets = {
    icons / "logo.png": 512,
    icons / "favicon-16x16.png": 16,
    icons / "favicon-32x32.png": 32,
    public / "favicon-192.png": 192,
}

for path, size in transparent_targets.items():
    resize_rgba(im, size).save(path, "PNG", optimize=True)
    print(f"transparent {path.relative_to(ROOT)} {size}")

# favicon.ico — keep transparency where possible
ico_sizes = [16, 32, 48]
ico_imgs = [resize_rgba(im, s) for s in ico_sizes]
ico_imgs[0].save(icons / "favicon.ico", format="ICO", sizes=[(s, s) for s in ico_sizes])
print("transparent favicon.ico")

# Master transparent 1024
resize_rgba(im, 1024).save(icons / "icon-1024.png", "PNG", optimize=True)

# --- Opaque OS / PWA icons (logo sans fond posé sur #020617) ---
opaque = {
    icons / "apple-touch-icon.png": 180,
    icons / "android-chrome-192x192.png": 192,
    icons / "android-chrome-512x512.png": 512,
    icons / "artwork.png": 512,
    public / "apple-touch-icon.png": 180,
}

for path, size in opaque.items():
    on_bg(im, size).save(path, "PNG", optimize=True)
    print(f"opaque {path.relative_to(ROOT)} {size}")

on_bg_padded(im, 192, 0.78).save(icons / "maskable-192x192.png", "PNG", optimize=True)
on_bg_padded(im, 512, 0.78).save(icons / "maskable-512x512.png", "PNG", optimize=True)
print("maskable 192/512")

og = Image.new("RGB", (1200, 630), APP_BG)
logo = resize_rgba(im, 420)
og_rgba = Image.new("RGBA", (1200, 630), (*APP_BG, 255))
og_rgba.alpha_composite(logo, dest=((1200 - logo.width) // 2, (630 - logo.height) // 2))
og_rgba.convert("RGB").save(public / "og-image.png", "PNG", optimize=True)
print("og-image")

# --- iOS ---
ios_icon = (
    ROOT
    / "ios"
    / "App"
    / "App"
    / "Assets.xcassets"
    / "AppIcon.appiconset"
    / "AppIcon-512@2x.png"
)
on_bg(im, 1024).save(ios_icon, "PNG", optimize=True)
print(f"ios {ios_icon.relative_to(ROOT)}")

# --- Android ---
android_res = ROOT / "android" / "app" / "src" / "main" / "res"
android_sizes = {
    "mipmap-mdpi": {"launcher": 48, "foreground": 108},
    "mipmap-hdpi": {"launcher": 72, "foreground": 162},
    "mipmap-xhdpi": {"launcher": 96, "foreground": 216},
    "mipmap-xxhdpi": {"launcher": 144, "foreground": 324},
    "mipmap-xxxhdpi": {"launcher": 192, "foreground": 432},
}

for folder, sizes in android_sizes.items():
    dens = android_res / folder
    dens.mkdir(parents=True, exist_ok=True)
    launcher = on_bg(im, sizes["launcher"])
    launcher.save(dens / "ic_launcher.png", "PNG", optimize=True)
    launcher.save(dens / "ic_launcher_round.png", "PNG", optimize=True)

    # Adaptive foreground: keep real transparency around the mark
    fg_size = sizes["foreground"]
    fg = Image.new("RGBA", (fg_size, fg_size), (0, 0, 0, 0))
    content = resize_rgba(im, int(fg_size * 0.72))
    offset = ((fg_size - content.width) // 2, (fg_size - content.height) // 2)
    fg.alpha_composite(content, dest=offset)
    fg.save(dens / "ic_launcher_foreground.png", "PNG", optimize=True)
    print(f"android {folder}")

(android_res / "values" / "ic_launcher_background.xml").write_text(
    '<?xml version="1.0" encoding="utf-8"?>\n'
    "<resources>\n"
    '    <color name="ic_launcher_background">#020617</color>\n'
    "</resources>\n",
    encoding="utf-8",
)
print("android background #020617")
print("DONE")

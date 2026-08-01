"""
Génère toutes les icônes site / PWA / Android / iOS à partir de :
  - public/icons/sansfond.png  → logo UI (fond transparent)
  - public/icons/app-icon-source.png → icône app (cadre doré)
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
public = ROOT / "public"
icons = public / "icons"

SITE_SRC = icons / "sansfond.png"
APP_SRC = icons / "app-icon-source.png"

# Fond sombre aligné sur l'icône (noir premium)
APP_BG = (8, 8, 8)  # #080808


def knock_out_black(im: Image.Image, threshold: int = 28) -> Image.Image:
    """Rend le noir (et quasi-noir) transparent pour le logo site."""
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if r <= threshold and g <= threshold and b <= threshold:
                px[x, y] = (0, 0, 0, 0)
            elif r < threshold + 40 and g < threshold + 40 and b < threshold + 40:
                # Adoucir les bords sombres
                darkness = max(r, g, b)
                soft = max(0, min(255, int((darkness - threshold) * (255 / 40))))
                px[x, y] = (r, g, b, min(a, soft))
    return im


def crop_square(im: Image.Image) -> Image.Image:
    side = min(im.size)
    left = (im.width - side) // 2
    top = (im.height - side) // 2
    return im.crop((left, top, left + side, top + side))


def trim_outer_black(im: Image.Image, threshold: int = 12, pad: int = 8) -> Image.Image:
    """Recadre le canvas noir autour d'une app icon (garde le squircle)."""
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    min_x, min_y, max_x, max_y = w, h, 0, 0
    found = False
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 8 and (r > threshold or g > threshold or b > threshold):
                found = True
                if x < min_x:
                    min_x = x
                if y < min_y:
                    min_y = y
                if x > max_x:
                    max_x = x
                if y > max_y:
                    max_y = y
    if not found:
        return im
    min_x = max(0, min_x - pad)
    min_y = max(0, min_y - pad)
    max_x = min(w - 1, max_x + pad)
    max_y = min(h - 1, max_y + pad)
    return im.crop((min_x, min_y, max_x + 1, max_y + 1))


def resize_rgba(img: Image.Image, size: int) -> Image.Image:
    return img.resize((size, size), Image.Resampling.LANCZOS)


def on_bg(img: Image.Image, size: int, bg=APP_BG) -> Image.Image:
    layer = resize_rgba(img.convert("RGBA"), size)
    base = Image.new("RGBA", (size, size), (*bg, 255))
    return Image.alpha_composite(base, layer).convert("RGB")


def fit_cover_rgb(img: Image.Image, size: int) -> Image.Image:
    """Redimensionne une app icon opaque pour remplir le carré."""
    sq = crop_square(img.convert("RGBA"))
    return resize_rgba(sq, size).convert("RGB")


def fit_contain_on_bg(img: Image.Image, size: int, ratio: float = 1.0, bg=APP_BG) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), (*bg, 255))
    content = resize_rgba(img.convert("RGBA"), int(size * ratio))
    offset = ((size - content.width) // 2, (size - content.height) // 2)
    canvas.alpha_composite(content, dest=offset)
    return canvas.convert("RGB")


# --- Sources ---
if not SITE_SRC.exists():
    raise SystemExit(f"Missing {SITE_SRC}")
if not APP_SRC.exists():
    raise SystemExit(f"Missing {APP_SRC}")

site_raw = Image.open(SITE_SRC).convert("RGBA")
# Si le fichier source a encore un fond noir, on le retire
site = knock_out_black(crop_square(site_raw))
site.save(SITE_SRC, "PNG", optimize=True)
print(f"updated transparent {SITE_SRC.relative_to(ROOT)}")

app_raw = Image.open(APP_SRC).convert("RGBA")
# Garder l'icône cadrée (squircle + bordure) pour PWA / stores
app = crop_square(app_raw)
# Version plein cadre pour launchers (moins de bande noire inutile)
app_tight = crop_square(trim_outer_black(app_raw, pad=4))

# --- Transparent (UI + petits favicons) ---
transparent_targets = {
    icons / "logo.png": 512,
    icons / "favicon-16x16.png": 16,
    icons / "favicon-32x32.png": 32,
    icons / "favicon-180x180.png": 180,
    icons / "favicon-192x192.png": 192,
    public / "favicon-192.png": 192,
}

for path, size in transparent_targets.items():
    resize_rgba(site, size).save(path, "PNG", optimize=True)
    print(f"transparent {path.relative_to(ROOT)} {size}")

ico_sizes = [16, 32, 48]
ico_imgs = [resize_rgba(site, s) for s in ico_sizes]
ico_imgs[0].save(icons / "favicon.ico", format="ICO", sizes=[(s, s) for s in ico_sizes])
ico_imgs[0].save(public / "favicon.ico", format="ICO", sizes=[(s, s) for s in ico_sizes])
print("favicon.ico (icons + public)")

resize_rgba(site, 1024).save(icons / "icon-1024.png", "PNG", optimize=True)

# --- Opaque app / PWA (source appicon) ---
opaque = {
    icons / "apple-touch-icon.png": 180,
    icons / "android-chrome-192x192.png": 192,
    icons / "android-chrome-512x512.png": 512,
    icons / "artwork.png": 512,
    icons / "app icon.png": 1024,
    public / "apple-touch-icon.png": 180,
    public / "icon.png": 512,
    public / "appicon.png": 1024,
}

for path, size in opaque.items():
    fit_cover_rgb(app_tight, size).save(path, "PNG", optimize=True)
    print(f"appicon {path.relative_to(ROOT)} {size}")

# Maskable : safe zone ~80%
fit_contain_on_bg(app_tight, 192, 0.82).save(icons / "maskable-192x192.png", "PNG", optimize=True)
fit_contain_on_bg(app_tight, 512, 0.82).save(icons / "maskable-512x512.png", "PNG", optimize=True)
print("maskable 192/512")

# OG image
og = Image.new("RGBA", (1200, 630), (*APP_BG, 255))
logo = resize_rgba(site, 380)
og.alpha_composite(logo, dest=((1200 - logo.width) // 2, (630 - logo.height) // 2))
og.convert("RGB").save(public / "og-image.png", "PNG", optimize=True)
print("og-image")

# --- iOS (1024) ---
ios_icon = (
    ROOT
    / "ios"
    / "App"
    / "App"
    / "Assets.xcassets"
    / "AppIcon.appiconset"
    / "AppIcon-512@2x.png"
)
fit_cover_rgb(app_tight, 1024).save(ios_icon, "PNG", optimize=True)
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
    launcher = fit_cover_rgb(app_tight, sizes["launcher"])
    launcher.save(dens / "ic_launcher.png", "PNG", optimize=True)
    launcher.save(dens / "ic_launcher_round.png", "PNG", optimize=True)

    # Adaptive foreground : logo plat transparent (évite double arrondi)
    fg_size = sizes["foreground"]
    fg = Image.new("RGBA", (fg_size, fg_size), (0, 0, 0, 0))
    content = resize_rgba(site, int(fg_size * 0.68))
    offset = ((fg_size - content.width) // 2, (fg_size - content.height) // 2)
    fg.alpha_composite(content, dest=offset)
    fg.save(dens / "ic_launcher_foreground.png", "PNG", optimize=True)
    print(f"android {folder}")

(android_res / "values" / "ic_launcher_background.xml").write_text(
    '<?xml version="1.0" encoding="utf-8"?>\n'
    "<resources>\n"
    '    <color name="ic_launcher_background">#080808</color>\n'
    "</resources>\n",
    encoding="utf-8",
)
print("android background #080808")

# drawable background legacy
drawable_bg = android_res / "drawable" / "ic_launcher_background.xml"
if drawable_bg.exists():
    # keep vector if present; color resource already updated
    pass

print("DONE")

"""
Optimize public images for web performance:
- Reciter portraits -> WebP max 384px
- Category / place photos -> WebP max 640px
- Logo sansfond -> WebP max 320px
Keeps sources in place only if already under _original; otherwise
moves replaced PNG/JPG into _original before writing WebP.
"""
from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
RECITERS = ROOT / "public" / "reciters"
BACKUP = RECITERS / "_original"
ICONS = ROOT / "public" / "icons"
IMG = ROOT / "public" / "img"


def to_webp(src: Path, dest: Path, max_side: int, quality: int) -> tuple[int, int]:
    with Image.open(src) as im:
        im = im.convert("RGBA") if im.mode in ("P", "RGBA", "LA") else im.convert("RGB")
        im.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
        dest.parent.mkdir(parents=True, exist_ok=True)
        save_kwargs: dict = {"quality": quality, "method": 6}
        if im.mode == "RGBA":
            save_kwargs["quality"] = quality
        im.save(dest, "WEBP", **save_kwargs)
        return im.size


def archive_source(src: Path) -> None:
    if "_original" in src.parts:
        return
    BACKUP.mkdir(parents=True, exist_ok=True)
    target = BACKUP / src.name
    if not target.exists():
        shutil.copy2(src, target)
    if src.suffix.lower() in {".png", ".jpg", ".jpeg"} and src.parent == RECITERS:
        src.unlink(missing_ok=True)


def main() -> None:
    report: list[str] = []

    for src in sorted(RECITERS.glob("*")):
        if not src.is_file() or src.suffix.lower() not in {".png", ".jpg", ".jpeg"}:
            continue
        if src.name.startswith("_"):
            continue
        dest = src.with_suffix(".webp")
        before = src.stat().st_size
        size = to_webp(src, dest, max_side=384, quality=78)
        archive_source(src)
        after = dest.stat().st_size
        report.append(f"reciter {src.name} -> {dest.name} {size[0]}x{size[1]} {before//1024}KB -> {after//1024}KB")

    for name in ("mecca.jpg", "medine.jpg", "riyad.jpg", "choix.jpg"):
        src = IMG / name
        if not src.exists():
            continue
        dest = src.with_suffix(".webp")
        before = src.stat().st_size
        size = to_webp(src, dest, max_side=640, quality=76)
        after = dest.stat().st_size
        report.append(f"place {src.name} -> {dest.name} {size[0]}x{size[1]} {before//1024}KB -> {after//1024}KB")

    logo = ICONS / "sansfond.png"
    if logo.exists():
        dest = ICONS / "sansfond.webp"
        before = logo.stat().st_size
        size = to_webp(logo, dest, max_side=320, quality=82)
        after = dest.stat().st_size
        report.append(f"logo {logo.name} -> {dest.name} {size[0]}x{size[1]} {before//1024}KB -> {after//1024}KB")

    print("\n".join(report))
    print(f"\nDone: {len(report)} files")


if __name__ == "__main__":
    main()

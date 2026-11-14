"""Build the demo photo set for the web app from Wikimedia Commons.

Reads `manifest.json` (one entry per demo car: the Commons file plus its author
and licence) and writes:

- apps/web/public/seed/cars/<id>.webp     the photo, resized
- apps/web/src/lib/seed/photos.json       size, blur backdrop, tint and credit per car
- apps/web/public/seed/ATTRIBUTION.md     author, licence and source for every photo

Run from the repository root:

    uv run --with pillow python scripts/seed-photos/build.py

Downloads are cached in scripts/seed-photos/.cache, so re-runs are offline.
"""

from __future__ import annotations

import base64
import colorsys
import hashlib
import io
import json
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
CACHE = HERE / ".cache"
OUT_IMAGES = ROOT / "apps/web/public/seed/cars"
OUT_JSON = ROOT / "apps/web/src/lib/seed/photos.json"
OUT_ATTRIBUTION = ROOT / "apps/web/public/seed/ATTRIBUTION.md"

API = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = "seed-photo-builder/0.1"
MAX_ATTEMPTS = 6
PAUSE_SECONDS = 2.0
FETCH_WIDTH = 1920
OUTPUT_WIDTH = 1280
WEBP_QUALITY = 78
BACKDROP_SIZE = (96, 64)
# On the 2x intermediate. High enough that street furniture and skylines melt into broad zones of colour.
BACKDROP_BLUR = 28


def http_get(url: str) -> bytes:
    """GET with patience: Commons answers 429 when asked too quickly."""
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    for attempt in range(MAX_ATTEMPTS):
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                return response.read()
        except urllib.error.HTTPError as error:
            last_try = attempt == MAX_ATTEMPTS - 1
            if error.code not in (429, 500, 502, 503, 504) or last_try:
                raise
            retry_after = error.headers.get("Retry-After", "")
            wait = int(retry_after) if retry_after.isdigit() else 5 * 2**attempt
            print(f"  HTTP {error.code}, waiting {wait}s")
            time.sleep(wait)
    raise RuntimeError("unreachable")


def thumb_url(title: str) -> str:
    query = urllib.parse.urlencode(
        {
            "action": "query",
            "format": "json",
            "titles": title,
            "prop": "imageinfo",
            "iiprop": "url|size",
            "iiurlwidth": FETCH_WIDTH,
        }
    )
    data = json.loads(http_get(f"{API}?{query}"))
    page = next(iter(data["query"]["pages"].values()))
    info = page["imageinfo"][0]
    return info.get("thumburl") or info["url"]


def fetch(entry: dict) -> Image.Image:
    CACHE.mkdir(exist_ok=True)
    # Keyed by the Commons title too, so swapping a car's photo in the manifest refetches it.
    title_key = hashlib.sha1(entry["commonsTitle"].encode("utf-8")).hexdigest()[:10]
    cached = CACHE / f"{entry['id']}-{title_key}.jpg"
    if not cached.exists():
        url = thumb_url(entry["commonsTitle"])
        time.sleep(PAUSE_SECONDS)
        cached.write_bytes(http_get(url))
        time.sleep(PAUSE_SECONDS)
    return Image.open(cached).convert("RGB")


def backdrop_data_url(image: Image.Image) -> str:
    """The whole photo, tiny and heavily blurred.

    The card lays it over the photo's own box and stretches it, so the colours
    at the top of the photo continue above it and the ground continues below.
    """
    small = image.resize((BACKDROP_SIZE[0] * 2, BACKDROP_SIZE[1] * 2), Image.LANCZOS)
    small = small.filter(ImageFilter.GaussianBlur(BACKDROP_BLUR)).resize(BACKDROP_SIZE, Image.LANCZOS)
    buffer = io.BytesIO()
    small.save(buffer, "WEBP", quality=55, method=6)
    return "data:image/webp;base64," + base64.b64encode(buffer.getvalue()).decode("ascii")


# Glow colour per paint colour, all at a similar weight on a dark background.
PAINT_TINTS = {
    "red": "#e5484d",
    "blue": "#4a82f5",
    "yellow": "#e3c23a",
    "green": "#63b84f",
    "orange": "#f5803e",
    "white": "#a8b5cc",
    "silver": "#9aa6b5",
    "grey": "#8791a3",
    "black": "#6f7896",
    "beige": "#c7a876",
    "brown": "#b0835a",
}


def tint(image: Image.Image) -> str:
    """The most vivid colour that covers a meaningful part of the photo.

    Only a fallback: the vivid part of a car photo is often the sky, so when the
    manifest says what colour the car is, that decides the glow instead.
    """
    small = image.resize((96, 64), Image.LANCZOS)
    quantized = small.quantize(colors=8, method=Image.MEDIANCUT)
    palette = quantized.getpalette()[: 8 * 3]
    counts = sorted(quantized.getcolors(), reverse=True)
    total = sum(count for count, _ in counts)

    best, best_score = (120, 130, 150), -1.0
    for count, index in counts:
        share = count / total
        if share < 0.05:
            continue
        r, g, b = palette[index * 3 : index * 3 + 3]
        _, lightness, saturation = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
        # Favour saturated colours that are neither near-black nor blown out.
        score = saturation * (1 - abs(lightness - 0.5) * 1.4) * (0.5 + share)
        if score > best_score:
            best, best_score = (r, g, b), score

    hue, _, saturation = colorsys.rgb_to_hls(*(channel / 255 for channel in best))
    # Normalise so every glow has the same weight on a dark background.
    r, g, b = colorsys.hls_to_rgb(hue, 0.56, min(0.85, max(0.32, saturation * 1.25)))
    return f"#{round(r * 255):02x}{round(g * 255):02x}{round(b * 255):02x}"


def main() -> None:
    manifest = json.loads((HERE / "manifest.json").read_text(encoding="utf-8"))
    OUT_IMAGES.mkdir(parents=True, exist_ok=True)

    photos: dict[str, dict] = {}
    lines = [
        "# Photo credits",
        "",
        "Demo listing photos come from Wikimedia Commons. Each file was resized and",
        "re-encoded as WebP; nothing else was changed. The licences below apply to",
        "the photos, not to the rest of this repository.",
        "",
        "| File | Author | Licence | Source |",
        "| --- | --- | --- | --- |",
    ]

    for entry in manifest:
        image = fetch(entry)
        if image.width > OUTPUT_WIDTH:
            height = round(image.height * OUTPUT_WIDTH / image.width)
            image = image.resize((OUTPUT_WIDTH, height), Image.LANCZOS)
        target = OUT_IMAGES / f"{entry['id']}.webp"
        image.save(target, "WEBP", quality=WEBP_QUALITY, method=6)

        photos[entry["id"]] = {
            "src": f"/seed/cars/{entry['id']}.webp",
            "width": image.width,
            "height": image.height,
            "blur": backdrop_data_url(image),
            "tint": PAINT_TINTS.get(entry.get("pictured", {}).get("color", "")) or tint(image),
            "credit": {
                "author": entry["author"],
                "license": entry["license"],
                "licenseUrl": entry.get("licenseUrl") or "",
                "sourceUrl": entry["pageUrl"],
            },
        }
        licence = (
            f"[{entry['license']}]({entry['licenseUrl']})" if entry.get("licenseUrl") else entry["license"]
        )
        lines.append(f"| `cars/{entry['id']}.webp` | {entry['author']} | {licence} | [Commons]({entry['pageUrl']}) |")
        print(f"{entry['id']:<22} {image.width}x{image.height}  {target.stat().st_size // 1024:>4} kB  {photos[entry['id']]['tint']}")

    OUT_JSON.write_text(json.dumps(photos, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    OUT_ATTRIBUTION.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"\n{len(photos)} photos → {OUT_IMAGES.relative_to(ROOT)}")


if __name__ == "__main__":
    main()

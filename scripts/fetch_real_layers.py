"""Fetch and cache real BHUMI-FUSE demo layers.

The prototype ships with deterministic fallback demo geometry so it can run
offline. This script is the first-pull path for a live demo: it fetches OSM
context from Overpass and creates cache manifests for footprints, admin
boundaries, and imagery sources that should be downloaded before judging.
"""

from __future__ import annotations

import json
import urllib.parse
import urllib.request
from pathlib import Path

CACHE = Path(__file__).resolve().parents[1] / "backend" / "data" / "real_cache"
BBOX = "18.5597,73.7729,18.56155,73.77545"


def fetch_osm() -> None:
    query = f"""
    [out:json][timeout:25];
    (
      way["highway"]({BBOX});
      way["building"]({BBOX});
      node["amenity"]({BBOX});
    );
    out body geom;
    """
    url = "https://overpass-api.de/api/interpreter?" + urllib.parse.urlencode({"data": query})
    with urllib.request.urlopen(url, timeout=45) as response:
        (CACHE / "osm_pune_context.json").write_bytes(response.read())


def main() -> None:
    CACHE.mkdir(parents=True, exist_ok=True)
    try:
        fetch_osm()
        osm_status = "downloaded"
    except Exception as exc:
        osm_status = f"not downloaded: {exc}"
    manifest = {
        "bbox": BBOX,
        "osm": osm_status,
        "building_footprints": "Use Microsoft Global ML Building Footprints India tiles; cache as footprints.geojson.",
        "admin_boundaries": "Use data.gov.in, PMC/PMRDA, or DataMeet administrative boundaries; cache as admin.geojson.",
        "current_imagery": "Use Sentinel-2/Bhuvan scene over bbox; cache as current.tif.",
        "historical_imagery": "Use older Landsat/Bhuvan scene over bbox; cache as historical.tif.",
    }
    (CACHE / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()


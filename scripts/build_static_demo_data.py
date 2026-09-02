from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OSM = ROOT / "frontend" / "src" / "osm-pune-kharadi.json"
OUT = ROOT / "frontend" / "src" / "demoData.ts"


def centroid(ring):
    pts = ring[:-1] if ring[0] == ring[-1] else ring
    return [sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts)]


def bbox(ring, pad=0.000035):
    xs = [p[0] for p in ring]
    ys = [p[1] for p in ring]
    return [
        [min(xs) - pad, min(ys) - pad],
        [max(xs) + pad, min(ys) - pad],
        [max(xs) + pad, max(ys) + pad],
        [min(xs) - pad, max(ys) + pad],
        [min(xs) - pad, min(ys) - pad],
    ]


def move(ring, dx, dy):
    return [[x + dx, y + dy] for x, y in ring]


def feature(fid, geometry, properties):
    return {"type": "Feature", "id": fid, "geometry": geometry, "properties": {"id": fid, **properties}}


def fc(features):
    return {"type": "FeatureCollection", "features": features}


def main():
    raw = json.loads(OSM.read_text(encoding="utf-8-sig"))
    buildings, roads = [], []
    for el in raw["elements"]:
        tags = el.get("tags", {})
        geom = el.get("geometry") or []
        coords = [[p["lon"], p["lat"]] for p in geom]
        if not coords:
            continue
        if "building" in tags and len(coords) >= 4:
            if coords[0] != coords[-1]:
                coords.append(coords[0])
            buildings.append((el["id"], coords, tags))
        elif "highway" in tags and len(coords) >= 2:
            roads.append((el["id"], coords, tags))

    buildings = sorted(buildings, key=lambda item: abs(centroid(item[1])[0] - 73.77418) + abs(centroid(item[1])[1] - 18.56062))[:8]
    roads = roads[:10]
    bounds = [
        min(p[0] for _, ring, _ in buildings + roads for p in ring),
        min(p[1] for _, ring, _ in buildings + roads for p in ring),
        max(p[0] for _, ring, _ in buildings + roads for p in ring),
        max(p[1] for _, ring, _ in buildings + roads for p in ring),
    ]
    sim_label = "Simulated legal boundary - derived from real OSM building footprints, not an official record"
    building_features = [
        feature(f"building-{osm_id}", {"type": "Polygon", "coordinates": [ring]}, {
            "source_type": "derived_building_footprint_real",
            "authority_level": 0.72,
            "is_synthetic": False,
            "timestamp": "2026-09-02",
            "label": "Real OpenStreetMap building footprint",
            "osm_id": osm_id,
        }) for osm_id, ring, _ in buildings
    ]
    road_features = [
        feature(f"road-{osm_id}", {"type": "LineString", "coordinates": ring}, {
            "source_type": "contextual_municipal_real",
            "authority_level": 0.68,
            "is_synthetic": False,
            "timestamp": "2026-09-02",
            "label": "Real OpenStreetMap road/highway context",
            "osm_id": osm_id,
            "highway": tags.get("highway"),
            "name": tags.get("name", "Unnamed OSM road"),
        }) for osm_id, ring, tags in roads
    ]
    offsets = [(0.00010, 0.00008), (0.00008, -0.00006), (-0.00005, 0.00007), (0.00013, 0.00003)]
    cadastral_features = []
    for idx, (osm_id, ring, _) in enumerate(buildings[:4]):
      parcel = move(bbox(ring), *offsets[idx])
      cadastral_features.append(feature(f"parcel-{idx + 1}", {"type": "Polygon", "coordinates": [parcel]}, {
          "source_type": "authoritative_cadastral_simulated",
          "authority_level": 0.92,
          "is_synthetic": True,
          "timestamp": "2017-01-15",
          "label": sim_label,
          "derived_from_osm_building_id": osm_id,
      }))

    controls = []
    for idx, road in enumerate(roads[:4]):
        pt = road[1][len(road[1]) // 2]
        controls.append(feature(f"gnss-{idx + 1}", {"type": "Point", "coordinates": pt}, {
            "source_type": "synthetic_control",
            "authority_level": 0.8,
            "is_synthetic": True,
            "positional_accuracy_m": [0.07, 0.12, 0.18, 0.21][idx],
            "label": "Real OSM coordinate with synthetic GNSS accuracy metadata",
        }))

    data = {
        "data": {
            "cadastral": fc(cadastral_features),
            "buildings": fc(building_features),
            "municipal": fc(road_features),
            "control": fc(controls),
            "bounds": bounds,
            "provenance": {
                "area": "Kharadi / Pune pilot bounding box",
                "bbox": [18.5597, 73.7729, 18.56155, 73.77545],
                "osm_elements": len(raw["elements"]),
                "osm_buildings": len([e for e in raw["elements"] if "building" in e.get("tags", {})]),
                "osm_roads": len([e for e in raw["elements"] if "highway" in e.get("tags", {})]),
                "source": "OpenStreetMap via Overpass API, downloaded 2026-09-02",
                "imagery_basemap": "Esri World Imagery raster tiles in MapLibre",
                "cadastral_note": sim_label,
            },
        }
    }
    OUT.write_text(
        "export const staticDemo = " + json.dumps(data, indent=2) + " as const;\n",
        encoding="utf-8",
    )
    print(OUT)


if __name__ == "__main__":
    main()

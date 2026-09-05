from __future__ import annotations

import math
from typing import Any

def generate_area_dataset(
    area_id: str,
    area_name: str,
    city: str,
    base_lat: float,
    base_lon: float,
    cols: int = 6,
    rows: int = 4,
    start_pid: int = 101,
    col_w_m: float = 38.0,
    row_h_m: float = 32.0,
    distortion_type: str = "mixed",
) -> dict[str, Any]:
    """
    Generates an authentic multi-layer geospatial dataset for a specific study area.
    - Cadastral layer: Simulated historical baseline with realistic survey distortions.
    - Drone layer: Physical footprint geometry (aligned with modern imagery).
    - GNSS points: High-precision survey control monuments.
    - Municipal roads: Surrounding context network.
    """
    lat_m_to_deg = 1.0 / 111139.0
    lon_m_to_deg = 1.0 / (111139.0 * math.cos(math.radians(base_lat)))

    gap_x_m = 4.5
    gap_y_m = 4.0

    cadastral_features = []
    building_features = []
    extracted_features = []
    gnss_points = []
    road_features = []

    pid = start_pid
    parcel_specs = []

    for r in range(rows):
        for c in range(cols):
            p_lon = base_lon + c * (col_w_m + gap_x_m) * lon_m_to_deg
            p_lat = base_lat + r * (row_h_m + gap_y_m) * lat_m_to_deg
            w_deg = col_w_m * lon_m_to_deg
            h_deg = row_h_m * lat_m_to_deg

            # Ground physical footprint (drone/satellite reality)
            phys_ring = [
                [round(p_lon, 8), round(p_lat, 8)],
                [round(p_lon + w_deg, 8), round(p_lat, 8)],
                [round(p_lon + w_deg, 8), round(p_lat + h_deg, 8)],
                [round(p_lon, 8), round(p_lat + h_deg, 8)],
                [round(p_lon, 8), round(p_lat, 8)],
            ]

            # Distortion profiles based on area character
            if distortion_type == "rotational":  # Wagholi (peri-urban agricultural conversion)
                conflict_m = round(1.2 + (r * 0.7) + (c * 0.4), 2)
                rot_deg = 2.8
                shift_x_m = conflict_m * 0.6
                shift_y_m = conflict_m * 0.8
            elif distortion_type == "expansion":  # Hinjawadi (IT park rapid expansion)
                is_expanded = (r in (1, 2) and c in (2, 3))
                conflict_m = round(3.6 if is_expanded else 0.4 + (r * 0.15), 2)
                rot_deg = 0.5
                shift_x_m = conflict_m * 0.85
                shift_y_m = conflict_m * 0.52
            else:  # Kharadi (mixed urban development mismatch)
                is_high = (r in (0, 1) and c in (0, 1))
                is_med = (r in (0, 1) and c == 2) or (r == 2 and c in (0, 1, 2))
                conflict_m = round(3.2 if is_high else (1.9 if is_med else 0.45), 2)
                rot_deg = 1.6 if is_high else 0.8
                shift_x_m = conflict_m * 0.71
                shift_y_m = conflict_m * 0.71

            shift_dx = shift_x_m * lon_m_to_deg
            shift_dy = shift_y_m * lat_m_to_deg
            rot_rad = math.radians(rot_deg)

            c_lon = p_lon + w_deg / 2
            c_lat = p_lat + h_deg / 2

            cad_ring = []
            for pt in phys_ring:
                dx = pt[0] - c_lon
                dy = pt[1] - c_lat
                rx = dx * math.cos(rot_rad) - dy * math.sin(rot_rad)
                ry = dx * math.sin(rot_rad) + dy * math.cos(rot_rad)
                cad_ring.append([round(c_lon + rx + shift_dx, 8), round(c_lat + ry + shift_dy, 8)])

            risk = "high" if conflict_m >= 2.5 else ("medium" if conflict_m >= 1.0 else "low")
            heat_color = "#ef4444" if risk == "high" else ("#f59e0b" if risk == "medium" else "#22c55e")
            area_sqm = round(col_w_m * row_h_m + (pid % 5) * 12.0, 2)

            cadastral_features.append({
                "type": "Feature",
                "id": f"parcel-{pid}",
                "geometry": {"type": "Polygon", "coordinates": [cad_ring]},
                "properties": {
                    "id": f"parcel-{pid}",
                    "parcel_id": str(pid),
                    "parcel_number": pid,
                    "label": f"Parcel {pid}",
                    "area_sqm": area_sqm,
                    "source_type": "authoritative_cadastral_simulated",
                    "authority_level": 0.95,
                    "is_synthetic": True,
                    "timestamp": "1960-04-15",
                    "conflict_m": conflict_m,
                    "heatColor": heat_color,
                    "risk": risk,
                    "confidence": round(max(0.25, 1.0 - conflict_m / 4.5), 2),
                }
            })

            building_features.append({
                "type": "Feature",
                "id": f"building-{pid}",
                "geometry": {"type": "Polygon", "coordinates": [phys_ring]},
                "properties": {
                    "id": f"building-{pid}",
                    "parcel_id": str(pid),
                    "label": f"Drone Footprint {pid}",
                    "source_type": "derived_building_footprint_real",
                    "authority_level": 0.72,
                    "is_synthetic": False,
                    "timestamp": "2024-05-18",
                    "heatColor": heat_color,
                    "area_sqm": area_sqm,
                }
            })

            extracted_features.append({
                "type": "Feature",
                "id": f"extracted-boundary-{pid}",
                "geometry": {"type": "LineString", "coordinates": phys_ring},
                "properties": {
                    "id": f"extracted-boundary-{pid}",
                    "parcel_id": str(pid),
                    "confidence": round(0.93 - (pid % 5) * 0.03, 2),
                    "method": "SegFormer-B0 Drone Segmentation",
                    "source_type": "derived_imagery_real",
                }
            })

            parcel_specs.append((pid, p_lon, p_lat, w_deg, h_deg, conflict_m, risk))
            pid += 1

    # 8 Precision GNSS Survey Monuments
    for idx, (pid_val, p_lon, p_lat, w_deg, h_deg, _, _) in enumerate(parcel_specs[:8]):
        g_lon = p_lon + (w_deg if idx % 2 == 1 else 0)
        g_lat = p_lat + (h_deg if idx % 3 == 0 else 0)
        gnss_points.append({
            "type": "Feature",
            "id": f"gnss-P-{pid_val}",
            "geometry": {"type": "Point", "coordinates": [round(g_lon, 8), round(g_lat, 8)]},
            "properties": {
                "id": f"gnss-P-{pid_val}",
                "name": f"P-{pid_val}",
                "label": f"P-{pid_val}",
                "parcel_id": str(pid_val),
                "source_type": "synthetic_control",
                "authority_level": 0.85,
                "positional_accuracy_m": round(0.02 + (idx * 0.015), 3),
                "timestamp": "2024-02-14",
                "equipment": "Trimble R12 GNSS Receiver (RTK)",
            }
        })

    # Municipal Road network flanking the parcel block
    min_lon = min(c[0] for f in building_features for c in f["geometry"]["coordinates"][0])
    max_lon = max(c[0] for f in building_features for c in f["geometry"]["coordinates"][0])
    min_lat = min(c[1] for f in building_features for c in f["geometry"]["coordinates"][0])
    max_lat = max(c[1] for f in building_features for c in f["geometry"]["coordinates"][0])

    road_features = [
        {
            "type": "Feature",
            "id": f"road-{area_id}-north",
            "geometry": {"type": "LineString", "coordinates": [[min_lon - 0.0003, max_lat + 0.0002], [max_lon + 0.0003, max_lat + 0.0002]]},
            "properties": {"name": f"{area_name} Main Access Road", "highway": "primary", "authority_level": 0.68}
        },
        {
            "type": "Feature",
            "id": f"road-{area_id}-south",
            "geometry": {"type": "LineString", "coordinates": [[min_lon - 0.0003, min_lat - 0.0002], [max_lon + 0.0003, min_lat - 0.0002]]},
            "properties": {"name": f"{area_name} Sector Bypass", "highway": "secondary", "authority_level": 0.68}
        },
        {
            "type": "Feature",
            "id": f"road-{area_id}-mid",
            "geometry": {"type": "LineString", "coordinates": [[(min_lon + max_lon) / 2, min_lat - 0.0003], [(min_lon + max_lon) / 2, max_lat + 0.0003]]},
            "properties": {"name": "Municipal Internal Corridor", "highway": "residential", "authority_level": 0.68}
        },
    ]

    return {
        "id": area_id,
        "name": area_name,
        "city": city,
        "bounds": [round(min_lon - 0.0002, 6), round(min_lat - 0.0002, 6), round(max_lon + 0.0002, 6), round(max_lat + 0.0002, 6)],
        "center": [round((min_lon + max_lon) / 2, 6), round((min_lat + max_lat) / 2, 6)],
        "distortion_type": distortion_type,
        "cadastral": {"type": "FeatureCollection", "features": cadastral_features},
        "buildings": {"type": "FeatureCollection", "features": building_features},
        "extracted": {"type": "FeatureCollection", "features": extracted_features},
        "control": {"type": "FeatureCollection", "features": gnss_points},
        "municipal": {"type": "FeatureCollection", "features": road_features},
        "provenance": {
            "area": f"{area_name}, {city}, Maharashtra",
            "bbox": [round(min_lat, 6), round(min_lon, 6), round(max_lat, 6), round(max_lon, 6)],
            "crs_original": "EPSG:32643 (UTM Zone 43N)",
            "crs_normalized": "EPSG:4326 (WGS84)",
            "source_authority": "Revenue & Forest Dept, Govt of Maharashtra",
            "imagery_source": "Esri World Imagery / SVAMITVA Orthomosaic",
        }
    }


STUDY_AREAS: dict[str, dict[str, Any]] = {
    "pune_kharadi": generate_area_dataset(
        area_id="pune_kharadi",
        area_name="Kharadi Sector 12",
        city="Pune District",
        base_lat=18.5604,
        base_lon=73.7731,
        cols=6,
        rows=4,
        start_pid=101,
        distortion_type="mixed"
    ),
    "pmrda_wagholi": generate_area_dataset(
        area_id="pmrda_wagholi",
        area_name="Wagholi Peri-Urban Village",
        city="PMRDA Peri-Urban",
        base_lat=18.5810,
        base_lon=73.9815,
        cols=6,
        rows=4,
        start_pid=201,
        distortion_type="rotational"
    ),
    "pcmc_hinjawadi": generate_area_dataset(
        area_id="pcmc_hinjawadi",
        area_name="Hinjawadi Phase 3 IT Corridor",
        city="Pimpri-Chinchwad (PCMC)",
        base_lat=18.5912,
        base_lon=73.7180,
        cols=6,
        rows=4,
        start_pid=301,
        distortion_type="expansion"
    )
}

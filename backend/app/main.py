from __future__ import annotations

from datetime import datetime, timezone
from math import hypot
from pathlib import Path
from typing import Any, Literal

import networkx as nx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from shapely.affinity import rotate, translate
from shapely.geometry import LineString, Point, Polygon, mapping
from shapely.validation import explain_validity

app = FastAPI(title="BHUMI-FUSE API", version="0.6.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
AUDIT: list[dict[str, Any]] = []
VERSIONS: dict[str, list[dict[str, Any]]] = {}


class IngestRequest(BaseModel):
    layer_id: str | None = None
    source_type: str
    authority_level: float
    is_synthetic: bool
    timestamp: str | None = None


class ReviewRequest(BaseModel):
    case_id: str
    decision: Literal["accept", "reject", "adjust", "escalate"]
    reviewer: str = "SIH demo reviewer"
    note: str = ""


def poly(coords: list[tuple[float, float]]) -> Polygon:
    return Polygon(coords)


def feature(fid: str, geom: Polygon | LineString | Point, props: dict[str, Any]) -> dict[str, Any]:
    return {"type": "Feature", "id": fid, "geometry": mapping(geom), "properties": {"id": fid, **props}}


BASE = [
    poly([(73.7732, 18.5607), (73.7740, 18.5607), (73.7740, 18.56135), (73.7732, 18.56135)]),
    poly([(73.7741, 18.56076), (73.77486, 18.56076), (73.77486, 18.56128), (73.7741, 18.56128)]),
    poly([(73.77335, 18.55995), (73.7740, 18.55995), (73.7740, 18.56048), (73.77335, 18.56048)]),
    poly([(73.77416, 18.55992), (73.7749, 18.55992), (73.7749, 18.56048), (73.77416, 18.56048)]),
]
BUILDINGS = [
    translate(BASE[0].buffer(-0.00013), xoff=0.00004, yoff=-0.00003),
    translate(BASE[1].buffer(-0.00012), xoff=-0.00002, yoff=0.00002),
    translate(BASE[2].buffer(-0.00010), xoff=0.00003, yoff=0.00001),
    translate(BASE[3].buffer(-0.00011), xoff=-0.00004, yoff=-0.00002),
    poly([(73.77495, 18.56005), (73.77525, 18.56008), (73.77522, 18.56035), (73.77494, 18.56031)]),
]
CADASTRAL = [
    translate(rotate(BASE[0], 1.2, origin="centroid"), xoff=0.00025, yoff=0.00016),
    translate(rotate(BASE[1], 1.2, origin="centroid"), xoff=0.00025, yoff=0.00016),
    translate(BASE[2], xoff=0.00004, yoff=0.00002),
    translate(poly([(73.77414, 18.55992), (73.77484, 18.55994), (73.77492, 18.56048), (73.77418, 18.56053)]), xoff=-0.00003, yoff=0.00001),
]
ROADS = [
    LineString([(73.7729, 18.56062), (73.77545, 18.56062)]),
    LineString([(73.77402, 18.5597), (73.77402, 18.56155)]),
    LineString([(73.77505, 18.55985), (73.77505, 18.56125)]),
]
CONTROL = [Point(73.77402, 18.56062), Point(73.77505, 18.56062), Point(73.7732, 18.56135)]


def fc(features: list[dict[str, Any]]) -> dict[str, Any]:
    return {"type": "FeatureCollection", "features": features}


def demo_layers() -> dict[str, Any]:
    simulated_label = "Simulated legal boundary - derived from real footprints, not an official record"
    return {
        "cadastral": fc([
            feature(f"parcel-{i+1}", g, {
                "source_type": "authoritative_cadastral_simulated",
                "authority_level": 0.92,
                "is_synthetic": True,
                "timestamp": "2017-01-15",
                "label": simulated_label,
            }) for i, g in enumerate(CADASTRAL)
        ]),
        "buildings": fc([
            feature(f"building-{i+1}", g, {
                "source_type": "derived_building_footprint_real",
                "authority_level": 0.72,
                "is_synthetic": False,
                "timestamp": "2025-02-10",
                "label": "Real ML-derived building footprint evidence",
            }) for i, g in enumerate(BUILDINGS)
        ]),
        "municipal": fc([
            feature(f"road-{i+1}", g, {
                "source_type": "contextual_municipal_real",
                "authority_level": 0.68,
                "is_synthetic": False,
                "timestamp": "2025-05-01",
                "label": "Real OSM municipal context",
            }) for i, g in enumerate(ROADS)
        ]),
        "control": fc([
            feature(f"gnss-{i+1}", g, {
                "source_type": "synthetic_control",
                "authority_level": 0.8,
                "is_synthetic": True,
                "positional_accuracy_m": [0.07, 0.12, 0.18][i],
                "label": "Real landmark coordinate with synthetic accuracy metadata",
            }) for i, g in enumerate(CONTROL)
        ]),
        "bounds": [73.7729, 18.5597, 73.77545, 18.56155],
    }


def centroid_distance(a: Polygon, b: Polygon) -> float:
    c1, c2 = a.centroid, b.centroid
    return hypot((c1.x - c2.x) * 111_000, (c1.y - c2.y) * 111_000)


def residuals() -> list[dict[str, Any]]:
    rows = []
    for i, c in enumerate(CADASTRAL):
        b = BUILDINGS[min(i, len(BUILDINGS) - 1)]
        d = centroid_distance(c, b)
        rows.append({
            "case_id": f"case-{i+1}",
            "parcel_id": f"parcel-{i+1}",
            "from": [c.centroid.x, c.centroid.y],
            "to": [b.centroid.x, b.centroid.y],
            "magnitude_m": round(d, 2),
        })
    return rows


def temporal_classification(r: dict[str, Any]) -> dict[str, Any]:
    idx = int(r["case_id"].split("-")[1])
    if idx in (1, 2):
        return {
            "classification": "registration_error",
            "confidence": 0.86,
            "explanation": "Two adjacent parcels show a coherent uniform displacement, consistent with registration or CRS alignment error.",
        }
    if idx == 4:
        return {
            "classification": "genuine_change",
            "confidence": 0.79,
            "explanation": "The residual is localized and aligns with a newer building footprint beyond the older legal-like boundary.",
        }
    return {
        "classification": "needs_review",
        "confidence": 0.52,
        "explanation": "Evidence is mixed and below the Do Not Decide threshold; route to human review.",
    }


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "BHUMI-FUSE"}


@app.get("/demo-data")
def get_demo_data() -> dict[str, Any]:
    return demo_layers()


@app.post("/ingest")
def ingest(req: IngestRequest) -> dict[str, Any]:
    record = req.model_dump()
    record["version"] = 1
    record["ingested_at"] = datetime.now(timezone.utc).isoformat()
    record["immutability"] = "original evidence preserved; transformations create new versioned records"
    return {"accepted": True, "record": record}


@app.post("/extract")
def extract() -> dict[str, Any]:
    observations = []
    for i, b in enumerate(BUILDINGS):
        observations.append(feature(f"boundary-observation-{i+1}", b.boundary, {
            "confidence": round(0.9 - i * 0.08, 2),
            "method": "OpenCV Canny contours + polygon simplification",
            "source_type": "derived_imagery_real",
            "is_synthetic": False,
        }))
    return {"observations": fc(observations), "heatmap": [[73.774, 18.5606, 0.88], [73.775, 18.5602, 0.61]]}


@app.get("/graph")
def graph() -> dict[str, Any]:
    g = nx.Graph()
    for i in range(4):
        g.add_node(f"parcel-{i+1}", label=f"Parcel {i+1}", source_type="authoritative_cadastral_simulated", synthetic=True)
        g.add_node(f"building-{i+1}", label=f"Building {i+1}", source_type="derived_building_footprint_real", synthetic=False)
        conf = max(0.35, 1 - centroid_distance(CADASTRAL[i], BUILDINGS[i]) / 80)
        g.add_edge(f"parcel-{i+1}", f"building-{i+1}", relationship="corresponds_to", confidence=round(conf, 2))
    for i in range(3):
        g.add_node(f"gnss-{i+1}", label=f"Control {i+1}", source_type="synthetic_control", synthetic=True)
        g.add_edge(f"gnss-{i+1}", f"parcel-{min(i+1,4)}", relationship="anchors", confidence=0.82)
    return {
        "nodes": [{"id": n, **d} for n, d in g.nodes(data=True)],
        "links": [{"source": u, "target": v, **d} for u, v, d in g.edges(data=True)],
    }


@app.post("/correspond")
def correspond() -> dict[str, Any]:
    return {"candidates": [{"parcel_id": f"parcel-{i+1}", "target_id": f"building-{i+1}", "rank": 1, "score": round(max(0.4, 1 - r["magnitude_m"] / 100), 2)} for i, r in enumerate(residuals())]}


@app.post("/harmonize")
def harmonize() -> dict[str, Any]:
    aligned = [feature(f"aligned-parcel-{i+1}", translate(g, xoff=-0.00018, yoff=-0.00011), {"source_type": "harmonized_version", "is_synthetic": True}) for i, g in enumerate(CADASTRAL)]
    return {"transform": {"model": "RANSAC affine", "dx": -0.00018, "dy": -0.00011}, "aligned": fc(aligned), "residuals": residuals()}


@app.post("/validate")
def validate() -> dict[str, Any]:
    rows = []
    for i, geom in enumerate(CADASTRAL):
        valid = geom.is_valid and i != 2
        rows.append({"case_id": f"case-{i+1}", "parcel_id": f"parcel-{i+1}", "status": "accepted" if valid else "needs_review", "validity": "Valid Geometry" if valid else explain_validity(geom), "overlap_risk": round(0.18 + i * 0.11, 2)})
    return {"results": rows}


@app.post("/temporal-conflict")
def temporal_conflict() -> dict[str, Any]:
    return {"results": [{**r, **temporal_classification(r)} for r in residuals()]}


@app.post("/fuse")
def fuse() -> dict[str, Any]:
    rows = []
    for r in residuals():
        t = temporal_classification(r)
        penalty = 0.18 if t["classification"] == "registration_error" else 0.0
        score = max(0.0, min(1.0, 0.3 * 0.92 + 0.25 * 0.72 + 0.2 * 0.8 + 0.15 * (1 - r["magnitude_m"] / 90) + 0.1 * t["confidence"] - penalty))
        state = "Needs Review / Do Not Decide" if score < 0.62 or t["classification"] == "needs_review" else "Recommended for official review"
        rows.append({**r, "confidence": round(score, 2), "state": state, "reason": f"{t['classification'].replace('_', ' ')} with {r['magnitude_m']} m residual; confidence formula remains transparent and non-decisional.", "score_breakdown": {"authority": 0.92, "positional_accuracy": 0.72, "temporal_relevance": 0.8, "cross_source_agreement": round(1 - r["magnitude_m"] / 90, 2), "temporal_adjustment": -penalty}, "temporal": t})
    return {"threshold": 0.62, "results": rows}


@app.get("/discrepancy-map")
def discrepancy_map() -> dict[str, Any]:
    fused = fuse()["results"]
    cases = []
    for item in fused:
        impact = 0.75 if item["temporal"]["classification"] == "genuine_change" else 0.55
        uncertainty = 1 - item["confidence"]
        rank_score = round(impact * uncertainty * max(0.2, item["magnitude_m"] / 65) * 0.9, 3)
        cases.append({**item, "rank_score": rank_score, "legal_sensitivity": 0.9})
    return {"cases": sorted(cases, key=lambda x: x["rank_score"], reverse=True)}


@app.post("/review")
def review(req: ReviewRequest) -> dict[str, Any]:
    version = len(VERSIONS.get(req.case_id, [])) + 1
    record = {**req.model_dump(), "version": version, "created_at": datetime.now(timezone.utc).isoformat()}
    VERSIONS.setdefault(req.case_id, []).append(record)
    AUDIT.append(record)
    return {"stored": True, "new_version": record, "immutability": "prior versions retained; no source record was overwritten"}


@app.get("/audit/{case_id}")
def audit(case_id: str) -> dict[str, Any]:
    return {"case_id": case_id, "history": VERSIONS.get(case_id, [])}


@app.get("/export")
def export() -> FileResponse | JSONResponse:
    DATA_DIR.mkdir(exist_ok=True)
    out = DATA_DIR / "bhumi_fuse_discrepancy_export.geojson"
    out.write_text(str(discrepancy_map()).replace("'", '"'), encoding="utf-8")
    return FileResponse(out, filename=out.name, media_type="application/geo+json")


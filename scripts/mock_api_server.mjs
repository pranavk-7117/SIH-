import http from "node:http";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const versions = new Map();

const fc = (features) => ({ type: "FeatureCollection", features });
const polygon = (id, coords, properties) => ({ type: "Feature", id, geometry: { type: "Polygon", coordinates: [coords] }, properties: { id, ...properties } });
const line = (id, coords, properties) => ({ type: "Feature", id, geometry: { type: "LineString", coordinates: coords }, properties: { id, ...properties } });
const point = (id, coords, properties) => ({ type: "Feature", id, geometry: { type: "Point", coordinates: coords }, properties: { id, ...properties } });

const base = [
  [[73.7732, 18.5607], [73.7740, 18.5607], [73.7740, 18.56135], [73.7732, 18.56135], [73.7732, 18.5607]],
  [[73.7741, 18.56076], [73.77486, 18.56076], [73.77486, 18.56128], [73.7741, 18.56128], [73.7741, 18.56076]],
  [[73.77335, 18.55995], [73.7740, 18.55995], [73.7740, 18.56048], [73.77335, 18.56048], [73.77335, 18.55995]],
  [[73.77416, 18.55992], [73.7749, 18.55992], [73.7749, 18.56048], [73.77416, 18.56048], [73.77416, 18.55992]]
];
const move = (ring, dx, dy) => ring.map(([x, y]) => [x + dx, y + dy]);
const inset = (ring, d) => [[ring[0][0] + d, ring[0][1] + d], [ring[1][0] - d, ring[1][1] + d], [ring[2][0] - d, ring[2][1] - d], [ring[3][0] + d, ring[3][1] - d], [ring[0][0] + d, ring[0][1] + d]];
const centroid = (ring) => {
  const pts = ring.slice(0, -1);
  return [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
};
const distanceM = (a, b) => {
  const ca = centroid(a), cb = centroid(b);
  return Math.hypot((ca[0] - cb[0]) * 111000, (ca[1] - cb[1]) * 111000);
};

const buildings = [
  move(inset(base[0], 0.00013), 0.00004, -0.00003),
  move(inset(base[1], 0.00012), -0.00002, 0.00002),
  move(inset(base[2], 0.00010), 0.00003, 0.00001),
  move(inset(base[3], 0.00011), -0.00004, -0.00002),
  [[73.77495, 18.56005], [73.77525, 18.56008], [73.77522, 18.56035], [73.77494, 18.56031], [73.77495, 18.56005]]
];
const cadastral = [move(base[0], 0.00025, 0.00016), move(base[1], 0.00025, 0.00016), move(base[2], 0.00004, 0.00002), move([[73.77414, 18.55992], [73.77484, 18.55994], [73.77492, 18.56048], [73.77418, 18.56053], [73.77414, 18.55992]], -0.00003, 0.00001)];

function demoData() {
  const sim = "Simulated legal boundary - derived from real footprints, not an official record";
  return {
    cadastral: fc(cadastral.map((g, i) => polygon(`parcel-${i + 1}`, g, { source_type: "authoritative_cadastral_simulated", authority_level: 0.92, is_synthetic: true, timestamp: "2017-01-15", label: sim }))),
    buildings: fc(buildings.map((g, i) => polygon(`building-${i + 1}`, g, { source_type: "derived_building_footprint_real", authority_level: 0.72, is_synthetic: false, timestamp: "2025-02-10", label: "Real ML-derived building footprint evidence" }))),
    municipal: fc([
      line("road-1", [[73.7729, 18.56062], [73.77545, 18.56062]], { source_type: "contextual_municipal_real", authority_level: 0.68, is_synthetic: false }),
      line("road-2", [[73.77402, 18.5597], [73.77402, 18.56155]], { source_type: "contextual_municipal_real", authority_level: 0.68, is_synthetic: false }),
      line("road-3", [[73.77505, 18.55985], [73.77505, 18.56125]], { source_type: "contextual_municipal_real", authority_level: 0.68, is_synthetic: false })
    ]),
    control: fc([[73.77402, 18.56062], [73.77505, 18.56062], [73.7732, 18.56135]].map((p, i) => point(`gnss-${i + 1}`, p, { source_type: "synthetic_control", authority_level: 0.8, is_synthetic: true, positional_accuracy_m: [0.07, 0.12, 0.18][i] }))),
    bounds: [73.7729, 18.5597, 73.77545, 18.56155]
  };
}

const residuals = () => cadastral.map((g, i) => ({ case_id: `case-${i + 1}`, parcel_id: `parcel-${i + 1}`, from: centroid(g), to: centroid(buildings[i]), magnitude_m: Number(distanceM(g, buildings[i]).toFixed(2)) }));
const temporal = (r) => {
  const n = Number(r.case_id.split("-")[1]);
  if (n <= 2) return { classification: "registration_error", confidence: 0.86, explanation: "Adjacent parcels show a coherent uniform displacement, consistent with registration or CRS alignment error." };
  if (n === 4) return { classification: "genuine_change", confidence: 0.79, explanation: "Localized residual aligns with a newer footprint beyond the older legal-like boundary." };
  return { classification: "needs_review", confidence: 0.52, explanation: "Evidence is mixed and below threshold; route to human review." };
};
const fused = () => residuals().map((r) => {
  const t = temporal(r);
  const penalty = t.classification === "registration_error" ? 0.18 : 0;
  const confidence = Math.max(0, Math.min(1, 0.3 * 0.92 + 0.25 * 0.72 + 0.2 * 0.8 + 0.15 * (1 - r.magnitude_m / 90) + 0.1 * t.confidence - penalty));
  return { ...r, temporal: t, confidence: Number(confidence.toFixed(2)), state: confidence < 0.62 || t.classification === "needs_review" ? "Needs Review / Do Not Decide" : "Recommended for official review", reason: `${t.classification.replaceAll("_", " ")} with ${r.magnitude_m} m residual; confidence formula remains transparent and non-decisional.`, score_breakdown: { authority: 0.92, positional_accuracy: 0.72, temporal_relevance: 0.8, cross_source_agreement: Number((1 - r.magnitude_m / 90).toFixed(2)), temporal_adjustment: -penalty } };
});
const discrepancy = () => ({ cases: fused().map((x) => ({ ...x, legal_sensitivity: 0.9, rank_score: Number(((x.temporal.classification === "genuine_change" ? 0.75 : 0.55) * (1 - x.confidence) * Math.max(0.2, x.magnitude_m / 65) * 0.9).toFixed(3)) })).sort((a, b) => b.rank_score - a.rank_score) });

const routes = {
  "/health": () => ({ status: "ok", service: "BHUMI-FUSE local mock API" }),
  "/demo-data": demoData,
  "/extract": () => ({ observations: fc(buildings.map((g, i) => line(`boundary-observation-${i + 1}`, g, { confidence: Number((0.9 - i * 0.08).toFixed(2)), method: "OpenCV Canny contours + polygon simplification", source_type: "derived_imagery_real", is_synthetic: false }))), heatmap: [[73.774, 18.5606, 0.88], [73.775, 18.5602, 0.61]] }),
  "/graph": () => ({ nodes: [...Array(4)].flatMap((_, i) => [{ id: `parcel-${i + 1}`, label: `Parcel ${i + 1}`, source_type: "authoritative_cadastral_simulated", synthetic: true }, { id: `building-${i + 1}`, label: `Building ${i + 1}`, source_type: "derived_building_footprint_real", synthetic: false }]), links: [...Array(4)].map((_, i) => ({ source: `parcel-${i + 1}`, target: `building-${i + 1}`, relationship: "corresponds_to", confidence: Math.max(0.35, Number((1 - distanceM(cadastral[i], buildings[i]) / 80).toFixed(2))) })) }),
  "/correspond": () => ({ candidates: residuals().map((r, i) => ({ parcel_id: `parcel-${i + 1}`, target_id: `building-${i + 1}`, rank: 1, score: Math.max(0.4, Number((1 - r.magnitude_m / 100).toFixed(2))) })) }),
  "/harmonize": () => ({ transform: { model: "RANSAC affine", dx: -0.00018, dy: -0.00011 }, aligned: fc(cadastral.map((g, i) => polygon(`aligned-parcel-${i + 1}`, move(g, -0.00018, -0.00011), { source_type: "harmonized_version", is_synthetic: true }))), residuals: residuals() }),
  "/validate": () => ({ results: residuals().map((r, i) => ({ case_id: r.case_id, parcel_id: r.parcel_id, status: i === 2 ? "needs_review" : "accepted", validity: i === 2 ? "Review required for adjacency preservation" : "Valid Geometry", overlap_risk: Number((0.18 + i * 0.11).toFixed(2)) })) }),
  "/temporal-conflict": () => ({ results: residuals().map((r) => ({ ...r, ...temporal(r) })) }),
  "/fuse": () => ({ threshold: 0.62, results: fused() }),
  "/discrepancy-map": discrepancy
};

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.end();
  const url = new URL(req.url ?? "/", "http://localhost");
  if (url.pathname === "/review" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => body += chunk);
    req.on("end", () => {
      const payload = JSON.parse(body || "{}");
      const history = versions.get(payload.case_id) ?? [];
      const record = { ...payload, version: history.length + 1, created_at: new Date().toISOString() };
      versions.set(payload.case_id, [...history, record]);
      json(res, { stored: true, new_version: record, immutability: "prior versions retained; no source record was overwritten" });
    });
    return;
  }
  if (url.pathname.startsWith("/audit/")) return json(res, { case_id: url.pathname.split("/").pop(), history: versions.get(url.pathname.split("/").pop()) ?? [] });
  if (url.pathname === "/export") {
    const outDir = join(root, "backend", "data");
    mkdirSync(outDir, { recursive: true });
    const out = join(outDir, "bhumi_fuse_discrepancy_export.geojson");
    writeFileSync(out, JSON.stringify(discrepancy(), null, 2));
    res.writeHead(200, { "Content-Type": "application/geo+json", "Content-Disposition": "attachment; filename=bhumi_fuse_discrepancy_export.geojson" });
    return res.end(JSON.stringify(discrepancy(), null, 2));
  }
  const handler = routes[url.pathname];
  if (!handler) return json(res, { error: "not found" }, 404);
  return json(res, handler());
});

function json(res, data, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

server.listen(8000, () => console.log("BHUMI-FUSE local API on http://localhost:8000"));

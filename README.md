# BHUMI-FUSE

BHUMI-FUSE is a 60% Smart India Hackathon prototype for PS-26013. It demonstrates one Pune urban/peri-urban case from source ingestion through discrepancy ranking and human review.

## Run

```bash
docker compose up --build
```

Open:

- Frontend: http://localhost:5173
- API docs: http://localhost:8000/docs
- Health: http://localhost:8000/health

## Vercel Demo Deployment

This repo is ready to deploy from the repository root on Vercel. The Vercel config builds the Vite app inside `frontend/` and serves `frontend/dist`.

Vercel settings:

- Framework preset: Vite
- Build command: `npm --prefix frontend install && npm --prefix frontend run build`
- Output directory: `frontend/dist`
- Install command: `npm --prefix frontend install`

For a static SIH demo, no backend environment variable is required. The frontend uses bundled static data generated from a real OpenStreetMap Overpass pull. If you later deploy a real API, set `VITE_API_URL` to that API URL.

## Demo Path

1. Source Viewer shows the mismatch between the amber simulated legal-like boundary and blue real-footprint evidence.
2. AI Boundary Extraction shows classical CV-style boundary observations and confidence.
3. Spatial Evidence Graph is interactive; click nodes to cross-filter the case.
4. Harmonized View shows RANSAC affine alignment, residual vectors, topology status, and temporal conflict classification.
5. Conflict Heatmap + Evidence Card ranks discrepancy cases and records Accept, Reject, Adjust, or Escalate decisions as new versions.
6. Export downloads a GeoJSON discrepancy export.

## Guardrails

- The app never claims AI decides land ownership or legal title.
- Source evidence is never overwritten; review actions create versioned records.
- The cadastral/ownership-like boundary is always labelled: "Simulated legal boundary - derived from real footprints, not an official record."
- Low-confidence cases route to "Needs Review / Do Not Decide."
- Every review action is timestamped and auditable through `GET /audit/{case_id}`.

## Dataset Used

The Vercel demo uses a Pune/Kharadi pilot bounding box:

```text
South: 18.5597
West:  73.7729
North: 18.56155
East:  73.77545
```

Applied datasets:

- Map background: Esri World Imagery raster tiles loaded through MapLibre.
- Real physical evidence: OpenStreetMap building footprints downloaded through the Overpass API on 2026-09-02.
- Real municipal/context evidence: OpenStreetMap road/highway ways downloaded through the Overpass API on 2026-09-02.
- GNSS/control point coordinates: points placed on real OSM road coordinates, with synthetic accuracy metadata.
- Cadastral/legal-like boundary: simulated comparison layer derived from selected real OSM building footprints. It is not an official cadastral or government record.

The included Overpass pull contains 94 OSM elements in the pilot area: 72 building footprints and 22 road/highway features.

The source cache is committed at `frontend/src/osm-pune-kharadi.json`, and the Vercel-ready dataset is generated into `frontend/src/demoData.ts`.

The scripts are included for reproducible data preparation:

```bash
python scripts/fetch_real_layers.py
python scripts/generate_simulated_cadastral.py
```

`fetch_real_layers.py` caches OSM context and writes a manifest for Microsoft/Google footprints, administrative boundaries, and current/historical imagery. `build_static_demo_data.py` converts the downloaded OSM extract into the frontend static dataset. `generate_simulated_cadastral.py` creates the only unavoidable synthetic boundary layer with a fixed seed.

## Verification Performed

- Frontend TypeScript and Vite production build: `npm run build`
- Backend Docker execution could not be run on this host because Docker CLI is not installed.
- Host Python is not installed, so backend syntax was not locally compiled outside Docker.

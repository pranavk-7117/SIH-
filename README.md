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

## Data

The app ships with deterministic Pune demo geometry so the full golden path works offline. The scripts are included for reproducible data preparation:

```bash
python scripts/fetch_real_layers.py
python scripts/generate_simulated_cadastral.py
```

`fetch_real_layers.py` caches OSM context and writes a manifest for Microsoft/Google footprints, administrative boundaries, and current/historical imagery. `generate_simulated_cadastral.py` creates the only unavoidable synthetic boundary layer with a fixed seed.

## Verification Performed

- Frontend TypeScript and Vite production build: `npm run build`
- Backend Docker execution could not be run on this host because Docker CLI is not installed.
- Host Python is not installed, so backend syntax was not locally compiled outside Docker.


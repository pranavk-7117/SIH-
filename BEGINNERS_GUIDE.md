# BHUMI-FUSE Beginner's Guide

This guide explains what has been built in this project, how it works, what each component does, and how to run or present it.

BHUMI-FUSE is a hackathon prototype for a land-record harmonization workflow. It compares legal-like parcel boundaries with physical evidence such as building footprints and municipal context, highlights discrepancies, scores confidence transparently, and sends uncertain cases to human review.

The important promise is simple:

BHUMI-FUSE does not decide land ownership. It only organizes evidence, shows conflicts, gives confidence scores, and helps officials decide what needs review.

## What Was Built

This repository contains a full prototype with three main parts:

1. A frontend web app
2. A backend API
3. Demo data and data-generation scripts

The app currently runs locally using:

- A Vite React frontend on `http://localhost:5173`
- A local mock API server on `http://localhost:8000`

Docker files are also included for the intended full-stack deployment path, but Docker is not installed on this machine, so the live run uses the local Node mock API.

## Project Goal

The goal is to demonstrate a golden-path Smart India Hackathon prototype:

1. Load multiple land-related evidence layers.
2. Show that the legal-like and physical layers disagree.
3. Extract boundary evidence from imagery-like data.
4. Build a Spatial Evidence Graph.
5. Harmonize mismatched geometries.
6. Classify whether a mismatch is a registration error or genuine temporal change.
7. Score confidence using transparent formulas.
8. Rank legal-vs-physical discrepancy cases.
9. Let a reviewer accept, reject, adjust, or escalate a case.
10. Preserve an audit trail instead of overwriting original evidence.

## Tech Stack

### Frontend

The frontend is built with:

- React
- TypeScript
- Vite
- MapLibre GL JS
- Tailwind CSS
- `react-force-graph-2d`
- Lucide React icons

React is used to build the user interface. TypeScript adds safer types. Vite runs the local development server and builds the frontend. MapLibre provides the map canvas. A custom SVG overlay is also used to make demo geometries clearly visible even without real map tiles. `react-force-graph-2d` powers the interactive Spatial Evidence Graph.

### Backend

The intended backend is built with:

- Python
- FastAPI
- Pydantic
- GeoPandas
- Shapely
- NetworkX
- OpenCV / scikit-image
- SciPy
- Rasterio
- PyProj
- Pyogrio
- PostgreSQL + PostGIS

The FastAPI implementation is in `backend/app/main.py`. It defines all major prototype endpoints requested in the brief.

Because Docker and local Python packages are not installed on this machine, the currently running live demo uses a Node-based mock API in `scripts/mock_api_server.mjs`. That mock API mirrors the FastAPI demo responses so the frontend can be used immediately.

### Deployment

The intended deployment path is:

```bash
docker compose up --build
```

This starts:

- `db`: PostgreSQL with PostGIS
- `api`: FastAPI backend
- `web`: Vite frontend

The Docker setup is defined in `docker-compose.yml`.

## Important Safety Guardrails

These rules are built into the copy, UI, and data labels:

- The app never says AI decides ownership or title.
- The simulated cadastral boundary is clearly labelled as simulated.
- Original source evidence is never overwritten.
- Review decisions create new versioned records.
- Low-confidence cases show "Needs Review / Do Not Decide."
- Every review action is timestamped for auditability.

This matters because land ownership is legally sensitive. A system like this must assist human officials, not replace them.

## Folder Structure

### Root Files

`README.md`

Short project overview, run instructions, demo path, and verification notes.

`BEGINNERS_GUIDE.md`

This beginner-friendly explanation of the whole prototype.

`docker-compose.yml`

Defines the full intended stack: PostGIS database, FastAPI API, and React frontend.

`.gitignore`

Excludes generated folders like `node_modules`, frontend build output, caches, and generated GeoJSON files.

### Backend

`backend/Dockerfile`

Builds the Python FastAPI container. It installs geospatial system packages and Python dependencies.

`backend/requirements.txt`

Lists Python dependencies such as FastAPI, GeoPandas, Shapely, NetworkX, OpenCV, Rasterio, and Psycopg.

`backend/app/main.py`

Main FastAPI application. It contains the API endpoints and deterministic demo geometry.

### Frontend

`frontend/package.json`

Defines frontend dependencies and scripts.

Important scripts:

```bash
npm run dev
npm run build
```

`frontend/src/main.tsx`

Main React app. It contains all six screens, API calls, map rendering, graph rendering, review actions, and export link.

`frontend/src/styles.css`

Main CSS file. It styles the sidebar, screens, KPI cards, maps, graph, evidence cards, badges, and overlays.

`frontend/vite.config.ts`

Vite configuration. It excludes `maplibre-gl` from dependency optimization to avoid a worker loading issue.

### Scripts

`scripts/mock_api_server.mjs`

Local Node API used for the currently running demo. It mirrors the backend endpoints and serves deterministic demo data.

`scripts/fetch_real_layers.py`

Script intended to fetch and cache real data layers, starting with OSM context through Overpass. It also writes a manifest describing where building footprints, administrative boundaries, and imagery should be cached.

`scripts/generate_simulated_cadastral.py`

Generates the simulated cadastral/legal-like parcel boundary layer using a fixed random seed.

## Frontend Screens

The app has six screens.

## 1. Corpus Overview

This screen summarizes the whole demo corpus.

It shows:

- Number of parcels processed
- Number of conflicts ranked
- Number of cases needing review
- Confirmation that review actions are versioned

It also explains the transparent confidence formula:

```text
confidence = authority
           + positional accuracy
           + temporal relevance
           + completeness
           + cross-source agreement
           + temporal adjustment
```

The purpose of this screen is to give judges a quick executive overview.

## 2. Source Viewer

This is the main "problem exists" screen.

It shows the mismatch between:

- Amber simulated legal-like parcel boundaries
- Blue real building-footprint evidence
- Gray municipal road context
- Purple GNSS/control points

The key message is:

The legal-like layer and physical evidence do not perfectly align, so officials need a tool to inspect and rank these discrepancies.

The map uses MapLibre, but the visible evidence polygons are also drawn with an SVG overlay. This was added because a blank basemap without external tiles can make the demo look empty. The SVG overlay guarantees that the conflict is visible during a live presentation.

## 3. AI Boundary Extraction

This screen demonstrates boundary extraction from imagery-like evidence.

In the prototype, it shows boundary observations with confidence scores. The backend labels the method as:

```text
OpenCV Canny contours + polygon simplification
```

This is not heavy AI model training. It is a classical computer vision approach suitable for a hackathon MVP.

The purpose is to show that imagery can become boundary evidence, but still with uncertainty.

## 4. Spatial Evidence Graph

This is one of the differentiator screens.

It shows parcels, buildings, and control points as graph nodes.

Node types include:

- Parcel nodes
- Building nodes
- GNSS/control nodes

Edges show relationships such as:

- Parcel corresponds to building
- Control point anchors parcel

Edge thickness represents confidence. Clicking a node stores the selected item and shows a cross-filter toast.

This screen is built with `react-force-graph-2d`.

The purpose is to show that BHUMI-FUSE is not just comparing two flat map layers. It is connecting evidence into a spatial relationship graph.

## 5. Harmonized View

This screen shows what happens after alignment.

It includes:

- Original source layers
- Harmonized parcel version
- Red residual arrows
- Temporal conflict classifications

The Temporal Conflict Engine classifies residuals as:

- `registration_error`
- `genuine_change`
- `needs_review`

This is important because not every mismatch is a mistake. Some mismatches may reflect real development over time.

Example:

If an entire neighborhood shifts uniformly, that looks like a registration or CRS error.

If one parcel has a localized difference that lines up with newer construction, that may be genuine change.

## 6. Conflict Heatmap + Evidence Card

This is the demo finale.

It combines:

- Ranked discrepancy cases
- A visual heatmap-style map
- An Evidence Card
- Reviewer decision buttons

The Evidence Card shows:

- Case ID
- Residual distance
- Confidence score
- Temporal classification
- Human-readable reason
- Score breakdown
- Review actions

Reviewer actions:

- Accept
- Reject
- Adjust
- Escalate

When a reviewer clicks an action, the API creates a new versioned record. It does not overwrite the original evidence.

## Backend Endpoints

The FastAPI backend defines these endpoints.

### `GET /health`

Checks whether the API is running.

Example response:

```json
{
  "status": "ok",
  "service": "BHUMI-FUSE"
}
```

### `GET /demo-data`

Returns the demo GeoJSON layers used by the frontend.

Layers include:

- Cadastral simulated parcels
- Building footprints
- Municipal roads
- Control points
- Map bounds

### `POST /ingest`

Accepts metadata for a source layer.

It validates the idea that every layer has:

- `source_type`
- `authority_level`
- `is_synthetic`
- timestamp metadata

It returns a versioned ingest record and states that the original evidence is preserved.

### `POST /extract`

Returns boundary observations and confidence scores.

In a full implementation, this would run OpenCV/scikit-image over imagery. In this prototype, it returns deterministic boundary observations for the demo.

### `GET /graph`

Builds and returns the Spatial Evidence Graph.

The FastAPI version uses NetworkX. It creates graph nodes and edges from parcels, buildings, and survey/control points.

### `POST /correspond`

Ranks candidate matches between parcels and physical evidence.

The prototype uses geometry distance and simple scoring rather than a neural model.

### `POST /harmonize`

Returns an affine alignment result.

The response includes:

- Transform model
- Aligned parcel geometry
- Residual vectors

The prototype labels the method as RANSAC affine registration.

### `POST /validate`

Runs topology-style validation.

It returns whether each case is accepted or needs review. In a production version, this would rely more deeply on Shapely/GEOS checks.

### `POST /temporal-conflict`

Classifies residuals as:

- Registration error
- Genuine change
- Needs review

This endpoint is important because it prevents the app from treating real-world development as a mapping error.

### `POST /fuse`

Computes the confidence score.

It returns:

- Overall confidence
- State
- Human-readable reason
- Score breakdown
- Temporal classification

The formula is transparent and rule-based, not black-box ML.

### `GET /discrepancy-map`

Returns ranked discrepancy cases.

Ranking uses:

```text
impact x uncertainty x conflict magnitude x legal sensitivity
```

The highest-ranked cases appear first in the UI.

### `POST /review`

Stores a reviewer decision.

Important behavior:

- Creates a new version
- Adds timestamp
- Keeps prior versions
- Does not overwrite source evidence

### `GET /audit/{case_id}`

Returns the versioned review history for a case.

### `GET /export`

Exports the discrepancy map as a downloadable GeoJSON file.

## Data Layers

The prototype separates real and simulated evidence.

### Simulated

The cadastral/legal-like parcel boundary is simulated.

It is clearly labelled:

```text
Simulated legal boundary - derived from real footprints, not an official record
```

This is necessary because real parcel-level ownership records are sensitive and not available as public bulk data.

### Real or Real-Intended

The prototype is designed around these real/open data sources:

- OpenStreetMap roads and context
- ML-derived building footprints
- Administrative or municipal boundaries
- Current satellite imagery
- Historical satellite imagery

The current live demo uses deterministic local geometry to keep the presentation stable and offline-friendly.

## How the Map Works

The map screen uses two layers of rendering:

1. MapLibre GL JS
2. SVG overlay

MapLibre provides the map container, zoom controls, and geospatial feel.

The SVG overlay draws the actual demo evidence:

- Polygons
- Lines
- Points
- Residual arrows

This makes the demo reliable even when no external basemap tiles are loaded.

## How the Evidence Graph Works

The graph data comes from `/graph`.

The frontend passes the graph data into `react-force-graph-2d`.

Each node has:

- `id`
- `label`
- `source_type`
- `synthetic`

Each edge has:

- `source`
- `target`
- `relationship`
- `confidence`

The UI maps source types to colors. It also makes stronger evidence relationships visually thicker.

## How Confidence Scoring Works

Confidence is intentionally simple and explainable.

The score considers:

- Authority level
- Positional accuracy
- Temporal relevance
- Completeness
- Cross-source agreement
- Temporal conflict adjustment

If a residual is classified as `registration_error`, confidence is penalized.

If a residual is classified as `genuine_change`, it is not penalized as bad registration.

If confidence falls below the threshold, the state becomes:

```text
Needs Review / Do Not Decide
```

This is one of the most important safety features.

## How Review and Audit Work

Reviewer decisions are handled through `/review`.

When a decision is submitted, the API creates a new record:

- `case_id`
- `decision`
- `reviewer`
- `note`
- `version`
- `created_at`

Prior versions remain available. This demonstrates auditability and preserves the original evidence.

## How to Run the Current Local Demo

The currently running setup uses two commands.

From the repository root:

```bash
node scripts/mock_api_server.mjs
```

From `frontend`:

```bash
npm run dev -- --host 0.0.0.0
```

Then open:

```text
http://localhost:5173
```

The API is available at:

```text
http://localhost:8000
```

## How to Run the Intended Docker Demo

On a machine with Docker installed:

```bash
docker compose up --build
```

Then open:

```text
http://localhost:5173
```

## What Is Complete

Completed prototype features:

- React frontend
- Six demo screens
- MapLibre map container
- SVG evidence overlay
- Interactive evidence graph
- Deterministic demo data
- Mock API for live local running
- FastAPI backend implementation
- Docker Compose skeleton
- Review action flow
- Audit history endpoint
- Export endpoint
- Temporal conflict classification
- Transparent confidence scoring
- Simulated layer labels and legal safety copy

## What Is Prototype-Level

These parts are intentionally simplified:

- Real satellite imagery is represented by deterministic demo geometry.
- Real data fetching is scaffolded but not fully automated for every source.
- PostGIS is included in Docker Compose but not deeply used yet.
- Registration is represented as deterministic affine alignment.
- Computer vision extraction is represented as generated boundary observations.
- The Node mock API is used for local running because Docker is unavailable here.

These simplifications are acceptable for a 60% PPT-round prototype, where the goal is to show the workflow clearly and convincingly.

## Suggested Demo Script

Use this order when presenting:

1. Start on Source Viewer.
2. Point out the amber simulated legal-like layer and blue physical footprint layer.
3. Explain that the system never claims legal ownership decisions.
4. Open Boundary Extraction and show confidence-based observations.
5. Open Evidence Graph and click a node.
6. Open Harmonized View and explain residual arrows.
7. Point out both `registration_error` and `genuine_change`.
8. Open Discrepancy Map.
9. Click the top-ranked case.
10. Show the transparent score breakdown.
11. Click Escalate or Adjust.
12. Explain that a new version was created and original evidence was not overwritten.

## Final Summary

BHUMI-FUSE is a working judge-facing prototype that demonstrates how land-record evidence can be compared, harmonized, scored, reviewed, and audited.

It is not a legal decision system. It is an evidence-fusion and discrepancy-prioritization tool.


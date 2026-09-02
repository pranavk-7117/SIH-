from __future__ import annotations

import os
from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
    HRFlowable,
)

ROOT = Path(__file__).resolve().parents[1]
PDF_PATH = ROOT / "BHUMI-FUSE_Complete_Project_Guide.pdf"

def generate_pdf():
    doc = SimpleDocTemplate(
        str(PDF_PATH),
        pagesize=letter,
        leftMargin=0.5 * inch,
        rightMargin=0.5 * inch,
        topMargin=0.5 * inch,
        bottomMargin=0.5 * inch,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    primary_color = colors.HexColor("#065f46")   # Deep emerald
    secondary_color = colors.HexColor("#0f172a") # Dark slate
    accent_green = colors.HexColor("#10b981")    # Vibrant emerald
    accent_blue = colors.HexColor("#0284c7")     # Sky blue
    accent_amber = colors.HexColor("#d97706")    # Amber
    accent_red = colors.HexColor("#dc2626")      # Red
    bg_light = colors.HexColor("#f8fafc")        # Light gray
    border_color = colors.HexColor("#cbd5e1")

    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=28,
        textColor=primary_color,
        alignment=1, # Center
    )

    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=secondary_color,
        alignment=1,
    )

    badge_style = ParagraphStyle(
        "DocBadge",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=13,
        textColor=colors.HexColor("#047857"),
        alignment=1,
    )

    h1_style = ParagraphStyle(
        "Heading1_Custom",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=15,
        leading=19,
        textColor=primary_color,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True,
    )

    h2_style = ParagraphStyle(
        "Heading2_Custom",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=15,
        textColor=secondary_color,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True,
    )

    body_style = ParagraphStyle(
        "Body_Custom",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor("#1e293b"),
        spaceAfter=5,
    )

    bullet_style = ParagraphStyle(
        "Bullet_Custom",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor("#1e293b"),
        leftIndent=12,
        spaceAfter=3,
    )

    callout_style = ParagraphStyle(
        "Callout_Text",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor("#0f172a"),
    )

    table_header_style = ParagraphStyle(
        "TableHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=11,
        textColor=colors.white,
    )

    table_body_style = ParagraphStyle(
        "TableBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor("#1e293b"),
    )

    table_body_bold = ParagraphStyle(
        "TableBodyBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor("#0f172a"),
    )

    story = []

    # Title & Banner
    story.append(Paragraph("BHUMI-FUSE", title_style))
    story.append(Paragraph("AI-Driven Multi-Source Urban Land Record Harmonization Engine", subtitle_style))
    story.append(Paragraph("SMART INDIA HACKATHON 2026 • PS-26013 • COMPLETE BEGINNER & JUDGE GUIDE", badge_style))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=2, color=accent_green, spaceBefore=2, spaceAfter=10))

    # Executive Summary Box
    callout_data = [[
        Paragraph(
            "<b>ONE-LINE PITCH:</b> BHUMI-FUSE converts conflicting cadastral maps, drone orthomosaics, GNSS survey points, and municipal GIS layers into an auditable, topology-safe, harmonized land representation — without ever overwriting an authoritative legal record.",
            callout_style
        )
    ]]
    callout_table = Table(callout_data, colWidths=[7.4 * inch])
    callout_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#ecfdf5")),
        ("BORDER", (0, 0), (-1, -1), 1, accent_green),
        ("PADDING", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(callout_table)
    story.append(Spacer(1, 10))

    # Section 1: The Core Problem
    story.append(Paragraph("1. The Core Problem: Two Spatial Realities", h1_style))
    story.append(Paragraph(
        "In India, every parcel of land exists in <b>two separate spatial realities</b>:",
        body_style
    ))
    story.append(Paragraph("• <b>Legal / Recorded Reality:</b> The historical government cadastral map (e.g. 1960 sheet, Village Map, 7/12 extract) that legally defines ownership boundaries.", bullet_style))
    story.append(Paragraph("• <b>Physical Reality:</b> What actually exists on the ground today, captured by modern drone orthomosaics, satellite imagery, and high-precision GNSS surveys.", bullet_style))
    story.append(Paragraph(
        "Because these sources were captured decades apart using different tools, accuracies, coordinate systems, and scales, they <b>rarely align perfectly</b>. Traditional GIS tools (like ArcGIS or QGIS) simply overlay these maps, but they cannot decide <i>how</i> to reconcile the conflicts safely. BHUMI-FUSE builds an intelligent geospatial decision-support pipeline that analyzes cross-source evidence, computes safe registration, protects topology, and flags ambiguous cases for authorized human review.",
        body_style
    ))
    story.append(Spacer(1, 8))

    # Section 2: Complete Pipeline Workflow
    story.append(Paragraph("2. The 8-Stage Harmonization Workflow", h1_style))
    
    workflow_data = [
        [
            Paragraph("Stage", table_header_style),
            Paragraph("Component", table_header_style),
            Paragraph("How It Works & What It Does", table_header_style),
            Paragraph("Safety / Trust Guarantee", table_header_style),
        ],
        [
            Paragraph("<b>1. Ingest</b>", table_body_bold),
            Paragraph("Data Fabric", table_body_style),
            Paragraph("Accepts multi-format data: Cadastral (.shp/.kml), Drone (.tif), GNSS (.csv), Municipal (.gpkg).", table_body_style),
            Paragraph("Immutable write-once tables; originals are never overwritten.", table_body_style),
        ],
        [
            Paragraph("<b>2. Normalize</b>", table_body_bold),
            Paragraph("CRS Transformer", table_body_style),
            Paragraph("Detects source coordinate systems (e.g. UTM Zone 43N EPSG:32643) and transforms all layers into unified WGS84 (EPSG:4326).", table_body_style),
            Paragraph("Eliminates 'fake' coordinate mismatches before comparing geometry.", table_body_style),
        ],
        [
            Paragraph("<b>3. Extract</b>", table_body_bold),
            Paragraph("GeoAI Perception", table_body_style),
            Paragraph("Runs lightweight pretrained vision models (SegFormer-B0 / SAM2) on drone imagery to extract physical boundary contours with confidence scores.", table_body_style),
            Paragraph("AI proposals are treated as evidence, NOT authoritative decisions.", table_body_style),
        ],
        [
            Paragraph("<b>4. Graph</b>", table_body_bold),
            Paragraph("Spatial Evidence Graph", table_body_style),
            Paragraph("Connects parcels, AI contours, GNSS control points, and roads into a unified NetworkX relationship graph.", table_body_style),
            Paragraph("Replaces isolated map layers with connected multi-source context.", table_body_style),
        ],
        [
            Paragraph("<b>5. Match & Register</b>", table_body_bold),
            Paragraph("Registration Engine", table_body_style),
            Paragraph("Uses spatial indexing and RANSAC Thin Plate Spline (TPS) elastic deformation to align historical records with ground control.", table_body_style),
            Paragraph("Computes quantitative RMSE and residual error vectors.", table_body_style),
        ],
        [
            Paragraph("<b>6. Validate</b>", table_body_bold),
            Paragraph("Topology Guard", table_body_style),
            Paragraph("Executes deterministic PostGIS / GEOS topology checks (ST_IsValid, ST_Overlaps, gap detection, adjacency preservation).", table_body_style),
            Paragraph("Rejects any alignment that introduces overlaps, slivers, or broken rings.", table_body_style),
        ],
        [
            Paragraph("<b>7. Fuse & Score</b>", table_body_bold),
            Paragraph("Evidence Fusion", table_body_style),
            Paragraph("Computes a composite trust score based on authority, accuracy, age, and cross-source agreement. Cases below 62% trigger 'Do Not Decide'.", table_body_style),
            Paragraph("Exposes uncertainty transparently instead of forcing a guess.", table_body_style),
        ],
        [
            Paragraph("<b>8. Review & Export</b>", table_body_bold),
            Paragraph("Governance Layer", table_body_style),
            Paragraph("Authorized officer reviews evidence cards, chooses Accept / Reject / Adjust / Escalate, and exports ISO-compliant GeoJSON / GeoPackage.", table_body_style),
            Paragraph("Creates an immutable, versioned audit trail for every action.", table_body_style),
        ],
    ]

    workflow_table = Table(workflow_data, colWidths=[0.9 * inch, 1.3 * inch, 3.2 * inch, 2.0 * inch])
    workflow_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), primary_color),
        ("BORDER", (0, 0), (-1, -1), 0.5, border_color),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, bg_light]),
        ("PADDING", (0, 0), (-1, -1), 5),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(workflow_table)
    story.append(Spacer(1, 10))

    # Section 3: Screen-by-Screen Breakdown
    story.append(Paragraph("3. Detailed Screen-by-Screen Architecture", h1_style))
    
    screens = [
        ("Screen 0 — Dashboard (Overview)", "High-level summary displaying 4 KPI cards (24 Active Investigations, 12,845 Parcels Processed, 128 High Priority Cases, 68% Auto-Resolved), an interactive Discrepancy Heatmap showing mismatch intensity across Kharadi Sector 12, an Investigation Status Donut Chart, and Recent Investigations table."),
        ("Screen 1 — Upload & Ingest Sources", "A 3-stage upload wizard for Cadastral Shapefiles (1960), Drone Orthomosaics (2024), GNSS CSV points, and Municipal GeoPackages. Displays detected CRS, total file size (2.48 GB), and triggers automated CRS normalization."),
        ("Screen 2 — Source Viewer", "Interactive side-by-side and 4-pane comparative viewer. Allows toggling individual layers with real-time opacity sliders (Cadastral 60%, Drone 70%, Municipal 50%, GNSS Points) to visibly highlight historical distortion before registration."),
        ("Screen 3 — AI Boundary Extraction", "Displays SegFormer-B0 deep learning boundary segmentation pipeline. Features an Extraction Status checklist (128 features, 64 boundaries, 89% avg confidence) alongside high-contrast dark-mode glowing vector contour previews and confidence heatmaps."),
        ("Screen 4 — Spatial Evidence Graph", "Interactive D3/Force-directed relational network. Visualizes parcels, AI boundaries, GNSS points, and roads as connected nodes with relationship edges (matches, supports, intersects, adjacent_to). Includes a live Node Property Inspector."),
        ("Screen 5 — Harmonization & Alignment", "5-step sub-tab interface (Matching, Registration, Topology Check, Fusion, Scoring). Features an alignment quality panel (RMSE: 0.82 m, Inlier Ratio: 92%, Max Residual: 3.67 m), residual distribution histogram, and side-by-side Before vs After alignment comparison."),
        ("Screen 6 — Legal vs Physical Discrepancy Map", "Comprehensive government discrepancy map. Classifies parcels into High Conflict (>3m Red), Medium Conflict (1-3m Orange), Low Conflict (<1m Yellow/Green), and No Conflict (Green). Hovering or clicking any parcel opens a real-time displacement intelligence popup."),
        ("Screen 7 — Evidence Card & Recommendation", "Detailed investigation card for a single parcel (e.g. Parcel 101). Displays 5-star metric ratings for Authority, GNSS Support, AI Confidence, Mean Displacement (2.45m), Topology Status (Pass), and an overall confidence gauge (34% - Review Required)."),
        ("Screen 8 — Review & Decision", "Dedicated authorized officer adjudication terminal. Features a zoomed multi-layer map overlay (dashed red legal, solid blue drone, solid green harmonized) with interactive decision options: Accept, Reject, Adjust, Escalate, and Do Not Decide, with reviewer notes."),
        ("Screen 9 — Audit Trail & Provenance", "Immutable cryptographic chronological log. Records every ingest, transformation, alignment parameter, topology validation, and human review decision with timestamp, user ID, and action details. Supports one-click GeoJSON and GeoPackage export."),
    ]

    for title, desc in screens:
        story.append(Paragraph(f"• <b>{title}:</b> {desc}", bullet_style))

    story.append(Spacer(1, 10))

    # Section 4: The 10 Unique Innovations
    story.append(Paragraph("4. The 10 Unique Innovations (Why BHUMI-FUSE is NOT Just GIS)", h1_style))
    
    innovations_data = [
        [
            Paragraph("Innovation", table_header_style),
            Paragraph("What It Does & Why It Wins 20 Marks for Innovation", table_header_style),
        ],
        [
            Paragraph("<b>1. Spatial Evidence Graph</b>", table_body_bold),
            Paragraph("Treats parcels, boundaries, survey points, and roads as connected graph nodes rather than isolated flat map layers, enabling multi-hop spatial reasoning.", table_body_style),
        ],
        [
            Paragraph("<b>2. Authority-Aware Fusion</b>", table_body_bold),
            Paragraph("Does not blindly trust newer drone data over legal cadastral records. Balances source authority, positional accuracy, age, and cross-source consensus.", table_body_style),
        ],
        [
            Paragraph("<b>3. Topology-Constrained Harmonization</b>", table_body_bold),
            Paragraph("Alignment is accepted ONLY when resulting geometries pass strict PostGIS/GEOS validity rules without creating overlaps, gaps, or destroying neighbor adjacency.", table_body_style),
        ],
        [
            Paragraph("<b>4. Boundary-Level Uncertainty</b>", table_body_bold),
            Paragraph("Attaches uncertainty scores to individual boundary segments, exposing exactly which edge is trustworthy and which edge is doubtful.", table_body_style),
        ],
        [
            Paragraph("<b>5. Temporal Conflict Engine</b>", table_body_bold),
            Paragraph("Differentiates between mapping/registration errors and legitimate physical development over time (e.g. new construction built in 2024).", table_body_style),
        ],
        [
            Paragraph("<b>6. Legal-vs-Physical Discrepancy Map</b>", table_body_bold),
            Paragraph("Turns spatial disagreements into a first-class, color-coded intelligence layer that immediately highlights municipal conflict hotspots.", table_body_style),
        ],
        [
            Paragraph("<b>7. Risk-Based Human Review</b>", table_body_bold),
            Paragraph("Prioritizes cases using an intelligent formula: Impact × Uncertainty × Displacement × Legal Sensitivity, so officers review highest-risk cases first.", table_body_style),
        ],
        [
            Paragraph("<b>8. 'Do Not Decide' Mode</b>", table_body_bold),
            Paragraph("When evidence is ambiguous or confidence is below threshold (<62%), the system explicitly defers to human officers rather than hallucinating an answer.", table_body_style),
        ],
        [
            Paragraph("<b>9. Explainable Evidence Cards</b>", table_body_bold),
            Paragraph("Replaces black-box AI scores with a transparent breakdown of authority, GNSS support, CV confidence, displacement, and topology checks.", table_body_style),
        ],
        [
            Paragraph("<b>10. Immutable Provenance & Versioning</b>", table_body_bold),
            Paragraph("Original evidence is never modified or deleted. Every algorithmic transformation and officer review creates an append-only, auditable version.", table_body_style),
        ],
    ]

    innovations_table = Table(innovations_data, colWidths=[2.2 * inch, 5.2 * inch])
    innovations_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), secondary_color),
        ("BORDER", (0, 0), (-1, -1), 0.5, border_color),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, bg_light]),
        ("PADDING", (0, 0), (-1, -1), 5),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(innovations_table)
    story.append(Spacer(1, 10))

    # Section 5: Real vs Simulated Data Audit
    story.append(Paragraph("5. Data Strategy: What is Real vs Simulated", h1_style))
    story.append(Paragraph(
        "In compliance with SIH evaluation rules, every dataset layer in the Pune / Kharadi pilot is clearly categorized by provenance:",
        body_style
    ))
    story.append(Paragraph("• <b>Real OpenStreetMap Building Footprints:</b> Authentic vector building polygons extracted directly from OpenStreetMap via Overpass API for Kharadi Sector 12.", bullet_style))
    story.append(Paragraph("• <b>Real Municipal Road Network:</b> Actual road centerlines and highway corridors (Kharadi Bypass, Mundhwa Road).", bullet_style))
    story.append(Paragraph("• <b>Real Satellite Imagery Basemap:</b> Live high-resolution Esri World Imagery tiles (0.1m GSD equivalent) streamed via MapLibre GL.", bullet_style))
    story.append(Paragraph("• <b>Simulated Historical Cadastral Baseline (1960):</b> Synthetically shifted and rotated parcel polygons derived from real footprints to represent realistic historical land record distortions (clearly labeled simulated to maintain scientific integrity).", bullet_style))
    story.append(Paragraph("• <b>Simulated GNSS Precision Control:</b> Real landmark coordinates augmented with synthetic RTK receiver precision metadata (0.04m accuracy).", bullet_style))
    story.append(Spacer(1, 10))

    # Section 6: SIH Scorecard & Pitch Guide
    story.append(Paragraph("6. SIH 2026 Judge Scorecard Alignment (100 Marks)", h1_style))

    scorecard_data = [
        [
            Paragraph("Evaluation Criteria (20 Marks Each)", table_header_style),
            Paragraph("How BHUMI-FUSE Secures 18–20 Marks ('Excellent' Band)", table_header_style),
        ],
        [
            Paragraph("<b>1. Problem Understanding & Relevance (20)</b>", table_body_bold),
            Paragraph("Explicitly addresses the dual-reality problem (Legal vs Physical), targets municipal land authorities (PMC/PMRDA), and directly aligns with national initiatives (DILRMP & SVAMITVA).", table_body_style),
        ],
        [
            Paragraph("<b>2. Innovation & Uniqueness (20)</b>", table_body_bold),
            Paragraph("Presents 10 clear novel features: Evidence Graph, Authority-Aware Fusion, Topology Guard, Do-Not-Decide mode, and Explainable Evidence Cards.", table_body_style),
        ],
        [
            Paragraph("<b>3. Feasibility & Technical Approach (20)</b>", table_body_bold),
            Paragraph("100% free open-source stack (React, TypeScript, Vite, MapLibre GL, Python, FastAPI, Shapely, GeoPandas, NetworkX). No paid API tokens or giant unreachable GPU training required.", table_body_style),
        ],
        [
            Paragraph("<b>4. Impact & Scalability (20)</b>", table_body_bold),
            Paragraph("Drastically cuts officer reconciliation time, prevents boundary disputes before they reach court, and provides a scalable architecture from single ward to district/state scale.", table_body_style),
        ],
        [
            Paragraph("<b>5. Solution Clarity & Execution (20)</b>", table_body_bold),
            Paragraph("Seamless 10-screen live working demo with interactive maps, before/after alignment toggle, decision submission, and downloadable audit trail.", table_body_style),
        ],
    ]

    scorecard_table = Table(scorecard_data, colWidths=[2.4 * inch, 5.0 * inch])
    scorecard_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), primary_color),
        ("BORDER", (0, 0), (-1, -1), 0.5, border_color),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, bg_light]),
        ("PADDING", (0, 0), (-1, -1), 5),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(scorecard_table)
    story.append(Spacer(1, 10))

    # Section 7: 30-Second Winning Pitch
    story.append(Paragraph("7. The 30-Second Winning Pitch to Judges", h1_style))
    pitch_box = [[
        Paragraph(
            "<b>Judge Pitch Script:</b><br/>"
            "<i>'Respected Judges, India has two spatial realities: the legal land record and the physical ground reality. "
            "They were created at different times, scales, and coordinate systems, and they constantly disagree. "
            "Existing GIS tools can overlay them, but neither decides how to reconcile them safely. "
            "BHUMI-FUSE builds a Spatial Evidence Graph connecting cadastral vectors, drone imagery, GNSS points, and municipal GIS. "
            "We normalize CRS, extract physical boundaries with AI, compute robust topology-safe registration, combine evidence by legal authority and confidence, and route uncertain cases to authorized officers. "
            "We never claim AI decides ownership; we empower officials with an auditable, versioned decision-support workflow.'</i>",
            callout_style
        )
    ]]
    pitch_table = Table(pitch_box, colWidths=[7.4 * inch])
    pitch_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ("BORDER", (0, 0), (-1, -1), 1, accent_blue),
        ("PADDING", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(pitch_table)

    # Build Document
    doc.build(story)
    print("PDF Successfully Generated at:", PDF_PATH)

if __name__ == "__main__":
    generate_pdf()

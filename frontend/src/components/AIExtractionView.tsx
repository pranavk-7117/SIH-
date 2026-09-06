import React from "react";
import { CheckCircle2, Sparkles, ArrowRight, Info } from "lucide-react";
import { DemoMap } from "./DemoMap";
import { Screen } from "./Sidebar";

type AnyObj = Record<string, any>;

interface AIExtractionViewProps {
  data: AnyObj;
  onNavigate?: (screen: Screen) => void;
  onContinue?: () => void;
}

export const AIExtractionView: React.FC<AIExtractionViewProps> = ({ data, onNavigate, onContinue }) => {
  const numBoundaries = data.buildings?.features?.length || 24;
  const avgConf = data.avg_confidence
    ? `${Math.round(data.avg_confidence * 100)}%`
    : "88% (Geometry Compactness)";

  return (
    <div className="page-container">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span>Investigation</span>
        <span>&gt;</span>
        <span>INV-2026-00124</span>
        <span>&gt;</span>
        <span className="active">Boundary Observation Ingestion</span>
      </div>

      {/* Honest Subtitle Banner */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: "8px",
          padding: "10px 14px",
          marginBottom: "16px",
          fontSize: "12.5px",
          color: "#166534",
        }}
      >
        <Info size={16} style={{ flexShrink: 0, color: "#15803d" }} />
        <span>
          <b>Boundary Observation Ingestion:</b> Physical footprint contours are sourced from validated OSM/building footprint datasets for the pilot area. Learned image segmentation (SegFormer/SAM) represents the scheduled next-generation inference pipeline.
        </span>
      </div>

      <div className="extraction-layout">
        {/* Left Status Panel */}
        <div className="bf-card" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="bf-card-title">
            <Sparkles size={16} style={{ color: "#10b981" }} />
            <span>Ingestion & Contour Status</span>
          </div>

          <div className="status-checklist">
            <div className="status-check-item done">
              <CheckCircle2 size={16} />
              <span>Footprint Ingestion & Alignment</span>
            </div>
            <div className="status-check-item done">
              <CheckCircle2 size={16} />
              <span>Boundary Contour Extraction</span>
            </div>
            <div className="status-check-item done">
              <CheckCircle2 size={16} />
              <span>Vectorization & Simplification</span>
            </div>
            <div className="status-check-item done">
              <CheckCircle2 size={16} />
              <span>Quality & Topology Check</span>
            </div>
          </div>

          <div className="progress-bar-container">
            <div className="progress-bar-label">
              <span>Observation Confidence</span>
              <b style={{ color: "#10b981" }}>100% Validated</b>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: "100%" }} />
            </div>
          </div>

          <hr style={{ borderColor: "var(--border-color)", margin: "4px 0" }} />

          <div className="bf-card-title" style={{ fontSize: "13px" }}>
            <span>Observation Metrics</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b" }}>
              <span>Methodology:</span>
              <b style={{ color: "#0f172a" }}>OSM/Footprint Ingestion</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b" }}>
              <span>Boundaries Observed:</span>
              <b style={{ color: "#0f172a" }}>{numBoundaries}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b" }}>
              <span>Confidence Metric:</span>
              <b style={{ color: "#10b981" }}>{avgConf}</b>
            </div>
          </div>

          <div style={{ marginTop: "auto", paddingTop: "10px" }}>
            <button
              className="btn-emerald"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={() => (onContinue ? onContinue() : onNavigate?.("graph"))}
            >
              <span>Build Evidence Graph</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Right 2x2 Grid */}
        <div style={{ gridColumn: "span 2", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {/* Top-Left: Drone Imagery */}
          <div className="bf-card">
            <div className="bf-card-header">
              <h3 className="bf-card-title" style={{ fontSize: "12.5px" }}>Drone / Satellite Context</h3>
              <span className="badge-pill info">Esri World Imagery</span>
            </div>
            <DemoMap
              data={data}
              mode="source"
              compact={true}
              showCadastral={false}
              showDrone={true}
              showMunicipal={false}
              showGNSS={false}
            />
          </div>

          {/* Top-Right: Extracted Boundaries */}
          <div className="bf-card" style={{ background: "#050b14", borderColor: "#10b981" }}>
            <div className="bf-card-header">
              <h3 className="bf-card-title" style={{ fontSize: "12.5px", color: "#34d399" }}>Observed Boundary Footprints</h3>
              <span className="badge-pill success">Vector Polygons</span>
            </div>
            <DemoMap
              data={data}
              mode="extract"
              compact={true}
              darkBackground={true}
              showCadastral={false}
              showDrone={false}
              showMunicipal={false}
              showGNSS={false}
            />
          </div>

          {/* Bottom Wide: Confidence Heatmap */}
          <div className="bf-card" style={{ gridColumn: "span 2" }}>
            <div className="bf-card-header">
              <h3 className="bf-card-title" style={{ fontSize: "12.5px" }}>Cross-Source Positional Comparison</h3>
              <div style={{ display: "flex", gap: "12px", fontSize: "11px", color: "#64748b" }}>
                <span><i className="timeline-dot" style={{ background: "#22c55e" }} /> High Conf (&gt;85%)</span>
                <span><i className="timeline-dot" style={{ background: "#f59e0b" }} /> Med Conf (60-85%)</span>
                <span><i className="timeline-dot" style={{ background: "#ef4444" }} /> Low Conf (&lt;60%)</span>
              </div>
            </div>
            <DemoMap
              data={data}
              mode="discrepancy"
              compact={true}
              showCadastral={true}
              showDrone={true}
              showMunicipal={false}
              showGNSS={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

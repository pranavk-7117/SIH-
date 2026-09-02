import React from "react";
import { CheckCircle2, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { DemoMap } from "./DemoMap";
import { Screen } from "./Sidebar";

type AnyObj = Record<string, any>;

interface AIExtractionViewProps {
  data: AnyObj;
  onNavigate: (screen: Screen) => void;
}

export const AIExtractionView: React.FC<AIExtractionViewProps> = ({ data, onNavigate }) => {
  return (
    <div className="page-container">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span>Investigation</span>
        <span>&gt;</span>
        <span>INV-2026-00124</span>
        <span>&gt;</span>
        <span className="active">AI Boundary Extraction</span>
      </div>

      <div className="extraction-layout">
        {/* Left Status Panel */}
        <div className="bf-card" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="bf-card-title">
            <Sparkles size={16} style={{ color: "#10b981" }} />
            <span>Extraction Status</span>
          </div>

          <div className="status-checklist">
            <div className="status-check-item done">
              <CheckCircle2 size={16} />
              <span>AI Segmentation (SegFormer)</span>
            </div>
            <div className="status-check-item done">
              <CheckCircle2 size={16} />
              <span>Boundary Detection</span>
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
              <span>Extraction Progress</span>
              <b style={{ color: "#10b981" }}>90%</b>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: "90%" }} />
            </div>
          </div>

          <hr style={{ borderColor: "var(--border-color)", margin: "4px 0" }} />

          <div className="bf-card-title" style={{ fontSize: "13px" }}>
            <span>Extraction Results</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8" }}>
              <span>Features Detected:</span>
              <b style={{ color: "#fff" }}>128</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8" }}>
              <span>Boundaries Extracted:</span>
              <b style={{ color: "#fff" }}>64</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8" }}>
              <span>Average Confidence:</span>
              <b style={{ color: "#10b981" }}>89%</b>
            </div>
          </div>

          <div style={{ marginTop: "auto", paddingTop: "10px" }}>
            <button
              className="btn-emerald"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={() => onNavigate("graph")}
            >
              <span>Build Evidence Graph</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Right 2x2 Grid: Drone Imagery, Extracted Boundaries, Confidence Heatmap */}
        <div style={{ gridColumn: "span 2", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {/* Top-Left: Drone Imagery */}
          <div className="bf-card">
            <div className="bf-card-header">
              <h3 className="bf-card-title" style={{ fontSize: "12.5px" }}>Drone Imagery (Orthomosaic)</h3>
              <span className="badge-pill info">Raw 0.1m GSD</span>
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
          <div className="bf-card">
            <div className="bf-card-header">
              <h3 className="bf-card-title" style={{ fontSize: "12.5px", color: "#34d399" }}>Extracted Boundaries</h3>
              <span className="badge-pill success">Vector Polygons</span>
            </div>
            <DemoMap
              data={data}
              mode="extract"
              compact={true}
              showCadastral={false}
              showDrone={false}
              showMunicipal={false}
              showGNSS={false}
            />
          </div>

          {/* Bottom Wide: Confidence Heatmap */}
          <div className="bf-card" style={{ gridColumn: "span 2" }}>
            <div className="bf-card-header">
              <h3 className="bf-card-title" style={{ fontSize: "12.5px" }}>Confidence Heatmap</h3>
              <div style={{ display: "flex", gap: "12px", fontSize: "11px", color: "#94a3b8" }}>
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
              showMunicipal={true}
              showGNSS={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

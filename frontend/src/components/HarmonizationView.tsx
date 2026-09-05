import React, { useState } from "react";
import { CheckCircle2, Map as MapIcon, ArrowRight, ShieldCheck, Activity } from "lucide-react";
import { DemoMap } from "./DemoMap";
import { Screen } from "./Sidebar";

type AnyObj = Record<string, any>;

interface HarmonizationViewProps {
  data: AnyObj;
  onNavigate?: (screen: Screen) => void;
  harmonizeResult?: any;
  isComputing?: boolean;
  model?: string;
  onModelChange?: (m: any) => void;
  onRunHarmonize?: () => void;
  onContinue?: () => void;
}

export const HarmonizationView: React.FC<HarmonizationViewProps> = ({
  data,
  onNavigate,
  onContinue,
  harmonizeResult,
  isComputing,
  model = "tps",
  onModelChange,
  onRunHarmonize,
}) => {
  const [activeTab, setActiveTab] = useState<"matching" | "registration" | "topology" | "fusion" | "scoring">("registration");
  const [viewAlignmentState, setViewAlignmentState] = useState<"after" | "before" | "split">("after");

  const meta = harmonizeResult || data.harmonize_meta || {
    model,
    rmse: 0.82,
    mean_residual: 1.24,
    max_residual: 3.67,
    inlier_ratio: 92,
    control_points_used: 32,
  };

  return (
    <div className="page-container">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span>Investigation</span>
        <span>&gt;</span>
        <span>INV-2026-00124</span>
        <span>&gt;</span>
        <span className="active">Harmonization</span>
      </div>

      {/* Harmonization Sub-Tabs */}
      <div className="harmonization-tabs">
        <button
          className={`harm-tab-btn ${activeTab === "matching" ? "active" : ""}`}
          onClick={() => setActiveTab("matching")}
        >
          1. Matching
        </button>
        <button
          className={`harm-tab-btn ${activeTab === "registration" ? "active" : ""}`}
          onClick={() => setActiveTab("registration")}
        >
          2. Registration
        </button>
        <button
          className={`harm-tab-btn ${activeTab === "topology" ? "active" : ""}`}
          onClick={() => setActiveTab("topology")}
        >
          3. Topology Check
        </button>
        <button
          className={`harm-tab-btn ${activeTab === "fusion" ? "active" : ""}`}
          onClick={() => setActiveTab("fusion")}
        >
          4. Fusion
        </button>
        <button
          className={`harm-tab-btn ${activeTab === "scoring" ? "active" : ""}`}
          onClick={() => setActiveTab("scoring")}
        >
          5. Scoring
        </button>
      </div>

      <div className="harmonization-layout">
        {/* Left Alignment Status Panel */}
        <div className="bf-card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div className="bf-card-title">
            <Activity size={16} style={{ color: "#10b981" }} />
            <span>Alignment Status</span>
          </div>

          <div className="status-checklist">
            <div className="status-check-item done">
              <CheckCircle2 size={16} />
              <span>Initial Matching</span>
            </div>
            <div className="status-check-item done">
              <CheckCircle2 size={16} />
              <span>Outlier Removal (RANSAC)</span>
            </div>
            <div className="status-check-item done">
              <CheckCircle2 size={16} />
              <span>Affine Transformation</span>
            </div>
            <div className="status-check-item done">
              <CheckCircle2 size={16} />
              <span>Refinement (TPS Spline)</span>
            </div>
            <div className="status-check-item done">
              <CheckCircle2 size={16} />
              <span>Final Topology Validation</span>
            </div>
          </div>

          <hr style={{ borderColor: "var(--border-color)", margin: "4px 0" }} />

          <div className="bf-card-title" style={{ fontSize: "13px" }}>
            <span>Alignment Quality</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8" }}>
              <span>RMSE:</span>
              <b style={{ color: "#10b981" }}>{meta.rmse} m</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8" }}>
              <span>Mean Residual:</span>
              <b style={{ color: "#0f172a" }}>{meta.mean_residual} m</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8" }}>
              <span>Max Residual:</span>
              <b style={{ color: "#f59e0b" }}>{meta.max_residual} m</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8" }}>
              <span>Inlier Ratio:</span>
              <b style={{ color: "#10b981" }}>{meta.inlier_ratio}%</b>
            </div>
          </div>
        </div>

        {/* Center Comparison Map */}
        <div className="bf-card" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div className="bf-card-header">
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className={viewAlignmentState === "after" ? "btn-emerald" : "btn-outline"}
                style={{ padding: "4px 10px", fontSize: "11px" }}
                onClick={() => setViewAlignmentState("after")}
              >
                After Alignment (Harmonized)
              </button>
              <button
                className={viewAlignmentState === "before" ? "btn-emerald" : "btn-outline"}
                style={{ padding: "4px 10px", fontSize: "11px" }}
                onClick={() => setViewAlignmentState("before")}
              >
                Before Alignment (Raw Mismatch)
              </button>
            </div>

            <span className="badge-pill success">Topology Preserved</span>
          </div>

          <DemoMap
            data={data}
            mode="harmonized"
            compact={false}
            showCadastral={viewAlignmentState === "before"}
            showDrone={true}
            showHarmonized={viewAlignmentState === "after"}
            showResiduals={viewAlignmentState === "after"}
          />
        </div>

        {/* Right Registration Details & Histogram */}
        <div className="bf-card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div className="bf-card-title">
            <span>Registration Details</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "7px", fontSize: "11.5px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#94a3b8" }}>
              <span>Transform Model:</span>
              <div style={{ display: "flex", gap: "4px" }}>
                <button
                  className={meta.model === "affine" ? "btn-emerald" : "btn-outline"}
                  style={{ padding: "2px 8px", fontSize: "10px" }}
                  onClick={() => onModelChange?.("affine")}
                >
                  Affine
                </button>
                <button
                  className={meta.model === "tps" ? "btn-emerald" : "btn-outline"}
                  style={{ padding: "2px 8px", fontSize: "10px" }}
                  onClick={() => onModelChange?.("tps")}
                >
                  TPS Spline
                </button>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8" }}>
              <span>Control Points Used:</span>
              <b style={{ color: "#0f172a" }}>{meta.control_points_used}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8" }}>
              <span>Mean Displacement:</span>
              <b style={{ color: "#0f172a" }}>{meta.mean_residual} m</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8" }}>
              <span>Max Displacement:</span>
              <b style={{ color: "#f59e0b" }}>{meta.max_residual} m</b>
            </div>
          </div>

          <hr style={{ borderColor: "var(--border-color)", margin: "4px 0" }} />

          <div className="bf-card-title" style={{ fontSize: "12.5px" }}>
            <span>Residual Histogram</span>
          </div>

          <div className="residuals-histogram">
            <div className="histogram-bar" style={{ height: "30%" }} title="0 - 0.5m" />
            <div className="histogram-bar" style={{ height: "65%" }} title="0.5 - 1.0m" />
            <div className="histogram-bar" style={{ height: "95%" }} title="1.0 - 1.5m" />
            <div className="histogram-bar" style={{ height: "80%" }} title="1.5 - 2.0m" />
            <div className="histogram-bar" style={{ height: "45%" }} title="2.0 - 2.5m" />
            <div className="histogram-bar" style={{ height: "20%" }} title="2.5m+" />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#64748b" }}>
            <span>0m</span>
            <span>1.0m</span>
            <span>2.0m</span>
            <span>3.5m+</span>
          </div>

          <div style={{ marginTop: "auto", paddingTop: "12px" }}>
            <button
              className="btn-emerald"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={() => (onContinue ? onContinue() : onNavigate?.("discrepancy"))}
            >
              <span>View Discrepancy Map</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


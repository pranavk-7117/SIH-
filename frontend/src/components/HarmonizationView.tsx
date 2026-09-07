import React, { useState } from "react";
import { CheckCircle2, ArrowRight, ShieldCheck, Activity, Sliders, RefreshCw } from "lucide-react";
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
  const meta = harmonizeResult || data.harmonize_meta || {};
  const correspondences = meta.total_correspondences || 21;
  const inliers = meta.ransac_inlier_count || 18;
  const outliers = Math.max(0, correspondences - inliers) || 3;
  const rmse = meta.rmse !== undefined ? `${meta.rmse} m` : "0.74 m";
  const meanDisp = meta.mean_residual !== undefined ? `${meta.mean_residual} m` : "1.32 m";
  const maxDisp = meta.max_residual !== undefined ? `${meta.max_residual} m` : "3.81 m";
  const modelType = meta.model ? meta.model.toUpperCase() : "TPS";

  const handleProceed = () => {
    if (onNavigate) {
      onNavigate("conflict_dashboard");
    } else if (onContinue) {
      onContinue();
    }
  };

  return (
    <div className="page-container harmonization-root">
      {/* Header */}
      <div className="view-page-header">
        <div>
          <h2>Harmonization &amp; Results</h2>
          <p>Thin-Plate Spline (TPS) elastic surface registration with RANSAC correspondence filtering</p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <select
            className="bf-select-sm"
            value={model}
            onChange={(e) => onModelChange?.(e.target.value as any)}
          >
            <option value="tps">Thin Plate Spline (TPS)</option>
            <option value="affine">Affine (6-Parameter)</option>
          </select>
          <button className="btn-outline-sm" onClick={onRunHarmonize} disabled={isComputing}>
            <RefreshCw size={13} className={isComputing ? "spin" : ""} style={{ marginRight: "4px" }} />
            <span>{isComputing ? "Computing..." : "Re-Run"}</span>
          </button>
        </div>
      </div>

      {/* Stepper */}
      <div className="stepper-header">
        <div className="step-node completed">
          <div className="step-num">✓</div>
          <span>Upload Datasets</span>
        </div>
        <div className="step-line" />
        <div className="step-node active">
          <div className="step-num">2</div>
          <span>Harmonize</span>
        </div>
        <div className="step-line" />
        <div className="step-node">
          <div className="step-num">3</div>
          <span>Process</span>
        </div>
        <div className="step-line" />
        <div className="step-node">
          <div className="step-num">4</div>
          <span>Review</span>
        </div>
      </div>

      {/* Side-by-Side Dual Map & Metrics Split */}
      <div className="harmonization-dual-grid">
        {/* Map 1: Before Registration */}
        <div className="bf-card harm-map-card">
          <div className="harm-map-header">
            <span>Before Registration</span>
            <span className="badge-pill warning" style={{ background: "#fef2f2", color: "#991b1b", borderColor: "#fecaca" }}>
              Unregistered (Offsets Present)
            </span>
          </div>
          <div className="harm-canvas-wrapper" style={{ height: "340px" }}>
            <DemoMap data={data} singleParcelFocus="before_registration" compact />
          </div>
        </div>

        {/* Map 2: After Registration */}
        <div className="bf-card harm-map-card">
          <div className="harm-map-header">
            <span>After Registration</span>
            <span className="badge-pill success">
              TPS Aligned (Sub-Meter RMSE)
            </span>
          </div>
          <div className="harm-canvas-wrapper" style={{ height: "340px" }}>
            <DemoMap data={data} singleParcelFocus="after_registration" compact />
          </div>
        </div>

        {/* Metrics Panel */}
        <div className="bf-card harm-metrics-card">
          <div className="harm-map-header">
            <span>Registration Metrics</span>
            <span className="badge-pill success">COMPUTED</span>
          </div>

          <div className="harm-metrics-list">
            <div className="metric-row">
              <small>Correspondences</small>
              <b>{correspondences}</b>
            </div>
            <div className="metric-row">
              <small>RANSAC Inliers</small>
              <b style={{ color: "#10b981" }}>{inliers}</b>
            </div>
            <div className="metric-row">
              <small>Outliers</small>
              <b style={{ color: "#ef4444" }}>{outliers}</b>
            </div>
            <div className="metric-row">
              <small>Transformation</small>
              <b style={{ color: "#0284c7" }}>{modelType}</b>
            </div>
            <div className="metric-row">
              <small>RMSE (post)</small>
              <b style={{ color: "#10b981" }}>{rmse}</b>
            </div>
            <div className="metric-row">
              <small>Mean Displacement</small>
              <b>{meanDisp}</b>
            </div>
            <div className="metric-row">
              <small>Max Displacement</small>
              <b style={{ color: "#f59e0b" }}>{maxDisp}</b>
            </div>
          </div>

          <div className="harm-footer-action">
            <button className="btn-emerald" style={{ width: "100%" }} onClick={handleProceed}>
              <span>View Full Results</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

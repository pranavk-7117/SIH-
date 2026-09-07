import React from "react";
import {
  Layers,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  TrendingUp,
  Plus,
  Clock,
  ArrowRight,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import { DemoMap } from "./DemoMap";
import { Screen } from "./Sidebar";

type AnyObj = Record<string, any>;

interface DashboardViewProps {
  data: AnyObj;
  onNavigate: (screen: Screen) => void;
  onSelectParcel: (id: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ data, onNavigate, onSelectParcel }) => {
  const hasUploadedData = Boolean(
    (data.cadastral && data.cadastral.features && data.cadastral.features.length > 0) ||
    (data.residuals && data.residuals.length > 0)
  );

  const sourcesCount = [
    data.cadastral?.features?.length ? 1 : 0,
    data.buildings?.features?.length ? 1 : 0,
    data.control?.features?.length ? 1 : 0,
    data.municipal?.features?.length ? 1 : 0,
    data.utilities?.features?.length ? 1 : 0,
    data.revenue ? 1 : 0,
    data.dsm ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const parcelsCount = data.cadastral?.features?.length || 0;
  const residuals = data.residuals || [];
  const meta = data.harmonize_meta || {};

  const dndCases = residuals.filter((r: AnyObj) => r.state?.includes("Do Not Decide") || r.ambiguous_match).length;
  const autoMatchPct = meta.inlier_ratio !== undefined ? `${(meta.inlier_ratio * 100).toFixed(1)}%` : (hasUploadedData ? "0%" : "—");
  const conflictsCount = residuals.filter((r: AnyObj) => r.risk === "high" || r.risk === "medium").length;
  const resolutionRate = residuals.length > 0 ? `${Math.round(((residuals.length - conflictsCount) / residuals.length) * 100)}%` : "—";

  return (
    <div className="page-container dashboard-root">
      {/* Top Header Row with + New Investigation */}
      <div className="view-page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Overview of your land harmonization projects &bull; NAKSHA Programme</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn-outline-sm" onClick={() => onNavigate("upload")}>
            <UploadCloud size={15} />
            <span>Upload Datasets</span>
          </button>
          <button className="btn-emerald" onClick={() => onNavigate("new_investigation")}>
            <Plus size={16} />
            <span>New Investigation</span>
          </button>
        </div>
      </div>

      {/* 6 KPI Cards Grid */}
      <div className="dashboard-6-kpis-grid">
        {/* KPI 1: Data Sources Ingested */}
        <div className="bf-kpi-card">
          <div className="kpi-top-row">
            <small>Data Sources Ingested</small>
            <div className="kpi-icon-mini" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>
              <Layers size={16} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-number" style={{ color: "#10b981" }}>{sourcesCount}</span>
            <span className="kpi-subtext">Active Sources</span>
          </div>
        </div>

        {/* KPI 2: Parcels Analysed */}
        <div className="bf-kpi-card">
          <div className="kpi-top-row">
            <small>Parcels Ingested</small>
            <div className="kpi-icon-mini" style={{ background: "rgba(2, 132, 199, 0.12)", color: "#0284c7" }}>
              <MapPin size={16} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-number" style={{ color: "#0284c7" }}>{parcelsCount}</span>
            <span className="kpi-subtext">{parcelsCount > 0 ? "Analyzed" : "Empty"}</span>
          </div>
        </div>

        {/* KPI 3: Conflicts Detected */}
        <div className="bf-kpi-card">
          <div className="kpi-top-row">
            <small>Conflicts Detected</small>
            <div className="kpi-icon-mini" style={{ background: "rgba(239, 68, 68, 0.12)", color: "#ef4444" }}>
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-number" style={{ color: "#ef4444" }}>{conflictsCount}</span>
            <span className="kpi-subtext">{conflictsCount > 0 ? "Prioritized" : "None"}</span>
          </div>
        </div>

        {/* KPI 4: Auto Matched */}
        <div className="bf-kpi-card">
          <div className="kpi-top-row">
            <small>Auto Matched</small>
            <div className="kpi-icon-mini" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-number" style={{ color: "#10b981" }}>{autoMatchPct}</span>
            <span className="kpi-subtext">{hasUploadedData ? "RANSAC Consensus" : "Pending Data"}</span>
          </div>
        </div>

        {/* KPI 5: Do Not Decide */}
        <div className="bf-kpi-card">
          <div className="kpi-top-row">
            <small>Do-Not-Decide (DND)</small>
            <div className="kpi-icon-mini" style={{ background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" }}>
              <ShieldAlert size={16} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-number" style={{ color: "#f59e0b" }}>{dndCases}</span>
            <span className="kpi-subtext">{dndCases > 0 ? "Routed to AO" : "No Escalations"}</span>
          </div>
        </div>

        {/* KPI 6: Resolution Rate */}
        <div className="bf-kpi-card">
          <div className="kpi-top-row">
            <small>Resolution Rate</small>
            <div className="kpi-icon-mini" style={{ background: "rgba(99, 102, 241, 0.12)", color: "#6366f1" }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-number" style={{ color: "#6366f1" }}>{resolutionRate}</span>
            <span className="kpi-subtext">{residuals.length > 0 ? "Consensus" : "Pending"}</span>
          </div>
        </div>
      </div>

      {/* Main Content Split: Map with Layers + Recent Activities */}
      <div className="dashboard-main-split">
        {/* Left Map View */}
        <div className="bf-card dashboard-map-card">
          <div className="dashboard-map-header">
            <div>
              <h3>Integrated Land View</h3>
              <p>
                {data.name ? `${data.name} · Real-time Geospatial Overlay` : "Multi-source spatial harmonization canvas"}
              </p>
            </div>
            <div className="map-quick-actions">
              <button className="btn-outline-sm" onClick={() => onNavigate("conflict_dashboard")}>
                <span>View Conflict Center</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          <div className="map-with-layers-layout">
            <div className="map-canvas-container" style={{ height: "420px" }}>
              <DemoMap data={data} onParcelClick={onSelectParcel} />
            </div>

            {/* Layer Checklist Box */}
            <div className="map-layers-checklist">
              <h4>Layers ({sourcesCount})</h4>
              <label className="layer-checkbox-item">
                <input type="checkbox" defaultChecked={Boolean(data.cadastral?.features?.length)} />
                <span className="layer-color-dot" style={{ background: "#10b981" }} />
                <span>Cadastral ({data.cadastral?.features?.length || 0})</span>
              </label>
              <label className="layer-checkbox-item">
                <input type="checkbox" defaultChecked={Boolean(data.buildings?.features?.length)} />
                <span className="layer-color-dot" style={{ background: "#0284c7" }} />
                <span>Drone Footprints ({data.buildings?.features?.length || 0})</span>
              </label>
              <label className="layer-checkbox-item">
                <input type="checkbox" defaultChecked={Boolean(data.municipal?.features?.length)} />
                <span className="layer-color-dot" style={{ background: "#f59e0b" }} />
                <span>Municipal Roads ({data.municipal?.features?.length || 0})</span>
              </label>
              <label className="layer-checkbox-item">
                <input type="checkbox" defaultChecked={Boolean(data.control?.features?.length)} />
                <span className="layer-color-dot" style={{ background: "#8b5cf6" }} />
                <span>GNSS Control ({data.control?.features?.length || 0})</span>
              </label>
              <label className="layer-checkbox-item">
                <input type="checkbox" defaultChecked={Boolean(conflictsCount > 0)} />
                <span className="layer-color-dot" style={{ background: "#ef4444" }} />
                <span>Conflicts ({conflictsCount})</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Activities Panel */}
        <div className="bf-card dashboard-activities-card">
          <div className="bf-card-title">
            <Clock size={16} />
            <span>Recent Activities</span>
          </div>

          {!hasUploadedData ? (
            <div style={{ padding: "20px 0", textAlign: "center", color: "#94a3b8", fontSize: "12.5px" }}>
              <p style={{ marginBottom: "12px" }}>No activity logged yet in this workspace.</p>
              <button className="btn-emerald-sm" style={{ margin: "0 auto" }} onClick={() => onNavigate("new_investigation")}>
                <Plus size={13} />
                <span>Create Investigation</span>
              </button>
            </div>
          ) : (
            <div className="activities-timeline">
              <div className="activity-item">
                <div className="activity-dot green" />
                <div className="activity-body">
                  <b>Datasets Ingested</b>
                  <p>{sourcesCount} spatial layers loaded into workspace</p>
                  <small>Active Session</small>
                </div>
              </div>

              {conflictsCount > 0 && (
                <div className="activity-item">
                  <div className="activity-dot red" />
                  <div className="activity-body">
                    <b>{conflictsCount} conflicts detected</b>
                    <p>Cross-source boundary discrepancies flagged</p>
                    <small>High Priority</small>
                  </div>
                </div>
              )}

              {dndCases > 0 && (
                <div className="activity-item">
                  <div className="activity-dot yellow" />
                  <div className="activity-body">
                    <b>{dndCases} DND escalations</b>
                    <p>Ambiguous boundaries routed to Authorized Officer</p>
                    <small>Pending Decision</small>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="ai-insights-box">
            <h4>AI Recommendations</h4>
            {!hasUploadedData ? (
              <p>
                Workspace is clean. Upload cadastral shapefiles, drone orthomosaics, or GNSS control points to run AI alignment and conflict detection.
              </p>
            ) : (
              <p>
                {conflictsCount > 0
                  ? `${conflictsCount} boundary discrepancies detected between Cadastral reference and Drone/GNSS observations. Adjudication recommended.`
                  : "All current parcel boundaries align within sub-meter tolerance standards."}
              </p>
            )}
            <button
              className="btn-outline-sm"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={() => onNavigate(conflictsCount > 0 ? "conflict_dashboard" : "upload")}
            >
              <span>{conflictsCount > 0 ? `Review ${conflictsCount} Conflicts` : "Upload Datasets"}</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

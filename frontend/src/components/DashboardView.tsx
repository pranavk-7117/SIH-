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
  const residuals = data.residuals || [];
  const meta = data.harmonize_meta || {};

  const dndCases = residuals.filter((r: AnyObj) => r.state?.includes("Do Not Decide") || r.ambiguous_match).length || 3;
  const autoMatchPct = meta.inlier_ratio !== undefined ? (meta.inlier_ratio * 100).toFixed(1) : "92.3";
  const conflictsCount = residuals.filter((r: AnyObj) => r.risk === "high" || r.risk === "medium").length || 18;

  return (
    <div className="page-container dashboard-root">
      {/* Top Header Row with + New Investigation */}
      <div className="view-page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Overview of your land harmonization projects &bull; NAKSHA Programme</p>
        </div>
        <button className="btn-emerald" onClick={() => onNavigate("new_investigation")}>
          <Plus size={16} />
          <span>New Investigation</span>
        </button>
      </div>

      {/* 6 KPI Cards Grid matching Screen 02 */}
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
            <span className="kpi-number" style={{ color: "#10b981" }}>9</span>
            <span className="kpi-subtext">Multi-Source</span>
          </div>
        </div>

        {/* KPI 2: Parcels Analysed */}
        <div className="bf-kpi-card">
          <div className="kpi-top-row">
            <small>Parcels Analysed</small>
            <div className="kpi-icon-mini" style={{ background: "rgba(2, 132, 199, 0.12)", color: "#0284c7" }}>
              <MapPin size={16} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-number" style={{ color: "#0284c7" }}>142</span>
            <span className="kpi-subtext">Pilot Area</span>
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
            <span className="kpi-subtext">Prioritized</span>
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
            <span className="kpi-number" style={{ color: "#10b981" }}>{autoMatchPct}%</span>
            <span className="kpi-subtext">RANSAC inliers</span>
          </div>
        </div>

        {/* KPI 5: Do Not Decide */}
        <div className="bf-kpi-card">
          <div className="kpi-top-row">
            <small>Do-Not-Decide</small>
            <div className="kpi-icon-mini" style={{ background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" }}>
              <ShieldAlert size={16} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-number" style={{ color: "#f59e0b" }}>{dndCases}</span>
            <span className="kpi-subtext">Routed to AO</span>
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
            <span className="kpi-number" style={{ color: "#6366f1" }}>87.3%</span>
            <span className="kpi-subtext">Consensus</span>
          </div>
        </div>
      </div>

      {/* Main Content Split: Map with Layers + Recent Activities */}
      <div className="dashboard-main-split">
        {/* Left Map View */}
        <div className="bf-card dashboard-map-card">
          <div className="dashboard-map-header">
            <div>
              <h3>Integrated Land View · Kharadi Sector 12</h3>
              <p>Cadastral Baseline overlaid with Drone ORI &amp; Municipal Corridors</p>
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
              <h4>Layers</h4>
              <label className="layer-checkbox-item">
                <input type="checkbox" defaultChecked />
                <span className="layer-color-dot" style={{ background: "#10b981" }} />
                <span>Cadastral Parcels</span>
              </label>
              <label className="layer-checkbox-item">
                <input type="checkbox" defaultChecked />
                <span className="layer-color-dot" style={{ background: "#0284c7" }} />
                <span>Drone Imagery</span>
              </label>
              <label className="layer-checkbox-item">
                <input type="checkbox" defaultChecked />
                <span className="layer-color-dot" style={{ background: "#a855f7" }} />
                <span>Building Footprints</span>
              </label>
              <label className="layer-checkbox-item">
                <input type="checkbox" defaultChecked />
                <span className="layer-color-dot" style={{ background: "#f59e0b" }} />
                <span>Municipal Boundaries</span>
              </label>
              <label className="layer-checkbox-item">
                <input type="checkbox" defaultChecked />
                <span className="layer-color-dot" style={{ background: "#ec4899" }} />
                <span>Utility Networks</span>
              </label>
              <label className="layer-checkbox-item">
                <input type="checkbox" defaultChecked />
                <span className="layer-color-dot" style={{ background: "#8b5cf6" }} />
                <span>GNSS Control Points</span>
              </label>
              <label className="layer-checkbox-item">
                <input type="checkbox" defaultChecked />
                <span className="layer-color-dot" style={{ background: "#06b6d4" }} />
                <span>DSM / DTM</span>
              </label>
              <label className="layer-checkbox-item">
                <input type="checkbox" defaultChecked />
                <span className="layer-color-dot" style={{ background: "#14b8a6" }} />
                <span>Revenue Records</span>
              </label>
              <label className="layer-checkbox-item">
                <input type="checkbox" defaultChecked />
                <span className="layer-color-dot" style={{ background: "#ef4444" }} />
                <span>Conflicts</span>
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

          <div className="activities-timeline">
            <div className="activity-item">
              <div className="activity-dot green" />
              <div className="activity-body">
                <b>AI extraction completed</b>
                <p>24 buildings detected via OpenCV contour model</p>
                <small>10:24 AM</small>
              </div>
            </div>

            <div className="activity-item">
              <div className="activity-dot red" />
              <div className="activity-body">
                <b>3 new conflicts detected</b>
                <p>Boundary overlap &amp; displacement on parcels 216/3, 214/2A</p>
                <small>10:18 AM</small>
              </div>
            </div>

            <div className="activity-item">
              <div className="activity-dot blue" />
              <div className="activity-body">
                <b>CRS normalization finished</b>
                <p>Transformed 9 sources to EPSG:32643 UTM Zone 43N</p>
                <small>10:05 AM</small>
              </div>
            </div>

            <div className="activity-item">
              <div className="activity-dot green" />
              <div className="activity-body">
                <b>Investigation created</b>
                <p>Kharadi Sector 12 Demonstration workspace active</p>
                <small>09:48 AM</small>
              </div>
            </div>
          </div>

          <div className="ai-insights-box">
            <h4>AI Recommendations</h4>
            <p>
              Parcel <strong>216/3</strong> exhibits 6.3m displacement alongside an active Revenue 7/12 dispute flag. Prioritize field verification.
            </p>
            <button className="btn-outline-sm" style={{ width: "100%", justifyContent: "center" }} onClick={() => onNavigate("conflict_dashboard")}>
              <span>Review 18 Conflicts</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

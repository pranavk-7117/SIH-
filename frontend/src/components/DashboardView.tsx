import React from "react";
import { FileText, Database, AlertTriangle, ShieldCheck, ArrowRight } from "lucide-react";
import { DemoMap } from "./DemoMap";
import { Screen } from "./Sidebar";

type AnyObj = Record<string, any>;

interface DashboardViewProps {
  data: AnyObj;
  onNavigate: (screen: Screen) => void;
  onSelectParcel: (id: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ data, onNavigate, onSelectParcel }) => {
  return (
    <div className="page-container">
      {/* 4 Top KPI Cards */}
      <div className="kpis-grid">
        <div className="kpi-card">
          <div className="kpi-icon blue">
            <FileText size={20} />
          </div>
          <div className="kpi-content">
            <small>Total Investigations</small>
            <b>24</b>
            <span>Active cases in Pune</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon green">
            <Database size={20} />
          </div>
          <div className="kpi-content">
            <small>Parcels Processed</small>
            <b>12,845</b>
            <span>Across all sources</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon orange">
            <AlertTriangle size={20} />
          </div>
          <div className="kpi-content">
            <small>High Priority Cases</small>
            <b>128</b>
            <span>Require officer review</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon purple">
            <ShieldCheck size={20} />
          </div>
          <div className="kpi-content">
            <small>Auto Resolved</small>
            <b>68%</b>
            <span>High confidence trust score</span>
          </div>
        </div>
      </div>

      {/* Middle Grid: Discrepancy Heatmap + Donut & Recent Investigations */}
      <div className="dashboard-grid">
        {/* Discrepancy Heatmap */}
        <div className="bf-card">
          <div className="bf-card-header">
            <div>
              <h3 className="bf-card-title">Discrepancy Heatmap</h3>
              <p className="bf-card-subtitle">Real-time spatial mismatch intensity across Kharadi Sector 12</p>
            </div>
            <span style={{ fontSize: "11px", color: "#64748b" }}>Updated: 02 Sep 2026, 10:30 AM</span>
          </div>

          <DemoMap
            data={data}
            mode="discrepancy"
            compact={false}
            onSelectParcel={(pid) => {
              onSelectParcel(pid);
              onNavigate("evidence_card");
            }}
          />

          <div style={{ marginTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "16px", fontSize: "11.5px", color: "#94a3b8" }}>
              <span><i className="timeline-dot" style={{ background: "#22c55e" }} /> Low (0 - 1 m)</span>
              <span><i className="timeline-dot" style={{ background: "#f59e0b" }} /> Medium (1 - 3 m)</span>
              <span><i className="timeline-dot" style={{ background: "#ef4444" }} /> High (&gt; 3 m)</span>
            </div>
            <button className="btn-outline" style={{ padding: "6px 12px", fontSize: "11.5px" }} onClick={() => onNavigate("discrepancy")}>
              <span>Full Discrepancy Map</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Right Stack: Donut & Recent Cases */}
        <div className="dashboard-right-stack">
          {/* Investigation Status */}
          <div className="bf-card">
            <h3 className="bf-card-title" style={{ marginBottom: "12px" }}>Investigation Status</h3>
            <div className="donut-wrapper">
              <div className="donut-chart">
                <div className="donut-inner">
                  <b>68%</b>
                  <span>RESOLVED</span>
                </div>
              </div>
              <div className="donut-legend">
                <div className="legend-item">
                  <i style={{ background: "#10b981" }} />
                  <span>Completed</span>
                  <small>68% (16)</small>
                </div>
                <div className="legend-item">
                  <i style={{ background: "#38bdf8" }} />
                  <span>In Review</span>
                  <small>20% (5)</small>
                </div>
                <div className="legend-item">
                  <i style={{ background: "#f59e0b" }} />
                  <span>In Progress</span>
                  <small>8% (2)</small>
                </div>
                <div className="legend-item">
                  <i style={{ background: "#ef4444" }} />
                  <span>On Hold</span>
                  <small>4% (1)</small>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Investigations */}
          <div className="bf-card">
            <div className="bf-card-header" style={{ marginBottom: "10px" }}>
              <h3 className="bf-card-title">Recent Investigations</h3>
              <button
                className="btn-outline"
                style={{ padding: "3px 8px", fontSize: "10.5px" }}
                onClick={() => onNavigate("review")}
              >
                View All
              </button>
            </div>

            <div className="investigation-list">
              <div
                className="investigation-item"
                onClick={() => {
                  onSelectParcel("parcel-101");
                  onNavigate("review");
                }}
              >
                <div>
                  <div className="inv-code">INV-2026-00124</div>
                  <div className="inv-location">Kharadi Sector 12</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span className="badge-pill high">High</span>
                  <div className="inv-date">12 May 2026</div>
                </div>
              </div>

              <div
                className="investigation-item"
                onClick={() => {
                  onSelectParcel("parcel-102");
                  onNavigate("review");
                }}
              >
                <div>
                  <div className="inv-code">INV-2026-00123</div>
                  <div className="inv-location">Wagholi Village</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span className="badge-pill medium">Medium</span>
                  <div className="inv-date">11 May 2026</div>
                </div>
              </div>

              <div
                className="investigation-item"
                onClick={() => {
                  onSelectParcel("parcel-104");
                  onNavigate("review");
                }}
              >
                <div>
                  <div className="inv-code">INV-2026-00122</div>
                  <div className="inv-location">Hinjawadi Phase 3</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span className="badge-pill low">Low</span>
                  <div className="inv-date">10 May 2026</div>
                </div>
              </div>

              <div
                className="investigation-item"
                onClick={() => {
                  onSelectParcel("parcel-111");
                  onNavigate("review");
                }}
              >
                <div>
                  <div className="inv-code">INV-2026-00121</div>
                  <div className="inv-location">Pimpri-Chinchwad</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span className="badge-pill high">High</span>
                  <div className="inv-date">09 May 2026</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

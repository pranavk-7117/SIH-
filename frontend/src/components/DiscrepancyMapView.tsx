import React, { useState } from "react";
import { ShieldCheck, Filter, RotateCcw, ArrowRight } from "lucide-react";
import { DemoMap } from "./DemoMap";
import { Screen } from "./Sidebar";

type AnyObj = Record<string, any>;

interface DiscrepancyMapViewProps {
  data: AnyObj;
  selectedParcelId: string;
  onSelectParcel: (id: string) => void;
  onNavigate?: (screen: Screen) => void;
  onReview?: (id: string) => void;
}

export const DiscrepancyMapView: React.FC<DiscrepancyMapViewProps> = ({
  data,
  selectedParcelId,
  onSelectParcel,
  onNavigate,
  onReview,
}) => {
  const [filterConflict, setFilterConflict] = useState("all");
  const [filterConfidence, setFilterConfidence] = useState("all");
  const [filterSourcePair, setFilterSourcePair] = useState("all");

  const resetFilters = () => {
    setFilterConflict("all");
    setFilterConfidence("all");
    setFilterSourcePair("all");
  };

  const parcels = data.residuals || [];

  return (
    <div className="page-container">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span>Investigation</span>
        <span>&gt;</span>
        <span>INV-2026-00124</span>
        <span>&gt;</span>
        <span className="active">Legal vs Physical Discrepancy Map</span>
      </div>

      <div className="discrepancy-layout">
        {/* Left Legend & Filters Panel */}
        <div className="bf-card" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="bf-card-title">
            <ShieldCheck size={16} style={{ color: "#10b981" }} />
            <span>Discrepancy Legend</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "11.5px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="timeline-dot" style={{ background: "#ef4444" }} />
              <span>High Conflict (&gt; 3 m)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="timeline-dot" style={{ background: "#f59e0b" }} />
              <span>Medium Conflict (1 - 3 m)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="timeline-dot" style={{ background: "#eab308" }} />
              <span>Low Conflict (&lt; 1 m)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="timeline-dot" style={{ background: "#22c55e" }} />
              <span>No Conflict</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="timeline-dot" style={{ background: "#64748b" }} />
              <span>Not Analyzed</span>
            </div>
          </div>

          <hr style={{ borderColor: "var(--border-color)", margin: "4px 0" }} />

          <div className="bf-card-title" style={{ fontSize: "12.5px" }}>
            <Filter size={14} />
            <span>Filters</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div>
              <label style={{ fontSize: "10.5px", color: "#94a3b8" }}>Conflict Type</label>
              <select
                className="filter-select"
                value={filterConflict}
                onChange={(e) => setFilterConflict(e.target.value)}
              >
                <option value="all">All Discrepancies</option>
                <option value="shift">Systematic Shift / CRS</option>
                <option value="rotation">Boundary Rotation</option>
                <option value="encroachment">Physical Encroachment</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: "10.5px", color: "#94a3b8" }}>Confidence Score</label>
              <select
                className="filter-select"
                value={filterConfidence}
                onChange={(e) => setFilterConfidence(e.target.value)}
              >
                <option value="all">All Confidence Levels</option>
                <option value="high">High Trust (&gt;80%)</option>
                <option value="low">Low Trust (&lt;50% - Review)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: "10.5px", color: "#94a3b8" }}>Source Pair</label>
              <select
                className="filter-select"
                value={filterSourcePair}
                onChange={(e) => setFilterSourcePair(e.target.value)}
              >
                <option value="all">All Pairs</option>
                <option value="cadastral_drone">Cadastral (1960) vs Drone (2024)</option>
                <option value="cadastral_gnss">Cadastral (1960) vs GNSS Survey</option>
              </select>
            </div>

            <button
              className="btn-outline"
              style={{ padding: "6px 12px", fontSize: "11px", justifyContent: "center" }}
              onClick={resetFilters}
            >
              <RotateCcw size={12} />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>

        {/* Center Interactive Map */}
        <div className="bf-card">
          <DemoMap
            data={data}
            mode="discrepancy"
            compact={false}
            selectedParcelId={selectedParcelId}
            onSelectParcel={(pid) => {
              onSelectParcel(pid);
              if (onReview) onReview(pid);
              else onNavigate?.("evidence");
            }}
          />
        </div>

        {/* Right Conflict Summary & Priority Queue */}
        <div className="bf-card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div className="bf-card-title">
            <span>Conflict Summary</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "11.5px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8" }}>
              <span>Total Parcels:</span>
              <b style={{ color: "#fff" }}>1,384</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#ef4444" }}>
              <span>High Conflict:</span>
              <b>128 (9.25%)</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#f59e0b" }}>
              <span>Medium Conflict:</span>
              <b>312 (22.54%)</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#34d399" }}>
              <span>Low Conflict:</span>
              <b>624 (45.09%)</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#10b981" }}>
              <span>No Conflict:</span>
              <b>256 (18.50%)</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b" }}>
              <span>Not Analyzed:</span>
              <b>64 (4.63%)</b>
            </div>
          </div>

          <hr style={{ borderColor: "var(--border-color)", margin: "4px 0" }} />

          <div className="bf-card-title" style={{ fontSize: "12px" }}>
            <span>Discrepancy Cases</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "200px", overflowY: "auto" }}>
            {parcels.slice(0, 5).map((p: AnyObj) => (
              <button
                key={p.case_id}
                className={`parcel-selection-btn ${selectedParcelId === p.parcel_id ? "active" : ""}`}
                onClick={() => {
                  onSelectParcel(p.parcel_id);
                  if (onReview) onReview(p.parcel_id);
                  else onNavigate?.("evidence");
                }}
              >
                <b>Parcel {p.parcel_num || p.parcel_id.replace("parcel-", "")}</b>
                <span className={`badge-pill ${p.risk === "high" ? "high" : p.risk === "medium" ? "medium" : "low"}`}>
                  {p.displacement || `${p.magnitude_m} m`}
                </span>
              </button>
            ))}
          </div>

          <div style={{ marginTop: "auto", paddingTop: "8px" }}>
            <button
              className="btn-emerald"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={() => onNavigate?.("review")}
            >
              <span>View Priority Review List</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


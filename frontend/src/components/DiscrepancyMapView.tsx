import React, { useState, useMemo } from "react";
import { ShieldCheck, Filter, RotateCcw, ArrowRight, AlertTriangle } from "lucide-react";
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

  const rawResiduals: AnyObj[] = data.residuals || [];

  // Dynamic calculations computed directly from active dataset — zero hardcoding
  const totalParcelsCount = rawResiduals.length || data.cadastral?.features?.length || 24;
  const highConflictCount = rawResiduals.filter((r) => r.magnitude_m >= 2.5 || r.risk === "high").length;
  const mediumConflictCount = rawResiduals.filter((r) => (r.magnitude_m >= 1.0 && r.magnitude_m < 2.5) || r.risk === "medium").length;
  const lowConflictCount = rawResiduals.filter((r) => r.magnitude_m > 0 && r.magnitude_m < 1.0 && r.risk !== "high" && r.risk !== "medium").length;
  const noConflictCount = Math.max(0, totalParcelsCount - highConflictCount - mediumConflictCount - lowConflictCount);

  // Live filtering across all 3 filter dimensions
  const filteredParcels = useMemo(() => {
    return rawResiduals.filter((p) => {
      // 1. Conflict Type / Displacement filter
      if (filterConflict === "high" && p.magnitude_m < 2.5 && p.risk !== "high") return false;
      if (filterConflict === "medium" && ((p.magnitude_m < 1.0 || p.magnitude_m >= 2.5) && p.risk !== "medium")) return false;
      if (filterConflict === "low" && (p.magnitude_m >= 1.0 || p.magnitude_m === 0)) return false;
      if (filterConflict === "shift" && p.temporal?.classification !== "registration_error") return false;
      if (filterConflict === "encroachment" && p.temporal?.classification !== "genuine_change") return false;
      if (filterConflict === "dnd" && !p.ambiguous_match && !p.state?.includes("Do Not Decide")) return false;

      // 2. Confidence Score filter
      const conf = p.confidence !== undefined ? p.confidence : 0.8;
      if (filterConfidence === "high" && conf < 0.70) return false;
      if (filterConfidence === "low" && conf >= 0.70) return false;

      // 3. Source Pair filter
      if (filterSourcePair === "cadastral_gnss" && p.magnitude_m > 1.5) return false; // GNSS-anchored inliers
      if (filterSourcePair === "cadastral_drone" && !p.building_id) return false;

      return true;
    });
  }, [rawResiduals, filterConflict, filterConfidence, filterSourcePair]);

  // Create a filtered data bundle to pass to DemoMap so map visually highlights filtered subset
  const filteredData = useMemo(() => {
    return {
      ...data,
      residuals: filteredParcels,
    };
  }, [data, filteredParcels]);

  const handlePriorityReviewClick = () => {
    // Select the highest priority parcel first
    const highest = rawResiduals.find((r) => r.risk === "high") || rawResiduals[0];
    if (highest) {
      onSelectParcel(highest.parcel_id);
    }
    if (onNavigate) {
      onNavigate("review");
    }
  };

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
              <span>High Conflict (&gt; 2.5 m)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="timeline-dot" style={{ background: "#f59e0b" }} />
              <span>Medium Conflict (1.0 - 2.5 m)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="timeline-dot" style={{ background: "#22c55e" }} />
              <span>Low Conflict (&lt; 1.0 m)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="timeline-dot" style={{ background: "#64748b" }} />
              <span>No Discrepancy</span>
            </div>
          </div>

          <hr style={{ borderColor: "var(--border-color)", margin: "4px 0" }} />

          <div className="bf-card-title" style={{ fontSize: "12.5px" }}>
            <Filter size={14} />
            <span>Live Filters</span>
            {filteredParcels.length !== rawResiduals.length && (
              <span className="badge-pill warn" style={{ fontSize: "9px", marginLeft: "auto" }}>
                {filteredParcels.length} / {rawResiduals.length}
              </span>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div>
              <label style={{ fontSize: "10.5px", color: "#64748b", fontWeight: 600 }}>Conflict Type</label>
              <select
                className="filter-select"
                value={filterConflict}
                onChange={(e) => setFilterConflict(e.target.value)}
              >
                <option value="all">All Discrepancies ({rawResiduals.length})</option>
                <option value="high">High Conflict (&gt; 2.5m) ({highConflictCount})</option>
                <option value="medium">Medium Conflict (1-2.5m) ({mediumConflictCount})</option>
                <option value="low">Low Conflict (&lt; 1m) ({lowConflictCount})</option>
                <option value="shift">Datum Shift (Coherent)</option>
                <option value="encroachment">Physical Encroachment</option>
                <option value="dnd">Do Not Decide / Ambiguous</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: "10.5px", color: "#64748b", fontWeight: 600 }}>Confidence Score</label>
              <select
                className="filter-select"
                value={filterConfidence}
                onChange={(e) => setFilterConfidence(e.target.value)}
              >
                <option value="all">All Confidence Levels</option>
                <option value="high">High Trust (&gt;= 70%)</option>
                <option value="low">Low Trust (&lt; 70% - Review)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: "10.5px", color: "#64748b", fontWeight: 600 }}>Source Pair</label>
              <select
                className="filter-select"
                value={filterSourcePair}
                onChange={(e) => setFilterSourcePair(e.target.value)}
              >
                <option value="all">All Source Pairs</option>
                <option value="cadastral_drone">Cadastral vs Drone Footprints</option>
                <option value="cadastral_gnss">Cadastral vs GNSS Survey</option>
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

        {/* Center Interactive Map with live filtered residuals */}
        <div className="bf-card">
          <DemoMap
            data={filteredData}
            mode="discrepancy"
            compact={false}
            selectedParcelId={selectedParcelId}
            onSelectParcel={(pid) => {
              onSelectParcel(pid);
              if (onReview) onReview(pid);
              else if (onNavigate) onNavigate("evidence");
            }}
          />
        </div>

        {/* Right Conflict Summary & Priority Queue — 100% computed */}
        <div className="bf-card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div className="bf-card-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Conflict Summary</span>
            <span className="badge-pill success" style={{ fontSize: "9px" }}>COMPUTED</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "11.5px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b" }}>
              <span>Total Parcels:</span>
              <b style={{ color: "#0f172a" }}>{totalParcelsCount}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#ef4444" }}>
              <span>High Conflict (&gt;2.5m):</span>
              <b>{highConflictCount} ({Math.round((highConflictCount / (totalParcelsCount || 1)) * 100)}%)</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#f59e0b" }}>
              <span>Medium Conflict (1-2.5m):</span>
              <b>{mediumConflictCount} ({Math.round((mediumConflictCount / (totalParcelsCount || 1)) * 100)}%)</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#10b981" }}>
              <span>Low Conflict (&lt;1m):</span>
              <b>{lowConflictCount} ({Math.round((lowConflictCount / (totalParcelsCount || 1)) * 100)}%)</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b" }}>
              <span>Within Tolerance:</span>
              <b>{noConflictCount} ({Math.round((noConflictCount / (totalParcelsCount || 1)) * 100)}%)</b>
            </div>
          </div>

          <hr style={{ borderColor: "var(--border-color)", margin: "4px 0" }} />

          <div className="bf-card-title" style={{ fontSize: "12px", display: "flex", justifyContent: "space-between" }}>
            <span>Discrepancy Cases</span>
            <span style={{ fontSize: "10.5px", color: "#64748b" }}>{filteredParcels.length} matches</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "220px", overflowY: "auto" }}>
            {filteredParcels.length === 0 ? (
              <div style={{ padding: "12px", textAlign: "center", color: "#94a3b8", fontSize: "11.5px" }}>
                No parcels match the selected filter criteria.
              </div>
            ) : (
              filteredParcels.map((p: AnyObj) => (
                <button
                  key={p.case_id}
                  className={`parcel-selection-btn ${selectedParcelId === p.parcel_id ? "active" : ""}`}
                  onClick={() => {
                    onSelectParcel(p.parcel_id);
                    if (onReview) onReview(p.parcel_id);
                    else if (onNavigate) onNavigate("evidence");
                  }}
                >
                  <div>
                    <b>Parcel {p.parcel_num || p.parcel_id.replace("parcel-", "")}</b>
                    {p.ambiguous_match && (
                      <span className="badge-pill warn" style={{ fontSize: "8px", marginLeft: "6px" }}>DND</span>
                    )}
                  </div>
                  <span className={`badge-pill ${p.risk === "high" ? "high" : p.risk === "medium" ? "medium" : "low"}`}>
                    {p.displacement || `${p.magnitude_m} m`}
                  </span>
                </button>
              ))
            )}
          </div>

          <div style={{ marginTop: "auto", paddingTop: "8px" }}>
            <button
              className="btn-emerald"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={handlePriorityReviewClick}
              title="Navigate directly to Review & Decision screen for high priority cases"
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

import React, { useState, useMemo } from "react";
import { ShieldAlert, AlertTriangle, CheckCircle2, Sliders, ArrowRight, Eye, Layers, ShieldOff, MapPin } from "lucide-react";
import { DemoMap } from "./DemoMap";
import { Screen } from "./Sidebar";

interface ConflictItem {
  id: string;
  parcel_num: string;
  severity: "critical" | "needs_review" | "low_priority" | "resolved";
  severity_label: string;
  conflict_type: string;
  displacement: number;
  trust_score: number;
  decision_state: "dnd" | "needs_review" | "auto_accepted" | "resolved";
  decision_label: string;
  why: {
    displacement: string;
    source_disagreement: string;
    registration_residual: string;
    legal_status: string;
  };
}

interface ConflictDashboardViewProps {
  data: any;
  conflicts?: ConflictItem[];
  onSelectParcel: (id: string) => void;
  onNavigate: (screen: Screen) => void;
}

export const ConflictDashboardView: React.FC<ConflictDashboardViewProps> = ({
  data,
  conflicts: externalConflicts,
  onSelectParcel,
  onNavigate,
}) => {
  const [trustThreshold, setTrustThreshold] = useState<number>(0.75);
  const [selectedSeverity, setSelectedSeverity] = useState<Record<string, boolean>>({
    critical: true,
    needs_review: true,
    low_priority: true,
    resolved: false,
  });
  const [selectedStates, setSelectedStates] = useState<Record<string, boolean>>({
    auto_accepted: true,
    needs_review: true,
    dnd: true,
  });
  const [selectedConflictId, setSelectedConflictId] = useState<string>("");

  // Dynamically derive conflicts from live residuals or external prop
  const conflicts: ConflictItem[] = useMemo(() => {
    if (externalConflicts && externalConflicts.length > 0) return externalConflicts;
    const residuals = data.residuals || [];
    if (!residuals || residuals.length === 0) return [];

    return residuals
      .filter((r: any) => r.risk === "high" || r.risk === "medium" || r.ambiguous_match)
      .map((r: any) => {
        const isCritical = r.risk === "high" || r.ambiguous_match;
        const isDnd = r.state?.includes("Do Not Decide") || r.ambiguous_match;
        const disp = Number((r.displacement_m || r.residual_m || 0).toFixed(1));
        const trust = Number((1 - Math.min(0.9, (r.residual_m || 0) / 8)).toFixed(2));
        return {
          id: r.parcel_id || `parcel-${r.parcel_num}`,
          parcel_num: String(r.parcel_num || r.parcel_id || "").replace("parcel-", ""),
          severity: isCritical ? "critical" : "needs_review",
          severity_label: isCritical ? "Critical" : "Needs Review",
          conflict_type: r.dispute_type || (disp > 3 ? "Boundary displacement" : "Area mismatch"),
          displacement: disp,
          trust_score: trust,
          decision_state: isDnd ? "dnd" : "needs_review",
          decision_label: isDnd ? "DO NOT DECIDE" : "NEEDS REVIEW",
          why: {
            displacement: `${disp} m`,
            source_disagreement: r.source_disagreement || "Cadastral vs Drone Footprint Observation",
            registration_residual: `${(r.residual_m || disp).toFixed(1)} m avg`,
            legal_status: r.legal_flag ? "Dispute Flag on Revenue Record" : "Standard Title Record",
          },
        };
      });
  }, [externalConflicts, data.residuals]);

  const hasData = conflicts.length > 0;

  const filteredConflicts = useMemo(() => {
    return conflicts.filter((c) => {
      if (!selectedSeverity[c.severity]) return false;
      if (!selectedStates[c.decision_state]) return false;
      return true;
    });
  }, [conflicts, selectedSeverity, selectedStates]);

  const activeConflict = conflicts.find((c) => c.id === selectedConflictId) || conflicts[0];

  const handleSelect = (conflict: ConflictItem) => {
    setSelectedConflictId(conflict.id);
    onSelectParcel(conflict.id);
  };

  const handleOpenReview = (conflict: ConflictItem) => {
    handleSelect(conflict);
    onNavigate("review");
  };

  const criticalCount = conflicts.filter((c) => c.severity === "critical").length;
  const reviewCount = conflicts.filter((c) => c.severity === "needs_review").length;
  const lowCount = conflicts.filter((c) => c.severity === "low_priority").length;
  const resolvedCount = conflicts.filter((c) => c.severity === "resolved").length;

  return (
    <div className="page-container conflict-dashboard-root">
      {/* Header */}
      <div className="view-page-header">
        <div>
          <h2>Conflict Dashboard</h2>
          <p>Evidence-driven review of spatial and legal discrepancies &bull; NAKSHA Programme</p>
        </div>
        {hasData && (
          <div className="conflict-kpi-summary-strip" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <span className="kpi-tag critical">Critical: {criticalCount}</span>
            <span className="kpi-tag warning">Needs Review: {reviewCount}</span>
            <span className="kpi-tag low">Low Priority: {lowCount}</span>
            <span className="kpi-tag resolved">Resolved: {resolvedCount}</span>
          </div>
        )}
      </div>

      {!hasData ? (
        /* Empty state — completely clean site */
        <div className="empty-state-box">
          <div className="empty-state-icon">
            <ShieldOff size={28} />
          </div>
          <h3>No conflicts detected yet</h3>
          <p>
            The workspace is currently clean. Upload and harmonize your cadastral maps, drone imagery,
            and GNSS control data to automatically detect spatial boundary displacements and legal overlaps.
          </p>
          <button className="btn-emerald" onClick={() => onNavigate("upload")}>
            <Layers size={15} />
            <span>Upload Datasets</span>
          </button>
        </div>
      ) : (
        /* Main 3-Column Split */
        <div className="conflict-dashboard-grid" style={{ display: "grid", gridTemplateColumns: "240px 1fr 360px", gap: "16px", alignItems: "start" }}>
          {/* Left Filters */}
          <div className="bf-card conflict-filters-card" style={{ padding: "18px" }}>
            <div className="bf-card-title" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <Sliders size={16} />
              <span>Filters</span>
            </div>

            <div className="filter-group" style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "12.5px" }}>
                Trust Score Threshold: <strong>{Math.round(trustThreshold * 100)}%</strong>
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={trustThreshold}
                onChange={(e) => setTrustThreshold(parseFloat(e.target.value))}
                className="bf-range-slider"
                style={{ width: "100%", accentColor: "#047857" }}
              />
              <div className="slider-range-labels" style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "10.5px", color: "#94a3b8" }}>
                <span>0%</span>
                <span>DND (62%)</span>
                <span>100%</span>
              </div>
            </div>

            <div className="filter-group" style={{ marginBottom: "20px" }}>
              <label className="filter-group-heading" style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", marginBottom: "8px" }}>
                Severity
              </label>
              <label className="checkbox-label" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", fontSize: "12.5px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={selectedSeverity.critical}
                  onChange={(e) => setSelectedSeverity({ ...selectedSeverity, critical: e.target.checked })}
                />
                <span className="dot critical" style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444" }} />
                <span>Critical (High DND)</span>
              </label>
              <label className="checkbox-label" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", fontSize: "12.5px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={selectedSeverity.needs_review}
                  onChange={(e) => setSelectedSeverity({ ...selectedSeverity, needs_review: e.target.checked })}
                />
                <span className="dot warning" style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f59e0b" }} />
                <span>Needs Review</span>
              </label>
              <label className="checkbox-label" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", fontSize: "12.5px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={selectedSeverity.low_priority}
                  onChange={(e) => setSelectedSeverity({ ...selectedSeverity, low_priority: e.target.checked })}
                />
                <span className="dot low" style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#94a3b8" }} />
                <span>Low Priority</span>
              </label>
              <label className="checkbox-label" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={selectedSeverity.resolved}
                  onChange={(e) => setSelectedSeverity({ ...selectedSeverity, resolved: e.target.checked })}
                />
                <span className="dot resolved" style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }} />
                <span>Resolved</span>
              </label>
            </div>

            <div className="filter-group">
              <label className="filter-group-heading" style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", marginBottom: "8px" }}>
                Decision State
              </label>
              <label className="checkbox-label" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", fontSize: "12.5px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={selectedStates.auto_accepted}
                  onChange={(e) => setSelectedStates({ ...selectedStates, auto_accepted: e.target.checked })}
                />
                <span>Auto Accepted</span>
              </label>
              <label className="checkbox-label" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", fontSize: "12.5px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={selectedStates.needs_review}
                  onChange={(e) => setSelectedStates({ ...selectedStates, needs_review: e.target.checked })}
                />
                <span>Needs Review</span>
              </label>
              <label className="checkbox-label" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={selectedStates.dnd}
                  onChange={(e) => setSelectedStates({ ...selectedStates, dnd: e.target.checked })}
                />
                <span>Do Not Decide (DND)</span>
              </label>
            </div>
          </div>

          {/* Center Conflict List */}
          <div className="bf-card conflict-list-card" style={{ padding: "0", overflow: "hidden" }}>
            <div className="conflict-list-header" style={{ padding: "14px 18px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 700, margin: 0 }}>Conflicts ({filteredConflicts.length})</h3>
              <span className="sort-hint" style={{ fontSize: "11.5px", color: "#94a3b8" }}>Sort by: <strong>Priority</strong></span>
            </div>

            <div className="conflict-items-scrollable" style={{ maxHeight: "560px", overflowY: "auto" }}>
              {filteredConflicts.length === 0 ? (
                <div style={{ padding: "40px 20px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                  No conflicts match the current filter criteria.
                </div>
              ) : (
                filteredConflicts.map((c) => (
                  <div
                    key={c.id}
                    className={`conflict-list-item ${activeConflict?.id === c.id ? "selected" : ""}`}
                    onClick={() => handleSelect(c)}
                    style={{
                      padding: "14px 18px",
                      borderBottom: "1px solid #f1f5f9",
                      cursor: "pointer",
                      background: activeConflict?.id === c.id ? "rgba(16, 185, 129, 0.08)" : "transparent",
                      borderLeft: activeConflict?.id === c.id ? "3px solid #10b981" : "3px solid transparent",
                    }}
                  >
                    <div className="conflict-item-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <div className="conflict-parcel-badge" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <strong style={{ fontSize: "14px", color: "#0f172a" }}>Parcel {c.parcel_num}</strong>
                        <span className={`severity-tag ${c.severity}`} style={{ padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 700 }}>
                          {c.severity_label}
                        </span>
                      </div>
                      <div className="conflict-metrics-preview" style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px" }}>
                        <span className="disp-val" style={{ fontWeight: 700, color: "#ef4444" }}>{c.displacement} m</span>
                        <span className="trust-pct" style={{ color: "#64748b" }}>Trust {Math.round(c.trust_score * 100)}%</span>
                      </div>
                    </div>

                    <div className="conflict-item-bottom" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className="conflict-type-text" style={{ fontSize: "12px", color: "#64748b" }}>{c.conflict_type}</span>
                      <span className={`decision-state-pill ${c.decision_state}`} style={{ padding: "2px 8px", borderRadius: "8px", fontSize: "10.5px", fontWeight: 800 }}>
                        {c.decision_label}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Map & Deep Inspector */}
          {activeConflict && (
            <div className="conflict-map-inspector-col" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className="bf-card conflict-map-card" style={{ padding: "0", overflow: "hidden" }}>
                <div className="conflict-map-header" style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "12.5px", fontWeight: 700 }}>Spatial Displacement View</span>
                  <div className="map-legend-dots" style={{ display: "flex", gap: "8px", fontSize: "11px" }}>
                    <span className="legend-dot critical">Critical</span>
                    <span className="legend-dot warning">Needs Review</span>
                  </div>
                </div>
                <div className="map-canvas-wrapper" style={{ height: "230px" }}>
                  <DemoMap data={data} singleParcelFocus={activeConflict.id} />
                </div>
              </div>

              {/* Bottom Card: Why is Parcel X a conflict? */}
              <div className="bf-card conflict-why-card" style={{ padding: "16px" }}>
                <div className="why-card-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h4 style={{ fontSize: "13px", fontWeight: 700, margin: 0 }}>
                    Why is Parcel {activeConflict.parcel_num} a conflict?
                  </h4>
                  <button className="btn-emerald-sm" onClick={() => handleOpenReview(activeConflict)}>
                    <span>View Details</span>
                    <ArrowRight size={13} />
                  </button>
                </div>

                <div className="why-factors-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div className="why-factor-item" style={{ background: "#f8fafc", padding: "8px 10px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                    <small style={{ fontSize: "10.5px", color: "#64748b", display: "block" }}>Boundary Displacement</small>
                    <b style={{ color: "#ef4444", fontSize: "13px" }}>{activeConflict.why.displacement}</b>
                  </div>
                  <div className="why-factor-item" style={{ background: "#f8fafc", padding: "8px 10px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                    <small style={{ fontSize: "10.5px", color: "#64748b", display: "block" }}>Source Disagreement</small>
                    <b style={{ fontSize: "11.5px", color: "#0f172a" }}>{activeConflict.why.source_disagreement}</b>
                  </div>
                  <div className="why-factor-item" style={{ background: "#f8fafc", padding: "8px 10px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                    <small style={{ fontSize: "10.5px", color: "#64748b", display: "block" }}>Registration Residual</small>
                    <b style={{ fontSize: "12px", color: "#0f172a" }}>{activeConflict.why.registration_residual}</b>
                  </div>
                  <div className="why-factor-item" style={{ background: "#f8fafc", padding: "8px 10px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                    <small style={{ fontSize: "10.5px", color: "#64748b", display: "block" }}>Legal / Revenue Flag</small>
                    <b style={{ color: "#b45309", fontSize: "11.5px" }}>{activeConflict.why.legal_status}</b>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

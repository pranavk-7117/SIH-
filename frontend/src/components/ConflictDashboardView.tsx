import React, { useState, useMemo } from "react";
import { ShieldAlert, AlertTriangle, CheckCircle2, Sliders, ArrowRight, Eye, Layers } from "lucide-react";
import { DemoMap } from "./DemoMap";
import { Screen } from "./Sidebar";

interface ConflictDashboardViewProps {
  data: any;
  onSelectParcel: (id: string) => void;
  onNavigate: (screen: Screen) => void;
}

export const ConflictDashboardView: React.FC<ConflictDashboardViewProps> = ({
  data,
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
  const [selectedConflictId, setSelectedConflictId] = useState<string>("parcel-216/3");

  // Controlled, realistic SIH conflict test cases mapped directly to image 09
  const conflicts = useMemo(() => [
    {
      id: "parcel-216/3",
      parcel_num: "216/3",
      severity: "critical",
      severity_label: "Critical",
      conflict_type: "Boundary overlap",
      displacement: 6.3,
      trust_score: 0.34,
      decision_state: "dnd",
      decision_label: "DO NOT DECIDE",
      why: {
        displacement: "6.3 m",
        source_disagreement: "Cadastral vs Drone Imagery",
        registration_residual: "2.3 m",
        legal_status: "Active Revenue 7/12 Dispute Flag",
      },
    },
    {
      id: "parcel-214/2A",
      parcel_num: "214/2A",
      severity: "critical",
      severity_label: "Critical",
      conflict_type: "Boundary displacement",
      displacement: 4.8,
      trust_score: 0.52,
      decision_state: "dnd",
      decision_label: "DO NOT DECIDE",
      why: {
        displacement: "4.8 m",
        source_disagreement: "GNSS Rover vs Cadastral centroid",
        registration_residual: "1.9 m",
        legal_status: "Encumbrance recorded (Khata 3481)",
      },
    },
    {
      id: "parcel-220/1",
      parcel_num: "220/1",
      severity: "needs_review",
      severity_label: "Needs Review",
      conflict_type: "Area mismatch",
      displacement: 2.1,
      trust_score: 0.68,
      decision_state: "needs_review",
      decision_label: "NEEDS REVIEW",
      why: {
        displacement: "2.1 m",
        source_disagreement: "Municipal Road ROW encroaching plot boundary",
        registration_residual: "1.2 m",
        legal_status: "No active civil dispute",
      },
    },
    {
      id: "parcel-219/4A",
      parcel_num: "219/4A",
      severity: "needs_review",
      severity_label: "Needs Review",
      conflict_type: "Boundary overlap",
      displacement: 3.5,
      trust_score: 0.59,
      decision_state: "needs_review",
      decision_label: "NEEDS REVIEW",
      why: {
        displacement: "3.5 m",
        source_disagreement: "Building extension beyond cadastral boundary",
        registration_residual: "1.4 m",
        legal_status: "Pending mutation (Sale deed 2021)",
      },
    },
    {
      id: "parcel-211/1B",
      parcel_num: "211/1B",
      severity: "low_priority",
      severity_label: "Low Priority",
      conflict_type: "Boundary gap",
      displacement: 0.5,
      trust_score: 0.91,
      decision_state: "auto_accepted",
      decision_label: "AUTO ACCEPTED",
      why: {
        displacement: "0.5 m",
        source_disagreement: "Sub-meter sensor noise (within GPS tolerance)",
        registration_residual: "0.3 m",
        legal_status: "Clear title, no encumbrance",
      },
    },
  ], []);

  const filteredConflicts = useMemo(() => {
    return conflicts.filter((c) => {
      if (!selectedSeverity[c.severity]) return false;
      if (!selectedStates[c.decision_state]) return false;
      return true;
    });
  }, [conflicts, selectedSeverity, selectedStates]);

  const activeConflict = conflicts.find((c) => c.id === selectedConflictId) || conflicts[0];

  const handleSelect = (conflict: any) => {
    setSelectedConflictId(conflict.id);
    onSelectParcel(conflict.id);
  };

  const handleOpenReview = (conflict: any) => {
    handleSelect(conflict);
    onNavigate("review");
  };

  return (
    <div className="page-container conflict-dashboard-root">
      {/* Header */}
      <div className="view-page-header">
        <div>
          <h2>Conflict Dashboard</h2>
          <p>Evidence-driven review of spatial and legal discrepancies &bull; NAKSHA Programme</p>
        </div>
        <div className="conflict-kpi-summary-strip">
          <span className="kpi-tag critical">Critical: 2</span>
          <span className="kpi-tag warning">Needs Review: 2</span>
          <span className="kpi-tag low">Low Priority: 1</span>
          <span className="kpi-tag resolved">Resolved: 13</span>
        </div>
      </div>

      {/* Main 3-Column Split */}
      <div className="conflict-dashboard-grid">
        {/* Left Filters */}
        <div className="bf-card conflict-filters-card">
          <div className="bf-card-title">
            <Sliders size={16} />
            <span>Filters</span>
          </div>

          <div className="filter-group">
            <label>Trust Score Threshold: <strong>{Math.round(trustThreshold * 100)}%</strong></label>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={trustThreshold}
              onChange={(e) => setTrustThreshold(parseFloat(e.target.value))}
              className="bf-range-slider"
            />
            <div className="slider-range-labels">
              <span>0%</span>
              <span>DND (62%)</span>
              <span>100%</span>
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-group-heading">Severity</label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={selectedSeverity.critical}
                onChange={(e) => setSelectedSeverity({ ...selectedSeverity, critical: e.target.checked })}
              />
              <span className="dot critical" /> Critical (High DND)
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={selectedSeverity.needs_review}
                onChange={(e) => setSelectedSeverity({ ...selectedSeverity, needs_review: e.target.checked })}
              />
              <span className="dot warning" /> Needs Review
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={selectedSeverity.low_priority}
                onChange={(e) => setSelectedSeverity({ ...selectedSeverity, low_priority: e.target.checked })}
              />
              <span className="dot low" /> Low Priority
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={selectedSeverity.resolved}
                onChange={(e) => setSelectedSeverity({ ...selectedSeverity, resolved: e.target.checked })}
              />
              <span className="dot resolved" /> Resolved
            </label>
          </div>

          <div className="filter-group">
            <label className="filter-group-heading">Decision State</label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={selectedStates.auto_accepted}
                onChange={(e) => setSelectedStates({ ...selectedStates, auto_accepted: e.target.checked })}
              />
              Auto Accepted
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={selectedStates.needs_review}
                onChange={(e) => setSelectedStates({ ...selectedStates, needs_review: e.target.checked })}
              />
              Needs Review
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={selectedStates.dnd}
                onChange={(e) => setSelectedStates({ ...selectedStates, dnd: e.target.checked })}
              />
              Do Not Decide (Escalated)
            </label>
          </div>
        </div>

        {/* Center Conflict List */}
        <div className="bf-card conflict-list-card">
          <div className="conflict-list-header">
            <h3>Conflicts ({filteredConflicts.length})</h3>
            <span className="sort-hint">Sort by: <strong>Priority</strong></span>
          </div>

          <div className="conflict-items-scrollable">
            {filteredConflicts.map((c) => (
              <div
                key={c.id}
                className={`conflict-list-item ${selectedConflictId === c.id ? "selected" : ""}`}
                onClick={() => handleSelect(c)}
              >
                <div className="conflict-item-top">
                  <div className="conflict-parcel-badge">
                    <strong>{c.parcel_num}</strong>
                    <span className={`severity-tag ${c.severity}`}>{c.severity_label}</span>
                  </div>
                  <div className="conflict-metrics-preview">
                    <span className="disp-val">{c.displacement} m</span>
                    <span className="trust-pct">Trust {Math.round(c.trust_score * 100)}%</span>
                  </div>
                </div>

                <div className="conflict-item-bottom">
                  <span className="conflict-type-text">{c.conflict_type}</span>
                  <span className={`decision-state-pill ${c.decision_state}`}>
                    {c.decision_label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Map & Deep Inspector */}
        <div className="conflict-map-inspector-col">
          <div className="bf-card conflict-map-card">
            <div className="conflict-map-header">
              <span>Conflict Heatmap · Spatial Distribution</span>
              <div className="map-legend-dots">
                <span className="legend-dot critical">Critical</span>
                <span className="legend-dot warning">Needs Review</span>
                <span className="legend-dot low">Low</span>
              </div>
            </div>
            <div className="map-canvas-wrapper" style={{ height: "230px" }}>
              <DemoMap data={data} singleParcelFocus={activeConflict.id} />
            </div>
          </div>

          {/* Bottom Card: Why is Parcel X a conflict? */}
          <div className="bf-card conflict-why-card">
            <div className="why-card-top">
              <h4>Why is Parcel {activeConflict.parcel_num} a conflict?</h4>
              <button className="btn-emerald-sm" onClick={() => handleOpenReview(activeConflict)}>
                <span>View Details</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="why-factors-grid">
              <div className="why-factor-item">
                <small>Boundary Displacement</small>
                <b style={{ color: "#ef4444" }}>{activeConflict.why.displacement}</b>
              </div>
              <div className="why-factor-item">
                <small>Source Disagreement</small>
                <b>{activeConflict.why.source_disagreement}</b>
              </div>
              <div className="why-factor-item">
                <small>Registration Residual</small>
                <b>{activeConflict.why.registration_residual} avg</b>
              </div>
              <div className="why-factor-item">
                <small>Legal / Revenue Flag</small>
                <b style={{ color: "#b45309" }}>{activeConflict.why.legal_status}</b>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

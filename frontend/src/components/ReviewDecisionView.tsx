import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Clock,
  Info,
} from "lucide-react";
import { DemoMap } from "./DemoMap";
import { Screen } from "./Sidebar";

type AnyObj = Record<string, any>;

interface ReviewDecisionViewProps {
  data: AnyObj;
  selectedCase: AnyObj | null;
  selectedParcelId: string | number;
  onSelectParcel: (id: string) => void;
  onSubmitDecision: (decision: string, notes: string, parcelId: string) => void;
  onNavigate: (screen: Screen) => void;
}

export const ReviewDecisionView: React.FC<ReviewDecisionViewProps> = ({
  data,
  selectedCase,
  selectedParcelId,
  onSelectParcel,
  onSubmitDecision,
  onNavigate,
}) => {
  const [decision, setDecision] = useState<string>("field_verification");
  const [notes, setNotes] = useState<string>(
    "Displacement exceeds 6m with active 7/12 dispute. Request ground surveyor RTK field check."
  );
  const [activeTab, setActiveTab] = useState<"evidence" | "history">("evidence");

  const residuals = data.residuals || [];
  const currentIdx = residuals.findIndex(
    (r: AnyObj) =>
      r.parcel_id === selectedParcelId ||
      `parcel-${r.parcel_num}` === selectedParcelId ||
      String(r.parcel_num) === String(selectedParcelId)
  );

  const parcelNum =
    selectedCase?.parcel_id ||
    (typeof selectedParcelId === "string" && selectedParcelId.startsWith("parcel-")
      ? selectedParcelId.replace("parcel-", "PMC-KR-00")
      : `PMC-KR-00${selectedParcelId}`);

  const handleNext = () => {
    if (residuals.length === 0) return;
    const nextIdx = (currentIdx + 1) % residuals.length;
    const nextParcel = residuals[nextIdx];
    onSelectParcel(nextParcel.parcel_id || `parcel-${nextParcel.parcel_num}`);
  };

  const handlePrev = () => {
    if (residuals.length === 0) return;
    const prevIdx = (currentIdx - 1 + residuals.length) % residuals.length;
    const prevParcel = residuals[prevIdx];
    onSelectParcel(prevParcel.parcel_id || `parcel-${prevParcel.parcel_num}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitDecision(decision, notes, String(selectedParcelId));
  };

  const displacementVal = selectedCase?.post_alignment_residual_m !== null && selectedCase?.post_alignment_residual_m !== undefined
    ? `${selectedCase.post_alignment_residual_m.toFixed(1)} m`
    : selectedCase?.residual_m
    ? `${selectedCase.residual_m.toFixed(1)} m`
    : selectedCase?.magnitude_m
    ? `${selectedCase.magnitude_m.toFixed(1)} m`
    : "—";

  const isDND = Boolean(
    selectedCase?.ambiguous_match ||
    (selectedCase?.state && selectedCase.state.includes("Do Not Decide"))
  );

  return (
    <div className="page-container review-decision-root">
      {/* Page Header */}
      <div className="view-page-header">
        <div>
          <h2>Review &amp; Decision</h2>
          <p>Human-in-the-loop adjudication &bull; Court-admissible immutable parcel ledger</p>
        </div>
        <div className="pagination-controls" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button className="btn-outline-sm" onClick={handlePrev} disabled={residuals.length <= 1}>
            <ChevronLeft size={14} />
            <span>Previous</span>
          </button>
          <span className="page-number-pill" style={{ fontWeight: 700, fontSize: "12px", color: "#334155" }}>
            {residuals.length > 0 ? `${currentIdx >= 0 ? currentIdx + 1 : 1} / ${residuals.length}` : "1 / 1"}
          </span>
          <button className="btn-outline-sm" onClick={handleNext} disabled={residuals.length <= 1}>
            <span>Next</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* 3-Column Split */}
      <div className="review-decision-grid" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "16px", alignItems: "start" }}>
        {/* Left Column: Spatial Comparison Map */}
        <div className="bf-card review-map-box" style={{ padding: "0", overflow: "hidden" }}>
          <div className="review-col-header" style={{ padding: "14px 18px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700, fontSize: "13px" }}>Spatial Comparison</span>
            <div className="map-legend-pills" style={{ display: "flex", gap: "6px" }}>
              <span className="pill-cadastral" style={{ background: "#fef3c7", color: "#b45309", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 700 }}>Cadastral</span>
              <span className="pill-drone" style={{ background: "#e0f2fe", color: "#0369a1", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 700 }}>Drone ORI</span>
            </div>
          </div>
          <div style={{ height: "420px", position: "relative" }}>
            <DemoMap data={data} singleParcelFocus={selectedParcelId} onParcelClick={onSelectParcel} />
          </div>
        </div>

        {/* Center Column: Evidence Summary & History Tabs */}
        <div className="bf-card review-evidence-col" style={{ padding: "18px" }}>
          <div className="parcel-id-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div>
              <small style={{ color: "#64748b", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Parcel ID</small>
              <h3 style={{ margin: "2px 0 0 0", fontSize: "18px", color: "#0f172a" }}>{parcelNum}</h3>
            </div>
            {isDND ? (
              <span className="badge-pill warn" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <ShieldAlert size={13} />
                <span>DO NOT DECIDE</span>
              </span>
            ) : (
              <span className="badge-pill success">
                <ShieldCheck size={13} />
                <span>STANDARD REVIEW</span>
              </span>
            )}
          </div>

          <div className="evidence-subtabs">
            <button
              className={`subtab-btn ${activeTab === "evidence" ? "active" : ""}`}
              onClick={() => setActiveTab("evidence")}
            >
              Evidence
            </button>
            <button
              className={`subtab-btn ${activeTab === "history" ? "active" : ""}`}
              onClick={() => setActiveTab("history")}
            >
              History
            </button>
          </div>

          {activeTab === "evidence" ? (
            <div className="evidence-facts-list">
              <div className="fact-item">
                <span className="fact-label">Cadastral vs Drone:</span>
                <span className={`fact-val ${selectedCase?.risk === "high" ? "red" : "amber"}`}>
                  Boundary displacement {displacementVal}
                </span>
              </div>
              <div className="fact-item">
                <span className="fact-label">GNSS disagreement:</span>
                <span className={`fact-val ${selectedCase?.gnss_disagreement_m !== null && selectedCase?.gnss_disagreement_m !== undefined ? "amber" : "gray"}`}>
                  {selectedCase?.gnss_disagreement_m !== null && selectedCase?.gnss_disagreement_m !== undefined
                    ? `${selectedCase.gnss_disagreement_m.toFixed(1)} m`
                    : "Unavailable (No GNSS)"}
                </span>
              </div>
              <div className="fact-item">
                <span className="fact-label">Registration residual:</span>
                <span className="fact-val amber">
                  {selectedCase?.post_alignment_residual_m !== null && selectedCase?.post_alignment_residual_m !== undefined
                    ? `${selectedCase.post_alignment_residual_m.toFixed(2)} m`
                    : (selectedCase?.residual_m ? `${selectedCase.residual_m.toFixed(2)} m` : "—")}
                </span>
              </div>
              <div className="fact-item">
                <span className="fact-label">Revenue record:</span>
                <span className={`fact-val ${selectedCase?.revenue_record?.dispute_flag ? "red" : selectedCase?.revenue_record ? "green" : "gray"}`}>
                  {selectedCase?.revenue_record
                    ? (selectedCase.revenue_record.dispute_flag ? "Dispute Flag Active" : "Clear (No Dispute)")
                    : "No revenue record matched"}
                </span>
              </div>
            </div>
          ) : (
            <div className="history-timeline" style={{ display: "flex", flexDirection: "column", gap: "10px", margin: "14px 0" }}>
              {selectedCase?.revenue_record ? (
                <>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "12px", color: "#475569" }}>
                    <Clock size={14} style={{ color: "#64748b", marginTop: "2px", flexShrink: 0 }} />
                    <span>Survey / Khasra: <b>{selectedCase.revenue_record.survey_number || selectedCase.revenue_record.khasra_no || "Recorded"}</b></span>
                  </div>
                  {selectedCase.revenue_record.last_mutation_date && (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "12px", color: "#475569" }}>
                      <Clock size={14} style={{ color: "#64748b", marginTop: "2px", flexShrink: 0 }} />
                      <span>Last Mutation: <b>{selectedCase.revenue_record.last_mutation_date}</b></span>
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "12px", color: selectedCase.revenue_record.dispute_flag ? "#ef4444" : "#10b981" }}>
                    <Clock size={14} style={{ color: selectedCase.revenue_record.dispute_flag ? "#ef4444" : "#10b981", marginTop: "2px", flexShrink: 0 }} />
                    <span>Dispute Status: <b>{selectedCase.revenue_record.dispute_flag ? "Active Dispute Flag" : "No Dispute on Record"}</b></span>
                  </div>
                </>
              ) : (
                <div style={{ fontSize: "12px", color: "#94a3b8", padding: "10px 0" }}>
                  Historical revenue records not uploaded for this parcel. Upload revenue CSV to link historical mutation logs.
                </div>
              )}
            </div>
          )}

          <div
            style={{
              padding: "10px 12px",
              background: "rgba(2, 132, 199, 0.08)",
              border: "1px solid rgba(2, 132, 199, 0.2)",
              borderRadius: "7px",
              fontSize: "12px",
              color: "#0369a1",
              lineHeight: 1.45,
            }}
          >
            System recommends field verification with dual-frequency RTK rover.
          </div>
        </div>

        {/* Right Column: Decision Controls */}
        <div className="bf-card review-decision-col" style={{ padding: "18px" }}>
          <form onSubmit={handleSubmit} style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <div className="review-col-header" style={{ marginBottom: "14px", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>
              <span style={{ fontWeight: 700, fontSize: "13px" }}>Adjudication Decision</span>
            </div>

            <div className="decision-radio-list">
              <label className={`decision-radio-option ${decision === "accept" ? "checked" : ""}`}>
                <input
                  type="radio"
                  name="decision"
                  value="accept"
                  checked={decision === "accept"}
                  onChange={() => setDecision("accept")}
                />
                <span className="option-text">Accept AI Alignment</span>
              </label>

              <label className={`decision-radio-option ${decision === "adjust" ? "checked" : ""}`}>
                <input
                  type="radio"
                  name="decision"
                  value="adjust"
                  checked={decision === "adjust"}
                  onChange={() => setDecision("adjust")}
                />
                <span className="option-text">Adjust Boundary Vertices</span>
              </label>

              <label className={`decision-radio-option ${decision === "reject" ? "checked" : ""}`}>
                <input
                  type="radio"
                  name="decision"
                  value="reject"
                  checked={decision === "reject"}
                  onChange={() => setDecision("reject")}
                />
                <span className="option-text">Reject Match</span>
              </label>

              <label className={`decision-radio-option ${decision === "escalate" ? "checked" : ""}`}>
                <input
                  type="radio"
                  name="decision"
                  value="escalate"
                  checked={decision === "escalate"}
                  onChange={() => setDecision("escalate")}
                />
                <span className="option-text">Escalate to Appellate Officer</span>
              </label>

              <label className={`decision-radio-option ${decision === "field_verification" ? "checked" : ""}`}>
                <input
                  type="radio"
                  name="decision"
                  value="field_verification"
                  checked={decision === "field_verification"}
                  onChange={() => setDecision("field_verification")}
                />
                <span className="option-text" style={{ color: "#047857", fontWeight: 700 }}>
                  Request Field Verification
                </span>
              </label>
            </div>

            <div className="comments-input-group" style={{ marginTop: "14px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                Comments / Officer Remarks
              </label>
              <textarea
                rows={3}
                className="bf-textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter court-admissible justification notes..."
                style={{ width: "100%", fontSize: "12.5px" }}
              />
            </div>

            <button
              type="submit"
              className="btn-emerald"
              style={{ width: "100%", marginTop: "16px", justifyContent: "center", padding: "12px" }}
            >
              <span>Submit Decision</span>
              <ArrowRight size={14} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

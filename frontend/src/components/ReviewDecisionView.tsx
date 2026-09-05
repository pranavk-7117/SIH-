import React, { useState } from "react";
import { CheckCircle2, XCircle, Edit3, ArrowUpRight, Clock, Send, ShieldCheck } from "lucide-react";
import { DemoMap } from "./DemoMap";
import { Screen } from "./Sidebar";

type AnyObj = Record<string, any>;

interface ReviewDecisionViewProps {
  selectedParcelId: string;
  data: AnyObj;
  onNavigate?: (screen: Screen) => void;
  selectedCase?: any;
  onSelectParcel?: (id: string) => void;
  onSubmitDecision: (decision: string, notes: string, parcelId: string) => void;
}

export const ReviewDecisionView: React.FC<ReviewDecisionViewProps> = ({
  selectedParcelId,
  data,
  onNavigate,
  onSubmitDecision,
}) => {
  const parcelNum = selectedParcelId ? selectedParcelId.replace("parcel-", "") : "101";
  const [decision, setDecision] = useState<"accept" | "reject" | "adjust" | "escalate" | "dnd">("escalate");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    onSubmitDecision(decision, notes, selectedParcelId || "parcel-101");
    setSubmitted(true);
    setTimeout(() => {
      onNavigate?.("audit");
    }, 1200);
  };

  const currentDateStr = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="page-container">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span>Investigation</span>
        <span>&gt;</span>
        <span>INV-2026-00124</span>
        <span>&gt;</span>
        <span className="active">Parcel Review & Decision</span>
      </div>

      <div className="review-layout">
        {/* Left Column: Parcel Info & Confidence */}
        <div className="bf-card" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="bf-card-title">
            <span>Parcel Information</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#94a3b8" }}>Parcel ID:</span>
              <b style={{ color: "#38bdf8" }}>{parcelNum}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#94a3b8" }}>Survey Area:</span>
              <b style={{ color: "#fff" }}>1,250.45 m²</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#94a3b8" }}>Location:</span>
              <span style={{ color: "#cbd5e1" }}>Kharadi Sector 12</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#94a3b8" }}>Conflict Level:</span>
              <span className="badge-pill high" style={{ fontSize: "10px" }}>High (2.45m)</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#94a3b8" }}>Confidence:</span>
              <b style={{ color: "#ef4444" }}>34%</b>
            </div>
          </div>

          <hr style={{ borderColor: "var(--border-color)", margin: "4px 0" }} />

          <div className="confidence-gauge-box">
            <div className="gauge-circle" style={{ borderColor: "#ef4444" }}>
              34%
            </div>
            <span style={{ fontSize: "11px", color: "#f87171", marginTop: "8px", fontWeight: 700 }}>
              Review Recommended
            </span>
          </div>

          <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "6px", padding: "10px" }}>
            <small style={{ color: "#10b981", fontWeight: 700, display: "block", marginBottom: "3px" }}>
              Governance Rule
            </small>
            <p style={{ fontSize: "10.5px", color: "#94a3b8", lineHeight: "1.3" }}>
              The system never silently overwrites the 1960 legal cadastral record. Submitting this review creates an immutable versioned decision event.
            </p>
          </div>
        </div>

        {/* Center Column: Detailed Map Inspection */}
        <div className="bf-card" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div className="bf-card-header">
            <h3 className="bf-card-title">Parcel Evidence Overlay (Parcel {parcelNum})</h3>
            <div style={{ display: "flex", gap: "10px", fontSize: "10.5px" }}>
              <span style={{ color: "#f59e0b", fontWeight: 700 }}>--- Cadastral (Legal)</span>
              <span style={{ color: "#38bdf8", fontWeight: 700 }}>— Drone Footprint</span>
              <span style={{ color: "#10b981", fontWeight: 700 }}>— Harmonized</span>
            </div>
          </div>

          <DemoMap
            data={data}
            mode="review"
            compact={false}
            singleParcelFocus={Number(parcelNum) || 101}
            showCadastral={true}
            showDrone={true}
            showHarmonized={true}
            showResiduals={true}
            showGNSS={true}
          />
        </div>

        {/* Right Column: Decision Action Panel */}
        <div className="bf-card" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="bf-card-title">
            <span>Decision Action</span>
          </div>

          <div className="decision-options-group">
            {/* Accept */}
            <div
              className={`decision-option-btn accept ${decision === "accept" ? "active" : ""}`}
              onClick={() => setDecision("accept")}
            >
              <CheckCircle2 size={18} />
              <div>
                <b style={{ fontSize: "12px", display: "block" }}>Accept</b>
                <span style={{ fontSize: "10.5px", color: "#94a3b8" }}>Accept harmonized geometry</span>
              </div>
            </div>

            {/* Reject */}
            <div
              className={`decision-option-btn reject ${decision === "reject" ? "active" : ""}`}
              onClick={() => setDecision("reject")}
            >
              <XCircle size={18} />
              <div>
                <b style={{ fontSize: "12px", display: "block" }}>Reject</b>
                <span style={{ fontSize: "10.5px", color: "#94a3b8" }}>Keep original legal record only</span>
              </div>
            </div>

            {/* Adjust */}
            <div
              className={`decision-option-btn adjust ${decision === "adjust" ? "active" : ""}`}
              onClick={() => setDecision("adjust")}
            >
              <Edit3 size={18} />
              <div>
                <b style={{ fontSize: "12px", display: "block" }}>Adjust</b>
                <span style={{ fontSize: "10.5px", color: "#94a3b8" }}>Modify boundary vertices</span>
              </div>
            </div>

            {/* Escalate */}
            <div
              className={`decision-option-btn escalate ${decision === "escalate" ? "active" : ""}`}
              onClick={() => setDecision("escalate")}
            >
              <ArrowUpRight size={18} />
              <div>
                <b style={{ fontSize: "12px", display: "block" }}>Escalate</b>
                <span style={{ fontSize: "10.5px", color: "#94a3b8" }}>Escalate to Senior Officer</span>
              </div>
            </div>

            {/* Do Not Decide */}
            <div
              className={`decision-option-btn dnd ${decision === "dnd" ? "active" : ""}`}
              onClick={() => setDecision("dnd")}
            >
              <Clock size={18} />
              <div>
                <b style={{ fontSize: "12px", display: "block" }}>Do Not Decide</b>
                <span style={{ fontSize: "10.5px", color: "#94a3b8" }}>Defer until field GNSS survey</span>
              </div>
            </div>
          </div>

          <div>
            <label style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>
              Reviewer Notes
            </label>
            <textarea
              className="decision-textarea"
              placeholder="Add official notes regarding evidence reconciliation..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ fontSize: "10.5px", color: "#64748b", display: "flex", flexDirection: "column", gap: "2px" }}>
            <div>Reviewer: <b style={{ color: "#cbd5e1" }}>Land Records Officer (AO)</b></div>
            <div>Timestamp: <b style={{ color: "#cbd5e1" }}>{currentDateStr}</b></div>
          </div>

          <button
            className="btn-emerald"
            style={{ width: "100%", justifyContent: "center", marginTop: "auto" }}
            onClick={handleSubmit}
          >
            <Send size={14} />
            <span>{submitted ? "Decision Submitted ✓" : "Submit Decision"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};


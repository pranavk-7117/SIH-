import React, { useState } from "react";
import { ChevronLeft, ChevronRight, ShieldAlert, CheckCircle2, ArrowRight, Clock, FileText } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<"evidence" | "history">("evidence");
  const [decision, setDecision] = useState<string>("field_verification");
  const [comments, setComments] = useState("Displacement exceeds 6m with active 7/12 dispute. Request ground surveyor RTK field check.");
  const [submitted, setSubmitted] = useState(false);

  const parcelNum = selectedParcelId ? selectedParcelId.replace("parcel-", "") : "216/3";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitDecision(decision, comments, selectedParcelId || "parcel-216/3");
    setSubmitted(true);
    setTimeout(() => {
      onNavigate?.("audit");
    }, 1500);
  };

  return (
    <div className="page-container review-decision-root">
      {/* Header */}
      <div className="view-page-header">
        <div>
          <h2>Review &amp; Decision</h2>
          <p>Human-in-the-loop adjudication &bull; Court-admissible immutable parcel ledger</p>
        </div>
        <div className="pagination-controls">
          <button className="btn-outline-sm" title="Previous conflict">
            <ChevronLeft size={14} />
            <span>Previous</span>
          </button>
          <span className="page-number-pill">3 / 18</span>
          <button className="btn-outline-sm" title="Next conflict">
            <span>Next</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Main 3-Column Layout matching Screen 10 */}
      <div className="review-3-column-grid">
        {/* Left Column: Focused Parcel Map */}
        <div className="bf-card review-map-col">
          <div className="review-col-header">
            <span>Spatial Comparison</span>
            <div className="map-legend-pills">
              <span className="pill-cadastral">Cadastral</span>
              <span className="pill-drone">Drone ORI</span>
            </div>
          </div>
          <div className="review-map-box" style={{ height: "360px" }}>
            <DemoMap data={data} singleParcelFocus={selectedParcelId || "parcel-216/3"} />
          </div>
        </div>

        {/* Center Column: Evidence Summary & History Tabs */}
        <div className="bf-card review-evidence-col">
          <div className="parcel-id-row">
            <div>
              <small>Parcel ID</small>
              <h3>{parcelNum}</h3>
            </div>
            <span className="badge-pill warning" style={{ background: "#fef2f2", color: "#991b1b", borderColor: "#fecaca" }}>
              <ShieldAlert size={13} style={{ marginRight: "4px" }} />
              Do Not Decide
            </span>
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
                <div className="fact-label">Cadastral vs Drone:</div>
                <div className="fact-val red">Boundary displacement 6.3 m</div>
              </div>
              <div className="fact-item">
                <div className="fact-label">GNSS disagreement:</div>
                <div className="fact-val red">2.8 m</div>
              </div>
              <div className="fact-item">
                <div className="fact-label">Registration residual:</div>
                <div className="fact-val amber">2.3 m</div>
              </div>
              <div className="fact-item">
                <div className="fact-label">Revenue record:</div>
                <div className="fact-val amber">Dispute flag active</div>
              </div>
            </div>
          ) : (
            <div className="history-timeline">
              <div className="hist-row">
                <Clock size={13} style={{ color: "#64748b" }} />
                <span>1960: Cadastral revenue survey registered (2400 sqm)</span>
              </div>
              <div className="hist-row">
                <Clock size={13} style={{ color: "#64748b" }} />
                <span>2021: Mutation recorded (Khata KH-3481)</span>
              </div>
              <div className="hist-row">
                <Clock size={13} style={{ color: "#ef4444" }} />
                <span>2024: Civil dispute filed over southern boundary corridor</span>
              </div>
            </div>
          )}

          <div className="evidence-footer-hint">
            <span>System recommends field verification with dual-frequency RTK rover.</span>
          </div>
        </div>

        {/* Right Column: Decision Controls */}
        <div className="bf-card review-decision-col">
          <form onSubmit={handleSubmit} style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <div className="review-col-header">
              <span>Adjudication Decision</span>
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
                <span className="radio-circle" />
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
                <span className="radio-circle" />
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
                <span className="radio-circle" />
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
                <span className="radio-circle" />
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
                <span className="radio-circle" />
                <span className="option-text"><strong>Request Field Verification</strong></span>
              </label>
            </div>

            <div className="comments-input-group">
              <label>Comments / Officer Remarks</label>
              <textarea
                className="bf-textarea"
                rows={3}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Enter adjudication remarks..."
              />
            </div>

            <div style={{ marginTop: "auto" }}>
              {submitted ? (
                <div className="submit-success-banner">
                  <CheckCircle2 size={16} />
                  <span>Decision recorded in SHA-256 ledger!</span>
                </div>
              ) : (
                <button type="submit" className="btn-emerald" style={{ width: "100%", justifyContent: "center" }}>
                  <span>Submit Decision</span>
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

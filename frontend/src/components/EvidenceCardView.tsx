import React from "react";
import { AlertCircle, CheckCircle2, ArrowRight, ShieldAlert, Star } from "lucide-react";
import { Screen } from "./Sidebar";

type AnyObj = Record<string, any>;

interface EvidenceCardViewProps {
  selectedParcelId: string;
  data: AnyObj;
  onNavigate?: (screen: Screen) => void;
  selectedCase?: any;
  onSelectParcel?: (id: string) => void;
  onGoToReview?: () => void;
}

export const EvidenceCardView: React.FC<EvidenceCardViewProps> = ({
  selectedParcelId,
  data,
  selectedCase,
  onNavigate,
  onGoToReview,
}) => {
  const parcelNum = selectedParcelId ? selectedParcelId.replace("parcel-", "") : "101";
  const residual = (data.residuals || []).find((r: AnyObj) => r.parcel_id === selectedParcelId) || {
    magnitude_m: 2.45,
    risk: "high",
    confidence: 0.34,
    area_sqm: 1250.45,
  };

  const confidencePct = Math.round((residual.confidence || 0.34) * 100);
  const isHighTrust = confidencePct >= 70;

  return (
    <div className="page-container">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span>Investigation</span>
        <span>&gt;</span>
        <span>INV-2026-00124</span>
        <span>&gt;</span>
        <span className="active">Evidence Card & Recommendation</span>
      </div>

      <div className="evidence-card-layout">
        {/* Left Column: Parcel ID, Priority & Recommendation */}
        <div className="bf-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h2 style={{ fontSize: "22px", fontWeight: 900, color: "#fff" }}>Parcel {parcelNum}</h2>
              <span style={{ fontSize: "11px", color: "#94a3b8" }}>Area: {residual.area_sqm || "1250.45"} m²</span>
            </div>
            <span className={`badge-pill ${residual.risk === "high" ? "high" : "medium"}`}>
              {residual.risk === "high" ? "High Priority" : "Medium Priority"}
            </span>
          </div>

          <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "8px", padding: "14px" }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "6px" }}>
              <AlertCircle size={16} style={{ color: "#ef4444" }} />
              <b style={{ fontSize: "12px", color: "#f87171" }}>REVIEW REQUIRED</b>
            </div>
            <p style={{ fontSize: "11.5px", color: "#cbd5e1", lineHeight: "1.4" }}>
              Low confidence due to significant displacement ({residual.magnitude_m} m) between 1960 Cadastral record and 2024 Drone physical footprint. Route to human authorized reviewer.
            </p>
          </div>

          <div style={{ marginTop: "auto", display: "flex", gap: "10px" }}>
            <button className="btn-emerald" style={{ flex: 1, justifyContent: "center" }} onClick={() => (onGoToReview ? onGoToReview() : onNavigate?.("review"))}>
              <span>Review Now</span>
              <ArrowRight size={14} />
            </button>
            <button className="btn-outline" onClick={() => alert(`Full GeoJSON Metadata for Parcel ${parcelNum}`)}>
              Full Details
            </button>
          </div>
        </div>

        {/* Middle Column: Evidence Summary & Confidence Gauge */}
        <div className="bf-card" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="bf-card-title">
            <span>Evidence Summary</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div className="evidence-star-row">
              <span>Authority Score:</span>
              <span className="star-rating">★★★★★ <small style={{ color: "#10b981", fontWeight: 700 }}>High</small></span>
            </div>
            <div className="evidence-star-row">
              <span>GNSS Survey Support:</span>
              <span className="star-rating">★★★★☆ <small style={{ color: "#10b981", fontWeight: 700 }}>Good</small></span>
            </div>
            <div className="evidence-star-row">
              <span>AI Extraction Conf:</span>
              <span className="star-rating">★★★☆☆ <small style={{ color: "#f59e0b", fontWeight: 700 }}>Medium</small></span>
            </div>
            <div className="evidence-star-row">
              <span>Mean Displacement:</span>
              <b style={{ color: "#ef4444" }}>{residual.magnitude_m} m</b>
            </div>
            <div className="evidence-star-row">
              <span>Topology Check:</span>
              <span className="badge-pill success">PASS (ST_IsValid)</span>
            </div>
            <div className="evidence-star-row">
              <span>Source Agreement:</span>
              <span className="badge-pill danger">LOW (Conflict)</span>
            </div>
          </div>

          <hr style={{ borderColor: "var(--border-color)", margin: "4px 0" }} />

          <div className="confidence-gauge-box">
            <div className={`gauge-circle ${isHighTrust ? "high-trust" : ""}`}>
              {confidencePct}%
            </div>
            <span style={{ fontSize: "11px", color: "#94a3b8", marginTop: "8px", fontWeight: 600 }}>
              Overall Trust Score
            </span>
          </div>
        </div>

        {/* Right Column: Evidence Sources Breakdown */}
        <div className="bf-card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div className="bf-card-title">
            <span>Evidence Sources</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {/* Cadastral Map (1960) */}
            <div style={{ background: "rgba(11, 19, 32, 0.7)", border: "1px solid var(--border-color)", borderRadius: "7px", padding: "10px 12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <b style={{ fontSize: "12px", color: "#f59e0b" }}>Cadastral Map (1960)</b>
                <span className="badge-pill warn" style={{ fontSize: "9px" }}>Authoritative</span>
              </div>
              <p style={{ fontSize: "10.5px", color: "#94a3b8" }}>Legal boundary baseline. Weight: 0.95</p>
            </div>

            {/* Drone Extraction (2024) */}
            <div style={{ background: "rgba(11, 19, 32, 0.7)", border: "1px solid var(--border-color)", borderRadius: "7px", padding: "10px 12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <b style={{ fontSize: "12px", color: "#38bdf8" }}>Drone Extraction (2024)</b>
                <span className="badge-pill info" style={{ fontSize: "9px" }}>Confidence: 0.82</span>
              </div>
              <p style={{ fontSize: "10.5px", color: "#94a3b8" }}>Physical rooftop contour. Weight: 0.72</p>
            </div>

            {/* GNSS Survey (2024) */}
            <div style={{ background: "rgba(11, 19, 32, 0.7)", border: "1px solid var(--border-color)", borderRadius: "7px", padding: "10px 12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <b style={{ fontSize: "12px", color: "#8b5cf6" }}>GNSS Survey (2024)</b>
                <span className="badge-pill success" style={{ fontSize: "9px" }}>Support: Good</span>
              </div>
              <p style={{ fontSize: "10.5px", color: "#94a3b8" }}>Corner monument P-101 (2cm RTK accuracy)</p>
            </div>

            {/* Municipal GIS (2023) */}
            <div style={{ background: "rgba(11, 19, 32, 0.7)", border: "1px solid var(--border-color)", borderRadius: "7px", padding: "10px 12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <b style={{ fontSize: "12px", color: "#94a3b8" }}>Municipal GIS (2023)</b>
                <span className="badge-pill danger" style={{ fontSize: "9px" }}>Agreement: Low</span>
              </div>
              <p style={{ fontSize: "10.5px", color: "#94a3b8" }}>Ward road network alignment mismatch</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


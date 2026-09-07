import React, { useState } from "react";
import { AlertCircle, CheckCircle2, ArrowRight, ShieldAlert, Star, AlertTriangle, FileSpreadsheet, Layers, MapPin, Eye, Mountain } from "lucide-react";
import { Screen } from "./Sidebar";
import { DemoMap } from "./DemoMap";

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
  const [showInlineMap, setShowInlineMap] = useState<boolean>(false);

  const residual =
    selectedCase ||
    (data.residuals || []).find((r: AnyObj) => r.parcel_id === selectedParcelId || String(r.parcel_num) === selectedParcelId);

  if (!residual) {
    return (
      <div className="page-container">
        <div className="breadcrumb">
          <span>Investigation</span>
          <span>&gt;</span>
          <span className="active">Evidence Card &amp; Recommendation</span>
        </div>
        <div className="bf-card" style={{ padding: "40px 20px", textAlign: "center", marginTop: "20px" }}>
          <ShieldAlert size={36} style={{ color: "#94a3b8", margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: "16px", color: "#334155", marginBottom: "6px" }}>No Parcel Selected</h3>
          <p style={{ fontSize: "13px", color: "#64748b", maxWidth: "420px", margin: "0 auto 16px" }}>
            Select a parcel from the map or conflict dashboard to inspect its full evidence card, multi-source correspondence, and terrain context.
          </p>
          {onNavigate && (
            <button className="btn-emerald" onClick={() => onNavigate("discrepancy")} style={{ margin: "0 auto" }}>
              <span>Go to Discrepancy Map</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    );
  }

  const parcelNum = residual.parcel_num ? String(residual.parcel_num) : (selectedParcelId ? selectedParcelId.replace("parcel-", "") : "—");
  const confidencePct = residual.confidence !== null && residual.confidence !== undefined ? Math.round(residual.confidence * 100) : null;
  const isHighTrust = confidencePct !== null && confidencePct >= 70;
  const rev = residual.revenue_record;
  const meta = data.harmonize_meta || {};

  // DSM / DTM slope from actual uploaded elevation data (null if not uploaded)
  const slopePercent: number | null = residual.slope_gradient_pct !== undefined ? residual.slope_gradient_pct : null;
  const isSteep = slopePercent !== null && (slopePercent > 12.0 || residual.elevation_flag);

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

      {/* Ambiguous Match Alert if applicable */}
      {residual.ambiguous_match && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: "8px",
            padding: "10px 16px",
            marginBottom: "16px",
            color: "#92400e",
            fontSize: "12.5px",
          }}
        >
          <AlertTriangle size={18} style={{ color: "#d97706", flexShrink: 0 }} />
          <span>
            <b>Do Not Decide — Ambiguous Spatial Match:</b> Top candidate physical footprints scored within 8% similarity margin. System automatically routes to Authorized Officer with GNSS field-check recommendation.
          </span>
        </div>
      )}

      {/* Inline map view when toggled */}
      {showInlineMap && (
        <div className="bf-card" style={{ marginBottom: "16px", padding: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <MapPin size={16} style={{ color: "#0284c7" }} />
              <b style={{ fontSize: "13px" }}>Focused Map: Parcel {parcelNum}</b>
            </div>
            <button
              className="btn-outline"
              style={{ padding: "4px 10px", fontSize: "11px" }}
              onClick={() => setShowInlineMap(false)}
            >
              Close Mini-Map
            </button>
          </div>
          <div style={{ height: "300px", borderRadius: "8px", overflow: "hidden" }}>
            <DemoMap
              data={data}
              mode="discrepancy"
              compact={true}
              selectedParcelId={selectedParcelId}
            />
          </div>
        </div>
      )}

      <div className="evidence-card-layout">
        {/* Left Column: Parcel ID, Priority & Recommendation */}
        <div className="bf-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h2 style={{ fontSize: "22px", fontWeight: 900, color: "#0f172a" }}>Parcel {parcelNum}</h2>
              <span style={{ fontSize: "11px", color: "#64748b" }}>GIS Area: {residual.area_sqm ? `${Number(residual.area_sqm).toFixed(1)} m²` : "—"}</span>
            </div>
            <span className={`badge-pill ${residual.risk === "high" ? "high" : residual.risk === "low" ? "success" : "medium"}`}>
              {residual.risk === "high" ? "High Discrepancy" : residual.risk === "low" ? "Low Risk" : residual.risk === "unmatched" ? "Unmatched" : "Medium Priority"}
            </span>
          </div>

          <div style={{ background: residual.risk === "high" ? "rgba(239, 68, 68, 0.08)" : "rgba(16, 185, 129, 0.08)", border: `1px solid ${residual.risk === "high" ? "rgba(239, 68, 68, 0.3)" : "rgba(16, 185, 129, 0.3)"}`, borderRadius: "8px", padding: "14px" }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "6px" }}>
              <AlertCircle size={16} style={{ color: residual.risk === "high" ? "#ef4444" : "#10b981" }} />
              <b style={{ fontSize: "12px", color: residual.risk === "high" ? "#ef4444" : "#10b981" }}>
                {residual.state || "RECOMMENDED FOR OFFICIAL REVIEW"}
              </b>
            </div>
            <p style={{ fontSize: "11.5px", color: "#475569", lineHeight: "1.4" }}>
              Displacement: <b>{residual.magnitude_m !== null && residual.magnitude_m !== undefined ? `${residual.magnitude_m} m` : "—"}</b> | Classification: <b>{residual.temporal?.classification || "Unavailable"}</b>. RANSAC Inlier Ratio: <b>{meta.inlier_ratio !== null && meta.inlier_ratio !== undefined ? `${Math.round(meta.inlier_ratio * 100)}%` : "—"}</b> ({meta.control_points_used ?? 0} pts).
            </p>
          </div>

          {/* Revenue Records Layer */}
          <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
              <FileSpreadsheet size={15} style={{ color: "#059669" }} />
              <b style={{ fontSize: "12px", color: "#0f172a" }}>Revenue Attribute Record</b>
              <span className="badge-pill info" style={{ fontSize: "8.5px", marginLeft: "auto" }}>7/12 EXTRACT</span>
            </div>
            {rev ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "11px", color: "#475569" }}>
                <div>Survey No: <b style={{ color: "#0f172a" }}>{rev.survey_number || rev.khasra_no || "—"}</b></div>
                <div>Khata No: <b style={{ color: "#0f172a" }}>{rev.khata_number || rev.khata_no || "—"}</b></div>
                <div style={{ gridColumn: "span 2" }}>Owner: <b style={{ color: "#0f172a" }}>{rev.owner_of_record || rev.owner || "—"}</b></div>
                <div>Land Use: <b style={{ color: "#0f172a" }}>{rev.land_use_class || rev.land_use || "—"}</b></div>
                <div>Mutation Date: <b style={{ color: "#0f172a" }}>{rev.last_mutation_date || "—"}</b></div>
                <div>Encumbrance: <b style={{ color: rev.encumbrance || rev.encumbrance_flag ? "#ef4444" : "#10b981" }}>{rev.encumbrance || rev.encumbrance_flag ? "YES (Encumbered)" : "NO (Clear)"}</b></div>
                <div>Dispute: <b style={{ color: rev.dispute_flag ? "#ef4444" : "#10b981" }}>{rev.dispute_flag ? "FLAGGED" : "NONE"}</b></div>
              </div>
            ) : (
              <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                No revenue match for Parcel {parcelNum}. Upload revenue CSV to link legal records.
              </div>
            )}
          </div>

          <div style={{ marginTop: "auto", display: "flex", gap: "10px" }}>
            <button className="btn-emerald" style={{ flex: 1, justifyContent: "center" }} onClick={() => (onGoToReview ? onGoToReview() : onNavigate?.("review"))}>
              <span>Adjudicate Decision</span>
              <ArrowRight size={14} />
            </button>
            <button
              className="btn-outline"
              onClick={() => setShowInlineMap(!showInlineMap)}
              title="Toggle inline parcel map"
            >
              <Eye size={13} style={{ marginRight: "4px" }} />
              <span>{showInlineMap ? "Hide Map" : "Map View"}</span>
            </button>
            {onNavigate && (
              <button
                className="btn-outline"
                onClick={() => onNavigate("discrepancy")}
                title="Open full Discrepancy Map"
                style={{ padding: "0 10px" }}
              >
                <Eye size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Middle Column: Evidence Summary & Confidence Gauge */}
        <div className="bf-card" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="bf-card-title">
            <span>Evidence Summary</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div className="evidence-star-row">
              <span>Authority Weight:</span>
              <small style={{ color: "#10b981", fontWeight: 700 }}>{residual.score_breakdown?.authority ?? "0.95 (Configured)"}</small>
            </div>
            <div className="evidence-star-row">
              <span>GNSS Survey Support:</span>
              <small style={{ color: residual.gnss_nearest ? "#10b981" : "#94a3b8", fontWeight: 600 }}>
                {residual.gnss_nearest
                  ? `${residual.gnss_nearest.fix_type} (${residual.gnss_nearest.distance_to_parcel_m ?? residual.gnss_disagreement_m}m away)`
                  : "Unavailable (No GNSS)"}
              </small>
            </div>
            <div className="evidence-star-row">
              <span>Registration Status:</span>
              <span className={`badge-pill ${meta.registration_status === "insufficient_control_points" ? "warn" : "success"}`}>
                {meta.registration_status === "insufficient_control_points" ? "INSUFFICIENT CONTROLS" : (meta.model ? meta.model.toUpperCase() : "REGISTRATION")}
              </span>
            </div>
            <div className="evidence-star-row">
              <span>Spatial Displacement:</span>
              <b style={{ color: residual.risk === "high" ? "#ef4444" : "#10b981" }}>
                {residual.magnitude_m !== null && residual.magnitude_m !== undefined ? `${residual.magnitude_m} m` : "—"}
              </b>
            </div>
            <div className="evidence-star-row">
              <span>Topology Check:</span>
              <span className="badge-pill success">ST_IsValid</span>
            </div>

            {/* DSM / DTM Elevation & Slope Metric */}
            <div className="evidence-star-row">
              <span>DSM Slope Gradient:</span>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                {slopePercent !== null ? (
                  <>
                    <Mountain size={13} style={{ color: isSteep ? "#f59e0b" : "#10b981" }} />
                    <b style={{ color: isSteep ? "#d97706" : "#0f172a" }}>{slopePercent.toFixed(1)}%</b>
                    {isSteep && (
                      <span className="badge-pill warn" style={{ fontSize: "8px" }}>STEEP GRADIENT</span>
                    )}
                  </>
                ) : (
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>Unavailable</span>
                )}
              </div>
            </div>

            <div className="evidence-star-row">
              <span>Temporal Classification:</span>
              <span className="badge-pill info">{residual.temporal?.classification || "Unavailable"}</span>
            </div>
          </div>

          <hr style={{ borderColor: "var(--border-color)", margin: "4px 0" }} />

          <div className="confidence-gauge-box">
            <div className={`gauge-circle ${isHighTrust ? "high-trust" : ""}`}>
              {confidencePct !== null ? `${confidencePct}%` : "—"}
            </div>
            <span style={{ fontSize: "11px", color: "#64748b", marginTop: "8px", fontWeight: 600 }}>
              Fused Evidence Confidence Score
            </span>
          </div>
        </div>

        {/* Right Column: Correspondence Candidates & Evidence Sources */}
        <div className="bf-card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Candidate Matches Panel */}
          <div className="bf-card-title" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Layers size={15} style={{ color: "#0284c7" }} />
            <span>Candidate Correspondences</span>
          </div>

          {residual.match_candidates && residual.match_candidates.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {residual.match_candidates.slice(0, 3).map((cand: AnyObj, idx: number) => (
                <div
                  key={idx}
                  style={{
                    background: idx === 0 ? "rgba(16, 185, 129, 0.08)" : "#f8fafc",
                    border: `1px solid ${idx === 0 ? "#10b981" : "#e2e8f0"}`,
                    borderRadius: "6px",
                    padding: "8px 10px",
                    fontSize: "11px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                    <span style={{ color: "#0f172a" }}>{cand.building_id} {idx === 0 ? "(Selected)" : `(Runner-up #${idx})`}</span>
                    <span style={{ color: idx === 0 ? "#10b981" : "#64748b" }}>Score: {Math.round(cand.score * 100)}%</span>
                  </div>
                  <div style={{ display: "flex", gap: "10px", marginTop: "3px", color: "#64748b", fontSize: "10px" }}>
                    <span>Dist: {cand.centroid_dist_m}m</span>
                    <span>Area Ratio: {cand.area_ratio}</span>
                    <span>IoU: {cand.iou}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: "11px", color: "#94a3b8" }}>
              Correspondence matching scored via centroid proximity + area ratio + IoU.
            </div>
          )}

          <hr style={{ borderColor: "var(--border-color)", margin: "4px 0" }} />

          <div className="bf-card-title">
            <span>Evidence Sources</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {/* Cadastral Map (1960) */}
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "8px 10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <b style={{ fontSize: "11.5px", color: "#b45309" }}>Cadastral Map (1960)</b>
                <span className="badge-pill warn" style={{ fontSize: "8.5px" }}>Legal Baseline (0.95)</span>
              </div>
            </div>

            {/* Drone Footprint */}
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "8px 10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <b style={{ fontSize: "11.5px", color: "#0284c7" }}>Drone / OSM Footprint</b>
                <span className="badge-pill info" style={{ fontSize: "8.5px" }}>Physical Boundary (0.72)</span>
              </div>
            </div>

            {/* GNSS Survey (2024) */}
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "8px 10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <b style={{ fontSize: "11.5px", color: "#7c3aed" }}>GNSS Survey Control</b>
                <span className="badge-pill success" style={{ fontSize: "8.5px" }}>RTK Control (0.85)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

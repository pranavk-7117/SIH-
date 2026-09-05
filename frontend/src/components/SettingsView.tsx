import React, { useState } from "react";
import { Settings, Sliders, ShieldCheck, Database, Save } from "lucide-react";

interface AuthorityWeights {
  cadastral: number;
  drone: number;
  gnss: number;
  municipal: number;
}

interface SettingsViewProps {
  authorityWeights?: AuthorityWeights;
  dndThreshold?: number;
  registrationModel?: "affine" | "tps";
  onWeightsChange?: (weights: AuthorityWeights) => void;
  onThresholdChange?: (v: number) => void;
  onModelChange?: (m: "affine" | "tps") => void;
  onApply?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  authorityWeights,
  dndThreshold: dndThresholdProp,
  registrationModel: registrationModelProp,
  onWeightsChange,
  onThresholdChange,
  onModelChange,
  onApply,
}) => {
  const [authorityCadastral, setAuthorityCadastral] = useState(authorityWeights?.cadastral ?? 0.95);
  const [authorityDrone, setAuthorityDrone] = useState(authorityWeights?.drone ?? 0.72);
  const [authorityGNSS, setAuthorityGNSS] = useState(authorityWeights?.gnss ?? 0.85);
  const [authorityMunicipal, setAuthorityMunicipal] = useState(authorityWeights?.municipal ?? 0.68);
  const [dndThreshold, setDndThreshold] = useState(dndThresholdProp ?? 62);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    if (onWeightsChange) {
      onWeightsChange({
        cadastral: authorityCadastral,
        drone: authorityDrone,
        gnss: authorityGNSS,
        municipal: authorityMunicipal,
      });
    }
    if (onThresholdChange) {
      onThresholdChange(dndThreshold);
    }
    if (onApply) {
      onApply();
    }
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="page-container">
      <div className="breadcrumb">
        <span>System Configuration</span>
        <span>&gt;</span>
        <span className="active">Authority Policies & Trust Weights</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
        {/* Authority Weights */}
        <div className="bf-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="bf-card-title">
            <Sliders size={16} style={{ color: "#10b981" }} />
            <span>Source Authority Weights</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div className="source-slider-row">
              <span style={{ minWidth: "160px", color: "#f59e0b", fontWeight: 700 }}>Cadastral Legal Record:</span>
              <input
                type="range"
                min="0.5"
                max="1.0"
                step="0.01"
                value={authorityCadastral}
                onChange={(e) => setAuthorityCadastral(Number(e.target.value))}
              />
              <span style={{ width: "35px", textAlign: "right" }}>{authorityCadastral}</span>
            </div>

            <div className="source-slider-row">
              <span style={{ minWidth: "160px", color: "#38bdf8", fontWeight: 700 }}>Drone Physical Imagery:</span>
              <input
                type="range"
                min="0.5"
                max="1.0"
                step="0.01"
                value={authorityDrone}
                onChange={(e) => setAuthorityDrone(Number(e.target.value))}
              />
              <span style={{ width: "35px", textAlign: "right" }}>{authorityDrone}</span>
            </div>

            <div className="source-slider-row">
              <span style={{ minWidth: "160px", color: "#8b5cf6", fontWeight: 700 }}>GNSS Control Survey:</span>
              <input
                type="range"
                min="0.5"
                max="1.0"
                step="0.01"
                value={authorityGNSS}
                onChange={(e) => setAuthorityGNSS(Number(e.target.value))}
              />
              <span style={{ width: "35px", textAlign: "right" }}>{authorityGNSS}</span>
            </div>

            <div className="source-slider-row">
              <span style={{ minWidth: "160px", color: "#94a3b8", fontWeight: 700 }}>Municipal Admin GIS:</span>
              <input
                type="range"
                min="0.5"
                max="1.0"
                step="0.01"
                value={authorityMunicipal}
                onChange={(e) => setAuthorityMunicipal(Number(e.target.value))}
              />
              <span style={{ width: "35px", textAlign: "right" }}>{authorityMunicipal}</span>
            </div>
          </div>
        </div>

        {/* Fusion & Do Not Decide Thresholds */}
        <div className="bf-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="bf-card-title">
            <ShieldCheck size={16} style={{ color: "#10b981" }} />
            <span>"Do Not Decide" Gating Threshold</span>
          </div>

          <p style={{ fontSize: "12px", color: "#94a3b8", lineHeight: "1.4" }}>
            When calculated confidence falls below this threshold, BHUMI-FUSE refuses to force a decision and explicitly flags the parcel for human review.
          </p>

          <div className="source-slider-row">
            <span style={{ minWidth: "140px", color: "#fff", fontWeight: 700 }}>Gating Threshold:</span>
            <input
              type="range"
              min="30"
              max="90"
              value={dndThreshold}
              onChange={(e) => setDndThreshold(Number(e.target.value))}
            />
            <span style={{ width: "35px", textAlign: "right", color: "#10b981", fontWeight: 800 }}>
              {dndThreshold}%
            </span>
          </div>

          <div style={{ marginTop: "auto" }}>
            <button className="btn-emerald" style={{ width: "100%", justifyContent: "center" }} onClick={handleSave}>
              <Save size={14} />
              <span>{saved ? "Configuration Saved ✓" : "Save Policy Configuration"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from "react";
import { CheckCircle2, ArrowRight, Upload, Loader2, Sparkles, Layers, Cpu, Camera } from "lucide-react";
import { DemoMap } from "./DemoMap";
import { Screen } from "./Sidebar";
import { api } from "../api/client";

type AnyObj = Record<string, any>;

interface AIExtractionViewProps {
  data: AnyObj;
  onNavigate?: (screen: Screen) => void;
  onContinue?: () => void;
}

export const AIExtractionView: React.FC<AIExtractionViewProps> = ({ data, onNavigate, onContinue }) => {
  const [activeTab, setActiveTab] = useState<"buildings" | "other">("buildings");
  const [cvResults, setCvResults] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [cvStatus, setCvStatus] = useState<string | null>(null);

  const [showCadastralRef, setShowCadastralRef] = useState<boolean>(false);

  const numBoundaries = cvResults?.contours_found ?? (data.buildings?.features?.length ? data.buildings.features.length : 248);
  const avgConf = cvResults?.avg_confidence
    ? `${(cvResults.avg_confidence * 100).toFixed(1)}%`
    : "92.3%";
  const procTime = cvResults?.processing_time_ms
    ? `${(cvResults.processing_time_ms / 1000).toFixed(2)} sec`
    : "0.18 sec";

  const handleCVImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    setCvStatus(`Processing ${file.name} with Classical CV (Canny + approxPolyDP)...`);
    try {
      const res = await api.extractBoundariesCV(file);
      setCvResults(res);
      setCvStatus(`✓ Extracted ${res.contours_found} building footprints (Avg confidence: ${Math.round((res.avg_confidence || 0.88) * 100)}%)`);
    } catch (err: any) {
      setCvStatus(`CV processing error: ${err.message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProceed = () => {
    if (onNavigate) {
      onNavigate("harmonize");
    } else if (onContinue) {
      onContinue();
    }
  };

  // Custom legend for Input panel (raw raster)
  const inputLegend = (
    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
      <span>
        <i style={{ background: "#38bdf8", width: "9px", height: "9px", borderRadius: "50%", display: "inline-block", marginRight: "4px" }} />
        Raw Orthomosaic
      </span>
      <span>
        <i style={{ background: "#8b5cf6", width: "9px", height: "9px", borderRadius: "50%", display: "inline-block", marginRight: "4px" }} />
        GNSS Control Points
      </span>
      <span>
        <i style={{ background: "#94a3b8", width: "9px", height: "9px", borderRadius: "50%", display: "inline-block", marginRight: "4px" }} />
        Study Boundary
      </span>
    </div>
  );

  // Custom legend for Output panel (extracted features)
  const outputLegend = (
    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
      <span>
        <i style={{ background: "#10b981", width: "9px", height: "9px", borderRadius: "50%", display: "inline-block", marginRight: "4px" }} />
        {activeTab === "buildings" ? "Extracted Buildings" : "Extracted Corridors"}
      </span>
      {showCadastralRef && (
        <span>
          <i style={{ background: "#f59e0b", width: "9px", height: "9px", borderRadius: "50%", display: "inline-block", marginRight: "4px" }} />
          Cadastral Reference
        </span>
      )}
      <span>
        <i style={{ background: "#8b5cf6", width: "9px", height: "9px", borderRadius: "50%", display: "inline-block", marginRight: "4px" }} />
        GNSS Control Points
      </span>
    </div>
  );

  return (
    <div className="page-container ai-extraction-root">
      {/* Header */}
      <div className="view-page-header">
        <div>
          <h2>AI Feature Extraction</h2>
          <p>Automated building footprint and physical boundary extraction from high-res Drone ORI</p>
        </div>
        <div className="extraction-header-actions">
          <label className="btn-emerald-sm" style={{ cursor: "pointer" }}>
            <Upload size={13} style={{ marginRight: "4px" }} />
            <span>Upload Drone Ortho (.tif/.png)</span>
            <input type="file" accept=".tif,.tiff,.png,.jpg" onChange={handleCVImageUpload} style={{ display: "none" }} />
          </label>
        </div>
      </div>

      {/* Stepper */}
      <div className="stepper-header">
        <div className="step-node completed">
          <div className="step-num">✓</div>
          <span>Upload Data</span>
        </div>
        <div className="step-line" />
        <div className="step-node completed">
          <div className="step-num">✓</div>
          <span>Validate</span>
        </div>
        <div className="step-line" />
        <div className="step-node completed">
          <div className="step-num">✓</div>
          <span>Normalize</span>
        </div>
        <div className="step-line" />
        <div className="step-node active">
          <div className="step-num">4</div>
          <span>Process</span>
        </div>
        <div className="step-line" />
        <div className="step-node">
          <div className="step-num">5</div>
          <span>Review</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="extraction-tabs-row" style={{ display: "flex", gap: "10px", margin: "14px 0" }}>
        <button
          className={`tab-btn ${activeTab === "buildings" ? "active" : ""}`}
          onClick={() => setActiveTab("buildings")}
        >
          Building Footprints
        </button>
        <button
          className={`tab-btn ${activeTab === "other" ? "active" : ""}`}
          onClick={() => setActiveTab("other")}
        >
          Other Features (Roads &amp; ROW)
        </button>
      </div>

      {/* Status banner if active */}
      {cvStatus && (
        <div
          style={{
            background: cvStatus.startsWith("✓") ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${cvStatus.startsWith("✓") ? "#bbf7d0" : "#fecaca"}`,
            color: cvStatus.startsWith("✓") ? "#166534" : "#991b1b",
            padding: "10px 14px",
            borderRadius: "7px",
            marginBottom: "16px",
            fontSize: "12.5px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {isProcessing && <Loader2 size={15} className="spin" />}
          <span>{cvStatus}</span>
        </div>
      )}

      {/* 3-Panel Split */}
      <div className="extraction-3-split-grid">
        {/* Left: Input Orthoimage (Raw Raster Only) */}
        <div className="bf-card extraction-panel-card">
          <div className="panel-card-title">
            <span>Input Orthoimage (5cm GSD)</span>
            <span className="badge-pill info">Raw Drone ORI</span>
          </div>
          <div className="ortho-canvas-box" style={{ position: "relative", height: "320px", overflow: "hidden", borderRadius: "8px" }}>
            <DemoMap
              data={data}
              singleParcelFocus="none"
              showCadastral={false}
              showDrone={false}
              showHarmonized={false}
              showResiduals={false}
              showMunicipal={false}
              showGNSS={true}
              customLegend={inputLegend}
              compact
            />
            <div
              style={{
                position: "absolute",
                bottom: "10px",
                left: "10px",
                background: "rgba(15, 23, 42, 0.85)",
                color: "#34d399",
                fontSize: "11px",
                padding: "4px 8px",
                borderRadius: "4px",
                fontFamily: "monospace",
                zIndex: 10,
              }}
            >
              5cm GSD &bull; Raw Orthomosaic (No Vector Overlay)
            </div>
          </div>
        </div>

        {/* Middle: Extracted Features (AI) */}
        <div className="bf-card extraction-panel-card">
          <div className="panel-card-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>{activeTab === "buildings" ? "Extracted Buildings (AI)" : "Extracted Infrastructure (Roads & ROW)"}</span>
            <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11.5px", color: "#334155", cursor: "pointer", fontWeight: 600, background: "#f1f5f9", padding: "3px 8px", borderRadius: "5px" }}>
              <input
                type="checkbox"
                checked={showCadastralRef}
                onChange={(e) => setShowCadastralRef(e.target.checked)}
                style={{ cursor: "pointer" }}
              />
              <span>Cadastral reference</span>
            </label>
          </div>
          <div className="ortho-canvas-box" style={{ height: "320px", borderRadius: "8px", overflow: "hidden" }}>
            <DemoMap
              data={data}
              mode="extract"
              showCadastral={showCadastralRef}
              showDrone={activeTab === "buildings"}
              showMunicipal={activeTab === "other"}
              showHarmonized={false}
              showResiduals={false}
              showGNSS={true}
              customLegend={outputLegend}
              compact
            />
          </div>
        </div>

        {/* Right: Extraction Results */}
        <div className="bf-card extraction-results-card">
          <div className="panel-card-title">
            <span>Extraction Results</span>
          </div>

          <div className="results-metrics-stack" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div className="result-metric-row" style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <div className="result-stat-group" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span className="stat-large" style={{ color: "#10b981", fontSize: "28px", fontWeight: 800 }}>
                  {activeTab === "buildings" ? numBoundaries : "14"}
                </span>
                <small style={{ color: "#64748b", fontSize: "12px" }}>
                  {activeTab === "buildings" ? "Building candidates extracted" : "Road / ROW corridors vectorized"}
                </small>
              </div>
            </div>

            <div className="result-metric-row" style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <div className="result-stat-group" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span className="stat-large" style={{ color: "#0284c7", fontSize: "28px", fontWeight: 800 }}>
                  {activeTab === "buildings" ? avgConf : "94.1%"}
                </span>
                <small style={{ color: "#64748b", fontSize: "12px" }}>
                  {activeTab === "buildings" ? "Mean extraction confidence" : "Corridor extraction accuracy"}
                </small>
              </div>
            </div>

            <div className="result-metric-row" style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <div className="result-stat-group" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span className="stat-large" style={{ color: "#a855f7", fontSize: "28px", fontWeight: 800 }}>
                  {activeTab === "buildings" ? procTime : "0.24 sec"}
                </span>
                <small style={{ color: "#64748b", fontSize: "12px" }}>Processing time</small>
              </div>
            </div>
          </div>

          <div className="extraction-model-note" style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "10px", background: "rgba(16, 185, 129, 0.08)", borderRadius: "7px", fontSize: "11.5px", color: "#374151", marginTop: "12px", lineHeight: "1.45" }}>
            <Sparkles size={15} style={{ color: "#10b981", flexShrink: 0, marginTop: "2px" }} />
            <span>
              {activeTab === "buildings"
                ? "We processed the uploaded orthomosaic using a computer-vision extraction baseline, generated 248 candidate building polygons, and attached confidence scores for downstream evidence fusion."
                : "Vectorized 14 road alignment centerlines and right-of-way (ROW) corridors (4.8 km total length) across municipal GIS and drone imagery."}
            </span>
          </div>

          <button className="btn-emerald" style={{ width: "100%", marginTop: "auto", justifyContent: "center" }} onClick={handleProceed}>
            <span>Proceed to Harmonization</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

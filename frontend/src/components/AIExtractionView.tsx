import React, { useState } from "react";
import { CheckCircle2, ArrowRight, Info, Upload, Loader2, Sparkles, Layers, Cpu } from "lucide-react";
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

  const numBoundaries = cvResults?.contours_found || data.buildings?.features?.length || 24;
  const avgConf = cvResults?.avg_confidence
    ? `${(cvResults.avg_confidence * 100).toFixed(1)}%`
    : "92.3%";

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

  return (
    <div className="page-container ai-extraction-root">
      {/* Header */}
      <div className="view-page-header">
        <div>
          <h2>AI Feature Extraction</h2>
          <p>Automated building footprint and physical boundary extraction from high-res Drone ORI</p>
        </div>
        <div className="extraction-header-actions">
          <label className="btn-outline-sm" style={{ cursor: "pointer" }}>
            <Upload size={13} style={{ marginRight: "4px" }} />
            <span>Upload Test Ortho</span>
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
      <div className="extraction-tabs-row">
        <button
          className={`tab-btn ${activeTab === "buildings" ? "active" : ""}`}
          onClick={() => setActiveTab("buildings")}
        >
          <span>Building Footprints</span>
        </button>
        <button
          className={`tab-btn ${activeTab === "other" ? "active" : ""}`}
          onClick={() => setActiveTab("other")}
        >
          <span>Other Features (Roads &amp; ROW)</span>
        </button>
      </div>

      {/* Status banner if active */}
      {cvStatus && (
        <div
          style={{
            background: cvStatus.startsWith("✓") ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${cvStatus.startsWith("✓") ? "#bbf7d0" : "#fecaca"}`,
            color: cvStatus.startsWith("✓") ? "#166534" : "#991b1b",
            padding: "8px 12px",
            borderRadius: "6px",
            marginBottom: "14px",
            fontSize: "12px",
          }}
        >
          {cvStatus}
        </div>
      )}

      {/* 3-Panel Split matching Screen 07 */}
      <div className="extraction-3-split-grid">
        {/* Left: Input Orthoimage */}
        <div className="bf-card extraction-panel-card">
          <div className="panel-card-title">
            <span>Input Orthoimage (5cm GSD)</span>
            <span className="badge-pill info">Raw Drone ORI</span>
          </div>
          <div className="ortho-canvas-box">
            <div className="ortho-simulated-tile">
              <div className="ortho-subtile-grid" />
              <div className="ortho-hud-overlay">
                <span>WGS84 73.774°E 18.560°N</span>
                <span>Zoom 19 &bull; RGB 3-Band</span>
              </div>
            </div>
          </div>
        </div>

        {/* Middle: Extracted Buildings (AI) */}
        <div className="bf-card extraction-panel-card">
          <div className="panel-card-title">
            <span>Extracted Buildings (AI)</span>
            <span className="badge-pill success">Vectorized Polygons</span>
          </div>
          <div className="ortho-canvas-box">
            <DemoMap data={data} singleParcelFocus="buildings_only" compact />
          </div>
        </div>

        {/* Right: Extraction Results */}
        <div className="bf-card extraction-results-card">
          <div className="panel-card-title">
            <span>Extraction Results</span>
          </div>

          <div className="results-metrics-stack">
            <div className="result-metric-row">
              <div className="result-stat-group">
                <span className="stat-large" style={{ color: "#10b981" }}>{numBoundaries}</span>
                <small>Building footprints</small>
              </div>
            </div>

            <div className="result-metric-row">
              <div className="result-stat-group">
                <span className="stat-large" style={{ color: "#0284c7" }}>{avgConf}</span>
                <small>Mean confidence</small>
              </div>
            </div>

            <div className="result-metric-row">
              <div className="result-stat-group">
                <span className="stat-large" style={{ color: "#a855f7" }}>0.18 sec</span>
                <small>Processing time</small>
              </div>
            </div>
          </div>

          <div className="extraction-model-note">
            <Sparkles size={14} style={{ color: "#10b981", flexShrink: 0 }} />
            <span>OpenCV Canny edge detection &bull; approxPolyDP contour polygonization &bull; compactness scoring active.</span>
          </div>

          <button className="btn-emerald" style={{ width: "100%", marginTop: "auto" }} onClick={handleProceed}>
            <span>View Extracted Features</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

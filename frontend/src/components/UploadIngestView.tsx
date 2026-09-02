import React, { useState } from "react";
import { FileText, Camera, Navigation, Building2, FolderArchive, CheckCircle2, Upload, ArrowRight, ShieldAlert } from "lucide-react";
import { Screen } from "./Sidebar";

interface UploadIngestViewProps {
  onNavigate: (screen: Screen) => void;
  provenance: Record<string, any>;
  onTriggerNormalize: () => void;
}

export const UploadIngestView: React.FC<UploadIngestViewProps> = ({
  onNavigate,
  provenance,
  onTriggerNormalize,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [fileNames, setFileNames] = useState({
    cadastral: "cadastral_kharadi_1960.shp",
    drone: "drone_kharadi_2024.tif",
    gnss: "gnss_points.csv",
    municipal: "municipal_gis.gpkg",
    supporting: "None selected",
  });

  const [normalized, setNormalized] = useState(false);

  const handleFileChange = (type: keyof typeof fileNames, name: string) => {
    setFileNames((prev) => ({ ...prev, [type]: name }));
  };

  const handleNormalize = () => {
    setNormalized(true);
    onTriggerNormalize();
  };

  return (
    <div className="page-container">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span>Upload & Ingest</span>
        <span>&gt;</span>
        <span className="active">New Investigation (Kharadi Pilot)</span>
      </div>

      {/* 3-Stage Stepper Header */}
      <div className="stepper-header">
        <div className={`step-node ${currentStep >= 1 ? "active" : ""}`}>
          <div className="step-num">1</div>
          <span>Upload Sources</span>
        </div>
        <div className="step-line" />
        <div className={`step-node ${currentStep >= 2 ? "active" : ""}`}>
          <div className="step-num">2</div>
          <span>Source Details</span>
        </div>
        <div className="step-line" />
        <div className={`step-node ${currentStep >= 3 ? "active" : ""}`}>
          <div className="step-num">3</div>
          <span>Review & Confirm</span>
        </div>
      </div>

      {/* Upload Cards Grid */}
      <div className="upload-cards-grid">
        {/* Cadastral Map */}
        <div className="upload-source-card">
          <div className="upload-card-top">
            <div className="source-icon-title">
              <div className="source-icon">
                <FileText size={20} />
              </div>
              <div className="source-title-text">
                <h3>Cadastral Map</h3>
                <span>SHP, GeoJSON, KML (Authoritative Legal Baseline)</span>
              </div>
            </div>
            <span className="file-status-pill">
              <CheckCircle2 size={13} />
              <span>Uploaded</span>
            </span>
          </div>
          <div className="uploaded-file-row">
            <span>{fileNames.cadastral}</span>
            <small style={{ color: "#94a3b8" }}>2.4 MB</small>
          </div>
          <div className="upload-action-row">
            <label className="upload-file-btn">
              <Upload size={13} />
              <span>Replace file</span>
              <input
                type="file"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileChange("cadastral", e.target.files[0].name);
                }}
              />
            </label>
            <span className="badge-pill info">EPSG:32643 Detected</span>
          </div>
        </div>

        {/* Drone Imagery */}
        <div className="upload-source-card">
          <div className="upload-card-top">
            <div className="source-icon-title">
              <div className="source-icon">
                <Camera size={20} />
              </div>
              <div className="source-title-text">
                <h3>Drone Imagery / Orthomosaic</h3>
                <span>GeoTIFF, Cloud-Optimized GeoTIFF, ECW</span>
              </div>
            </div>
            <span className="file-status-pill">
              <CheckCircle2 size={13} />
              <span>Uploaded</span>
            </span>
          </div>
          <div className="uploaded-file-row">
            <span>{fileNames.drone}</span>
            <small style={{ color: "#94a3b8" }}>512 MB</small>
          </div>
          <div className="upload-action-row">
            <label className="upload-file-btn">
              <Upload size={13} />
              <span>Replace file</span>
              <input
                type="file"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileChange("drone", e.target.files[0].name);
                }}
              />
            </label>
            <span className="badge-pill info">0.1m GSD Resolution</span>
          </div>
        </div>

        {/* GNSS Survey Points */}
        <div className="upload-source-card">
          <div className="upload-card-top">
            <div className="source-icon-title">
              <div className="source-icon">
                <Navigation size={20} />
              </div>
              <div className="source-title-text">
                <h3>GNSS Survey Points</h3>
                <span>CSV, TXT, GeoJSON (High-Accuracy Control)</span>
              </div>
            </div>
            <span className="file-status-pill">
              <CheckCircle2 size={13} />
              <span>Uploaded</span>
            </span>
          </div>
          <div className="uploaded-file-row">
            <span>{fileNames.gnss}</span>
            <small style={{ color: "#94a3b8" }}>1.2 MB</small>
          </div>
          <div className="upload-action-row">
            <label className="upload-file-btn">
              <Upload size={13} />
              <span>Replace file</span>
              <input
                type="file"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileChange("gnss", e.target.files[0].name);
                }}
              />
            </label>
            <span className="badge-pill info">RTK Precision &lt;2cm</span>
          </div>
        </div>

        {/* Municipal GIS Data */}
        <div className="upload-source-card">
          <div className="upload-card-top">
            <div className="source-icon-title">
              <div className="source-icon">
                <Building2 size={20} />
              </div>
              <div className="source-title-text">
                <h3>Municipal GIS Data</h3>
                <span>GeoJSON, GPKG, Shapefile (Admin Context)</span>
              </div>
            </div>
            <span className="file-status-pill">
              <CheckCircle2 size={13} />
              <span>Uploaded</span>
            </span>
          </div>
          <div className="uploaded-file-row">
            <span>{fileNames.municipal}</span>
            <small style={{ color: "#94a3b8" }}>23 MB</small>
          </div>
          <div className="upload-action-row">
            <label className="upload-file-btn">
              <Upload size={13} />
              <span>Replace file</span>
              <input
                type="file"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileChange("municipal", e.target.files[0].name);
                }}
              />
            </label>
            <span className="badge-pill info">PMC/PMRDA Layers</span>
          </div>
        </div>
      </div>

      {/* Upload Summary Box & Action Bar */}
      <div className="upload-summary-box">
        <div className="summary-metrics-group">
          <div className="summary-metric-item">
            <small>Total Sources</small>
            <b>4</b>
          </div>
          <div className="summary-metric-item">
            <small>Total File Size</small>
            <b>2.48 GB</b>
          </div>
          <div className="summary-metric-item">
            <small>CRS Detected</small>
            <b>3 (Normalized to WGS84)</b>
          </div>
          <div className="summary-metric-item">
            <small>Ready to Process</small>
            <b style={{ color: "#10b981", display: "flex", alignItems: "center", gap: "5px" }}>
              <CheckCircle2 size={16} /> All Validated
            </b>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button className="btn-outline" onClick={handleNormalize}>
            {normalized ? "✓ Sources Normalized" : "Normalize All Sources"}
          </button>
          <button className="btn-emerald" onClick={() => onNavigate("source")}>
            <span>Next: Source Details</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Provenance Alert Card */}
      <div className="bf-card" style={{ background: "rgba(14, 26, 43, 0.4)", borderColor: "#1e293b" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
          <ShieldAlert size={18} style={{ color: "#38bdf8", marginTop: "2px" }} />
          <div>
            <h4 style={{ fontSize: "12.5px", color: "#e2e8f0", marginBottom: "4px" }}>
              Dataset Provenance & Authority Assurance
            </h4>
            <p style={{ fontSize: "11.5px", color: "#94a3b8", lineHeight: "1.4" }}>
              {provenance.area} • Ingested sources are stored in immutable write-once tables. Original cadastral maps are never modified or overwritten by automated algorithms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

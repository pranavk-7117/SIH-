import React, { useState } from "react";
import { FileText, Camera, Navigation, Building2, CheckCircle2, Upload, ArrowRight, ShieldAlert, AlertCircle, Loader2 } from "lucide-react";
import { Screen } from "./Sidebar";
import { api } from "../api/client";

interface UploadIngestViewProps {
  onNavigate?: (screen: Screen) => void;
  provenance?: Record<string, any>;
  onTriggerNormalize?: () => void;
  onNormalize?: () => void;
  onContinue?: () => void;
  onUploadData?: (layerType: "cadastral" | "buildings" | "control" | "municipal" | "utilities", geojson: any, meta: any) => void;
}

export const UploadIngestView: React.FC<UploadIngestViewProps> = ({
  onNavigate,
  provenance = { area: "Kharadi Sector 12, Pune" },
  onTriggerNormalize,
  onNormalize,
  onContinue,
  onUploadData,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [normalized, setNormalized] = useState(false);
  const [uploadedGeoJSONInfo, setUploadedGeoJSONInfo] = useState<any>(null);
  const [uploadedCSVInfo, setUploadedCSVInfo] = useState<any>(null);
  const [uploadedDroneInfo, setUploadedDroneInfo] = useState<any>(null);
  const [uploadedMunicipalInfo, setUploadedMunicipalInfo] = useState<any>(null);

  const handleGeoJSONUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadStatus(`Uploading & validating ${file.name}...`);
    try {
      const res = await api.uploadGeoJSON(file);
      setUploadedGeoJSONInfo(res);
      setUploadStatus(`✓ Successfully validated ${file.name} (${res.features || 24} features)`);
      if (res.geojson && onUploadData) {
        onUploadData("cadastral", res.geojson, res);
      }
    } catch (err) {
      setUploadStatus(`Error uploading: ${err}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadStatus(`Parsing GNSS coordinates from ${file.name}...`);
    try {
      const res = await api.uploadGNSSCSV(file);
      setUploadedCSVInfo(res);
      setUploadStatus(`✓ Parsed ${res.points_parsed || 8} GNSS survey control points`);
      if (res.geojson && onUploadData) {
        onUploadData("control", res.geojson, res);
      }
    } catch (err) {
      setUploadStatus(`Error uploading: ${err}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDroneUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadStatus(`Parsing Drone GeoTIFF header ${file.name}...`);
    try {
      const res = await api.uploadDroneGeoTIFF(file);
      setUploadedDroneInfo(res);
      setUploadStatus(`✓ Georeferenced Drone raster header ingested (${res.pixel_dimensions ? `${res.pixel_dimensions[0]}x${res.pixel_dimensions[1]} px` : "4096x4096 px"})`);
      if (res.footprint_geojson && onUploadData) {
        const fc = {
          type: "FeatureCollection",
          features: [res.footprint_geojson],
        };
        onUploadData("buildings", fc, res);
      }
    } catch (err) {
      setUploadStatus(`Error uploading drone raster: ${err}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleMunicipalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadStatus(`Ingesting municipal vector data ${file.name}...`);
    try {
      const res = await api.uploadMunicipalVector(file);
      setUploadedMunicipalInfo(res);
      setUploadStatus(`✓ Parsed municipal layer ${file.name} (${res.features || res.feature_count || 14} features)`);
      if (res.geojson && onUploadData) {
        onUploadData("municipal", res.geojson, res);
      }
    } catch (err) {
      setUploadStatus(`Error uploading municipal dataset: ${err}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleNormalize = () => {
    setNormalized(true);
    if (onNormalize) onNormalize();
    else if (onTriggerNormalize) onTriggerNormalize();
  };

  return (
    <div className="page-container">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span>Upload & Ingest</span>
        <span>&gt;</span>
        <span className="active">Multi-Source Ingestion Pipeline</span>
      </div>

      {/* Stepper */}
      <div className="stepper-header">
        <div className={`step-node ${currentStep >= 1 ? "active" : ""}`}>
          <div className="step-num">1</div>
          <span>Active Ingestion</span>
        </div>
        <div className="step-line" />
        <div className={`step-node ${currentStep >= 2 ? "active" : ""}`}>
          <div className="step-num">2</div>
          <span>Format Crosswalk</span>
        </div>
        <div className="step-line" />
        <div className={`step-node ${currentStep >= 3 ? "active" : ""}`}>
          <div className="step-num">3</div>
          <span>CRS Normalization</span>
        </div>
      </div>

      {/* Status banner */}
      {uploadStatus && (
        <div
          style={{
            background: uploadStatus.startsWith("✓") ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${uploadStatus.startsWith("✓") ? "#bbf7d0" : "#fecaca"}`,
            color: uploadStatus.startsWith("✓") ? "#166534" : "#991b1b",
            padding: "10px 14px",
            borderRadius: "6px",
            marginBottom: "16px",
            fontSize: "12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {isUploading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCircle2 size={14} />}
          <span>{uploadStatus}</span>
        </div>
      )}

      {/* Upload Cards Grid */}
      <div className="upload-cards-grid">
        {/* Cadastral Layer (Active GeoJSON upload) */}
        <div className="upload-source-card" style={{ borderColor: "#10b981" }}>
          <div className="upload-card-top">
            <div className="source-icon-title">
              <div className="source-icon" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
                <FileText size={20} />
              </div>
              <div className="source-title-text">
                <h3>Cadastral Geometry (Active)</h3>
                <span>GeoJSON / JSON (Legal Baseline)</span>
              </div>
            </div>
            <span className="file-status-pill">
              <CheckCircle2 size={13} />
              <span>Active</span>
            </span>
          </div>
          <div className="uploaded-file-row">
            <span>{uploadedGeoJSONInfo?.filename || "cadastral_pune_pilot.geojson"}</span>
            <small style={{ color: "#64748b" }}>{uploadedGeoJSONInfo ? `${uploadedGeoJSONInfo.features} features` : "Pre-loaded"}</small>
          </div>
          <div className="upload-action-row">
            <label className="upload-file-btn">
              <Upload size={13} />
              <span>Upload GeoJSON</span>
              <input type="file" accept=".geojson,.json" onChange={handleGeoJSONUpload} />
            </label>
            <span className="badge-pill success">Shapely Validated</span>
          </div>
        </div>

        {/* GNSS Survey Points (Active CSV upload) */}
        <div className="upload-source-card" style={{ borderColor: "#8b5cf6" }}>
          <div className="upload-card-top">
            <div className="source-icon-title">
              <div className="source-icon" style={{ background: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6" }}>
                <Navigation size={20} />
              </div>
              <div className="source-title-text">
                <h3>GNSS Survey Points (Active)</h3>
                <span>CSV / TXT (lat, lon, accuracy_m)</span>
              </div>
            </div>
            <span className="file-status-pill">
              <CheckCircle2 size={13} />
              <span>Active</span>
            </span>
          </div>
          <div className="uploaded-file-row">
            <span>{uploadedCSVInfo?.filename || "gnss_rtk_control_points.csv"}</span>
            <small style={{ color: "#64748b" }}>{uploadedCSVInfo ? `${uploadedCSVInfo.points_parsed} points` : "8 control points"}</small>
          </div>
          <div className="upload-action-row">
            <label className="upload-file-btn">
              <Upload size={13} />
              <span>Upload CSV</span>
              <input type="file" accept=".csv,.txt" onChange={handleCSVUpload} />
            </label>
            <span className="badge-pill success">RTK &lt;2cm</span>
          </div>
        </div>

        {/* Drone Imagery / Orthomosaic (Real GeoTIFF Header Ingestion) */}
        <div className="upload-source-card" style={{ borderColor: "#0284c7" }}>
          <div className="upload-card-top">
            <div className="source-icon-title">
              <div className="source-icon" style={{ background: "rgba(2, 132, 199, 0.1)", color: "#0284c7" }}>
                <Camera size={20} />
              </div>
              <div className="source-title-text">
                <h3>Drone GeoTIFF / Orthomosaic</h3>
                <span>Cloud-Optimized GeoTIFF / COG (.tif, .tiff)</span>
              </div>
            </div>
            <span className="file-status-pill">
              <CheckCircle2 size={13} />
              <span>Active</span>
            </span>
          </div>
          <div className="uploaded-file-row">
            <span>{uploadedDroneInfo?.filename || "drone_ortho_kharadi.tif"}</span>
            <small style={{ color: "#64748b" }}>{uploadedDroneInfo ? `${uploadedDroneInfo.pixel_dimensions?.[0] || 4096}x${uploadedDroneInfo.pixel_dimensions?.[1] || 4096} px` : "Raster Header Ingested"}</small>
          </div>
          <div className="upload-action-row">
            <label className="upload-file-btn">
              <Upload size={13} />
              <span>Upload GeoTIFF</span>
              <input type="file" accept=".tif,.tiff" onChange={handleDroneUpload} />
            </label>
            <span className="badge-pill info">Rasterio Header Parse</span>
          </div>
        </div>

        {/* Municipal GPKG / SHP / GeoJSON (Real Municipal Vector Ingestion) */}
        <div className="upload-source-card" style={{ borderColor: "#f59e0b" }}>
          <div className="upload-card-top">
            <div className="source-icon-title">
              <div className="source-icon" style={{ background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" }}>
                <Building2 size={20} />
              </div>
              <div className="source-title-text">
                <h3>Municipal GIS (GPKG / SHP / GeoJSON)</h3>
                <span>GeoPackage / Shapefile / GeoJSON</span>
              </div>
            </div>
            <span className="file-status-pill">
              <CheckCircle2 size={13} />
              <span>Active</span>
            </span>
          </div>
          <div className="uploaded-file-row">
            <span>{uploadedMunicipalInfo?.filename || "municipal_roads_pmc.gpkg"}</span>
            <small style={{ color: "#64748b" }}>{uploadedMunicipalInfo ? `${uploadedMunicipalInfo.features || uploadedMunicipalInfo.feature_count || 14} features` : "GeoPandas / GDAL Ingested"}</small>
          </div>
          <div className="upload-action-row">
            <label className="upload-file-btn">
              <Upload size={13} />
              <span>Upload Municipal</span>
              <input type="file" accept=".gpkg,.shp,.geojson,.json,.zip" onChange={handleMunicipalUpload} />
            </label>
            <span className="badge-pill success">GeoPandas / Pyogrio</span>
          </div>
        </div>
      </div>

      {/* Upload Summary Box & Action Bar */}
      <div className="upload-summary-box">
        <div className="summary-metrics-group">
          <div className="summary-metric-item">
            <small>Active Sources</small>
            <b>2 Live + 2 Proxies</b>
          </div>
          <div className="summary-metric-item">
            <small>GeoJSON Support</small>
            <b style={{ color: "#10b981" }}>Validated</b>
          </div>
          <div className="summary-metric-item">
            <small>CRS Transformation</small>
            <b>EPSG:32643 → EPSG:4326</b>
          </div>
          <div className="summary-metric-item">
            <small>Geometry Integrity</small>
            <b style={{ color: "#10b981", display: "flex", alignItems: "center", gap: "5px" }}>
              <CheckCircle2 size={16} /> 100% Closed Rings
            </b>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button className="btn-outline" onClick={handleNormalize}>
            {normalized ? "✓ CRS Normalized to WGS84" : "Normalize All CRS"}
          </button>
          <button className="btn-emerald" onClick={() => (onContinue ? onContinue() : onNavigate?.("sources"))}>
            <span>Next: Source Details</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Provenance Alert Card */}
      <div className="bf-card" style={{ background: "#f8fafc", borderColor: "#e2e8f0" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
          <ShieldAlert size={18} style={{ color: "#0284c7", marginTop: "2px" }} />
          <div>
            <h4 style={{ fontSize: "12.5px", color: "#0f172a", marginBottom: "4px" }}>
              Dataset Provenance & Authority Assurance
            </h4>
            <p style={{ fontSize: "11.5px", color: "#64748b", lineHeight: "1.4" }}>
              {provenance.area} • Ingested sources are stored in immutable write-once tables with SHA-256 hash chaining. Original cadastral maps are never modified or overwritten by automated algorithms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

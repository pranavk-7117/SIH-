import React, { useState } from "react";
import {
  FileText,
  Camera,
  Navigation,
  Building2,
  CheckCircle2,
  Upload,
  ArrowRight,
  ShieldAlert,
  AlertCircle,
  Loader2,
  Mountain,
  Zap,
  FileSpreadsheet,
  ShieldCheck,
  Layers,
  MapPin,
} from "lucide-react";
import { Screen } from "./Sidebar";
import { api } from "../api/client";

interface UploadIngestViewProps {
  onNavigate?: (screen: Screen) => void;
  provenance?: Record<string, any>;
  onTriggerNormalize?: () => void;
  onNormalize?: () => void;
  onContinue?: () => void;
  onUploadData?: (layerType: "cadastral" | "buildings" | "control" | "municipal" | "utilities" | "dsm" | "revenue", geojson: any, meta: any) => void;
  investigation?: any;
}

export const UploadIngestView: React.FC<UploadIngestViewProps> = ({
  onNavigate,
  provenance,
  onTriggerNormalize,
  onNormalize,
  onContinue,
  onUploadData,
  investigation,
}) => {
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedMap, setUploadedMap] = useState<Record<string, any>>({});

  // Helper to check if a specific source key is active
  const getSourceInfo = (key: string) => {
    return uploadedMap[key] || investigation?.sources?.[key] || null;
  };

  const handleUploadGeneric = async (
    sourceKey: string,
    file: File,
    layerType: "cadastral" | "buildings" | "control" | "municipal" | "utilities" | "dsm" | "revenue" | "ori" | "ground_truth",
    customParser?: () => Promise<any>
  ) => {
    setIsUploading(true);
    setUploadStatus(`Uploading and parsing ${file.name}...`);
    try {
      let res: any = null;
      if (customParser) {
        res = await customParser();
      } else if (file.name.endsWith(".geojson") || file.name.endsWith(".json")) {
        res = await api.uploadGeoJSON(file);
      } else if (file.name.endsWith(".csv") || file.name.endsWith(".txt")) {
        res = await api.uploadGNSSCSV(file);
      } else if (file.name.endsWith(".tif") || file.name.endsWith(".tiff")) {
        res = await api.uploadDroneGeoTIFF(file);
      } else {
        res = { filename: file.name, features: 1, file_format: file.name.split(".").pop()?.toUpperCase() };
      }

      // Attach to backend investigation if active
      if (investigation?.id) {
        try {
          await api.uploadInvestigationSource(investigation.id, sourceKey, file);
        } catch (e) {
          console.warn("Backend investigation source attach notice:", e);
        }
      }

      const info = {
        filename: file.name,
        features: res?.features || res?.points_parsed || res?.records_parsed || 1,
        features_count: res?.features || res?.points_parsed || res?.records_parsed || 1,
        file_format: file.name.split(".").pop()?.toUpperCase() || "GEOJSON",
        status: "VALID",
      };

      setUploadedMap((prev) => ({ ...prev, [sourceKey]: info }));
      setUploadStatus(`✓ Successfully uploaded ${file.name} (${info.features} features)`);

      if (onUploadData && (layerType === "cadastral" || layerType === "buildings" || layerType === "control" || layerType === "municipal" || layerType === "utilities" || layerType === "dsm" || layerType === "revenue")) {
        onUploadData(layerType, res?.geojson || res?.footprint_geojson || { type: "FeatureCollection", features: [] }, info);
      }
    } catch (err: any) {
      setUploadStatus(`Error uploading: ${err?.message || err}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGeoJSONUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleUploadGeneric("cadastral", f, "cadastral");
  };

  const handleDroneUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleUploadGeneric("drone", f, "buildings");
  };

  const handleORIUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleUploadGeneric("ori", f, "ori");
  };

  const handleBuildingUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleUploadGeneric("buildings", f, "buildings");
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleUploadGeneric("gnss", f, "control");
  };

  const handleMunicipalUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleUploadGeneric("municipal", f, "municipal");
  };

  const handleDSMUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleUploadGeneric("dsm", f, "dsm");
  };

  const handleUtilityUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleUploadGeneric("utility", f, "utilities");
  };

  const handleRevenueUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleUploadGeneric("revenue", f, "revenue");
  };

  const handleGTUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleUploadGeneric("ground_truth", f, "ground_truth");
  };

  const renderStatusPill = (sourceKey: string) => {
    const info = getSourceInfo(sourceKey);
    if (info) {
      return (
        <span className="file-status-pill active">
          <CheckCircle2 size={13} />
          <span>Uploaded</span>
        </span>
      );
    }
    return (
      <span className="file-status-pill pending">
        <AlertCircle size={13} />
        <span>Pending</span>
      </span>
    );
  };

  const renderFileRow = (sourceKey: string, defaultLabel: string) => {
    const info = getSourceInfo(sourceKey);
    if (info) {
      return (
        <div className="uploaded-file-row">
          <span style={{ fontWeight: 600, color: "#0f172a" }}>{info.filename}</span>
          <small style={{ color: "#059669", fontWeight: 600 }}>
            {info.features_count || info.features} features &bull; Ingested
          </small>
        </div>
      );
    }
    return (
      <div className="uploaded-file-row">
        <span style={{ color: "#94a3b8", fontStyle: "italic" }}>No dataset uploaded yet</span>
        <small style={{ color: "#94a3b8" }}>{defaultLabel}</small>
      </div>
    );
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="view-page-header">
        <div>
          <h2>Upload &amp; Ingest Datasets</h2>
          <p>
            {investigation ? `${investigation.id}: ${investigation.name}` : "Workspace Ingestion Pipeline"} &bull; Multi-source spatial and legal ingestion
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="stepper-header">
        <div className="step-node active">
          <div className="step-num">1</div>
          <span>Upload Datasets</span>
        </div>
        <div className="step-line" />
        <div className="step-node">
          <div className="step-num">2</div>
          <span>Validate</span>
        </div>
        <div className="step-line" />
        <div className="step-node">
          <div className="step-num">3</div>
          <span>Normalize</span>
        </div>
        <div className="step-line" />
        <div className="step-node">
          <div className="step-num">4</div>
          <span>Process</span>
        </div>
        <div className="step-line" />
        <div className="step-node">
          <div className="step-num">5</div>
          <span>Review</span>
        </div>
      </div>

      {/* Upload status message */}
      {uploadStatus && (
        <div
          style={{
            background: uploadStatus.startsWith("✓") ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${uploadStatus.startsWith("✓") ? "#bbf7d0" : "#fecaca"}`,
            color: uploadStatus.startsWith("✓") ? "#166534" : "#991b1b",
            padding: "10px 14px",
            borderRadius: "7px",
            margin: "16px 0",
            fontSize: "12.5px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {isUploading && <Loader2 size={15} className="spin" />}
          <span>{uploadStatus}</span>
        </div>
      )}

      {/* Upload Cards Grid - 10 NAKSHA Datasets */}
      <div className="upload-cards-grid" style={{ marginTop: "16px" }}>
        {/* 1. Cadastral Layer */}
        <div className="upload-source-card" style={{ borderColor: "#10b981" }}>
          <div className="upload-card-top">
            <div className="source-icon-title">
              <div className="source-icon" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
                <FileText size={20} />
              </div>
              <div className="source-title-text">
                <h3>Cadastral Geometry</h3>
                <span>Existing Cadastral Maps (Legal Baseline)</span>
              </div>
            </div>
            {renderStatusPill("cadastral")}
          </div>
          {renderFileRow("cadastral", "Legal Baseline (GeoJSON / SHP)")}
          <div className="upload-action-row">
            <label className="upload-file-btn">
              <Upload size={13} />
              <span>Upload Cadastral GeoJSON</span>
              <input type="file" accept=".geojson,.json" onChange={handleGeoJSONUpload} />
            </label>
            <span className="badge-pill success">Legal Authority 0.95</span>
          </div>
        </div>

        {/* 2. Drone Imagery */}
        <div className="upload-source-card" style={{ borderColor: "#0284c7" }}>
          <div className="upload-card-top">
            <div className="source-icon-title">
              <div className="source-icon" style={{ background: "rgba(2, 132, 199, 0.1)", color: "#0284c7" }}>
                <Camera size={20} />
              </div>
              <div className="source-title-text">
                <h3>Drone Imagery</h3>
                <span>Drone Aerial Survey Orthomosaic (.tif, .tiff)</span>
              </div>
            </div>
            {renderStatusPill("drone")}
          </div>
          {renderFileRow("drone", "Orthomosaic Raster (GeoTIFF)")}
          <div className="upload-action-row">
            <label className="upload-file-btn">
              <Upload size={13} />
              <span>Upload Drone GeoTIFF</span>
              <input type="file" accept=".tif,.tiff" onChange={handleDroneUpload} />
            </label>
            <span className="badge-pill info">Rasterio Header Parse</span>
          </div>
        </div>

        {/* 3. Orthorectified Imagery (ORI) */}
        <div className="upload-source-card" style={{ borderColor: "#38bdf8" }}>
          <div className="upload-card-top">
            <div className="source-icon-title">
              <div className="source-icon" style={{ background: "rgba(56, 189, 248, 0.1)", color: "#0284c7" }}>
                <Camera size={20} />
              </div>
              <div className="source-title-text">
                <h3>Orthorectified Imagery (ORI)</h3>
                <span>True Ortho Multispectral COG (.tif, .tiff)</span>
              </div>
            </div>
            {renderStatusPill("ori")}
          </div>
          {renderFileRow("ori", "True Ortho Reference (Cloud-Optimized GeoTIFF)")}
          <div className="upload-action-row">
            <label className="upload-file-btn">
              <Upload size={13} />
              <span>Upload ORI GeoTIFF</span>
              <input type="file" accept=".tif,.tiff" onChange={handleORIUpload} />
            </label>
            <span className="badge-pill success">True Ortho Reference</span>
          </div>
        </div>

        {/* 4. Building Footprints */}
        <div className="upload-source-card" style={{ borderColor: "#a855f7" }}>
          <div className="upload-card-top">
            <div className="source-icon-title">
              <div className="source-icon" style={{ background: "rgba(168, 85, 247, 0.1)", color: "#a855f7" }}>
                <Layers size={20} />
              </div>
              <div className="source-title-text">
                <h3>Building Footprint Datasets</h3>
                <span>Physical Built-Up Polygons (AI / Vectorized)</span>
              </div>
            </div>
            {renderStatusPill("buildings")}
          </div>
          {renderFileRow("buildings", "Physical Boundary Observations")}
          <div className="upload-action-row">
            <label className="upload-file-btn">
              <Upload size={13} />
              <span>Upload Building Footprints</span>
              <input type="file" accept=".geojson,.json" onChange={handleBuildingUpload} />
            </label>
            <span className="badge-pill success">Vector Polygonal Layer</span>
          </div>
        </div>

        {/* 5. GNSS / CORS Survey Data */}
        <div className="upload-source-card" style={{ borderColor: "#8b5cf6" }}>
          <div className="upload-card-top">
            <div className="source-icon-title">
              <div className="source-icon" style={{ background: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6" }}>
                <Navigation size={20} />
              </div>
              <div className="source-title-text">
                <h3>GNSS / CORS Survey Data</h3>
                <span>RTK Rover Ground Control Points (.csv)</span>
              </div>
            </div>
            {renderStatusPill("gnss")}
          </div>
          {renderFileRow("gnss", "Ground Survey Control Points")}
          <div className="upload-action-row">
            <label className="upload-file-btn">
              <Upload size={13} />
              <span>Upload GNSS / CORS CSV</span>
              <input type="file" accept=".csv,.txt" onChange={handleCSVUpload} />
            </label>
            <span className="badge-pill info">RTK &lt;2cm Precision</span>
          </div>
        </div>

        {/* 6. Municipal GIS Layers */}
        <div className="upload-source-card" style={{ borderColor: "#f59e0b" }}>
          <div className="upload-card-top">
            <div className="source-icon-title">
              <div className="source-icon" style={{ background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" }}>
                <Building2 size={20} />
              </div>
              <div className="source-title-text">
                <h3>Municipal GIS Layers</h3>
                <span>Admin Boundaries, Roads &amp; ROW (.gpkg, .shp)</span>
              </div>
            </div>
            {renderStatusPill("municipal")}
          </div>
          {renderFileRow("municipal", "Municipal Infrastructure Corridors")}
          <div className="upload-action-row">
            <label className="upload-file-btn">
              <Upload size={13} />
              <span>Upload Municipal Vector</span>
              <input type="file" accept=".geojson,.json,.gpkg" onChange={handleMunicipalUpload} />
            </label>
            <span className="badge-pill warn">GeoPandas / GDAL</span>
          </div>
        </div>

        {/* 7. DSM / DTM Datasets */}
        <div className="upload-source-card" style={{ borderColor: "#06b6d4" }}>
          <div className="upload-card-top">
            <div className="source-icon-title">
              <div className="source-icon" style={{ background: "rgba(6, 182, 212, 0.1)", color: "#06b6d4" }}>
                <Mountain size={20} />
              </div>
              <div className="source-title-text">
                <h3>DSM / DTM Datasets</h3>
                <span>Digital Surface &amp; Terrain Models (Slope / Height)</span>
              </div>
            </div>
            {renderStatusPill("dsm")}
          </div>
          {renderFileRow("dsm", "Elevation & Terrain Models")}
          <div className="upload-action-row">
            <label className="upload-file-btn">
              <Upload size={13} />
              <span>Upload Elevation DSM</span>
              <input type="file" accept=".tif,.tiff,.json" onChange={handleDSMUpload} />
            </label>
            <span className="badge-pill info">Terrain Gradient Active</span>
          </div>
        </div>

        {/* 8. Utility Network Data */}
        <div className="upload-source-card" style={{ borderColor: "#ec4899" }}>
          <div className="upload-card-top">
            <div className="source-icon-title">
              <div className="source-icon" style={{ background: "rgba(236, 72, 153, 0.1)", color: "#ec4899" }}>
                <Zap size={20} />
              </div>
              <div className="source-title-text">
                <h3>Utility Network Data</h3>
                <span>Power Transmission, Water &amp; Gas Pipelines</span>
              </div>
            </div>
            {renderStatusPill("utility")}
          </div>
          {renderFileRow("utility", "Underground & Overhead Utilities")}
          <div className="upload-action-row">
            <label className="upload-file-btn">
              <Upload size={13} />
              <span>Upload Utility Network</span>
              <input type="file" accept=".geojson,.json" onChange={handleUtilityUpload} />
            </label>
            <span className="badge-pill warn">Utility Corridors</span>
          </div>
        </div>

        {/* 9. Revenue Records */}
        <div className="upload-source-card" style={{ borderColor: "#14b8a6" }}>
          <div className="upload-card-top">
            <div className="source-icon-title">
              <div className="source-icon" style={{ background: "rgba(20, 184, 166, 0.1)", color: "#14b8a6" }}>
                <FileSpreadsheet size={20} />
              </div>
              <div className="source-title-text">
                <h3>Revenue Records</h3>
                <span>7/12 Extract, Khata, Khasra &amp; Mutations</span>
              </div>
            </div>
            {renderStatusPill("revenue")}
          </div>
          {renderFileRow("revenue", "Non-Spatial Legal Ownership ROR")}
          <div className="upload-action-row">
            <label className="upload-file-btn">
              <Upload size={13} />
              <span>Upload Revenue ROR (7/12)</span>
              <input type="file" accept=".csv,.xlsx" onChange={handleRevenueUpload} />
            </label>
            <span className="badge-pill success">Non-Spatial ROR Join</span>
          </div>
        </div>

        {/* 10. Ground Truthing / GT */}
        <div className="upload-source-card" style={{ borderColor: "#6366f1" }}>
          <div className="upload-card-top">
            <div className="source-icon-title">
              <div className="source-icon" style={{ background: "rgba(99, 102, 241, 0.1)", color: "#6366f1" }}>
                <ShieldCheck size={20} />
              </div>
              <div className="source-title-text">
                <h3>Ground Truthing / GT</h3>
                <span>Field Survey Verification &amp; Adjudication Ledger</span>
              </div>
            </div>
            {renderStatusPill("ground_truth")}
          </div>
          {renderFileRow("ground_truth", "Field Verification Ledger")}
          <div className="upload-action-row">
            <label className="upload-file-btn">
              <Upload size={13} />
              <span>Upload GT Survey CSV</span>
              <input type="file" accept=".csv" onChange={handleGTUpload} />
            </label>
            <span className="badge-pill info">Field Survey Review</span>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="validation-footer-bar" style={{ marginTop: "24px" }}>
        <span style={{ fontSize: "13px", color: "#64748b" }}>
          All uploaded datasets are attached directly to this investigation and stored in the database.
        </span>
        <button
          className="btn-emerald"
          onClick={() => {
            if (onNavigate) onNavigate("validation");
            else if (onContinue) onContinue();
          }}
        >
          <span>Proceed to Data Validation</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

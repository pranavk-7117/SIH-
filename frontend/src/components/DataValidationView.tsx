import React from "react";
import { CheckCircle2, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { Screen } from "./Sidebar";

interface DataValidationViewProps {
  investigation?: any;
  onNavigate: (screen: Screen) => void;
}

export const DataValidationView: React.FC<DataValidationViewProps> = ({
  investigation,
  onNavigate,
}) => {
  const validationRows = [
    { source: "Cadastral", file: "cadastral_1960.geojson", format: "GeoJSON", crs: "EPSG:4326", features: "24", status: "Valid" },
    { source: "Drone Imagery", file: "kharadi_ortho_2024.tif", format: "GeoTIFF", crs: "EPSG:32643", features: "Raster (4096x4096)", status: "Valid" },
    { source: "DSM / DTM", file: "dsm_dtm.tif", format: "GeoTIFF", crs: "EPSG:32643", features: "Raster (4096x4096)", status: "Valid" },
    { source: "GNSS / CORS", file: "gnss_2024.csv", format: "CSV", crs: "WGS84", features: "8", status: "Valid" },
    { source: "Municipal GIS", file: "municipal.gpkg", format: "GPKG", crs: "EPSG:32643", features: "36", status: "Valid" },
    { source: "Revenue Records", file: "revenue_7_12.csv", format: "CSV", crs: "-", features: "24", status: "Valid" },
    { source: "Utility Networks", file: "utility.gpkg", format: "GPKG", crs: "EPSG:32643", features: "18", status: "Valid" },
    { source: "Building Footprints", file: "buildings.geojson", format: "GeoJSON", crs: "EPSG:32643", features: "24", status: "Valid" },
    { source: "Ground Truth", file: "ground_truth.csv", format: "CSV", crs: "WGS84", features: "10", status: "Valid" },
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="view-page-header">
        <div>
          <h2>Data Validation</h2>
          <p>
            {investigation?.name || "Kharadi Sector 12 — Demonstration"} &bull; Multi-source structural &amp; topological validation
          </p>
        </div>
        <span className="badge-pill success">
          <CheckCircle2 size={13} style={{ marginRight: "4px" }} />
          All Checks Passed
        </span>
      </div>

      {/* Stepper */}
      <div className="stepper-header">
        <div className="step-node completed">
          <div className="step-num">✓</div>
          <span>Upload Data</span>
        </div>
        <div className="step-line" />
        <div className="step-node active">
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

      {/* Validation Summary Table Card */}
      <div className="bf-card" style={{ padding: "0", overflow: "hidden", marginBottom: "20px" }}>
        <table className="bf-table">
          <thead>
            <tr>
              <th>Source</th>
              <th>File Name</th>
              <th>Format</th>
              <th>Original CRS</th>
              <th>Features</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {validationRows.map((row, idx) => (
              <tr key={idx}>
                <td>
                  <strong>{row.source}</strong>
                </td>
                <td style={{ fontFamily: "monospace", fontSize: "12px", color: "#334155" }}>
                  {row.file}
                </td>
                <td>
                  <span className="format-tag">{row.format}</span>
                </td>
                <td>
                  <span style={{ color: row.crs === "-" ? "#94a3b8" : "#0284c7", fontWeight: 500 }}>
                    {row.crs}
                  </span>
                </td>
                <td>{row.features}</td>
                <td>
                  <span className="table-status-valid">
                    <CheckCircle2 size={13} />
                    <span>Valid</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom Action Bar */}
      <div className="validation-footer-bar">
        <div className="validation-status-msg">
          <CheckCircle2 size={18} style={{ color: "#10b981" }} />
          <span>All 9 datasets validated successfully. Geometry, rings, and CRS tags verified.</span>
        </div>
        <button className="btn-emerald" onClick={() => onNavigate("crs_normalization")}>
          <span>Proceed to Normalization</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

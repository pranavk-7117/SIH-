import React from "react";
import { CheckCircle2, ArrowRight, Globe, Info, RefreshCw } from "lucide-react";
import { Screen } from "./Sidebar";

interface CRSNormalizationViewProps {
  investigation?: any;
  onNavigate: (screen: Screen) => void;
}

export const CRSNormalizationView: React.FC<CRSNormalizationViewProps> = ({
  investigation,
  onNavigate,
}) => {
  const crsRows = [
    { source: "Cadastral", orig: "EPSG:4326", target: "EPSG:32643", trans: "Reprojected", status: "Completed" },
    { source: "Drone Imagery", orig: "EPSG:32643", target: "EPSG:32643", trans: "No change", status: "Completed" },
    { source: "DSM / DTM", orig: "EPSG:32643", target: "EPSG:32643", trans: "No change", status: "Completed" },
    { source: "GNSS / CORS", orig: "WGS84", target: "EPSG:32643", trans: "Reprojected", status: "Completed" },
    { source: "Municipal GIS", orig: "EPSG:32643", target: "EPSG:32643", trans: "No change", status: "Completed" },
    { source: "Revenue Records", orig: "-", target: "Attribute only", trans: "Attribute only", status: "Completed" },
    { source: "Utility Networks", orig: "EPSG:32643", target: "EPSG:32643", trans: "No change", status: "Completed" },
    { source: "Building Footprints", orig: "EPSG:32643", target: "EPSG:32643", trans: "No change", status: "Completed" },
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="view-page-header">
        <div>
          <h2>CRS Normalization</h2>
          <p>
            {investigation?.name || "Kharadi Sector 12 — Demonstration"} &bull; Coordinate Reference System alignment to standard projection
          </p>
        </div>
        <span className="badge-pill success">
          <Globe size={13} style={{ marginRight: "4px" }} />
          EPSG:32643 &bull; UTM Zone 43N
        </span>
      </div>

      {/* Stepper */}
      <div className="stepper-header">
        <div className="step-node completed">
          <div className="step-num">✓</div>
          <span>Upload Datasets</span>
        </div>
        <div className="step-line" />
        <div className="step-node completed">
          <div className="step-num">✓</div>
          <span>Validate</span>
        </div>
        <div className="step-line" />
        <div className="step-node active">
          <div className="step-num">3</div>
          <span>Normalize</span>
        </div>
        <div className="step-line" />
        <div className="step-node">
          <div className="step-num">4</div>
          <span>Transformation</span>
        </div>
        <div className="step-line" />
        <div className="step-node">
          <div className="step-num">5</div>
          <span>Status</span>
        </div>
      </div>

      {/* Normalization Table Card */}
      <div className="bf-card" style={{ padding: "0", overflow: "hidden", marginBottom: "20px" }}>
        <table className="bf-table">
          <thead>
            <tr>
              <th>Source</th>
              <th>Original CRS</th>
              <th>Target CRS</th>
              <th>Transformation</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {crsRows.map((row, idx) => (
              <tr key={idx}>
                <td>
                  <strong>{row.source}</strong>
                </td>
                <td>
                  <span style={{ color: "#64748b", fontFamily: "monospace" }}>{row.orig}</span>
                </td>
                <td>
                  <span style={{ color: "#0284c7", fontWeight: 600, fontFamily: "monospace" }}>{row.target}</span>
                </td>
                <td>
                  <span className={`trans-pill ${row.trans === "Reprojected" ? "reprojected" : "same"}`}>
                    {row.trans}
                  </span>
                </td>
                <td>
                  <span className="table-status-valid">
                    <CheckCircle2 size={13} />
                    <span>Completed</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Info Notice Box */}
      <div className="crs-info-box">
        <Info size={18} style={{ color: "#0284c7", flexShrink: 0 }} />
        <span>
          All spatial datasets have been normalized to <strong>EPSG:32643 (UTM Zone 43N)</strong> and projected to WGS84 for web visualization. Spatial calculations (distances, areas, and thin-plate-spline kernel) evaluate in metric Euclidean space.
        </span>
      </div>

      {/* Action Footer */}
      <div className="validation-footer-bar" style={{ marginTop: "18px" }}>
        <span style={{ fontSize: "12.5px", color: "#64748b" }}>
          Ready for AI/CV Boundary Extraction &amp; Correspondence Matching
        </span>
        <button className="btn-emerald" onClick={() => onNavigate("extract")}>
          <span>Proceed to Processing</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

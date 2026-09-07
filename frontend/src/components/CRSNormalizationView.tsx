import React from "react";
import { CheckCircle2, ArrowRight, Globe, Info, CheckSquare } from "lucide-react";
import { Screen } from "./Sidebar";

interface CRSRow {
  source: string;
  orig: string;
  target: string;
  trans: string;
  status: string;
}

interface CRSNormalizationViewProps {
  investigation?: any;
  crsRows?: CRSRow[];
  onNavigate: (screen: Screen) => void;
}

export const CRSNormalizationView: React.FC<CRSNormalizationViewProps> = ({
  investigation,
  crsRows,
  onNavigate,
}) => {
  // Only show rows produced by actual upload/normalization — no hardcoded data
  const rows: CRSRow[] = crsRows ?? [];
  const hasData = rows.length > 0;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="view-page-header">
        <div>
          <h2>CRS Normalization</h2>
          <p>
            {investigation?.name || "No investigation selected"} &bull; Coordinate Reference System alignment to standard projection
          </p>
        </div>
        {hasData && (
          <span className="badge-pill success">
            <Globe size={13} style={{ marginRight: "4px" }} />
            EPSG:32643 &bull; UTM Zone 43N
          </span>
        )}
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

      {!hasData ? (
        /* Empty state */
        <div className="empty-state-box">
          <div className="empty-state-icon">
            <Globe size={26} />
          </div>
          <h3>No datasets to normalize yet</h3>
          <p>
            Complete <strong>Data Validation</strong> first. Once datasets are validated,
            CRS normalization to EPSG:32643 (UTM Zone 43N) will run automatically.
          </p>
          <button className="btn-outline" onClick={() => onNavigate("validation")}>
            <CheckSquare size={14} />
            <span>Go to Validation</span>
          </button>
        </div>
      ) : (
        <>
          {/* Normalization Table Card */}
          <div className="bf-card" style={{ padding: "0", overflow: "hidden" }}>
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
                {rows.map((row, idx) => (
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
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: "5px",
                          fontSize: "11px",
                          fontWeight: 700,
                          background: row.trans === "Reprojected" ? "rgba(16,185,129,0.12)" : "#f1f5f9",
                          color: row.trans === "Reprojected" ? "#059669" : "#64748b",
                        }}
                      >
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
          <div className="crs-info-banner">
            <Info size={18} style={{ color: "#0284c7", flexShrink: 0, marginTop: "1px" }} />
            <span>
              All spatial datasets have been normalized to{" "}
              <strong>EPSG:32643 (UTM Zone 43N)</strong> and projected to WGS84 for web
              visualization. Spatial calculations (distances, areas, and thin-plate-spline
              kernel) evaluate in metric Euclidean space.
            </span>
          </div>

          {/* Action Footer */}
          <div className="validation-footer-bar">
            <span className="crs-ready-label">
              Ready for AI/CV Boundary Extraction &amp; Correspondence Matching
            </span>
            <button className="btn-emerald" onClick={() => onNavigate("extract")}>
              <span>Proceed to Processing</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

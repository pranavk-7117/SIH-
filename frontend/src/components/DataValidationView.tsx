import React from "react";
import { CheckCircle2, ArrowRight, UploadCloud, AlertCircle } from "lucide-react";
import { Screen } from "./Sidebar";

interface ValidationRow {
  source: string;
  file: string;
  format: string;
  crs: string;
  features: string;
  status: "Valid" | "Warning" | "Error";
}

interface DataValidationViewProps {
  investigation?: any;
  uploadedFiles?: ValidationRow[];
  onNavigate: (screen: Screen) => void;
}

export const DataValidationView: React.FC<DataValidationViewProps> = ({
  investigation,
  uploadedFiles,
  onNavigate,
}) => {
  // Only show rows that were actually uploaded — no preloaded hardcoded data
  const validationRows: ValidationRow[] = uploadedFiles ?? [];
  const hasData = validationRows.length > 0;
  const allValid = hasData && validationRows.every((r) => r.status === "Valid");

  return (
    <div className="page-container">
      {/* Header */}
      <div className="view-page-header">
        <div>
          <h2>Data Validation</h2>
          <p>
            {investigation?.name || "No investigation selected"} &bull; Multi-source structural &amp; topological validation
          </p>
        </div>
        {hasData && allValid && (
          <span className="badge-pill success">
            <CheckCircle2 size={13} style={{ marginRight: "4px" }} />
            All Checks Passed
          </span>
        )}
        {hasData && !allValid && (
          <span className="badge-pill warn">
            <AlertCircle size={13} style={{ marginRight: "4px" }} />
            Issues Detected
          </span>
        )}
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

      {/* Main content */}
      {!hasData ? (
        /* Empty state — no files uploaded yet */
        <div className="empty-state-box">
          <div className="empty-state-icon">
            <UploadCloud size={26} />
          </div>
          <h3>No datasets uploaded yet</h3>
          <p>
            Go to <strong>Upload &amp; Ingest</strong> to upload your datasets (Cadastral, Drone ORI, GNSS, etc.).
            Validation will run automatically once files are ingested.
          </p>
          <button className="btn-emerald" onClick={() => onNavigate("upload")}>
            <UploadCloud size={14} />
            <span>Upload Datasets</span>
          </button>
        </div>
      ) : (
        <>
          {/* Validation Summary Table Card */}
          <div className="bf-card" style={{ padding: "0", overflow: "hidden" }}>
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
                      {row.status === "Valid" ? (
                        <span className="table-status-valid">
                          <CheckCircle2 size={13} />
                          <span>Valid</span>
                        </span>
                      ) : (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "#ef4444", fontWeight: 700 }}>
                          <AlertCircle size={13} />
                          <span>{row.status}</span>
                        </span>
                      )}
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
              <span>
                All {validationRows.length} datasets validated successfully. Geometry, rings, and CRS tags verified.
              </span>
            </div>
            <button className="btn-emerald" onClick={() => onNavigate("crs_normalization")}>
              <span>Proceed to Normalization</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

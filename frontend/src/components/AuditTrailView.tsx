import React, { useState } from "react";
import { Download, Search, FileText, CheckCircle2, ShieldCheck, Database } from "lucide-react";

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  details: string;
  type: "upload" | "process" | "decision" | "export";
}

interface AuditTrailViewProps {
  auditLog: AuditEntry[];
  onExport: () => void;
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({ auditLog, onExport }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLogs = auditLog.filter(
    (entry) =>
      entry.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.user.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span>Investigation</span>
        <span>&gt;</span>
        <span>INV-2026-00124</span>
        <span>&gt;</span>
        <span className="active">Audit Trail & Provenance History</span>
      </div>

      {/* Header & Controls Bar */}
      <div className="bf-card" style={{ padding: "14px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ position: "relative", width: "280px" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: 10, color: "#64748b" }} />
            <input
              type="text"
              placeholder="Search audit actions, users, parcels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                background: "rgba(11, 19, 32, 0.9)",
                border: "1px solid var(--border-color)",
                borderRadius: "6px",
                padding: "7px 10px 7px 32px",
                fontSize: "12px",
                color: "#fff",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn-outline" onClick={onExport}>
              <Download size={13} />
              <span>Export Audit Log (JSON)</span>
            </button>
            <button className="btn-emerald" onClick={onExport}>
              <Download size={13} />
              <span>Export Harmonized GeoPackage</span>
            </button>
          </div>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bf-card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="audit-table-wrapper">
          <table className="audit-table">
            <thead>
              <tr>
                <th style={{ width: "190px" }}>Timestamp</th>
                <th style={{ width: "220px" }}>Action</th>
                <th style={{ width: "120px" }}>User / Role</th>
                <th>Details & Transformation History</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => {
                const dotColor =
                  log.type === "decision"
                    ? "#10b981"
                    : log.type === "process"
                    ? "#38bdf8"
                    : log.type === "upload"
                    ? "#f59e0b"
                    : "#8b5cf6";

                return (
                  <tr key={log.id}>
                    <td style={{ color: "#94a3b8", fontSize: "11.5px" }}>{log.timestamp}</td>
                    <td style={{ fontWeight: 700, color: "#fff" }}>
                      <span className="timeline-dot" style={{ background: dotColor }} />
                      <span>{log.action}</span>
                    </td>
                    <td>
                      <span className="badge-pill info" style={{ fontSize: "9.5px" }}>
                        {log.user}
                      </span>
                    </td>
                    <td style={{ color: "#cbd5e1" }}>{log.details}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Governance & Immutability Notice */}
      <div className="bf-card" style={{ background: "rgba(16, 185, 129, 0.05)", borderColor: "rgba(16, 185, 129, 0.2)" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <ShieldCheck size={20} style={{ color: "#10b981" }} />
          <div>
            <h4 style={{ fontSize: "13px", color: "#10b981", marginBottom: "2px" }}>
              Cryptographic & Versioned Audit Guarantee
            </h4>
            <p style={{ fontSize: "11.5px", color: "#94a3b8" }}>
              All events are append-only. Transformations, registration parameters, topology checks, and officer reviews are permanently logged and reproducible under ISO 19152 / LADM compliance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from "react";
import { Search, Bell, Loader2, Download, Building } from "lucide-react";
import { Screen } from "./Sidebar";
import { STUDY_AREAS } from "../studyAreas";
import { api } from "../api/client";

interface TopbarProps {
  currentScreen: Screen;
  selectedDistrict: string;
  areaIds: string[];
  activeAreaId: string;
  onAreaChange: (areaId: string) => void;
  isComputing?: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentScreen,
  selectedDistrict,
  areaIds,
  activeAreaId,
  onAreaChange,
  isComputing = false,
}) => {
  const [showDeptMenu, setShowDeptMenu] = useState(false);

  const getScreenTitle = () => {
    switch (currentScreen) {
      case "dashboard":
        return { title: "Dashboard", subtitle: "Overview of your investigations and system summary" };
      case "upload":
        return { title: "Upload & Ingest Sources", subtitle: "Upload multiple geospatial data sources to start harmonization" };
      case "sources":
        return { title: "Source Viewer", subtitle: "Preview and compare uploaded sources side-by-side" };
      case "extract":
        return { title: "Boundary Observation Ingestion", subtitle: "Physical boundary contours ingested from drone and OSM footprint datasets" };
      case "graph":
        return { title: "Spatial Evidence Graph", subtitle: "Live multi-relational graph connecting parcels, physical boundaries, GNSS, and roads" };
      case "harmonize":
        return { title: "Harmonization & Alignment", subtitle: "Live Affine/TPS registration with RANSAC outlier rejection and topology validation" };
      case "discrepancy":
        return { title: "Legal vs Physical Discrepancy Map", subtitle: "Conflict heatmap ranking parcels by legal-to-physical displacement magnitude" };
      case "evidence":
        return { title: "Evidence Card & Recommendation", subtitle: "Multi-source evidence breakdown, trust scores, and non-spatial revenue integration" };
      case "review":
        return { title: "Review & Decision", subtitle: "Authorized officer adjudication with versioned audit capture" };
      case "audit":
        return { title: "Audit Trail & Provenance", subtitle: "Tamper-evident append-only ledger with SHA-256 hash chaining" };
      case "settings":
        return { title: "System Configuration", subtitle: "Configure authority weights, thresholds, and registration model" };
      default:
        return { title: "BHUMI-FUSE", subtitle: "AI-Driven Multi-Source Land Record Harmonization Engine" };
    }
  };

  const { title, subtitle } = getScreenTitle();

  const handleDeptExport = async (deptId: string) => {
    setShowDeptMenu(false);
    const data = await api.getDepartmentExport(deptId, activeAreaId);
    if (!data) {
      alert(`Exporting ${deptId.toUpperCase()} schema for ${activeAreaId}... (Fallback JSON generated)`);
      return;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bhumi_fuse_${deptId}_schema_${activeAreaId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1>{title}</h1>
        <span>{subtitle}</span>
      </div>

      <div className="topbar-right">
        {/* Live computation indicator */}
        {isComputing && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#059669", fontWeight: 700 }}>
            <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
            <span>Computing…</span>
          </div>
        )}

        {/* Study Area Dropdown — triggers live re-computation */}
        <select
          className="topbar-selector"
          value={activeAreaId}
          onChange={(e) => onAreaChange(e.target.value)}
          style={{ minWidth: "220px" }}
        >
          {areaIds.map((id) => (
            <option key={id} value={id}>
              {STUDY_AREAS[id]?.name || id} — {STUDY_AREAS[id]?.city || ""}
            </option>
          ))}
        </select>

        {/* Export Harmonized GeoJSON Button */}
        <a
          href={`/datasets/${activeAreaId}_dataset.geojson`}
          download={`bhumi_fuse_${activeAreaId}_dataset.geojson`}
          className="btn-emerald"
          style={{ textDecoration: "none", padding: "6px 12px", fontSize: "11.5px", display: "flex", alignItems: "center", gap: "5px" }}
          title={`Download full GeoJSON dataset for ${STUDY_AREAS[activeAreaId]?.name || activeAreaId}`}
        >
          <Download size={13} />
          <span>Export GeoJSON</span>
        </a>

        {/* Inter-Departmental Exchange Button & Dropdown (PS-26013) */}
        <div style={{ position: "relative" }}>
          <button
            className="btn-outline"
            style={{ padding: "6px 10px", fontSize: "11.5px", display: "flex", alignItems: "center", gap: "5px" }}
            onClick={() => setShowDeptMenu((prev) => !prev)}
            title="Export reshaped schema for inter-departmental data exchange"
          >
            <Building size={13} />
            <span>Dept Schema ▾</span>
          </button>

          {showDeptMenu && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: "4px",
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                zIndex: 50,
                minWidth: "210px",
                overflow: "hidden",
              }}
            >
              <button
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "12px",
                  color: "#0f172a",
                  display: "flex",
                  flexDirection: "column",
                  borderBottom: "1px solid #f1f5f9",
                }}
                onClick={() => handleDeptExport("revenue")}
              >
                <b>Revenue Department</b>
                <small style={{ color: "#64748b", fontSize: "10.5px" }}>patta_holder, ksetra_phal, sarvekshan</small>
              </button>

              <button
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "12px",
                  color: "#0f172a",
                  display: "flex",
                  flexDirection: "column",
                  borderBottom: "1px solid #f1f5f9",
                }}
                onClick={() => handleDeptExport("municipal")}
              >
                <b>Municipal Corporation</b>
                <small style={{ color: "#64748b", fontSize: "10.5px" }}>property_owner, plot_area, zone_class</small>
              </button>

              <button
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "12px",
                  color: "#0f172a",
                  display: "flex",
                  flexDirection: "column",
                }}
                onClick={() => handleDeptExport("pmrda")}
              >
                <b>PMRDA Regional Auth</b>
                <small style={{ color: "#64748b", fontSize: "10.5px" }}>pattadar, plot_area_sqm, land_cat</small>
              </button>
            </div>
          )}
        </div>

        <button
          className="topbar-icon-btn"
          title="Search records"
          onClick={() => alert("Search indexed parcels and survey numbers")}
        >
          <Search size={16} />
        </button>

        <button
          className="topbar-icon-btn"
          title="High-priority notifications"
          onClick={() => alert("3 high-priority discrepancies require officer review")}
        >
          <Bell size={16} />
          <span className="notif-badge">3</span>
        </button>

        <div className="user-avatar" style={{ width: "32px", height: "32px", cursor: "pointer" }}>
          AO
        </div>
      </div>
    </header>
  );
};

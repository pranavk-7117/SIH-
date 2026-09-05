import React from "react";
import { Search, Bell, Loader2 } from "lucide-react";
import { Screen } from "./Sidebar";
import { STUDY_AREAS } from "../studyAreas";

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
  const getScreenTitle = () => {
    switch (currentScreen) {
      case "dashboard":
        return { title: "Dashboard", subtitle: "Overview of your investigations and system summary" };
      case "upload":
        return { title: "Upload & Ingest Sources", subtitle: "Upload multiple geospatial data sources to start harmonization" };
      case "sources":
        return { title: "Source Viewer", subtitle: "Preview and compare uploaded sources side-by-side" };
      case "extract":
        return { title: "AI Boundary Extraction", subtitle: "Physical boundary contours extracted from drone imagery using SegFormer-B0" };
      case "graph":
        return { title: "Spatial Evidence Graph", subtitle: "Live multi-relational graph connecting parcels, AI boundaries, GNSS, and roads" };
      case "harmonize":
        return { title: "Harmonization & Alignment", subtitle: "Live Affine/TPS registration with topology validation and evidence fusion" };
      case "discrepancy":
        return { title: "Legal vs Physical Discrepancy Map", subtitle: "Conflict heatmap ranking parcels by legal-to-physical displacement magnitude" };
      case "evidence":
        return { title: "Evidence Card & Recommendation", subtitle: "Multi-source evidence breakdown, trust scores, and confidence assessment" };
      case "review":
        return { title: "Review & Decision", subtitle: "Authorized officer adjudication with immutable versioned audit capture" };
      case "audit":
        return { title: "Audit Trail & Provenance", subtitle: "Complete cryptographic log of all transformations, decisions, and exports" };
      case "settings":
        return { title: "System Configuration", subtitle: "Configure authority weights, thresholds, and registration model" };
      default:
        return { title: "BHUMI-FUSE", subtitle: "AI-Driven Multi-Source Land Record Harmonization Engine" };
    }
  };

  const { title, subtitle } = getScreenTitle();

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

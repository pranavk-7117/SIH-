import React from "react";
import { Search, Bell, Plus, Loader2 } from "lucide-react";
import { Screen } from "./Sidebar";
import { STUDY_AREAS } from "../studyAreas";

interface TopbarProps {
  currentScreen: Screen;
  selectedDistrict: string;
  areaIds: string[];
  activeAreaId: string;
  onAreaChange: (areaId: string) => void;
  onNavigate?: (screen: Screen) => void;
  isComputing?: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentScreen,
  selectedDistrict,
  areaIds,
  activeAreaId,
  onAreaChange,
  onNavigate,
  isComputing = false,
}) => {
  const getScreenTitle = () => {
    switch (currentScreen) {
      case "landing":
        return { title: "BHUMI-FUSE Portal", subtitle: "AI-Enabled Geospatial Integration for Urban Land Governance" };
      case "dashboard":
        return { title: "Dashboard", subtitle: "Overview of your land harmonization projects · NAKSHA" };
      case "new_investigation":
        return { title: "New Investigation", subtitle: "Create a new land harmonization project" };
      case "upload":
        return { title: "Upload & Ingest Datasets", subtitle: "Bring all spatial and non-spatial evidence into one investigation" };
      case "validation":
        return { title: "Data Validation", subtitle: "Multi-source structural & topological validation summary" };
      case "crs_normalization":
        return { title: "CRS Normalization", subtitle: "Coordinate Reference System alignment to standard projection" };
      case "extract":
        return { title: "AI Feature Extraction", subtitle: "Automated building footprint and physical boundary extraction" };
      case "sources":
        return { title: "Source Viewer", subtitle: "Preview and compare uploaded sources side-by-side" };
      case "harmonize":
        return { title: "Harmonization & Results", subtitle: "Thin-Plate Spline (TPS) registration & RANSAC correspondence filtering" };
      case "conflict_dashboard":
        return { title: "Conflict Dashboard", subtitle: "Evidence-driven review of spatial and legal discrepancies" };
      case "discrepancy":
        return { title: "Discrepancy Map", subtitle: "Spatial displacement heatmap and legal mismatch visualizer" };
      case "evidence":
        return { title: "Evidence Cards", subtitle: "Multi-source evidence breakdown & trust scores" };
      case "graph":
        return { title: "AI Feature Graph", subtitle: "Interactive multi-relational spatial evidence graph" };
      case "review":
        return { title: "Review & Decision", subtitle: "Authorized officer adjudication with court-admissible audit capture" };
      case "reports":
        return { title: "Reports & Export", subtitle: "Authoritative harmonized land governance download packages" };
      case "audit":
        return { title: "Audit Trail", subtitle: "Tamper-evident append-only ledger with SHA-256 hash chaining" };
      case "settings":
        return { title: "Settings", subtitle: "System authority weights, Do-Not-Decide thresholds & models" };
      default:
        return { title: "BHUMI-FUSE", subtitle: "AI Land Harmonization Engine" };
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
        {isComputing && (
          <div className="computing-badge">
            <Loader2 size={14} className="spin" />
            <span>Computing…</span>
          </div>
        )}

        {/* Location / Search Box */}
        <div className="topbar-search-box">
          <Search size={14} className="search-icon" />
          <select
            className="topbar-area-dropdown"
            value={activeAreaId}
            onChange={(e) => onAreaChange(e.target.value)}
          >
            {areaIds.map((id) => (
              <option key={id} value={id}>
                {STUDY_AREAS[id]?.name || id}
              </option>
            ))}
          </select>
        </div>

        {/* Notification Bell */}
        <button className="topbar-icon-btn" title="Notifications">
          <Bell size={16} />
          <span className="notif-badge">3</span>
        </button>

        {/* User profile pill */}
        <div className="topbar-user-pill">
          <div className="avatar-dot">NR</div>
          <div className="user-text">
            <b>Nitin R.</b>
            <small>Land Records Officer</small>
          </div>
        </div>

        {/* + New Investigation Button */}
        {currentScreen !== "new_investigation" && onNavigate && (
          <button className="btn-emerald-sm" onClick={() => onNavigate("new_investigation")}>
            <Plus size={14} />
            <span>New Investigation</span>
          </button>
        )}
      </div>
    </header>
  );
};

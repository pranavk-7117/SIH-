import React from "react";
import { Search, Bell, Plus, Loader2, FolderKanban } from "lucide-react";
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
  investigations?: any[];
  activeInvestigation?: any;
  onSelectInvestigation?: (invId: string) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentScreen,
  selectedDistrict,
  areaIds,
  activeAreaId,
  onAreaChange,
  onNavigate,
  isComputing = false,
  investigations = [],
  activeInvestigation = null,
  onSelectInvestigation,
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
        return { title: "Multi-Source Viewer", subtitle: "Inspect Cadastral, Drone, GNSS and Municipal layers" };
      case "harmonize":
        return { title: "Geometric Alignment", subtitle: "Affine & TPS transformation with RANSAC outlier filtering" };
      case "conflict_dashboard":
        return { title: "Conflict Dashboard", subtitle: "Evidence-driven review of spatial and legal discrepancies" };
      case "discrepancy":
        return { title: "Discrepancy Map", subtitle: "Residual vectors and boundary displacement visualization" };
      case "evidence":
        return { title: "Spatial Evidence Card", subtitle: "Multi-source fusion confidence scoring per parcel" };
      case "review":
        return { title: "Review & Decision", subtitle: "Authorized officer adjudication with court-admissible audit capture" };
      case "graph":
        return { title: "Spatial Evidence Graph", subtitle: "Knowledge graph linking cadastral, physical and legal entities" };
      case "reports":
        return { title: "Reports & Export", subtitle: "Generate court-admissible audit packages and GeoJSON bundles" };
      case "audit":
        return { title: "Audit Trail", subtitle: "SHA-256 tamper-evident immutable change ledger" };
      case "settings":
        return { title: "Authority Weights", subtitle: "Configure multi-criteria evidence weights and DND thresholds" };
      default:
        return { title: "BHUMI-FUSE", subtitle: "SIH-26013 Geospatial Integration" };
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

        {/* Real Investigation Selector from DB */}
        <div className="topbar-search-box" style={{ minWidth: "220px" }}>
          <FolderKanban size={14} className="search-icon" style={{ color: "#047857" }} />
          <select
            className="topbar-area-dropdown"
            value={activeInvestigation?.id || ""}
            onChange={(e) => {
              if (e.target.value === "__new__") {
                if (onNavigate) onNavigate("new_investigation");
              } else if (onSelectInvestigation) {
                onSelectInvestigation(e.target.value);
              }
            }}
            style={{ fontWeight: 600, color: "#0f172a" }}
          >
            {investigations && investigations.length > 0 ? (
              investigations.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.id}: {inv.name || inv.area_name || "Investigation"}
                </option>
              ))
            ) : (
              <option value="" disabled>
                No Investigations Yet
              </option>
            )}
            <option value="__new__">+ Create New Investigation</option>
          </select>
        </div>

        {/* Notification Bell */}
        <button className="topbar-icon-btn" title="Notifications">
          <Bell size={16} />
          <span className="notif-badge">0</span>
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

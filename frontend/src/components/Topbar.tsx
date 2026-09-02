import React from "react";
import { ChevronDown, Search, Bell, Download } from "lucide-react";
import { Screen } from "./Sidebar";

interface TopbarProps {
  currentScreen: Screen;
  onExport: () => void;
  selectedDistrict: string;
  onSelectDistrict: (dist: string) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentScreen,
  onExport,
  selectedDistrict,
  onSelectDistrict,
}) => {
  const getScreenTitle = () => {
    switch (currentScreen) {
      case "dashboard":
        return { title: "Dashboard", subtitle: "Overview of your investigations and system summary" };
      case "upload":
        return { title: "Upload & Ingest Sources", subtitle: "Upload multiple geospatial data sources to start harmonization" };
      case "source":
        return { title: "Source Viewer", subtitle: "Preview and compare uploaded sources side-by-side" };
      case "extract":
        return { title: "AI Boundary Extraction", subtitle: "Extracting boundaries and features from high-resolution drone imagery" };
      case "graph":
        return { title: "Spatial Evidence Graph", subtitle: "Visualize relationships between spatial entities and cross-source evidence" };
      case "harmonize":
        return { title: "Harmonization & Alignment", subtitle: "Align sources, minimize spatial discrepancies, and validate topology" };
      case "discrepancy":
        return { title: "Legal vs Physical Discrepancy Map", subtitle: "Identify and rank conflicts between legal records and current physical reality" };
      case "evidence_card":
        return { title: "Evidence Card & Recommendation", subtitle: "Detailed evidence breakdown and AI recommendation per parcel" };
      case "review":
        return { title: "Review & Decision", subtitle: "Authorized officer evidence review and immutable decision capture" };
      case "audit":
        return { title: "Audit Trail", subtitle: "Complete immutable history of transformations, actions, and decisions" };
      case "settings":
        return { title: "System Configuration", subtitle: "Manage coordinate reference systems, thresholds, and authorities" };
      default:
        return { title: "BHUMI-FUSE", subtitle: "Land Record Harmonization Engine" };
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
        <select
          className="topbar-selector"
          value={selectedDistrict}
          onChange={(e) => onSelectDistrict(e.target.value)}
        >
          <option value="Pune District">Pune District (Kharadi Pilot)</option>
          <option value="Haveli Tehsil">Haveli Tehsil (PMRDA Peri-Urban)</option>
          <option value="Pimpri-Chinchwad">Pimpri-Chinchwad Ward 4</option>
        </select>

        <button className="topbar-icon-btn" title="Search records" onClick={() => alert("Search indexed parcels and survey numbers")}>
          <Search size={16} />
        </button>

        <button className="topbar-icon-btn" title="Notifications" onClick={() => alert("3 high-priority discrepancies require officer review")}>
          <Bell size={16} />
          <span className="notif-badge">3</span>
        </button>

        <button className="btn-emerald" onClick={onExport} style={{ padding: "7px 14px", fontSize: "12px" }}>
          <Download size={14} />
          <span>Export GeoJSON</span>
        </button>

        <div className="user-avatar" style={{ width: "32px", height: "32px", cursor: "pointer" }}>
          AO
        </div>
      </div>
    </header>
  );
};

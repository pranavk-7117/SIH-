import React from "react";
import {
  Home,
  PlusCircle,
  UploadCloud,
  CheckSquare,
  Globe,
  Sparkles,
  Layers,
  Map,
  ShieldAlert,
  GitFork,
  ClipboardCheck,
  FileDown,
  FileText,
  Settings,
  ExternalLink,
} from "lucide-react";

export type Screen =
  | "landing"
  | "dashboard"
  | "new_investigation"
  | "upload"
  | "validation"
  | "crs_normalization"
  | "extract"
  | "sources"
  | "harmonize"
  | "conflict_dashboard"
  | "discrepancy"
  | "evidence"
  | "review"
  | "graph"
  | "reports"
  | "audit"
  | "settings";

interface SidebarProps {
  currentScreen: Screen;
  onSelectScreen: (screen: Screen) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentScreen, onSelectScreen }) => {
  const mainNavItems: { id: Screen; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Dashboard", icon: <Home size={16} /> },
    { id: "new_investigation", label: "New Investigation", icon: <PlusCircle size={16} /> },
    { id: "upload", label: "Upload & Ingest", icon: <UploadCloud size={16} /> },
    { id: "validation", label: "Data Validation", icon: <CheckSquare size={16} /> },
    { id: "crs_normalization", label: "CRS Normalization", icon: <Globe size={16} /> },
    { id: "extract", label: "AI Feature Extraction", icon: <Sparkles size={16} /> },
    { id: "sources", label: "Source Viewer", icon: <Layers size={16} /> },
    { id: "harmonize", label: "Harmonization", icon: <Map size={16} /> },
    { id: "conflict_dashboard", label: "Conflict Dashboard", icon: <ShieldAlert size={16} /> },
    { id: "graph", label: "Evidence Graph", icon: <GitFork size={16} /> },
    { id: "review", label: "Review & Decision", icon: <ClipboardCheck size={16} /> },
    { id: "reports", label: "Reports & Export", icon: <FileDown size={16} /> },
    { id: "audit", label: "Audit Trail", icon: <FileText size={16} /> },
    { id: "settings", label: "Settings", icon: <Settings size={16} /> },
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="brand-header" onClick={() => onSelectScreen("landing")} style={{ cursor: "pointer" }}>
        <div className="gov-seal-mini">🏛️</div>
        <div className="brand-text">
          <h2>BHUMI-FUSE</h2>
          <p>Ministry of Panchayati Raj</p>
        </div>
      </div>

      <nav className="nav-section">
        <span className="nav-category">Investigation Pipeline</span>
        {mainNavItems.map((item) => (
          <button
            key={item.id}
            className={`nav-btn ${currentScreen === item.id ? "active" : ""}`}
            onClick={() => onSelectScreen(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer-link" onClick={() => onSelectScreen("landing")}>
        <ExternalLink size={14} />
        <span>Portal Landing Page</span>
      </div>

      <div className="sidebar-user">
        <div className="user-avatar" style={{ background: "#065f46", color: "#fff" }}>NR</div>
        <div className="user-info">
          <b>Nitin R.</b>
          <span>Land Records Officer</span>
        </div>
      </div>
    </aside>
  );
};

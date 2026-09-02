import React from "react";
import {
  Home,
  UploadCloud,
  Layers,
  Map,
  GitFork,
  ShieldCheck,
  ClipboardCheck,
  FileText,
  Settings,
  HelpCircle,
  BarChart3,
  Sparkles,
} from "lucide-react";

export type Screen =
  | "dashboard"
  | "upload"
  | "source"
  | "extract"
  | "graph"
  | "harmonize"
  | "discrepancy"
  | "evidence_card"
  | "review"
  | "audit"
  | "reports"
  | "settings";

interface SidebarProps {
  currentScreen: Screen;
  onSelectScreen: (screen: Screen) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentScreen, onSelectScreen }) => {
  const navItems: { id: Screen; label: string; icon: React.ReactNode; category?: string }[] = [
    { id: "dashboard", label: "Dashboard", icon: <Home size={17} /> },
    { id: "upload", label: "Upload & Ingest", icon: <UploadCloud size={17} /> },
    { id: "source", label: "Source Viewer", icon: <Layers size={17} /> },
    { id: "extract", label: "AI Extraction", icon: <Sparkles size={17} /> },
    { id: "graph", label: "Evidence Graph", icon: <GitFork size={17} /> },
    { id: "harmonize", label: "Harmonization", icon: <Map size={17} /> },
    { id: "discrepancy", label: "Discrepancy Map", icon: <ShieldCheck size={17} /> },
    { id: "evidence_card", label: "Evidence Cards", icon: <BarChart3 size={17} /> },
    { id: "review", label: "Reviews & Decision", icon: <ClipboardCheck size={17} /> },
    { id: "audit", label: "Audit Trail", icon: <FileText size={17} /> },
    { id: "settings", label: "Settings", icon: <Settings size={17} /> },
  ];

  return (
    <aside className="sidebar">
      <div className="brand-header">
        <div className="brand-logo-box">
          <span>◆</span>
        </div>
        <div className="brand-text">
          <h2>BHUMI-FUSE</h2>
          <p>AI Land Harmonizer</p>
        </div>
      </div>

      <nav className="nav-section">
        <span className="nav-category">Main Navigation</span>
        {navItems.map((item) => (
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

      <div className="sidebar-user">
        <div className="user-avatar">AO</div>
        <div className="user-info">
          <b>Admin Officer</b>
          <span>Land Records Dept</span>
        </div>
      </div>
    </aside>
  );
};

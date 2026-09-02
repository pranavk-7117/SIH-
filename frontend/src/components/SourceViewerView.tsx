import React, { useState } from "react";
import { DemoMap } from "./DemoMap";
import { Sliders, Eye, ArrowRight } from "lucide-react";
import { Screen } from "./Sidebar";

type AnyObj = Record<string, any>;

interface SourceViewerViewProps {
  data: AnyObj;
  onNavigate: (screen: Screen) => void;
}

export const SourceViewerView: React.FC<SourceViewerViewProps> = ({ data, onNavigate }) => {
  const [viewMode, setViewMode] = useState<"grid" | "unified">("grid");
  const [opacityCadastral, setOpacityCadastral] = useState(60);
  const [opacityDrone, setOpacityDrone] = useState(70);
  const [opacityMunicipal, setOpacityMunicipal] = useState(50);
  const [showGNSS, setShowGNSS] = useState(true);

  return (
    <div className="page-container">
      {/* Breadcrumb & Header Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="breadcrumb">
          <span>Investigation</span>
          <span>&gt;</span>
          <span>INV-2026-00124</span>
          <span>&gt;</span>
          <span className="active">Source Viewer</span>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className={viewMode === "grid" ? "btn-emerald" : "btn-outline"}
            style={{ padding: "6px 14px", fontSize: "12px" }}
            onClick={() => setViewMode("grid")}
          >
            4-Pane Source Comparison
          </button>
          <button
            className={viewMode === "unified" ? "btn-emerald" : "btn-outline"}
            style={{ padding: "6px 14px", fontSize: "12px" }}
            onClick={() => setViewMode("unified")}
          >
            Unified Layered Map
          </button>
        </div>
      </div>

      {/* Layer Opacity Bar */}
      <div className="bf-card" style={{ padding: "14px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px", fontWeight: 700, color: "#fff" }}>
            <Sliders size={16} style={{ color: "#10b981" }} />
            <span>Layer Visibility & Transparency Controls</span>
          </div>

          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", alignItems: "center" }}>
            <div className="source-slider-row" style={{ minWidth: "160px" }}>
              <span style={{ color: "#f59e0b", fontWeight: 700 }}>Cadastral (1960):</span>
              <input
                type="range"
                min="0"
                max="100"
                value={opacityCadastral}
                onChange={(e) => setOpacityCadastral(Number(e.target.value))}
              />
              <span style={{ fontSize: "11px", width: "28px" }}>{opacityCadastral}%</span>
            </div>

            <div className="source-slider-row" style={{ minWidth: "160px" }}>
              <span style={{ color: "#38bdf8", fontWeight: 700 }}>Drone (2024):</span>
              <input
                type="range"
                min="0"
                max="100"
                value={opacityDrone}
                onChange={(e) => setOpacityDrone(Number(e.target.value))}
              />
              <span style={{ fontSize: "11px", width: "28px" }}>{opacityDrone}%</span>
            </div>

            <div className="source-slider-row" style={{ minWidth: "160px" }}>
              <span style={{ color: "#94a3b8", fontWeight: 700 }}>Municipal (2023):</span>
              <input
                type="range"
                min="0"
                max="100"
                value={opacityMunicipal}
                onChange={(e) => setOpacityMunicipal(Number(e.target.value))}
              />
              <span style={{ fontSize: "11px", width: "28px" }}>{opacityMunicipal}%</span>
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11.5px", color: "#8b5cf6", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={showGNSS}
                onChange={(e) => setShowGNSS(e.target.checked)}
                style={{ accentColor: "#8b5cf6" }}
              />
              <span style={{ fontWeight: 700 }}>GNSS Survey Points</span>
            </label>
          </div>
        </div>
      </div>

      {/* View Mode: Grid (4 Panes) or Unified Single Map */}
      {viewMode === "grid" ? (
        <div className="source-viewer-grid">
          {/* Tile 1: Cadastral Map */}
          <div className="source-tile-card">
            <div className="source-tile-header">
              <h3>Cadastral Map (1960)</h3>
              <span className="badge-pill warn" style={{ fontSize: "9px" }}>Authoritative</span>
            </div>
            <DemoMap
              data={data}
              mode="source"
              compact={true}
              showCadastral={true}
              showDrone={false}
              showMunicipal={false}
              showGNSS={false}
              opacityCadastral={opacityCadastral / 100}
            />
            <div className="source-slider-row">
              <span>Transparency:</span>
              <input
                type="range"
                value={opacityCadastral}
                onChange={(e) => setOpacityCadastral(Number(e.target.value))}
              />
              <span>{opacityCadastral}%</span>
            </div>
          </div>

          {/* Tile 2: Drone Orthomosaic */}
          <div className="source-tile-card">
            <div className="source-tile-header">
              <h3>Drone Imagery (2024)</h3>
              <span className="badge-pill info" style={{ fontSize: "9px" }}>Physical Reality</span>
            </div>
            <DemoMap
              data={data}
              mode="source"
              compact={true}
              showCadastral={false}
              showDrone={true}
              showMunicipal={false}
              showGNSS={false}
              opacityDrone={opacityDrone / 100}
            />
            <div className="source-slider-row">
              <span>Transparency:</span>
              <input
                type="range"
                value={opacityDrone}
                onChange={(e) => setOpacityDrone(Number(e.target.value))}
              />
              <span>{opacityDrone}%</span>
            </div>
          </div>

          {/* Tile 3: Municipal GIS */}
          <div className="source-tile-card">
            <div className="source-tile-header">
              <h3>Municipal GIS (2023)</h3>
              <span className="badge-pill low" style={{ fontSize: "9px" }}>Contextual</span>
            </div>
            <DemoMap
              data={data}
              mode="source"
              compact={true}
              showCadastral={false}
              showDrone={false}
              showMunicipal={true}
              showGNSS={false}
              opacityMunicipal={opacityMunicipal / 100}
            />
            <div className="source-slider-row">
              <span>Transparency:</span>
              <input
                type="range"
                value={opacityMunicipal}
                onChange={(e) => setOpacityMunicipal(Number(e.target.value))}
              />
              <span>{opacityMunicipal}%</span>
            </div>
          </div>

          {/* Tile 4: GNSS Survey Points */}
          <div className="source-tile-card">
            <div className="source-tile-header">
              <h3>GNSS Survey Points (2024)</h3>
              <span className="badge-pill info" style={{ fontSize: "9px" }}>High Accuracy</span>
            </div>
            <DemoMap
              data={data}
              mode="source"
              compact={true}
              showCadastral={false}
              showDrone={false}
              showMunicipal={false}
              showGNSS={true}
            />
            <div className="source-slider-row">
              <span>Transparency:</span>
              <input type="range" defaultValue={50} />
              <span>50%</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bf-card">
          <DemoMap
            data={data}
            mode="source"
            compact={false}
            showCadastral={true}
            showDrone={true}
            showMunicipal={true}
            showGNSS={showGNSS}
            opacityCadastral={opacityCadastral / 100}
            opacityDrone={opacityDrone / 100}
            opacityMunicipal={opacityMunicipal / 100}
          />
        </div>
      )}

      {/* Bottom Action */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button className="btn-emerald" onClick={() => onNavigate("extract")}>
          <span>Proceed to AI Boundary Extraction</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

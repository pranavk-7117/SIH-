import React, { useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { GitFork, Filter, Search, ArrowRight, ShieldCheck } from "lucide-react";
import { Screen } from "./Sidebar";

type AnyObj = Record<string, any>;

interface EvidenceGraphViewProps {
  graph?: AnyObj;
  data?: AnyObj;
  graphData?: AnyObj | null;
  selectedParcelId?: string;
  onSelectParcel?: (id: string) => void;
  onNavigate?: (screen: Screen) => void;
  onContinue?: () => void;
}

const nodeColorMap: Record<string, string> = {
  authoritative_cadastral_simulated: "#f59e0b",
  derived_building_footprint_real: "#38bdf8",
  synthetic_control: "#8b5cf6",
  contextual_municipal_real: "#94a3b8",
};

export const EvidenceGraphView: React.FC<EvidenceGraphViewProps> = ({
  graph: graphProp,
  data,
  graphData,
  selectedParcelId,
  onSelectParcel,
  onNavigate,
  onContinue,
}) => {
  const graph = graphData || data?.graph || graphProp || { nodes: [], links: [] };
  const [selectedNode, setSelectedNode] = useState<AnyObj>(() => {
    return (
      graph.nodes.find((n: AnyObj) => n.id === selectedParcelId) ||
      graph.nodes[0] || {
        id: "parcel-101",
        label: "Parcel 101",
        type_label: "Cadastral Parcel",
        source: "Cadastral Map (1960)",
        area: "1250.45 m²",
        source_type: "authoritative_cadastral_simulated",
      }
    );
  });

  const [searchTerm, setSearchTerm] = useState("");

  const handleNodeClick = (node: AnyObj) => {
    setSelectedNode(node);
    if (node.id.startsWith("parcel-")) {
      onSelectParcel?.(node.id);
    }
  };

  const filteredGraph = {
    nodes: graph.nodes.filter((n: AnyObj) =>
      searchTerm ? n.label.toLowerCase().includes(searchTerm.toLowerCase()) : true
    ),
    links: graph.links,
  };

  return (
    <div className="page-container">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span>Investigation</span>
        <span>&gt;</span>
        <span>INV-2026-00124</span>
        <span>&gt;</span>
        <span className="active">Spatial Evidence Graph</span>
      </div>

      <div className="graph-viewport-shell">
        {/* Left Legend & Node Types */}
        <div className="graph-sidebar-left">
          <div className="bf-card-title">
            <GitFork size={16} style={{ color: "#10b981" }} />
            <span>Node Types</span>
          </div>

          <div className="graph-type-list">
            <div className="graph-type-row">
              <span>
                <i className="timeline-dot" style={{ background: "#f59e0b" }} />
                <span>Cadastral Parcel</span>
              </span>
              <b>128</b>
            </div>
            <div className="graph-type-row">
              <span>
                <i className="timeline-dot" style={{ background: "#38bdf8" }} />
                <span>AI Boundary</span>
              </span>
              <b>128</b>
            </div>
            <div className="graph-type-row">
              <span>
                <i className="timeline-dot" style={{ background: "#8b5cf6" }} />
                <span>GNSS Point</span>
              </span>
              <b>264</b>
            </div>
            <div className="graph-type-row">
              <span>
                <i className="timeline-dot" style={{ background: "#94a3b8" }} />
                <span>Municipal Feature</span>
              </span>
              <b>96</b>
            </div>
          </div>

          <hr style={{ borderColor: "var(--border-color)", margin: "8px 0" }} />

          <div className="bf-card-title">
            <span>Edge Types</span>
          </div>

          <div className="graph-type-list">
            <div className="graph-type-row">
              <span>• Matches</span>
              <b>342</b>
            </div>
            <div className="graph-type-row">
              <span>• Supports</span>
              <b>512</b>
            </div>
            <div className="graph-type-row">
              <span>• Adjacent To</span>
              <b>784</b>
            </div>
            <div className="graph-type-row">
              <span>• Intersects</span>
              <b>256</b>
            </div>
          </div>
        </div>

        {/* Center Force Graph Canvas */}
        <div className="graph-canvas-area">
          <div style={{ position: "absolute", top: 12, left: 12, zIndex: 10, display: "flex", gap: "8px" }}>
            <div style={{ position: "relative", width: "200px" }}>
              <Search size={14} style={{ position: "absolute", left: 8, top: 9, color: "#64748b" }} />
              <input
                type="text"
                placeholder="Search node..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  background: "rgba(14, 26, 43, 0.9)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "6px",
                  padding: "6px 8px 6px 28px",
                  fontSize: "11px",
                  color: "#fff",
                }}
              />
            </div>
          </div>

          <ForceGraph2D
            graphData={filteredGraph as any}
            nodeLabel="label"
            nodeRelSize={6}
            linkColor={(l: AnyObj) => (l.confidence > 0.7 ? "#10b981" : "#f59e0b")}
            linkWidth={(l: AnyObj) => 1.5 + (l.confidence || 0.5) * 3}
            linkDirectionalParticles={2}
            linkDirectionalParticleSpeed={0.005}
            onNodeClick={handleNodeClick}
            nodeCanvasObject={(n: AnyObj, ctx, scale) => {
              const active = selectedNode?.id === n.id;
              const color = nodeColorMap[n.source_type] || "#38bdf8";

              ctx.fillStyle = color;
              ctx.beginPath();
              ctx.arc(n.x!, n.y!, active ? 10 : 6, 0, 2 * Math.PI);
              ctx.fill();

              ctx.strokeStyle = active ? "#ffffff" : "rgba(255,255,255,0.6)";
              ctx.lineWidth = active ? 3 : 1.5;
              ctx.stroke();

              ctx.fillStyle = "#f1f5f9";
              ctx.font = `${10 / scale}px sans-serif`;
              ctx.fillText(n.label || n.id, n.x! + 9, n.y! + 3);
            }}
          />
        </div>

        {/* Right Node Inspector */}
        <div className="graph-sidebar-right">
          <div className="bf-card-title">
            <span>Selected Node</span>
          </div>

          <div className="node-inspector-box">
            <h4>{selectedNode.label || selectedNode.id}</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "11.5px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#94a3b8" }}>Type:</span>
                <b style={{ color: "#fff" }}>{selectedNode.type_label || "Cadastral Parcel"}</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#94a3b8" }}>Source:</span>
                <span style={{ color: "#38bdf8" }}>{selectedNode.source || "Cadastral Map (1960)"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#94a3b8" }}>Area:</span>
                <b style={{ color: "#fff" }}>{selectedNode.area || "1250.45 m²"}</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#94a3b8" }}>Confidence:</span>
                <b style={{ color: "#10b981" }}>{selectedNode.confidence ? `${Math.round(selectedNode.confidence * 100)}%` : "Authoritative"}</b>
              </div>
            </div>
          </div>

          <div className="bf-card-title" style={{ fontSize: "12px", marginTop: "4px" }}>
            <span>Connected Evidence</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "11px" }}>
            <div style={{ padding: "6px 8px", background: "rgba(11, 19, 32, 0.6)", borderRadius: "5px", display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#38bdf8" }}>AI Boundary 101</span>
              <span style={{ color: "#10b981", fontWeight: 700 }}>0.91 Match</span>
            </div>
            <div style={{ padding: "6px 8px", background: "rgba(11, 19, 32, 0.6)", borderRadius: "5px", display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#8b5cf6" }}>GNSS Point P-101</span>
              <span style={{ color: "#10b981", fontWeight: 700 }}>1.00 Support</span>
            </div>
            <div style={{ padding: "6px 8px", background: "rgba(11, 19, 32, 0.6)", borderRadius: "5px", display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#f59e0b" }}>Parcel 102</span>
              <span style={{ color: "#94a3b8" }}>Adjacent</span>
            </div>
            <div style={{ padding: "6px 8px", background: "rgba(11, 19, 32, 0.6)", borderRadius: "5px", display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#94a3b8" }}>Municipal Road 01</span>
              <span style={{ color: "#38bdf8" }}>0.85 Intersect</span>
            </div>
          </div>

          <div style={{ marginTop: "auto" }}>
            <button
              className="btn-emerald"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={() => (onContinue ? onContinue() : onNavigate?.("harmonize"))}
            >
              <span>Harmonize Sources</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

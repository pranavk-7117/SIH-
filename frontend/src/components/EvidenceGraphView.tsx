import React, { useState, useMemo } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { GitFork, Search, ArrowRight, ShieldCheck, Eye, EyeOff } from "lucide-react";
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
  cadastral: "#f59e0b",
  derived_building_footprint_real: "#38bdf8",
  drone: "#38bdf8",
  building: "#38bdf8",
  synthetic_control: "#a855f7",
  control: "#a855f7",
  gnss: "#a855f7",
  contextual_municipal_real: "#10b981",
  municipal: "#10b981",
  road: "#10b981",
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

  const [hoveredNode, setHoveredNode] = useState<AnyObj | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAllLabels, setShowAllLabels] = useState(false);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("all");

  // Dynamic Node Counts
  const counts = useMemo(() => {
    const nodes = graph.nodes || [];
    const links = graph.links || [];

    const cadastral = nodes.filter((n: AnyObj) => n.type_label === "Cadastral Parcel" || n.source_type?.includes("cadastral")).length;
    const drone = nodes.filter((n: AnyObj) => n.type_label === "AI Boundary" || n.source_type?.includes("drone") || n.source_type?.includes("building")).length;
    const gnss = nodes.filter((n: AnyObj) => n.type_label === "GNSS Point" || n.source_type?.includes("control") || n.source_type?.includes("gnss")).length;
    const municipal = nodes.filter((n: AnyObj) => n.type_label === "Municipal Feature" || n.source_type?.includes("municipal")).length;

    const matches = links.filter((l: AnyObj) => l.relation === "matches" || l.type === "matches").length;
    const supports = links.filter((l: AnyObj) => l.relation === "supports" || l.type === "supports").length;
    const adjacent = links.filter((l: AnyObj) => l.relation === "adjacent_to" || l.type === "adjacent_to").length;
    const intersects = links.filter((l: AnyObj) => l.relation === "intersects" || l.type === "intersects").length;

    return {
      cadastral,
      drone,
      gnss,
      municipal,
      matches: matches || Math.round(links.length * 0.45),
      supports: supports || Math.round(links.length * 0.25),
      adjacent: adjacent || Math.round(links.length * 0.2),
      intersects: intersects || Math.round(links.length * 0.1),
    };
  }, [graph]);

  const handleNodeClick = (node: AnyObj) => {
    setSelectedNode(node);
    if (node.id.startsWith("parcel-")) {
      onSelectParcel?.(node.id);
    }
  };

  const filteredGraph = useMemo(() => {
    let nodes = graph.nodes || [];
    if (selectedTypeFilter !== "all") {
      nodes = nodes.filter((n: AnyObj) => {
        if (selectedTypeFilter === "cadastral") return n.source_type?.includes("cadastral") || n.type_label?.includes("Cadastral");
        if (selectedTypeFilter === "drone") return n.source_type?.includes("drone") || n.source_type?.includes("building") || n.type_label?.includes("AI");
        if (selectedTypeFilter === "gnss") return n.source_type?.includes("gnss") || n.source_type?.includes("control") || n.type_label?.includes("GNSS");
        if (selectedTypeFilter === "municipal") return n.source_type?.includes("municipal") || n.type_label?.includes("Municipal");
        return true;
      });
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      nodes = nodes.filter((n: AnyObj) =>
        (n.label || "").toLowerCase().includes(q) || (n.id || "").toLowerCase().includes(q)
      );
    }

    const nodeIds = new Set(nodes.map((n: AnyObj) => n.id));
    const links = (graph.links || []).filter((l: AnyObj) => {
      const s = typeof l.source === "object" ? l.source.id : l.source;
      const t = typeof l.target === "object" ? l.target.id : l.target;
      return nodeIds.has(s) && nodeIds.has(t);
    });

    return { nodes, links };
  }, [graph, selectedTypeFilter, searchTerm]);

  // Dynamic connected evidence for selected node
  const connectedEvidence = useMemo(() => {
    if (!selectedNode || !graph.links) return [];
    const sid = selectedNode.id;
    const matched = [];

    for (const l of graph.links) {
      const s = typeof l.source === "object" ? l.source.id : l.source;
      const t = typeof l.target === "object" ? l.target.id : l.target;
      if (s === sid) {
        const targetNode = graph.nodes.find((n: AnyObj) => n.id === t);
        if (targetNode) {
          matched.push({
            id: targetNode.id,
            label: targetNode.label || targetNode.id,
            color: nodeColorMap[targetNode.source_type] || "#38bdf8",
            relation: l.relation || "supports",
            confidence: l.confidence ? `${Math.round(l.confidence * 100)}%` : "0.92",
          });
        }
      } else if (t === sid) {
        const sourceNode = graph.nodes.find((n: AnyObj) => n.id === s);
        if (sourceNode) {
          matched.push({
            id: sourceNode.id,
            label: sourceNode.label || sourceNode.id,
            color: nodeColorMap[sourceNode.source_type] || "#38bdf8",
            relation: l.relation || "adjacent_to",
            confidence: l.confidence ? `${Math.round(l.confidence * 100)}%` : "0.85",
          });
        }
      }
    }
    return matched.slice(0, 5);
  }, [selectedNode, graph]);

  return (
    <div className="page-container">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span>Investigation</span>
        <span>&gt;</span>
        <span>{data?.name || "Kharadi Sector 12"}</span>
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
            <button
              className={`graph-type-row ${selectedTypeFilter === "cadastral" ? "active" : ""}`}
              onClick={() => setSelectedTypeFilter(selectedTypeFilter === "cadastral" ? "all" : "cadastral")}
              style={{ background: "none", border: "none", width: "100%", textAlign: "left", cursor: "pointer" }}
            >
              <span>
                <i className="timeline-dot" style={{ background: "#f59e0b" }} />
                <span>Cadastral Parcel</span>
              </span>
              <b>{counts.cadastral}</b>
            </button>

            <button
              className={`graph-type-row ${selectedTypeFilter === "drone" ? "active" : ""}`}
              onClick={() => setSelectedTypeFilter(selectedTypeFilter === "drone" ? "all" : "drone")}
              style={{ background: "none", border: "none", width: "100%", textAlign: "left", cursor: "pointer" }}
            >
              <span>
                <i className="timeline-dot" style={{ background: "#38bdf8" }} />
                <span>AI Boundary</span>
              </span>
              <b>{counts.drone}</b>
            </button>

            <button
              className={`graph-type-row ${selectedTypeFilter === "gnss" ? "active" : ""}`}
              onClick={() => setSelectedTypeFilter(selectedTypeFilter === "gnss" ? "all" : "gnss")}
              style={{ background: "none", border: "none", width: "100%", textAlign: "left", cursor: "pointer" }}
            >
              <span>
                <i className="timeline-dot" style={{ background: "#a855f7" }} />
                <span>GNSS Point</span>
              </span>
              <b>{counts.gnss}</b>
            </button>

            <button
              className={`graph-type-row ${selectedTypeFilter === "municipal" ? "active" : ""}`}
              onClick={() => setSelectedTypeFilter(selectedTypeFilter === "municipal" ? "all" : "municipal")}
              style={{ background: "none", border: "none", width: "100%", textAlign: "left", cursor: "pointer" }}
            >
              <span>
                <i className="timeline-dot" style={{ background: "#10b981" }} />
                <span>Municipal Feature</span>
              </span>
              <b>{counts.municipal}</b>
            </button>
          </div>

          <hr style={{ borderColor: "var(--border-color)", margin: "8px 0" }} />

          <div className="bf-card-title">
            <span>Edge Types</span>
          </div>

          <div className="graph-type-list">
            <div className="graph-type-row">
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "10px", height: "3px", background: "#10b981", display: "inline-block" }} />
                <span>Matches (AI ↔ Cadastral)</span>
              </span>
              <b>{counts.matches}</b>
            </div>
            <div className="graph-type-row">
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "10px", height: "3px", background: "#a855f7", display: "inline-block" }} />
                <span>Supports (GNSS ↔ Boundary)</span>
              </span>
              <b>{counts.supports}</b>
            </div>
            <div className="graph-type-row">
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "10px", height: "3px", background: "#f59e0b", display: "inline-block" }} />
                <span>Adjacent To (Topology)</span>
              </span>
              <b>{counts.adjacent}</b>
            </div>
            <div className="graph-type-row">
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "10px", height: "3px", background: "#0284c7", display: "inline-block" }} />
                <span>Intersects (Roads)</span>
              </span>
              <b>{counts.intersects}</b>
            </div>
          </div>
        </div>

        {/* Center Force Graph Canvas */}
        <div className="graph-canvas-area" style={{ position: "relative" }}>
          {/* Top Controls: Search + Label Toggle */}
          <div style={{ position: "absolute", top: 12, left: 12, zIndex: 10, display: "flex", gap: "10px", alignItems: "center" }}>
            <div style={{ position: "relative", width: "220px" }}>
              <Search size={14} style={{ position: "absolute", left: 9, top: 9, color: "#64748b" }} />
              <input
                type="text"
                placeholder="Filter parcel or node..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  background: "rgba(15, 23, 42, 0.92)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "6px",
                  padding: "6px 8px 6px 28px",
                  fontSize: "11px",
                  color: "#fff",
                }}
              />
            </div>

            <button
              className="btn-outline"
              onClick={() => setShowAllLabels(!showAllLabels)}
              style={{
                padding: "6px 10px",
                fontSize: "11px",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                background: showAllLabels ? "rgba(16, 185, 129, 0.15)" : "rgba(15, 23, 42, 0.9)",
                borderColor: showAllLabels ? "#10b981" : "var(--border-color)",
                color: showAllLabels ? "#10b981" : "#e2e8f0",
              }}
            >
              {showAllLabels ? <Eye size={13} /> : <EyeOff size={13} />}
              <span>{showAllLabels ? "Labels: Visible" : "Labels: On Hover"}</span>
            </button>
          </div>

          <ForceGraph2D
            graphData={filteredGraph as any}
            nodeLabel=""
            nodeRelSize={6}
            linkColor={(l: AnyObj) => (l.relation === "supports" ? "#a855f7" : l.confidence > 0.7 ? "#10b981" : "#f59e0b")}
            linkWidth={(l: AnyObj) => 1.5 + (l.confidence || 0.5) * 2}
            linkDirectionalParticles={1}
            linkDirectionalParticleSpeed={0.004}
            onNodeClick={handleNodeClick}
            onNodeHover={(node: AnyObj | null) => setHoveredNode(node)}
            nodeCanvasObject={(n: AnyObj, ctx, scale) => {
              const active = selectedNode?.id === n.id;
              const isHovered = hoveredNode?.id === n.id;
              const color = nodeColorMap[n.source_type] || "#38bdf8";

              // 1. Halo Glow
              if (active || isHovered) {
                ctx.beginPath();
                ctx.arc(n.x!, n.y!, active ? 16 : 13, 0, 2 * Math.PI);
                ctx.fillStyle = active ? "rgba(16, 185, 129, 0.3)" : "rgba(56, 189, 248, 0.3)";
                ctx.fill();
              }

              // 2. Node Core
              ctx.beginPath();
              ctx.arc(n.x!, n.y!, active ? 9 : isHovered ? 8 : 6, 0, 2 * Math.PI);
              ctx.fillStyle = color;
              ctx.fill();

              ctx.strokeStyle = active ? "#ffffff" : "rgba(255, 255, 255, 0.8)";
              ctx.lineWidth = active ? 2.5 : 1.5;
              ctx.stroke();

              // 3. Clean, Non-Overlapping Label Pill
              const shouldShowLabel = showAllLabels || active || isHovered;
              if (shouldShowLabel && scale > 0.6) {
                const label = n.label || n.id;
                const fontSize = Math.max(9, Math.min(13, 11 / scale));
                ctx.font = `600 ${fontSize}px Inter, sans-serif`;
                const textWidth = ctx.measureText(label).width;

                const bX = n.x! + (active ? 12 : 9);
                const bY = n.y! - fontSize / 2 - 2;

                // Pill Background
                ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
                ctx.beginPath();
                if ((ctx as any).roundRect) {
                  (ctx as any).roundRect(bX - 4, bY, textWidth + 8, fontSize + 4, 4);
                } else {
                  ctx.rect(bX - 4, bY, textWidth + 8, fontSize + 4);
                }
                ctx.fill();
                ctx.strokeStyle = active ? "#10b981" : color;
                ctx.lineWidth = 1;
                ctx.stroke();

                // Text
                ctx.fillStyle = "#ffffff";
                ctx.fillText(label, bX, bY + fontSize - 2);
              }
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
                <span style={{ color: "#94a3b8" }}>Trust Score:</span>
                <b style={{ color: "#10b981" }}>{selectedNode.confidence ? `${Math.round(selectedNode.confidence * 100)}%` : "0.95 (Authoritative)"}</b>
              </div>
            </div>
          </div>

          <div className="bf-card-title" style={{ fontSize: "12px", marginTop: "4px" }}>
            <span>Connected Evidence ({connectedEvidence.length})</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "11px" }}>
            {connectedEvidence.length > 0 ? (
              connectedEvidence.map((ev: AnyObj) => (
                <div
                  key={ev.id}
                  style={{
                    padding: "6px 8px",
                    background: "rgba(11, 19, 32, 0.6)",
                    borderRadius: "5px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ color: ev.color, fontWeight: 600 }}>{ev.label}</span>
                  <span style={{ color: "#10b981", fontWeight: 700 }}>{ev.relation}</span>
                </div>
              ))
            ) : (
              <div style={{ color: "#64748b", fontSize: "11px", padding: "8px" }}>
                Select a parcel to view cross-source evidence links.
              </div>
            )}
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

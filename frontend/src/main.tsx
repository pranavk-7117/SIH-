import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import ForceGraph2D from "react-force-graph-2d";
import * as maplibregl from "maplibre-gl";
import { Bell, Check, ChevronDown, ClipboardCheck, Database, Download, FileText, GitFork, Home, Layers, Map, Radar, Search, Settings, ShieldCheck, UploadCloud } from "lucide-react";
import "maplibre-gl/dist/maplibre-gl.css";
import "./styles.css";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
type AnyObj = Record<string, any>;
type Screen = "overview" | "upload" | "source" | "extract" | "graph" | "harmonized" | "conflicts" | "review" | "audit";

const sourceColors: AnyObj = {
  authoritative_cadastral_simulated: "#f59e0b",
  derived_building_footprint_real: "#38bdf8",
  contextual_municipal_real: "#94a3b8",
  synthetic_control: "#8b5cf6",
  derived_imagery_real: "#22c55e",
  harmonized_version: "#22c55e"
};

function useDemo() {
  const [data, setData] = useState<AnyObj | null>(null);
  const [graph, setGraph] = useState<AnyObj>({ nodes: [], links: [] });
  const [harm, setHarm] = useState<AnyObj>({});
  const [temporal, setTemporal] = useState<AnyObj[]>([]);
  const [fused, setFused] = useState<AnyObj[]>([]);
  const [cases, setCases] = useState<AnyObj[]>([]);
  const [extract, setExtract] = useState<AnyObj>({});
  useEffect(() => {
    Promise.all([
      fetch(`${API}/demo-data`).then(r => r.json()),
      fetch(`${API}/graph`).then(r => r.json()),
      fetch(`${API}/harmonize`, { method: "POST" }).then(r => r.json()),
      fetch(`${API}/temporal-conflict`, { method: "POST" }).then(r => r.json()),
      fetch(`${API}/fuse`, { method: "POST" }).then(r => r.json()),
      fetch(`${API}/discrepancy-map`).then(r => r.json()),
      fetch(`${API}/extract`, { method: "POST" }).then(r => r.json())
    ]).then(([d, g, h, t, f, c, e]) => {
      setData(d); setGraph(g); setHarm(h); setTemporal(t.results); setFused(f.results); setCases(c.cases); setExtract(e);
    });
  }, []);
  return { data, graph, harm, temporal, fused, cases, extract };
}

function Badge({ tone = "real", children }: { tone?: "real" | "sim" | "warn" | "danger"; children: React.ReactNode }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

function Sidebar({ screen, setScreen }: { screen: Screen; setScreen: (s: Screen) => void }) {
  const items: [Screen, React.ReactNode, string][] = [
    ["overview", <Home />, "Dashboard"], ["upload", <UploadCloud />, "Upload & Ingest"], ["source", <Map />, "Source Viewer"],
    ["extract", <Radar />, "AI Extraction"], ["graph", <GitFork />, "Evidence Graph"], ["harmonized", <Layers />, "Harmonization"],
    ["conflicts", <ShieldCheck />, "Discrepancy Map"], ["review", <ClipboardCheck />, "Reviews"], ["audit", <FileText />, "Audit Trail"],
    ["overview", <Settings />, "Settings"]
  ];
  return <aside className="side"><div className="brand"><span className="logoDot">◆</span><div>BHUMI-FUSE<small>Evidence-Driven Land<br />Record Harmonization</small></div></div><nav>{items.map(([id, icon, label], i) => <button key={`${id}-${i}`} className={screen === id ? "active" : ""} onClick={() => setScreen(id)}>{icon}<span>{label}</span></button>)}</nav><div className="officer"><div>AO</div><span>Admin Officer<small>Land Records Department</small></span></div></aside>;
}

function Topbar({ screen }: { screen: Screen }) {
  const label = screen === "overview" ? "Dashboard" : screen === "upload" ? "Upload & Ingest" : screen === "conflicts" ? "Discrepancy Map" : screen[0].toUpperCase() + screen.slice(1);
  return <header className="topbar"><div><b>{label}</b><span>Project: Pune Pilot Area</span></div><div className="topActions"><button>Pune District <ChevronDown size={14} /></button><Search size={18} /><Bell size={18} /><span className="avatar">AO</span></div></header>;
}

function ringPath(ring: number[][], bounds: number[], width = 1000, height = 600) {
  const [minX, minY, maxX, maxY] = bounds;
  return ring.map(([x, y]) => `${(((x - minX) / (maxX - minX)) * width).toFixed(1)},${(height - ((y - minY) / (maxY - minY)) * height).toFixed(1)}`).join(" ");
}

function pointXY(point: number[], bounds: number[], width = 1000, height = 600) {
  const [minX, minY, maxX, maxY] = bounds;
  return [((point[0] - minX) / (maxX - minX)) * width, height - ((point[1] - minY) / (maxY - minY)) * height];
}

function DemoMap({ data, harm, selected, mode, compact = false }: { data: AnyObj; harm?: AnyObj; selected?: string; mode: "source" | "extract" | "harmonized" | "conflicts"; compact?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);
  const residualLines = { type: "FeatureCollection", features: (harm?.residuals ?? []).map((r: AnyObj) => ({ type: "Feature", properties: r, geometry: { type: "LineString", coordinates: [r.from, r.to] } })) };
  useEffect(() => {
    if (!ref.current || mapRef.current || !data) return;
    const map = new maplibregl.Map({
      container: ref.current,
      style: {
        version: 8,
        sources: {
          imagery: {
            type: "raster",
            tiles: [
              "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            ],
            tileSize: 256,
            attribution: "Esri World Imagery"
          }
        },
        layers: [
          { id: "bg", type: "background", paint: { "background-color": "#9ca987" } },
          { id: "imagery", type: "raster", source: "imagery", paint: { "raster-opacity": 0.96, "raster-saturation": -0.18, "raster-contrast": 0.12 } }
        ]
      } as any,
      center: [73.77418, 18.56062],
      zoom: 16.2,
      attributionControl: false
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.once("load", () => setLoaded(true));
    mapRef.current = map;
  }, [data]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !data || !loaded) return;
    const add = (id: string, geo: AnyObj, type: "line" | "fill" | "circle", color: string, opacity = 0.75) => {
      if (map.getLayer(`${id}-line`)) map.removeLayer(`${id}-line`);
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
      map.addSource(id, { type: "geojson", data: geo });
      if (type === "fill") {
        map.addLayer({ id, type: "fill", source: id, paint: { "fill-color": color, "fill-opacity": opacity } });
        map.addLayer({ id: `${id}-line`, type: "line", source: id, paint: { "line-color": color, "line-width": 2.5 } });
      } else if (type === "line") {
        map.addLayer({ id, type: "line", source: id, paint: { "line-color": color, "line-width": id.includes("residual") ? 4 : 3, "line-opacity": opacity } });
      } else {
        map.addLayer({ id, type: "circle", source: id, paint: { "circle-radius": 6, "circle-color": color, "circle-stroke-width": 2, "circle-stroke-color": "#fff" } });
      }
    };
    add("municipal", data.municipal, "line", "#64748b", 0.55);
    add("buildings", data.buildings, "fill", "#0891b2", 0.38);
    add("cadastral", data.cadastral, "fill", "#f59e0b", mode === "source" ? 0.22 : 0.12);
    add("control", data.control, "circle", "#7c3aed");
    if (mode === "extract") add("extract", harm?.aligned ?? data.buildings, "line", "#22c55e", 0.9);
    if (mode === "harmonized") {
      add("aligned", harm?.aligned ?? data.cadastral, "fill", "#22c55e", 0.2);
      add("residuals", residualLines, "line", "#ef4444", 0.85);
    }
    if (mode === "conflicts") add("conflict-heat", data.cadastral, "fill", selected ? "#ef4444" : "#f59e0b", 0.32);
  }, [data, harm, mode, selected, loaded]);
  return <div className={`mapCard ${compact ? "compactMap" : ""}`}><div className="map" ref={ref} /><EvidenceOverlay data={data} harm={harm} residualLines={residualLines} mode={mode} selected={selected} /></div>;
}

function EvidenceOverlay({ data, harm, residualLines, mode, selected }: { data: AnyObj; harm?: AnyObj; residualLines: AnyObj; mode: string; selected?: string }) {
  const bounds = data.bounds;
  const heat = mode === "conflicts";
  return <svg className="mapOverlay" viewBox="0 0 1000 600" aria-label="Projected evidence overlay"><defs><pattern id="sat" width="34" height="34" patternUnits="userSpaceOnUse"><rect width="34" height="34" fill="#8b9774" /><path d="M0 12H34M12 0V34" stroke="#66785d" strokeWidth="2" opacity=".28" /><circle cx="9" cy="25" r="7" fill="#acb696" opacity=".35" /></pattern><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#ef4444" /></marker></defs><rect width="1000" height="600" fill="url(#sat)" opacity=".12" />{data.municipal.features.map((f: AnyObj) => <polyline key={f.id} points={ringPath(f.geometry.coordinates, bounds)} className="roadLine" />)}{data.buildings.features.map((f: AnyObj, i: number) => <polygon key={f.id} points={ringPath(f.geometry.coordinates[0], bounds)} className={heat ? `heatPoly h${i % 3}` : "buildingPoly"} />)}{data.cadastral.features.map((f: AnyObj, i: number) => <polygon key={f.id} points={ringPath(f.geometry.coordinates[0], bounds)} className={heat ? `parcelHeat p${i}` : "parcelPoly"} />)}{mode === "extract" && (harm?.aligned?.features ?? []).map((f: AnyObj) => <polyline key={f.id} points={ringPath(f.geometry.coordinates, bounds)} className="extractLine" />)}{mode === "harmonized" && (harm?.aligned?.features ?? []).map((f: AnyObj) => <polygon key={f.id} points={ringPath(f.geometry.coordinates[0], bounds)} className="alignedPoly" />)}{mode === "harmonized" && residualLines.features.map((f: AnyObj) => { const [x1, y1] = pointXY(f.geometry.coordinates[0], bounds); const [x2, y2] = pointXY(f.geometry.coordinates[1], bounds); return <line key={f.properties.case_id} x1={x1} y1={y1} x2={x2} y2={y2} className="residualArrow" markerEnd="url(#arrow)" />; })}{data.control.features.map((f: AnyObj) => { const [cx, cy] = pointXY(f.geometry.coordinates, bounds); return <circle key={f.id} cx={cx} cy={cy} r="7" className="controlPoint" />; })}{selected && <g className="mapTooltip"><rect x="690" y="250" width="180" height="96" rx="8" /><text x="706" y="278">Parcel 101</text><text x="706" y="304">Conflict: High</text><text x="706" y="330">Action: Review</text></g>}</svg>;
}

function Kpi({ icon, label, value, note, warn }: { icon: React.ReactNode; label: string; value: string; note: string; warn?: boolean }) {
  return <div className="kpi"><span className={warn ? "iconWarn" : "iconGreen"}>{icon}</span><div><small>{label}</small><b>{value}</b><p>{note}</p></div></div>;
}

function LegendRows() {
  return <div className="legendRows"><span><i className="green" />Completed</span><span><i className="amber" />In Review</span><span><i className="red" />On Hold</span></div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="metric"><span>{label}</span><b>{value}</b></div>;
}

function UploadScreen() {
  const cards = [["Cadastral Map", "cadastral_kharadi_1960.shp", "Required", "#eff6ff"], ["Drone Imagery / Orthomosaic", "drone_kharadi_2024.tif", "Required", "#ecfdf5"], ["GNSS Survey Points", "gnss_points.csv", "Required", "#fef2f2"], ["Municipal GIS Data", "municipal_gis.gpkg", "Optional", "#f8fafc"]];
  return <section className="page"><div className="crumb">Upload & Ingest › New Investigation</div><h1>Upload New Investigation</h1><p className="sub">Upload all relevant sources for a new investigation</p><div className="steps"><b>1 Upload Sources</b><span /><b>2 Source Details</b><span /><b>3 Review & Confirm</b></div><div className="uploadGrid">{cards.map(([title, file, req, bg]) => <div className="uploadCard" key={title} style={{ background: bg }}><Database /><h3>{title}</h3><small>{req}</small><p>{file}</p><Check className="okIcon" /></div>)}</div><button className="greenBtn">Next: Source Details</button></section>;
}

function Overview({ fused, cases, data, harm }: { fused: AnyObj[]; cases: AnyObj[]; data: AnyObj; harm: AnyObj }) {
  const review = fused.filter(x => x.state?.includes("Do Not Decide")).length;
  return <section className="page"><h1>Dashboard</h1><p className="sub">Overview of investigations and system summary</p><div className="kpis"><Kpi icon={<FileText />} label="Total Investigations" value="24" note="Active cases" /><Kpi icon={<Database />} label="Parcels Processed" value="12,845" note="Across all sources" /><Kpi icon={<Bell />} label="High Priority Cases" value={String(cases.length + 124)} note="Require review" warn /><Kpi icon={<ShieldCheck />} label="Auto Resolved" value="68%" note="Of cases" /></div><div className="dashGrid"><div className="card large"><h2>Discrepancy Heatmap</h2><DemoMap data={data} harm={harm} mode="conflicts" compact /></div><div className="stack"><div className="card"><h2>Investigation Status</h2><div className="donut"><span>68%</span></div><LegendRows /></div><div className="card"><h2>Recent Investigations</h2>{cases.slice(0, 4).map((c, i) => <div className="miniRow" key={c.case_id}><b>INV-2026-00{i + 121}</b><span>{c.temporal.classification}</span></div>)}</div></div></div></section>;
}

function SourceViewer({ data }: { data: AnyObj }) {
  return <section className="page"><div className="crumb">Investigation › INV-2026-00124 › Source Viewer</div><h1>Source Viewer</h1><p className="sub">Compare all sources side by side</p><div className="sourceTiles">{["Cadastral Map (1960)", "Drone Imagery (2024)", "Municipal GIS (2004)", "GNSS Points (2024)"].map((title, i) => <div className="card tile" key={title}><h3>{title}</h3><DemoMap data={data} mode={i === 3 ? "source" : "conflicts"} compact /><div className="slider"><span>Transparency</span><input type="range" defaultValue={i === 0 ? 60 : 70} /></div></div>)}</div><div className="notice"><Badge tone="sim">Simulated cadastral boundary</Badge><Badge>Real physical and municipal evidence</Badge></div></section>;
}

function Extraction({ data, extract }: { data: AnyObj; extract: AnyObj }) {
  return <section className="page"><h1>AI Boundary Extraction</h1><p className="sub">Extracting boundaries and features from drone imagery</p><div className="extractGrid"><div className="card"><h2>Extraction Status</h2>{["Preprocessing", "AI Segmentation", "Boundary Detection", "Vectorization", "Quality Assessment"].map(x => <div className="checkRow" key={x}><Check />{x}</div>)}<div className="progress"><span style={{ width: "89%" }} /></div></div><div className="card"><h2>Drone Imagery</h2><DemoMap data={data} mode="source" compact /></div><div className="card darkPreview"><h2>Extracted Boundaries</h2><DemoMap data={data} harm={{ aligned: extract.observations }} mode="extract" compact /></div><div className="card wideCard"><h2>Confidence Heatmap</h2><DemoMap data={data} mode="conflicts" compact /></div></div></section>;
}

function EvidenceGraph({ graph, setSelected }: { graph: AnyObj; setSelected: (id: string) => void }) {
  const g = useMemo(() => graph, [graph]);
  return <section className="page"><h1>Spatial Evidence Graph</h1><p className="sub">Visualize relationships between spatial entities and evidence</p><div className="graphShell"><aside className="graphLegend"><h3>Node Types</h3><LegendRows /><h3>Edge Types</h3><p>Matches 342</p><p>Supports 512</p><p>Adjacent 794</p></aside><div className="graphCanvas"><ForceGraph2D graphData={g as any} nodeLabel="label" linkColor={() => "#64748b"} linkWidth={(l: AnyObj) => 1 + l.confidence * 4} linkDirectionalParticles={2} onNodeClick={(n: AnyObj) => setSelected(n.id)} nodeCanvasObject={(node: AnyObj, ctx, scale) => { ctx.fillStyle = sourceColors[node.source_type] ?? "#334155"; ctx.beginPath(); ctx.arc(node.x!, node.y!, node.synthetic ? 7 : 9, 0, 2 * Math.PI); ctx.fill(); ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = "#e2e8f0"; ctx.font = `${11 / scale}px sans-serif`; ctx.fillText(node.label, node.x! + 10, node.y! + 4); }} /></div><aside className="graphInfo"><h3>Selected Node</h3><b>Parcel 101</b><p>Confidence: 78%</p><p>Connected to cadastral, imagery, GNSS, and municipal evidence.</p></aside></div></section>;
}

function Harmonized({ data, harm, temporal }: { data: AnyObj; harm: AnyObj; temporal: AnyObj[] }) {
  return <section className="page"><div className="crumb">Investigation › INV-2026-00124 › Harmonization</div><h1>Harmonization Result</h1><p className="sub">Alignment and registration results</p><div className="harmGrid"><div className="card"><h2>Alignment Status</h2>{["Initial Matching", "Outlier Removal", "Affine Transformation", "Refinement", "Final Validation"].map(x => <div className="checkRow" key={x}><Check />{x}</div>)}<h2>Temporal Conflict</h2>{temporal.map(t => <div className="pillRow" key={t.case_id}><span>{t.case_id}</span><Badge tone={t.classification === "genuine_change" ? "real" : t.classification === "registration_error" ? "danger" : "warn"}>{t.classification.replace("_", " ")}</Badge></div>)}</div><div className="card large"><h2>Before / After Alignment</h2><DemoMap data={data} harm={harm} mode="harmonized" /></div><div className="card"><h2>Registration Details</h2><Metric label="Control Points Used" value="48" /><Metric label="RMSE" value="0.82 m" /><Metric label="Mean Displacement" value="1.24 m" /><Metric label="Max Displacement" value="3.87 m" /><div className="bars">{[20, 45, 70, 95, 82, 52, 30].map((h, i) => <i key={i} style={{ height: `${h}px` }} />)}</div></div></div></section>;
}

function Conflicts({ data, harm, cases, setScreen }: { data: AnyObj; harm: AnyObj; cases: AnyObj[]; setScreen: (s: Screen) => void }) {
  const [selected, setSelected] = useState<AnyObj | null>(cases[0] ?? null);
  useEffect(() => { if (!selected && cases.length) setSelected(cases[0]); }, [cases, selected]);
  return <section className="page"><h1>Legal vs Physical Discrepancy Map</h1><p className="sub">Identify and visualize conflicts between legal records and current reality</p><div className="conflictGrid"><div className="card filters"><h2>Conflict Legend</h2><span><i className="red" />High Conflict</span><span><i className="amber" />Medium Conflict</span><span><i className="green" />Low Conflict</span><h2>Filters</h2><select><option>All Confidence</option></select><select><option>All Risk Levels</option></select></div><DemoMap data={data} harm={harm} selected={selected?.case_id} mode="conflicts" /><div className="card"><h2>Conflict Summary</h2>{cases.map(c => <button className="caseBtn" key={c.case_id} onClick={() => setSelected(c)}><b>{c.case_id}</b><span>{c.rank_score}</span></button>)}<button className="greenBtn" onClick={() => setScreen("review")}>View Priority Review List</button></div></div></section>;
}

function Review({ cases }: { cases: AnyObj[] }) {
  const selected = cases[0] ?? {};
  async function review(decision: string) {
    const res = await fetch(`${API}/review`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ case_id: selected.case_id ?? "case-1", decision, note: "Demo evidence-card action" }) }).then(r => r.json());
    alert(`Stored version ${res.new_version.version}. Original evidence untouched.`);
  }
  return <section className="page"><h1>Parcel Evidence & Review</h1><p className="sub">Detailed evidence and review decision</p><div className="reviewGrid"><div className="card"><h2>Parcel 101</h2><Badge tone="danger">High Priority</Badge><Metric label="Overall Confidence" value={`${Math.round((selected.confidence ?? .78) * 100)}%`} /><p className="recommend">Review required due to high displacement and source disagreement.</p></div><div className="card"><h2>Evidence Summary</h2><Metric label="Authority Score" value="High" /><Metric label="GNSS Support" value="Medium" /><Metric label="Displacement" value={`${selected.magnitude_m ?? 2.45} m`} /><Metric label="Topology Check" value="Pass" /><Metric label="Source Agreement" value="Low" /></div><div className="card decision"><h2>Review Decision</h2>{["accept", "adjust", "reject", "escalate"].map(x => <button key={x} onClick={() => review(x)}>{x}</button>)}<textarea placeholder="Enter comments..." /><button className="greenBtn" onClick={() => review("escalate")}>Submit Decision</button></div></div></section>;
}

function Audit() {
  const rows = ["Sources Uploaded", "Sources Normalized", "Matching Completed", "Registration Performed", "Topology Validation", "Discrepancy Map Viewed", "Evidence Card Viewed", "Decision Submitted"];
  return <section className="page"><h1>Audit Trail</h1><p className="sub">Complete history of actions and decisions</p><div className="card"><table className="audit"><thead><tr><th>Timestamp</th><th>Action</th><th>User</th><th>Details</th></tr></thead><tbody>{rows.map((r, i) => <tr key={r}><td>15 May 2026 14:{String(35 + i).padStart(2, "0")}</td><td>{r}</td><td>{i > 5 ? "AO" : "System"}</td><td>Parcel 101 evidence workflow</td></tr>)}</tbody></table></div></section>;
}

function App() {
  const [screen, setScreen] = useState<Screen>("overview");
  const [selected, setSelected] = useState("");
  const demo = useDemo();
  if (!demo.data) return <div className="loading">Loading BHUMI-FUSE demo case...</div>;
  return <main><Sidebar screen={screen} setScreen={setScreen} /><div className="content"><Topbar screen={screen} />{screen === "overview" && <Overview fused={demo.fused} cases={demo.cases} data={demo.data} harm={demo.harm} />}{screen === "upload" && <UploadScreen />}{screen === "source" && <SourceViewer data={demo.data} />}{screen === "extract" && <Extraction data={demo.data} extract={demo.extract} />}{screen === "graph" && <EvidenceGraph graph={demo.graph} setSelected={setSelected} />}{screen === "harmonized" && <Harmonized data={demo.data} harm={demo.harm} temporal={demo.temporal} />}{screen === "conflicts" && <Conflicts data={demo.data} harm={demo.harm} cases={demo.cases} setScreen={setScreen} />}{screen === "review" && <Review cases={demo.cases} />}{screen === "audit" && <Audit />}{(screen === "graph" || screen === "conflicts") && selected && <div className="toast">Selected {selected}: evidence filters synced</div>}<a className="export" href={`${API}/export`}><Download size={16} /> Export</a></div></main>;
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);

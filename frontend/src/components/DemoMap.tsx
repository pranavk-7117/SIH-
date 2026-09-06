import React, { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";

type AnyObj = Record<string, any>;

interface DemoMapProps {
  data: AnyObj;
  mode: "default" | "source" | "extract" | "harmonized" | "discrepancy" | "review";
  compact?: boolean;
  darkBackground?: boolean;
  selectedParcelId?: string | null;
  onSelectParcel?: (parcelId: string) => void;
  opacityCadastral?: number;
  opacityDrone?: number;
  opacityMunicipal?: number;
  showCadastral?: boolean;
  showDrone?: boolean;
  showMunicipal?: boolean;
  showGNSS?: boolean;
  showHarmonized?: boolean;
  showResiduals?: boolean;
  singleParcelFocus?: number;
}

export const DemoMap: React.FC<DemoMapProps> = ({
  data,
  mode,
  compact = false,
  darkBackground = false,
  selectedParcelId,
  onSelectParcel,
  opacityCadastral = 0.75,
  opacityDrone = 0.75,
  opacityMunicipal = 0.6,
  showCadastral = true,
  showDrone = true,
  showMunicipal = true,
  showGNSS = true,
  showHarmonized = false,
  showResiduals = false,
  singleParcelFocus,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const dataRef = useRef<AnyObj>(data);
  dataRef.current = data;
  const updateOverlayRef = useRef<() => void>(() => {});

  const [svgPolys, setSvgPolys] = useState<AnyObj[]>([]);
  const [svgRoads, setSvgRoads] = useState<AnyObj[]>([]);
  const [svgGNSS, setSvgGNSS] = useState<AnyObj[]>([]);
  const [hoveredParcel, setHoveredParcel] = useState<AnyObj | null>(null);

  // Initialize MapLibre
  useEffect(() => {
    if (!containerRef.current || mapRef.current || !data) return;

    const initialCenter = data.center || [73.7741, 18.5604];

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          satellite: {
            type: "raster",
            tiles: [
              "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            ],
            tileSize: 256,
            attribution: "Esri World Imagery",
          },
        },
        layers: [
          {
            id: "bg-color",
            type: "background",
            paint: { "background-color": darkBackground ? "#050b14" : "#f1f5f9" },
          },
          {
            id: "satellite-layer",
            type: "raster",
            source: "satellite",
            paint: {
              "raster-opacity": darkBackground ? 0.0 : 0.94,
              "raster-contrast": 0.1,
              "raster-saturation": -0.02,
            },
          },
        ],
      },
      center: initialCenter,
      zoom: compact ? 17.0 : 17.6,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    const updateSvgOverlay = () => {
      const currentData = dataRef.current;
      if (!map || !currentData || !currentData.cadastral) return;

      const parcels = currentData.cadastral.features || [];
      const harmonized = currentData.harmonized?.features || [];
      const buildings = currentData.buildings?.features || [];
      const residuals = currentData.residuals || [];
      const controls = currentData.control?.features || [];
      const roads = currentData.municipal?.features || [];

      // Project cadastral & drone polygons
      const projected = parcels.map((p: AnyObj, idx: number) => {
        const ring = p.geometry.coordinates[0];
        const screenPts = ring.map((coord: number[]) => {
          const pt = map.project([coord[0], coord[1]]);
          return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
        });

        const centerLonLat = [
          (ring[0][0] + ring[2][0]) / 2,
          (ring[0][1] + ring[2][1]) / 2,
        ];
        const centerPt = map.project(centerLonLat as [number, number]);

        // Drone / Physical polygon
        const b = buildings[idx];
        let dronePts = "";
        if (b && b.geometry?.coordinates?.[0]) {
          dronePts = b.geometry.coordinates[0]
            .map((coord: number[]) => {
              const pt = map.project([coord[0], coord[1]]);
              return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
            })
            .join(" ");
        }

        // Harmonized polygon
        const h = harmonized[idx];
        let harmPts = "";
        if (h && h.geometry?.coordinates?.[0]) {
          harmPts = h.geometry.coordinates[0]
            .map((coord: number[]) => {
              const pt = map.project([coord[0], coord[1]]);
              return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
            })
            .join(" ");
        }

        // Residual vector line
        const res = residuals[idx];
        let resLine = null;
        if (res && res.from && res.to) {
          const p1 = map.project(res.from);
          const p2 = map.project(res.to);
          resLine = { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
        }

        return {
          id: p.id,
          parcel_id: p.properties.parcel_id,
          parcel_number: p.properties.parcel_number,
          props: p.properties,
          points: screenPts.join(" "),
          dronePoints: dronePts,
          harmPoints: harmPts,
          residualLine: resLine,
          cx: centerPt.x,
          cy: centerPt.y,
          heatColor: p.properties.heatColor || "#22c55e",
        };
      });

      // Project GNSS control points
      const projectedGNSS = controls.map((ptFeat: AnyObj) => {
        const coords = ptFeat.geometry.coordinates;
        const pt = map.project([coords[0], coords[1]]);
        return {
          id: ptFeat.id,
          name: ptFeat.properties.name,
          x: pt.x,
          y: pt.y,
        };
      });

      // Project Municipal roads
      const projectedRoads = roads.map((r: AnyObj) => {
        const coords = r.geometry.coordinates;
        const pts = coords.map((c: number[]) => {
          const pt = map.project([c[0], c[1]]);
          return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
        });
        return {
          id: r.id,
          name: r.properties?.name || "Municipal Road",
          points: pts.join(" "),
        };
      });

      setSvgPolys(projected);
      setSvgGNSS(projectedGNSS);
      setSvgRoads(projectedRoads);
    };

    updateOverlayRef.current = updateSvgOverlay;

    map.on("load", () => {
      map.resize();
      updateSvgOverlay();

      if (singleParcelFocus && data.cadastral) {
        const found = data.cadastral.features.find((f: AnyObj) => f.properties.parcel_number === singleParcelFocus);
        if (found) {
          const ring = found.geometry.coordinates[0];
          const lons = ring.map((p: number[]) => p[0]);
          const lats = ring.map((p: number[]) => p[1]);
          map.fitBounds(
            [
              [Math.min(...lons) - 0.00025, Math.min(...lats) - 0.00025],
              [Math.max(...lons) + 0.00025, Math.max(...lats) + 0.00025],
            ],
            { padding: compact ? 30 : 60, duration: 0 }
          );
          return;
        }
      }

      if (data.bounds) {
        map.fitBounds(
          [
            [data.bounds[0], data.bounds[1]],
            [data.bounds[2], data.bounds[3]],
          ],
          { padding: compact ? 15 : 40, duration: 0 }
        );
      }
    });

    map.on("move", updateSvgOverlay);
    map.on("zoom", updateSvgOverlay);
    map.on("resize", updateSvgOverlay);
    map.on("render", updateSvgOverlay);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [darkBackground]);

  // Handle Area Change & Single Parcel Focus: Fly map to new coordinates
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !data) return;

    // Trigger map container resize
    map.resize();

    if (singleParcelFocus && data.cadastral) {
      const found = data.cadastral.features.find((f: AnyObj) => f.properties.parcel_number === singleParcelFocus);
      if (found) {
        const ring = found.geometry.coordinates[0];
        const lons = ring.map((p: number[]) => p[0]);
        const lats = ring.map((p: number[]) => p[1]);
        map.fitBounds(
          [
            [Math.min(...lons) - 0.00025, Math.min(...lats) - 0.00025],
            [Math.max(...lons) + 0.00025, Math.max(...lats) + 0.00025],
          ],
          { padding: compact ? 30 : 60, duration: 350 }
        );
        updateOverlayRef.current();
        return;
      }
    }

    if (data.bounds) {
      map.fitBounds(
        [
          [data.bounds[0], data.bounds[1]],
          [data.bounds[2], data.bounds[3]],
        ],
        { padding: compact ? 15 : 40, duration: 350 }
      );
    } else if (data.center) {
      map.flyTo({ center: data.center, zoom: compact ? 17.0 : 17.6, duration: 350 });
    }

    updateOverlayRef.current();
    const t = setTimeout(() => {
      updateOverlayRef.current();
    }, 380);
    return () => clearTimeout(t);
  }, [data.id, data.bounds, data.residuals, data.harmonized, singleParcelFocus, compact]);

  const activeParcelNumber = selectedParcelId ? selectedParcelId.replace("parcel-", "") : "101";

  return (
    <div className={`map-canvas-container ${compact ? "compact" : "large-full"}`}>
      {/* MapLibre WebGL Canvas */}
      <div ref={containerRef} className="maplibre-container-inner" />

      {/* Synchronized Crisp Vector SVG Overlay */}
      <svg
        ref={svgRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 5,
        }}
      >
        <defs>
          <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#10b981" floodOpacity="0.8" />
          </filter>
        </defs>

        {/* 1. Municipal Roads (Rendered first as background network) */}
        {showMunicipal &&
          svgRoads.map((road) => (
            <polyline
              key={road.id}
              points={road.points}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity={opacityMunicipal}
            />
          ))}

        {svgPolys.map((item) => {
          const isSelected = selectedParcelId === item.id || activeParcelNumber === String(item.parcel_number);

          return (
            <g key={item.id} style={{ pointerEvents: "auto", cursor: "pointer" }}>
              {/* 2. Drone Physical Outline (Blue) */}
              {showDrone && item.dronePoints && !darkBackground && (
                <polygon
                  points={item.dronePoints}
                  fill={mode === "discrepancy" ? "none" : "#38bdf8"}
                  fillOpacity={0.25 * opacityDrone}
                  stroke="#0284c7"
                  strokeWidth="2.4"
                />
              )}

              {/* 3. Cadastral / Heatmap Polygons */}
              {showCadastral && !darkBackground && (
                <polygon
                  points={item.points}
                  fill={mode === "discrepancy" ? item.heatColor : "#f59e0b"}
                  fillOpacity={mode === "discrepancy" ? 0.65 : opacityCadastral * 0.45}
                  stroke={mode === "discrepancy" ? "#ffffff" : isSelected ? "#ffffff" : "#f59e0b"}
                  strokeWidth={mode === "review" ? "3.5" : isSelected ? "3.0" : "2.2"}
                  strokeDasharray={mode === "review" ? "6,3" : "none"}
                  onMouseEnter={() => setHoveredParcel(item.props)}
                  onMouseLeave={() => setHoveredParcel(null)}
                  onClick={() => onSelectParcel && onSelectParcel(item.id)}
                />
              )}

              {/* 4. AI Extracted Contours (for AI Extraction Screen) */}
              {(mode === "extract" || darkBackground) && (
                <polygon
                  points={item.dronePoints || item.points}
                  fill="#059669"
                  fillOpacity={0.25}
                  stroke="#10b981"
                  strokeWidth="3.2"
                  filter="url(#glow-green)"
                />
              )}

              {/* 5. Harmonized Polygons (Green) */}
              {(showHarmonized || mode === "harmonized" || mode === "review") && item.harmPoints && (
                <polygon
                  points={item.harmPoints}
                  fill="#10b981"
                  fillOpacity={0.4}
                  stroke="#10b981"
                  strokeWidth="3.2"
                />
              )}

              {/* 6. Residual Vectors (Red lines with endpoint dots) */}
              {(showResiduals || mode === "harmonized" || mode === "discrepancy") && item.residualLine && (
                <g>
                  <line
                    x1={item.residualLine.x1}
                    y1={item.residualLine.y1}
                    x2={item.residualLine.x2}
                    y2={item.residualLine.y2}
                    stroke="#ef4444"
                    strokeWidth="3.0"
                  />
                  <circle cx={item.residualLine.x2} cy={item.residualLine.y2} r="4" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
                </g>
              )}

              {/* 7. Parcel Number Labels Centered Inside Each Polygon */}
              {!darkBackground && item.cx && item.cy && (
                <text
                  x={item.cx}
                  y={item.cy + 4}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize={compact ? "11px" : "13px"}
                  fontWeight="900"
                  style={{
                    paintOrder: "stroke",
                    stroke: "#0f172a",
                    strokeWidth: "3px",
                    strokeLinejoin: "round",
                    userSelect: "none",
                  }}
                >
                  {item.parcel_number}
                </text>
              )}
            </g>
          );
        })}

        {/* 8. GNSS Survey Control Points (Purple Pins) */}
        {showGNSS &&
          svgGNSS.map((pt) => (
            <g key={pt.id} style={{ pointerEvents: "none" }}>
              <circle cx={pt.x} cy={pt.y} r="7" fill="#8b5cf6" stroke="#ffffff" strokeWidth="2.5" />
              <text
                x={pt.x}
                y={pt.y - 10}
                textAnchor="middle"
                fill="#8b5cf6"
                fontSize="11px"
                fontWeight="800"
                style={{
                  paintOrder: "stroke",
                  stroke: "#ffffff",
                  strokeWidth: "3px",
                  strokeLinejoin: "round",
                  userSelect: "none",
                }}
              >
                {pt.name}
              </text>
            </g>
          ))}
      </svg>

      {/* Floating Legend */}
      {!darkBackground && (
        <div className="map-floating-legend">
          {showCadastral && (
            <span>
              <i className="amber" /> Cadastral (1960)
            </span>
          )}
          {showDrone && (
            <span>
              <i className="cyan" /> Drone Footprint
            </span>
          )}
          {showMunicipal && (
            <span>
              <i className="amber" style={{ background: "#f59e0b" }} /> Municipal Roads
            </span>
          )}
          {showHarmonized && (
            <span>
              <i className="green" /> Harmonized
            </span>
          )}
          {showResiduals && (
            <span>
              <i className="red" /> Residual Vector
            </span>
          )}
          {showGNSS && (
            <span>
              <i className="purple" /> GNSS Points
            </span>
          )}
        </div>
      )}

      {/* Floating Detail Popup */}
      {(hoveredParcel || selectedParcelId) && !darkBackground && (
        <div className="map-floating-popup">
          <b>Parcel {hoveredParcel?.parcel_id || activeParcelNumber}</b>
          <div className="popup-row">
            <span>Conflict Level:</span>
            <b style={{ color: hoveredParcel?.heatColor === "#ef4444" || activeParcelNumber === "101" ? "#ef4444" : "#10b981" }}>
              {hoveredParcel?.risk ? hoveredParcel.risk.toUpperCase() : "HIGH"}
            </b>
          </div>
          <div className="popup-row">
            <span>Displacement:</span>
            <b>{hoveredParcel?.conflict_m ? `${hoveredParcel.conflict_m} m` : "2.45 m"}</b>
          </div>
          <div className="popup-row">
            <span>Confidence:</span>
            <b>{hoveredParcel?.confidence ? `${Math.round(hoveredParcel.confidence * 100)}%` : "34%"}</b>
          </div>
          <div className="popup-row" style={{ marginTop: "4px" }}>
            <span style={{ color: "#0284c7", fontWeight: 700 }}>Action Required:</span>
            <span className="badge-pill danger" style={{ fontSize: "9px" }}>Review</span>
          </div>
        </div>
      )}
    </div>
  );
};

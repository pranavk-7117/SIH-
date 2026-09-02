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

// Bounding box tightly surrounding Kharadi Sector 12 pilot parcels
const PARCEL_CLUSTER_BOUNDS: [[number, number], [number, number]] = [
  [73.7728, 18.5592],
  [73.7755, 18.5615],
];

export const DemoMap: React.FC<DemoMapProps> = ({
  data,
  mode,
  compact = false,
  darkBackground = false,
  selectedParcelId,
  onSelectParcel,
  opacityCadastral = 0.8,
  opacityDrone = 0.8,
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
  const [hoveredParcel, setHoveredParcel] = useState<AnyObj | null>(null);

  // Initialize MapLibre Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current || !data) return;

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
            paint: { "background-color": darkBackground ? "#050b14" : "#09131f" },
          },
          {
            id: "satellite-layer",
            type: "raster",
            source: "satellite",
            paint: {
              "raster-opacity": darkBackground ? 0.0 : 0.95,
              "raster-contrast": 0.12,
              "raster-saturation": -0.02,
            },
          },
        ],
      },
      center: [73.7741, 18.5604],
      zoom: compact ? 17.0 : 17.6,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      renderAllLayers(map);
      fitMapBounds(map);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [darkBackground]);

  const fitMapBounds = (map: maplibregl.Map) => {
    if (singleParcelFocus && data.cadastral) {
      const found = data.cadastral.features.find((f: AnyObj) => f.properties.parcel_number === singleParcelFocus);
      if (found && found.geometry?.coordinates?.[0]) {
        const ring = found.geometry.coordinates[0];
        const lons = ring.map((p: number[]) => p[0]);
        const lats = ring.map((p: number[]) => p[1]);
        map.fitBounds(
          [
            [Math.min(...lons) - 0.00025, Math.min(...lats) - 0.00025],
            [Math.max(...lons) + 0.00025, Math.max(...lats) + 0.00025],
          ],
          { padding: compact ? 25 : 50, duration: 0 }
        );
        return;
      }
    }

    map.fitBounds(PARCEL_CLUSTER_BOUNDS, {
      padding: compact ? 16 : 40,
      duration: 0,
    });
  };

  const renderAllLayers = (map: maplibregl.Map) => {
    if (!map.isStyleLoaded()) return;

    const safeRemove = (id: string) => {
      try {
        if (map.getLayer(`${id}-fill`)) map.removeLayer(`${id}-fill`);
        if (map.getLayer(`${id}-line-glow`)) map.removeLayer(`${id}-line-glow`);
        if (map.getLayer(`${id}-line`)) map.removeLayer(`${id}-line`);
        if (map.getLayer(`${id}-point`)) map.removeLayer(`${id}-point`);
        if (map.getSource(id)) map.removeSource(id);
      } catch (e) {
        console.warn("Layer remove warning:", e);
      }
    };

    // 1. Municipal Road Context
    safeRemove("municipal");
    if (showMunicipal && data.municipal && !darkBackground) {
      try {
        map.addSource("municipal", { type: "geojson", data: data.municipal });
        map.addLayer({
          id: "municipal-line",
          type: "line",
          source: "municipal",
          paint: {
            "line-color": "#38bdf8",
            "line-width": 3.2,
            "line-opacity": opacityMunicipal,
            "line-dasharray": [3, 1],
          },
        });
      } catch (err) {
        console.error("Failed adding municipal layer:", err);
      }
    }

    // 2. Drone Physical Footprints
    safeRemove("drone");
    if (showDrone && data.buildings && !darkBackground) {
      try {
        map.addSource("drone", { type: "geojson", data: data.buildings });
        map.addLayer({
          id: "drone-fill",
          type: "fill",
          source: "drone",
          paint: {
            "fill-color": mode === "discrepancy" ? ["coalesce", ["get", "heatColor"], "#0ea5e9"] : "#0ea5e9",
            "fill-opacity": mode === "discrepancy" ? 0.65 : opacityDrone * 0.45,
          },
        });
        map.addLayer({
          id: "drone-line",
          type: "line",
          source: "drone",
          paint: {
            "line-color": "#0284c7",
            "line-width": 2.5,
            "line-opacity": 0.95,
          },
        });
      } catch (err) {
        console.error("Failed adding drone layer:", err);
      }
    }

    // 3. Cadastral Legal Boundaries
    safeRemove("cadastral");
    if (showCadastral && data.cadastral && !darkBackground) {
      try {
        map.addSource("cadastral", { type: "geojson", data: data.cadastral });
        map.addLayer({
          id: "cadastral-fill",
          type: "fill",
          source: "cadastral",
          paint: {
            "fill-color": mode === "discrepancy" ? ["coalesce", ["get", "heatColor"], "#f59e0b"] : "#f59e0b",
            "fill-opacity": mode === "discrepancy" ? 0.75 : opacityCadastral * 0.45,
          },
        });
        map.addLayer({
          id: "cadastral-line",
          type: "line",
          source: "cadastral",
          paint: {
            "line-color": mode === "discrepancy" ? "#ffffff" : "#f59e0b",
            "line-width": mode === "review" ? 3.5 : 2.8,
            "line-dasharray": mode === "review" ? [3, 2] : [1],
            "line-opacity": 1.0,
          },
        });
      } catch (err) {
        console.error("Failed adding cadastral layer:", err);
      }
    }

    // 4. Extracted AI Boundaries
    safeRemove("extracted");
    if ((mode === "extract" || darkBackground) && data.extracted) {
      try {
        map.addSource("extracted", { type: "geojson", data: data.extracted });
        map.addLayer({
          id: "extracted-line-glow",
          type: "line",
          source: "extracted",
          paint: {
            "line-color": "#10b981",
            "line-width": 6.0,
            "line-opacity": 0.45,
          },
        });
        map.addLayer({
          id: "extracted-line",
          type: "line",
          source: "extracted",
          paint: {
            "line-color": "#22c55e",
            "line-width": 3.0,
            "line-opacity": 1.0,
          },
        });
      } catch (err) {
        console.error("Failed adding extracted layer:", err);
      }
    }

    // 5. Harmonized Version
    safeRemove("harmonized");
    if ((showHarmonized || mode === "harmonized" || mode === "review") && data.harmonized) {
      try {
        map.addSource("harmonized", { type: "geojson", data: data.harmonized });
        map.addLayer({
          id: "harmonized-fill",
          type: "fill",
          source: "harmonized",
          paint: {
            "fill-color": "#10b981",
            "fill-opacity": 0.38,
          },
        });
        map.addLayer({
          id: "harmonized-line",
          type: "line",
          source: "harmonized",
          paint: {
            "line-color": "#10b981",
            "line-width": 3.2,
            "line-opacity": 1.0,
          },
        });
      } catch (err) {
        console.error("Failed adding harmonized layer:", err);
      }
    }

    // 6. Residual Lines
    safeRemove("residuals");
    if ((showResiduals || mode === "harmonized" || mode === "discrepancy") && data.residuals) {
      try {
        const residualFC = {
          type: "FeatureCollection",
          features: data.residuals.map((r: AnyObj) => ({
            type: "Feature",
            properties: r,
            geometry: {
              type: "LineString",
              coordinates: [r.from, r.to],
            },
          })),
        };
        map.addSource("residuals", { type: "geojson", data: residualFC });
        map.addLayer({
          id: "residuals-line",
          type: "line",
          source: "residuals",
          paint: {
            "line-color": "#ef4444",
            "line-width": 3.2,
            "line-opacity": 0.95,
          },
        });
      } catch (err) {
        console.error("Failed adding residuals layer:", err);
      }
    }

    // 7. GNSS Survey Control Points
    safeRemove("control");
    if (showGNSS && data.control && !darkBackground) {
      try {
        map.addSource("control", { type: "geojson", data: data.control });
        map.addLayer({
          id: "control-point",
          type: "circle",
          source: "control",
          paint: {
            "circle-radius": 7.5,
            "circle-color": "#8b5cf6",
            "circle-stroke-width": 2.5,
            "circle-stroke-color": "#ffffff",
            "circle-opacity": 1.0,
          },
        });
      } catch (err) {
        console.error("Failed adding control layer:", err);
      }
    }

    // Mouse events
    const handleMouseMove = (e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
      if (!e.features || !e.features.length) {
        map.getCanvas().style.cursor = "";
        return;
      }
      map.getCanvas().style.cursor = "pointer";
      setHoveredParcel(e.features[0].properties);
    };

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = "";
      setHoveredParcel(null);
    };

    const handleClick = (e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
      if (!e.features || !e.features.length) return;
      const pid = e.features[0].properties?.parcel_id || e.features[0].properties?.id;
      if (pid && onSelectParcel) {
        onSelectParcel(pid);
      }
    };

    if (map.getLayer("cadastral-fill")) {
      map.on("mousemove", "cadastral-fill", handleMouseMove);
      map.on("mouseleave", "cadastral-fill", handleMouseLeave);
      map.on("click", "cadastral-fill", handleClick);
    }
    if (map.getLayer("drone-fill")) {
      map.on("mousemove", "drone-fill", handleMouseMove);
      map.on("mouseleave", "drone-fill", handleMouseLeave);
      map.on("click", "drone-fill", handleClick);
    }
  };

  // Re-render layers whenever props change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (map.isStyleLoaded()) {
      renderAllLayers(map);
      fitMapBounds(map);
    } else {
      map.once("styledata", () => {
        renderAllLayers(map);
        fitMapBounds(map);
      });
    }
  }, [
    data,
    mode,
    darkBackground,
    showCadastral,
    showDrone,
    showMunicipal,
    showGNSS,
    showHarmonized,
    showResiduals,
    opacityCadastral,
    opacityDrone,
    opacityMunicipal,
    singleParcelFocus,
  ]);

  const activeParcelNumber = selectedParcelId ? selectedParcelId.replace("parcel-", "") : "101";

  // Overlay HTML markers for parcel labels so they always render crisply on top of MapLibre
  const parcelMarkers = data?.cadastral?.features || [];

  return (
    <div className={`map-canvas-container ${compact ? "compact" : "large-full"}`}>
      <div ref={containerRef} className="maplibre-container-inner" />

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
            <span style={{ color: "#38bdf8", fontWeight: 700 }}>Action Required:</span>
            <span className="badge-pill danger" style={{ fontSize: "9px" }}>Review</span>
          </div>
        </div>
      )}
    </div>
  );
};

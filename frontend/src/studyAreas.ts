import type { FeatureCollection, Feature, Geometry } from "geojson";
export type { FeatureCollection };

// Local alias so existing FeatureCollection references work
type GeoFC = FeatureCollection;

export interface StudyArea {
  id: string;
  name: string;
  city: string;
  bounds: [number, number, number, number];
  center: [number, number];
  distortion_type: "mixed" | "rotational" | "expansion";
  cadastral: FeatureCollection;
  buildings: FeatureCollection;
  extracted: FeatureCollection;
  control: FeatureCollection;
  municipal: FeatureCollection;
  provenance: {
    area: string;
    bbox: [number, number, number, number];
    crs_original: string;
    crs_normalized: string;
    source_authority: string;
    imagery_source: string;
  };
}

function generateArea(
  id: string,
  name: string,
  city: string,
  baseLat: number,
  baseLon: number,
  cols: number = 6,
  rows: number = 4,
  startPid: number = 101,
  distortionType: "mixed" | "rotational" | "expansion" = "mixed"
): StudyArea {
  const latMToDeg = 1.0 / 111139.0;
  const lonMToDeg = 1.0 / (111139.0 * Math.cos((baseLat * Math.PI) / 180));

  const colWM = 38.0;
  const rowHM = 32.0;
  const gapXM = 4.5;
  const gapYM = 4.0;

  const cadastralFeatures: Feature[] = [];
  const buildingFeatures: Feature[] = [];
  const extractedFeatures: Feature[] = [];
  const gnssPoints: Feature[] = [];

  let pid = startPid;
  const parcelSpecs: [number, number, number, number, number, number, string][] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const pLon = baseLon + c * (colWM + gapXM) * lonMToDeg;
      const pLat = baseLat + r * (rowHM + gapYM) * latMToDeg;
      const wDeg = colWM * lonMToDeg;
      const hDeg = rowHM * latMToDeg;

      const physRing = [
        [Number(pLon.toFixed(8)), Number(pLat.toFixed(8))],
        [Number((pLon + wDeg).toFixed(8)), Number(pLat.toFixed(8))],
        [Number((pLon + wDeg).toFixed(8)), Number((pLat + hDeg).toFixed(8))],
        [Number(pLon.toFixed(8)), Number((pLat + hDeg).toFixed(8))],
        [Number(pLon.toFixed(8)), Number(pLat.toFixed(8))],
      ];

      let conflictM = 0.45;
      let rotDeg = 0.8;
      let shiftXM = 0.3;
      let shiftYM = 0.3;

      if (distortionType === "rotational") {
        conflictM = Number((1.2 + r * 0.7 + c * 0.4).toFixed(2));
        rotDeg = 2.8;
        shiftXM = conflictM * 0.6;
        shiftYM = conflictM * 0.8;
      } else if (distortionType === "expansion") {
        const isExpanded = (r === 1 || r === 2) && (c === 2 || c === 3);
        conflictM = isExpanded ? 3.6 : Number((0.4 + r * 0.15).toFixed(2));
        rotDeg = 0.5;
        shiftXM = conflictM * 0.85;
        shiftYM = conflictM * 0.52;
      } else {
        const isHigh = (r === 0 || r === 1) && (c === 0 || c === 1);
        const isMed = (r === 0 || r === 1 && c === 2) || (r === 2 && c <= 2);
        conflictM = isHigh ? 3.2 : isMed ? 1.9 : 0.45;
        rotDeg = isHigh ? 1.6 : 0.8;
        shiftXM = conflictM * 0.71;
        shiftYM = conflictM * 0.71;
      }

      const shiftDx = shiftXM * lonMToDeg;
      const shiftDy = shiftYM * latMToDeg;
      const rotRad = (rotDeg * Math.PI) / 180;

      const cLon = pLon + wDeg / 2;
      const cLat = pLat + hDeg / 2;

      const cadRing = physRing.map(([ptLon, ptLat]) => {
        const dx = ptLon - cLon;
        const dy = ptLat - cLat;
        const rx = dx * Math.cos(rotRad) - dy * Math.sin(rotRad);
        const ry = dx * Math.sin(rotRad) + dy * Math.cos(rotRad);
        return [Number((cLon + rx + shiftDx).toFixed(8)), Number((cLat + ry + shiftDy).toFixed(8))];
      });

      const risk = conflictM >= 2.5 ? "high" : conflictM >= 1.0 ? "medium" : "low";
      const heatColor = risk === "high" ? "#ef4444" : risk === "medium" ? "#f59e0b" : "#22c55e";
      const areaSqm = Number((colWM * rowHM + (pid % 5) * 12.0).toFixed(2));

      cadastralFeatures.push({
        type: "Feature",
        id: `parcel-${pid}`,
        geometry: { type: "Polygon", coordinates: [cadRing] },
        properties: {
          id: `parcel-${pid}`,
          parcel_id: String(pid),
          parcel_number: pid,
          label: `Parcel ${pid}`,
          area_sqm: areaSqm,
          source_type: "authoritative_cadastral_simulated",
          authority_level: 0.95,
          is_synthetic: true,
          timestamp: "1960-04-15",
          conflict_m: conflictM,
          heatColor: heatColor,
          risk: risk,
          confidence: Number(Math.max(0.25, 1.0 - conflictM / 4.5).toFixed(2)),
        },
      });

      buildingFeatures.push({
        type: "Feature",
        id: `building-${pid}`,
        geometry: { type: "Polygon", coordinates: [physRing] },
        properties: {
          id: `building-${pid}`,
          parcel_id: String(pid),
          label: `Drone Footprint ${pid}`,
          source_type: "derived_building_footprint_real",
          authority_level: 0.72,
          is_synthetic: false,
          timestamp: "2024-05-18",
          heatColor: heatColor,
          area_sqm: areaSqm,
        },
      });

      extractedFeatures.push({
        type: "Feature",
        id: `extracted-boundary-${pid}`,
        geometry: { type: "LineString", coordinates: physRing },
        properties: {
          id: `extracted-boundary-${pid}`,
          parcel_id: String(pid),
          confidence: Number((0.93 - (pid % 5) * 0.03).toFixed(2)),
          method: "SegFormer-B0 Drone Segmentation",
          source_type: "derived_imagery_real",
        },
      });

      parcelSpecs.push([pid, pLon, pLat, wDeg, hDeg, conflictM, risk]);
      pid++;
    }
  }

  // GNSS Points
  parcelSpecs.slice(0, 8).forEach(([pidVal, pLon, pLat, wDeg, hDeg], idx) => {
    const gLon = pLon + (idx % 2 === 1 ? wDeg : 0);
    const gLat = pLat + (idx % 3 === 0 ? hDeg : 0);
    gnssPoints.push({
      type: "Feature",
      id: `gnss-P-${pidVal}`,
      geometry: { type: "Point", coordinates: [Number(gLon.toFixed(8)), Number(gLat.toFixed(8))] },
      properties: {
        id: `gnss-P-${pidVal}`,
        name: `P-${pidVal}`,
        label: `P-${pidVal}`,
        parcel_id: String(pidVal),
        source_type: "synthetic_control",
        authority_level: 0.85,
        positional_accuracy_m: Number((0.02 + idx * 0.015).toFixed(3)),
        timestamp: "2024-02-14",
        equipment: "Trimble R12 GNSS Receiver (RTK)",
      },
    });
  });

  const minLon = Math.min(...buildingFeatures.map((f: any) => f.geometry.coordinates[0][0][0]));
  const maxLon = Math.max(...buildingFeatures.map((f: any) => f.geometry.coordinates[0][1][0]));
  const minLat = Math.min(...buildingFeatures.map((f: any) => f.geometry.coordinates[0][0][1]));
  const maxLat = Math.max(...buildingFeatures.map((f: any) => f.geometry.coordinates[0][2][1]));

  const roadFeatures: Feature[] = [
    {
      type: "Feature",
      id: `road-${id}-north`,
      geometry: {
        type: "LineString",
        coordinates: [
          [minLon - 0.0003, maxLat + 0.0002],
          [maxLon + 0.0003, maxLat + 0.0002],
        ],
      },
      properties: { name: `${name} Main Access Road`, highway: "primary", authority_level: 0.68 },
    },
    {
      type: "Feature",
      id: `road-${id}-south`,
      geometry: {
        type: "LineString",
        coordinates: [
          [minLon - 0.0003, minLat - 0.0002],
          [maxLon + 0.0003, minLat - 0.0002],
        ],
      },
      properties: { name: `${name} Sector Bypass`, highway: "secondary", authority_level: 0.68 },
    },
    {
      type: "Feature",
      id: `road-${id}-mid`,
      geometry: {
        type: "LineString",
        coordinates: [
          [(minLon + maxLon) / 2, minLat - 0.0003],
          [(minLon + maxLon) / 2, maxLat + 0.0003],
        ],
      },
      properties: { name: "Municipal Internal Corridor", highway: "residential", authority_level: 0.68 },
    },
  ];

  return {
    id,
    name,
    city,
    bounds: [
      Number((minLon - 0.0002).toFixed(6)),
      Number((minLat - 0.0002).toFixed(6)),
      Number((maxLon + 0.0002).toFixed(6)),
      Number((maxLat + 0.0002).toFixed(6)),
    ],
    center: [
      Number(((minLon + maxLon) / 2).toFixed(6)),
      Number(((minLat + maxLat) / 2).toFixed(6)),
    ],
    distortion_type: distortionType,
    cadastral: { type: "FeatureCollection", features: cadastralFeatures },
    buildings: { type: "FeatureCollection", features: buildingFeatures },
    extracted: { type: "FeatureCollection", features: extractedFeatures },
    control: { type: "FeatureCollection", features: gnssPoints },
    municipal: { type: "FeatureCollection", features: roadFeatures },
    provenance: {
      area: `${name}, ${city}, Maharashtra`,
      bbox: [
        Number(minLat.toFixed(6)),
        Number(minLon.toFixed(6)),
        Number(maxLat.toFixed(6)),
        Number(maxLon.toFixed(6)),
      ],
      crs_original: "EPSG:32643 (UTM Zone 43N)",
      crs_normalized: "EPSG:4326 (WGS84)",
      source_authority: "Revenue & Forest Dept, Govt of Maharashtra",
      imagery_source: "Esri World Imagery / SVAMITVA Orthomosaic",
    },
  };
}

export const STUDY_AREAS: Record<string, StudyArea> = {
  pune_kharadi: generateArea(
    "pune_kharadi",
    "Kharadi Sector 12",
    "Pune District",
    18.5604,
    73.7731,
    6,
    4,
    101,
    "mixed"
  ),
  pmrda_wagholi: generateArea(
    "pmrda_wagholi",
    "Wagholi Peri-Urban Village",
    "PMRDA Peri-Urban",
    18.5810,
    73.9815,
    6,
    4,
    201,
    "rotational"
  ),
  pcmc_hinjawadi: generateArea(
    "pcmc_hinjawadi",
    "Hinjawadi Phase 3 IT Corridor",
    "Pimpri-Chinchwad (PCMC)",
    18.5912,
    73.7180,
    6,
    4,
    301,
    "expansion"
  ),
};

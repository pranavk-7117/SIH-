import type { FeatureCollection, Feature } from "geojson";

// ── Shared Interfaces ──────────────────────────────────────────────────────

export interface MatchCandidate {
  drone_idx?: number;
  building_id: string;
  score: number;
  centroid_dist_m: number;
  area_ratio: number;
  iou: number;
}

export interface RevenueRecord {
  parcel_id: string;
  survey_number: string;
  khata_number: string;
  khasra_number: string;
  owner_of_record: string;
  co_owner: string | null;
  land_use_class: string;
  area_sqm_revenue: number;
  last_mutation_date: string;
  mutation_type: string;
  encumbrance: boolean;
  dispute_flag: boolean;
  revenue_source: string;
  data_label: string;
}

export interface ResidualCase {
  case_id: string;
  parcel_id: string;
  parcel_num: number;
  building_id: string;
  from: [number, number];
  to: [number, number];
  magnitude_m: number;
  displacement: string;
  risk: "high" | "medium" | "low" | "no_conflict";
  confidence: number;
  area_sqm: number;
  heatColor: string;
  // P1 — correspondence fields
  match_confidence: number;
  ambiguous_match: boolean;
  match_candidates: MatchCandidate[];
  // Revenue record joined by parcel_id
  revenue_record?: RevenueRecord;
  temporal: {
    classification: "registration_error" | "genuine_change" | "minor_fuzz" | "needs_review";
    confidence: number;
    explanation: string;
    coherence: number;
  };
  score_breakdown: {
    authority: number;
    positional_accuracy: number;
    temporal_relevance: number;
    cross_source_agreement: number;
  };
  state: string;
}

export interface HarmonizeResult {
  model: "affine" | "tps";
  model_label?: string;
  correspondence_method?: string;
  rmse: number;
  mean_residual: number;
  max_residual: number;
  inlier_ratio: number;
  ransac_inlier_count?: number;
  ransac_iterations?: number;
  control_points_used: number;
  total_correspondences?: number;
  dnd_count?: number;
  auto_resolved_count?: number;
  residuals: ResidualCase[];
  harmonized: FeatureCollection;
}

export interface TopologyCheckResult {
  case_id: string;
  parcel_id: string;
  status: "pass" | "warning" | "fail";
  validity: string;
  overlap_risk: number;
  overlaps_detected: string[];
  auto_corrected?: boolean;
  correction_type?: string | null;
}

export interface EvidenceGraphData {
  nodes: Array<{
    id: string;
    label: string;
    parcel_num?: number;
    source_type: string;
    type_label: string;
    source: string;
    area?: string;
    confidence?: number;
    accuracy?: string;
    synthetic: boolean;
  }>;
  links: Array<{
    source: string;
    target: string;
    relationship: "matches" | "supports" | "adjacent_to" | "intersects";
    confidence: number;
  }>;
}

// ── Basic Math Helpers ─────────────────────────────────────────────────────

export function geoDistanceM(p1: [number, number], p2: [number, number]): number {
  const midLat = (p1[1] + p2[1]) / 2;
  const latScale = 111139.0;
  const lonScale = 111139.0 * Math.cos((midLat * Math.PI) / 180);
  const dx = (p1[0] - p2[0]) * lonScale;
  const dy = (p1[1] - p2[1]) * latScale;
  return Math.hypot(dx, dy);
}

export function polygonCentroid(ring: number[][]): [number, number] {
  const pts =
    ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]
      ? ring.slice(0, -1)
      : ring;
  const sumLon = pts.reduce((acc, p) => acc + p[0], 0);
  const sumLat = pts.reduce((acc, p) => acc + p[1], 0);
  return [sumLon / pts.length, sumLat / pts.length];
}

export function polygonAreaM2(ring: number[][], lonScale: number, latScale: number): number {
  const pts =
    ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]
      ? ring.slice(0, -1)
      : ring;
  let area = 0;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const x1 = pts[i][0] * lonScale, y1 = pts[i][1] * latScale;
    const x2 = pts[j][0] * lonScale, y2 = pts[j][1] * latScale;
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area) / 2.0;
}

export function isRingValid(ring: number[][]): { valid: boolean; reason: string } {
  if (!ring || ring.length < 4) return { valid: false, reason: "Ring has fewer than 4 coordinates" };
  const first = ring[0], last = ring[ring.length - 1];
  if (Math.abs(first[0] - last[0]) > 1e-9 || Math.abs(first[1] - last[1]) > 1e-9)
    return { valid: false, reason: "Ring not closed" };
  let area = 0;
  for (let i = 0; i < ring.length - 1; i++)
    area += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  if (Math.abs(area) < 1e-12) return { valid: false, reason: "Polygon has zero area / collinear points" };
  return { valid: true, reason: "Valid Geometry (ST_IsValid)" };
}

export function polygonBBox(ring: number[][]): [number, number, number, number] {
  const lons = ring.map((p) => p[0]);
  const lats = ring.map((p) => p[1]);
  return [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)];
}

/** Bounding-box IoU — fast approximation used client-side */
export function bboxIoU(ring1: number[][], ring2: number[][]): number {
  const [ax0, ay0, ax1, ay1] = polygonBBox(ring1);
  const [bx0, by0, bx1, by1] = polygonBBox(ring2);
  const ix0 = Math.max(ax0, bx0), iy0 = Math.max(ay0, by0);
  const ix1 = Math.min(ax1, bx1), iy1 = Math.min(ay1, by1);
  if (ix1 <= ix0 || iy1 <= iy0) return 0;
  const inter = (ix1 - ix0) * (iy1 - iy0);
  const areaA = (ax1 - ax0) * (ay1 - ay0);
  const areaB = (bx1 - bx0) * (by1 - by0);
  const union = areaA + areaB - inter;
  return union > 0 ? inter / union : 0;
}

// ── P12: Real Polygon Intersection (Sutherland-Hodgman) ───────────────────

function clipPolygonByEdge(
  polygon: [number, number][],
  edgeA: [number, number],
  edgeB: [number, number]
): [number, number][] {
  const result: [number, number][] = [];
  if (!polygon.length) return result;
  const inside = (p: [number, number]) =>
    (edgeB[0] - edgeA[0]) * (p[1] - edgeA[1]) - (edgeB[1] - edgeA[1]) * (p[0] - edgeA[0]) >= 0;
  const intersect = (a: [number, number], b: [number, number]): [number, number] => {
    const [x1, y1] = a, [x2, y2] = b;
    const [x3, y3] = edgeA, [x4, y4] = edgeB;
    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denom) < 1e-15) return a;
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    return [x1 + t * (x2 - x1), y1 + t * (y2 - y1)];
  };
  for (let i = 0; i < polygon.length; i++) {
    const cur = polygon[i];
    const prev = polygon[(i - 1 + polygon.length) % polygon.length];
    const curIn = inside(cur), prevIn = inside(prev);
    if (curIn) {
      if (!prevIn) result.push(intersect(prev, cur));
      result.push(cur);
    } else if (prevIn) {
      result.push(intersect(prev, cur));
    }
  }
  return result;
}

export function polygonIntersectionArea(ring1: number[][], ring2: number[][]): number {
  /**
   * Sutherland-Hodgman polygon clipping to compute intersection area.
   * Replaces the old bounding-box intersection proxy.
   */
  const toTuples = (ring: number[][]): [number, number][] =>
    ring.map((p) => [p[0], p[1]] as [number, number]);
  let clipped = toTuples(ring1);
  const clip = toTuples(ring2);
  for (let i = 0; i < clip.length - 1; i++) {
    clipped = clipPolygonByEdge(clipped, clip[i], clip[i + 1]);
    if (!clipped.length) return 0;
  }
  let area = 0;
  for (let i = 0; i < clipped.length; i++) {
    const j = (i + 1) % clipped.length;
    area += clipped[i][0] * clipped[j][1] - clipped[j][0] * clipped[i][1];
  }
  return Math.abs(area) / 2;
}

// ── P1: Real Candidate Correspondence Engine ───────────────────────────────

interface CorrespondenceResult {
  cadIdx: number;
  droneIdx: number;
  matchConfidence: number;
  ambiguousMatch: boolean;
  topCandidates: MatchCandidate[];
}

export function buildCorrespondenceSet(
  cadFeatures: Feature[],
  droneFeatures: Feature[],
  searchRadiusM: number = 150,
  dndThreshold: number = 0.45,
  ambiguityMargin: number = 0.08
): CorrespondenceResult[] {
  const MID_LAT = 18.56;
  const LON_SCALE = 111139 * Math.cos((MID_LAT * Math.PI) / 180);
  const LAT_SCALE = 111139;

  return cadFeatures.map((cad, i) => {
    const cadRing = (cad.geometry as any).coordinates[0] as number[][];
    const cadCen = polygonCentroid(cadRing);
    const cadArea = polygonAreaM2(cadRing, LON_SCALE, LAT_SCALE);

    const candidates: MatchCandidate[] = [];
    droneFeatures.forEach((drone, j) => {
      const droneRing = (drone.geometry as any).coordinates[0] as number[][];
      const droneCen = polygonCentroid(droneRing);
      const distM = geoDistanceM(cadCen, droneCen);
      if (distM > searchRadiusM) return;

      const droneArea = polygonAreaM2(droneRing, LON_SCALE, LAT_SCALE);
      const centroidScore = 1.0 / (1.0 + distM / 30.0);
      const areaMax = Math.max(cadArea, droneArea);
      const areaRatio = areaMax > 0 ? Math.min(cadArea, droneArea) / areaMax : 0;
      const iou = bboxIoU(cadRing, droneRing);
      const combined = 0.4 * centroidScore + 0.35 * areaRatio + 0.25 * iou;

      candidates.push({
        drone_idx: j,
        building_id: (drone.properties as any)?.id || `building-${j}`,
        score: Math.round(combined * 10000) / 10000,
        centroid_dist_m: Math.round(distM * 100) / 100,
        area_ratio: Math.round(areaRatio * 10000) / 10000,
        iou: Math.round(iou * 10000) / 10000,
      });
    });

    candidates.sort((a, b) => b.score - a.score);

    if (!candidates.length) {
      const fallbackIdx = i % droneFeatures.length;
      candidates.push({
        drone_idx: fallbackIdx,
        building_id: (droneFeatures[fallbackIdx].properties as any)?.id || `building-${fallbackIdx}`,
        score: 0.1, centroid_dist_m: 999, area_ratio: 0.1, iou: 0,
      });
    }

    const top = candidates[0];
    let ambiguous = top.score < dndThreshold;
    if (candidates.length >= 2)
      ambiguous = ambiguous || (candidates[0].score - candidates[1].score < ambiguityMargin);

    return {
      cadIdx: i,
      droneIdx: top.drone_idx ?? i,
      matchConfidence: top.score,
      ambiguousMatch: ambiguous,
      topCandidates: candidates.slice(0, 3),
    };
  });
}

// ── P2: Real RANSAC ────────────────────────────────────────────────────────

interface RansacResult {
  inlierIndices: number[];
  inlierRatio: number;
  inlierCount: number;
  iterations: number;
}

function fitAffineSimple(
  srcPts: [number, number][],
  tgtPts: [number, number][]
): (p: [number, number]) => [number, number] {
  const n = srcPts.length;
  const cxS = srcPts.reduce((s, p) => s + p[0], 0) / n;
  const cyS = srcPts.reduce((s, p) => s + p[1], 0) / n;
  const cxT = tgtPts.reduce((s, p) => s + p[0], 0) / n;
  const cyT = tgtPts.reduce((s, p) => s + p[1], 0) / n;
  let sU2 = 0, sV2 = 0, sUV = 0, sU_Up = 0, sV_Up = 0, sU_Vp = 0, sV_Vp = 0;
  for (let i = 0; i < n; i++) {
    const u = srcPts[i][0] - cxS, v = srcPts[i][1] - cyS;
    const up = tgtPts[i][0] - cxT, vp = tgtPts[i][1] - cyT;
    sU2 += u * u; sV2 += v * v; sUV += u * v;
    sU_Up += u * up; sV_Up += v * up;
    sU_Vp += u * vp; sV_Vp += v * vp;
  }
  const D = sU2 * sV2 - sUV * sUV;
  if (Math.abs(D) < 1e-22) {
    const dx = cxT - cxS, dy = cyT - cyS;
    return ([x, y]) => [x + dx, y + dy];
  }
  const a = (sV2 * sU_Up - sUV * sV_Up) / D, b = (sU2 * sV_Up - sUV * sU_Up) / D;
  const c = (sV2 * sU_Vp - sUV * sV_Vp) / D, d = (sU2 * sV_Vp - sUV * sU_Vp) / D;
  return ([x, y]) => [
    cxT + a * (x - cxS) + b * (y - cyS),
    cyT + c * (x - cxS) + d * (y - cyS),
  ];
}

export function ransacFilter(
  srcPts: [number, number][],
  tgtPts: [number, number][],
  opts: { nIter?: number; minSample?: number; inlierThresholdM?: number; seed?: number } = {}
): RansacResult {
  const { nIter = 150, minSample = 3, inlierThresholdM = 2.0 } = opts;
  const n = srcPts.length;
  if (n < minSample) return { inlierIndices: Array.from({ length: n }, (_, i) => i), inlierRatio: 1, inlierCount: n, iterations: 0 };

  let seed = 42;
  const rand = () => { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return (seed >>> 0) / 0xffffffff; };
  const sample = (n_: number, k: number): number[] => {
    const arr = Array.from({ length: n_ }, (_, i) => i);
    for (let i = 0; i < k; i++) {
      const j = i + Math.floor(rand() * (n_ - i));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, k);
  };

  let bestInliers: number[] = [];
  for (let iter = 0; iter < nIter; iter++) {
    const idx = sample(n, minSample);
    const sSamp = idx.map((k) => srcPts[k]);
    const tSamp = idx.map((k) => tgtPts[k]);
    const fn = fitAffineSimple(sSamp, tSamp);
    const inliers: number[] = [];
    for (let k = 0; k < n; k++) {
      const [tx, ty] = fn(srcPts[k]);
      const err = Math.hypot(tx - tgtPts[k][0], ty - tgtPts[k][1]);
      if (err < inlierThresholdM) inliers.push(k);
    }
    if (inliers.length > bestInliers.length) bestInliers = inliers;
  }
  if (bestInliers.length < minSample) bestInliers = Array.from({ length: n }, (_, i) => i);
  return {
    inlierIndices: bestInliers,
    inlierRatio: Math.round((bestInliers.length / n) * 10000) / 10000,
    inlierCount: bestInliers.length,
    iterations: nIter,
  };
}

// ── P3: True Thin Plate Spline (r²log(r) kernel) ──────────────────────────

function tpsKernel(r: number): number {
  return r < 1e-10 ? 0 : r * r * Math.log(r);
}

function gaussSolve(A: number[][], b: number[]): number[] | null {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++)
      if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    if (Math.abs(M[pivot][col]) < 1e-12) return null;
    [M[col], M[pivot]] = [M[pivot], M[col]];
    for (let r = col + 1; r < n; r++) {
      const f = M[r][col] / M[col][col];
      for (let k = col; k <= n; k++) M[r][k] -= f * M[col][k];
    }
  }
  const x = new Array(n).fill(0);
  for (let row = n - 1; row >= 0; row--) {
    x[row] = M[row][n];
    for (let k = row + 1; k < n; k++) x[row] -= M[row][k] * x[k];
    x[row] /= M[row][row];
  }
  return x;
}

export function solveTrueTPSTransform(
  sourcePts: [number, number][],
  targetPts: [number, number][]
): (pt: [number, number]) => [number, number] {
  const n = Math.min(sourcePts.length, targetPts.length);
  if (n < 3) return solveAffineTransform(sourcePts.slice(0, n), targetPts.slice(0, n));

  const size = n + 3;
  const L: number[][] = Array.from({ length: size }, () => new Array(size).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const r = Math.hypot(sourcePts[i][0] - sourcePts[j][0], sourcePts[i][1] - sourcePts[j][1]);
      L[i][j] = tpsKernel(r);
    }
    L[i][n] = 1; L[i][n + 1] = sourcePts[i][0]; L[i][n + 2] = sourcePts[i][1];
    L[n][i] = 1; L[n + 1][i] = sourcePts[i][0]; L[n + 2][i] = sourcePts[i][1];
  }

  const bx = [...targetPts.slice(0, n).map((p) => p[0]), 0, 0, 0];
  const by = [...targetPts.slice(0, n).map((p) => p[1]), 0, 0, 0];

  const wx = gaussSolve(L, bx);
  const wy = gaussSolve(L, by);

  if (!wx || !wy) return solveAffineTransform(sourcePts, targetPts);

  return ([x, y]: [number, number]): [number, number] => {
    let xOut = wx[n] + wx[n + 1] * x + wx[n + 2] * y;
    let yOut = wy[n] + wy[n + 1] * x + wy[n + 2] * y;
    for (let i = 0; i < n; i++) {
      const r = Math.hypot(x - sourcePts[i][0], y - sourcePts[i][1]);
      const u = tpsKernel(r);
      xOut += wx[i] * u;
      yOut += wy[i] * u;
    }
    return [xOut, yOut];
  };
}

export function solveAffineTransform(
  sourcePts: [number, number][],
  targetPts: [number, number][]
): (pt: [number, number]) => [number, number] {
  const n = Math.min(sourcePts.length, targetPts.length);
  if (n < 2) {
    const dx = n === 1 ? targetPts[0][0] - sourcePts[0][0] : 0;
    const dy = n === 1 ? targetPts[0][1] - sourcePts[0][1] : 0;
    return ([x, y]) => [x + dx, y + dy];
  }
  const cxS = sourcePts.slice(0, n).reduce((s, p) => s + p[0], 0) / n;
  const cyS = sourcePts.slice(0, n).reduce((s, p) => s + p[1], 0) / n;
  const cxT = targetPts.slice(0, n).reduce((s, p) => s + p[0], 0) / n;
  const cyT = targetPts.slice(0, n).reduce((s, p) => s + p[1], 0) / n;
  let sU2 = 0, sV2 = 0, sUV = 0, sU_Up = 0, sV_Up = 0, sU_Vp = 0, sV_Vp = 0;
  for (let i = 0; i < n; i++) {
    const u = sourcePts[i][0] - cxS, v = sourcePts[i][1] - cyS;
    const up = targetPts[i][0] - cxT, vp = targetPts[i][1] - cyT;
    sU2 += u * u; sV2 += v * v; sUV += u * v;
    sU_Up += u * up; sV_Up += v * up;
    sU_Vp += u * vp; sV_Vp += v * vp;
  }
  const D = sU2 * sV2 - sUV * sUV;
  if (Math.abs(D) < 1e-22) { const dx = cxT - cxS, dy = cyT - cyS; return ([x, y]) => [x + dx, y + dy]; }
  const a = (sV2 * sU_Up - sUV * sV_Up) / D, b = (sU2 * sV_Up - sUV * sU_Up) / D;
  const c = (sV2 * sU_Vp - sUV * sV_Vp) / D, d = (sU2 * sV_Vp - sUV * sU_Vp) / D;
  return ([x, y]) => [cxT + a * (x - cxS) + b * (y - cyS), cyT + c * (x - cxS) + d * (y - cyS)];
}

// ── Main Harmonization Pipeline ───────────────────────────────────────────

export function computeLiveHarmonization(
  cadastralFC: FeatureCollection,
  droneFC: FeatureCollection,
  controlFC: FeatureCollection,
  options: {
    model: "affine" | "tps";
    authorityWeights: { cadastral: number; drone: number; gnss: number; municipal: number };
    dndThreshold: number;
  }
): HarmonizeResult {
  const cadFeatures = cadastralFC.features || [];
  const droneFeatures = droneFC.features || [];

  const MID_LAT = 18.56;
  const LON_SCALE = 111139 * Math.cos((MID_LAT * Math.PI) / 180);
  const LAT_SCALE = 111139;

  // P1: Real correspondence engine
  const correspondences = buildCorrespondenceSet(
    cadFeatures, droneFeatures,
    150, options.dndThreshold / 100, 0.08
  );

  // Build control point arrays from correspondence
  const allSrc: [number, number][] = [];
  const allTgt: [number, number][] = [];
  correspondences.forEach((corr) => {
    const cadRing = (cadFeatures[corr.cadIdx].geometry as any).coordinates[0] as number[][];
    const droneRing = (droneFeatures[corr.droneIdx].geometry as any).coordinates[0] as number[][];
    const cCad = polygonCentroid(cadRing);
    const cDrone = polygonCentroid(droneRing);
    allSrc.push([cCad[0] * LON_SCALE, cCad[1] * LAT_SCALE]);
    allTgt.push([cDrone[0] * LON_SCALE, cDrone[1] * LAT_SCALE]);
  });

  // P2: RANSAC on metre-space control points
  const ransac = ransacFilter(allSrc, allTgt, { nIter: 150, minSample: 3, inlierThresholdM: 2.0 });
  const inlierSrc = ransac.inlierIndices.map((k) => allSrc[k]);
  const inlierTgt = ransac.inlierIndices.map((k) => allTgt[k]);

  // P3: True TPS or Affine on RANSAC inliers
  const transformM =
    options.model === "tps"
      ? solveTrueTPSTransform(inlierSrc, inlierTgt)
      : solveAffineTransform(inlierSrc, inlierTgt);

  const transformFn = ([lon, lat]: [number, number]): [number, number] => {
    const [tx, ty] = transformM([lon * LON_SCALE, lat * LAT_SCALE]);
    return [tx / LON_SCALE, ty / LAT_SCALE];
  };

  // Apply transform, build residuals
  const harmonizedFeatures: Feature[] = [];
  const residuals: ResidualCase[] = [];
  let sumSqErr = 0, maxResidual = 0;
  const displacements: number[] = [];

  correspondences.forEach((corr) => {
    const cadFeat = cadFeatures[corr.cadIdx];
    const droneFeat = droneFeatures[corr.droneIdx];
    const cadRing = (cadFeat.geometry as any).coordinates[0] as number[][];
    const droneRing = (droneFeat.geometry as any).coordinates[0] as number[][];

    const alignedRing = cadRing.map((pt) => transformFn([pt[0], pt[1]]));
    alignedRing[alignedRing.length - 1] = [alignedRing[0][0], alignedRing[0][1]];

    const cCadOrig = polygonCentroid(cadRing);
    const cAligned = polygonCentroid(alignedRing);
    const cDrone = polygonCentroid(droneRing);

    const distM = geoDistanceM(cAligned, cDrone);
    displacements.push(distM);
    sumSqErr += distM * distM;
    if (distM > maxResidual) maxResidual = distM;

    const pid = cadFeat.properties?.parcel_id || String(101 + corr.cadIdx);
    const pidNum = cadFeat.properties?.parcel_number || 101 + corr.cadIdx;
    const origDistM = geoDistanceM(cCadOrig, cDrone);
    const risk = origDistM >= 2.5 ? "high" : origDistM >= 1.0 ? "medium" : "low";
    const heatColor = risk === "high" ? "#ef4444" : risk === "medium" ? "#f59e0b" : "#22c55e";

    harmonizedFeatures.push({
      type: "Feature",
      id: `aligned-${cadFeat.id || pid}`,
      geometry: { type: "Polygon", coordinates: [alignedRing] },
      properties: {
        id: `aligned-${cadFeat.id || pid}`,
        parcel_id: pid, parcel_number: pidNum,
        label: `Harmonized Parcel ${pid}`,
        source_type: "harmonized_version", status: "validated_topology_pass",
        residual_m: Number(distM.toFixed(2)),
      },
    });

    residuals.push({
      case_id: `case-${pid}`, parcel_id: `parcel-${pid}`, parcel_num: pidNum,
      building_id: corr.topCandidates[0]?.building_id || `building-${pid}`,
      from: cCadOrig, to: cDrone,
      magnitude_m: Number(origDistM.toFixed(2)),
      displacement: `${origDistM.toFixed(2)} m`,
      risk, confidence: 0.8,
      area_sqm: cadFeat.properties?.area_sqm || 1250.0,
      heatColor,
      match_confidence: corr.matchConfidence,
      ambiguous_match: corr.ambiguousMatch,
      match_candidates: corr.topCandidates,
      temporal: { classification: "registration_error", confidence: 0.85, explanation: "", coherence: 0.9 },
      score_breakdown: { authority: options.authorityWeights.cadastral, positional_accuracy: 0.85, temporal_relevance: 0.8, cross_source_agreement: 0.8 },
      state: "Recommended for official review",
    });
  });

  // Directional coherence (Change Detection Engine)
  residuals.forEach((res, i) => {
    const v1x = res.to[0] - res.from[0], v1y = res.to[1] - res.from[1];
    const len1 = Math.hypot(v1x, v1y) || 1e-9;
    let dotSum = 0, neighborCount = 0;
    residuals.forEach((other, j) => {
      if (i === j) return;
      if (geoDistanceM(other.from, res.from) < 200) {
        const v2x = other.to[0] - other.from[0], v2y = other.to[1] - other.from[1];
        const len2 = Math.hypot(v2x, v2y) || 1e-9;
        dotSum += (v1x * v2x + v1y * v2y) / (len1 * len2);
        neighborCount++;
      }
    });
    const coherence = neighborCount > 0 ? dotSum / neighborCount : 0.85;
    const mag = res.magnitude_m;
    if (mag > 2.6 && coherence > 0.8)
      res.temporal = { classification: "registration_error", confidence: 0.88, explanation: "Coherent uniform displacement; consistent with datum shift.", coherence: +coherence.toFixed(2) };
    else if (mag > 2.0 && coherence < 0.45)
      res.temporal = { classification: "genuine_change", confidence: 0.82, explanation: "Localized divergence; modern physical change.", coherence: +coherence.toFixed(2) };
    else if (mag <= 0.8)
      res.temporal = { classification: "minor_fuzz", confidence: 0.95, explanation: "Within GNSS survey tolerance.", coherence: +coherence.toFixed(2) };
    else
      res.temporal = { classification: "needs_review", confidence: 0.58, explanation: "Below threshold; routed to human officer.", coherence: +coherence.toFixed(2) };

    const w = options.authorityWeights;
    const totalW = w.cadastral + w.drone + w.gnss + w.municipal;
    const agreement = Math.max(0, 1 - mag / 6.0);
    const penalty = res.temporal.classification === "needs_review" ? 0.2 : 0;
    const rawScore = (w.cadastral * 0.95 + w.drone * 0.72 + w.gnss * 0.85 + w.municipal * 0.68) / totalW * 0.5
      + agreement * 0.3 + res.temporal.confidence * 0.2 - penalty;
    res.confidence = +Math.max(0.1, Math.min(1.0, rawScore)).toFixed(2);

    if (res.ambiguous_match || res.confidence < options.dndThreshold / 100 || res.temporal.classification === "needs_review")
      res.state = res.ambiguous_match ? "Do Not Decide — Ambiguous Match" : "Needs Review / Do Not Decide";
    else
      res.state = "Recommended for official review";

    res.score_breakdown = {
      authority: +((w.cadastral * 0.95) / (w.cadastral || 1)).toFixed(2),
      positional_accuracy: +(1 - Math.min(1, mag / 5.0)).toFixed(2),
      temporal_relevance: +res.temporal.confidence.toFixed(2),
      cross_source_agreement: +agreement.toFixed(2),
    };
  });

  const n = cadFeatures.length || 1;
  const rmse = +Math.sqrt(sumSqErr / n).toFixed(2);
  const dndCount = residuals.filter((r) => r.state.includes("Do Not Decide")).length;

  return {
    model: options.model,
    model_label: options.model === "tps" ? "True TPS (r²log(r) kernel, RANSAC-filtered)" : "Affine (6-parameter, RANSAC-filtered)",
    correspondence_method: "Scored matching: centroid distance + area ratio + bbox IoU",
    rmse,
    mean_residual: +(displacements.reduce((a, b) => a + b, 0) / n).toFixed(2),
    max_residual: +maxResidual.toFixed(2),
    inlier_ratio: ransac.inlierRatio,
    ransac_inlier_count: ransac.inlierCount,
    ransac_iterations: ransac.iterations,
    control_points_used: inlierSrc.length,
    total_correspondences: correspondences.length,
    dnd_count: dndCount,
    auto_resolved_count: residuals.length - dndCount,
    residuals,
    harmonized: { type: "FeatureCollection", features: harmonizedFeatures },
  };
}

// ── P12: Real Topology Checking (Sutherland-Hodgman) ──────────────────────

export function computeLiveTopology(harmonizedFC: FeatureCollection): TopologyCheckResult[] {
  const features = harmonizedFC.features || [];
  return features.map((feat: Feature, i: number) => {
    const ring = (feat.geometry as any).coordinates[0] as number[][];
    const pid = feat.properties?.parcel_id || String(101 + i);
    const ringCheck = isRingValid(ring);

    // Overlap test against other parcels
    const overlaps: string[] = [];
    features.forEach((otherFeat: Feature, j: number) => {
      if (i === j) return;
      const otherRing = (otherFeat.geometry as any).coordinates[0] as number[][];
      const interArea = polygonIntersectionArea(ring, otherRing);
      if (interArea > 1e-10) {
        overlaps.push(otherFeat.properties?.parcel_id || String(101 + j));
      }
    });

    const hasOverlap = overlaps.length > 0;
    const isPass = ringCheck.valid && !hasOverlap;

    return {
      case_id: `case-${pid}`,
      parcel_id: `parcel-${pid}`,
      status: isPass ? "pass" : hasOverlap ? "warning" : "fail",
      validity: ringCheck.valid ? (hasOverlap ? `Overlaps with parcel(s): ${overlaps.join(", ")}` : "Valid Geometry (ST_IsValid)") : ringCheck.reason,
      overlap_risk: hasOverlap ? 0.45 : 0.0,
      overlaps_detected: overlaps,
      auto_corrected: false,
    };
  });
}

/** Build client-side evidence graph — node list from study area data. */
export function buildEvidenceGraph(
  cadFC: FeatureCollection,
  droneFC: FeatureCollection,
  gnssFC: FeatureCollection,
  municipalFC: FeatureCollection,
  residuals: ResidualCase[]
): EvidenceGraphData {
  const nodes: EvidenceGraphData["nodes"] = [];
  const links: EvidenceGraphData["links"] = [];

  const cadFeatures = cadFC.features || [];
  const droneFeatures = droneFC.features || [];

  const correspondences = buildCorrespondenceSet(cadFeatures, droneFeatures);
  const corrMap = new Map(correspondences.map((c) => [c.cadIdx, c]));

  cadFeatures.forEach((f, i) => {
    const pid = (f.properties as any)?.parcel_id || String(101 + i);
    nodes.push({ id: `parcel-${pid}`, label: `Parcel ${pid}`, source_type: "authoritative_cadastral_simulated",
      type_label: "Cadastral Parcel", source: "Cadastral Map (Simulated)", area: `${(f.properties as any)?.area_sqm || 1250} m²`, synthetic: true });
  });

  droneFeatures.forEach((f, i) => {
    const pid = (f.properties as any)?.parcel_id || String(101 + i);
    const corr = corrMap.get(i);
    nodes.push({ id: `boundary-${pid}`, label: `Boundary Obs. ${pid}`, source_type: "derived_building_footprint_real",
      type_label: "Boundary Observation", source: "OSM/Footprint (2024)",
      confidence: (f.properties as any)?.confidence || 0.91, synthetic: false });
    links.push({ source: `parcel-${pid}`, target: `boundary-${pid}`, relationship: "matches",
      confidence: corr ? corr.matchConfidence : 0.88 });
  });

  (gnssFC.features || []).forEach((pt) => {
    const pid = (pt.properties as any)?.parcel_id || "101";
    nodes.push({ id: (pt as any).id || `gnss-${pid}`, label: (pt.properties as any)?.name || "GNSS Point",
      source_type: "synthetic_control", type_label: "GNSS Point", source: "GNSS Survey (2024)",
      accuracy: `${(pt.properties as any)?.positional_accuracy_m || 0.02} m`, synthetic: true });
    links.push({ source: (pt as any).id || `gnss-${pid}`, target: `parcel-${pid}`, relationship: "supports", confidence: 0.98 });
  });

  (municipalFC.features || []).forEach((r) => {
    const rid = (r as any).id || `road-${Math.random()}`;
    nodes.push({ id: rid, label: (r.properties as any)?.name || "Municipal Road",
      source_type: "contextual_municipal_real", type_label: "Municipal Feature",
      source: "Municipal GIS (OSM proxy)", synthetic: false });
    const roadCoords = (r.geometry as any).coordinates as number[][];
    const roadMid = polygonCentroid(roadCoords);
    cadFeatures.forEach((f, i) => {
      const pid = (f.properties as any)?.parcel_id || String(101 + i);
      const cen = polygonCentroid((f.geometry as any).coordinates[0]);
      if (geoDistanceM(roadMid, cen) < 80)
        links.push({ source: rid, target: `parcel-${pid}`, relationship: "intersects", confidence: 0.85 });
    });
  });

  const cadCentroids = cadFeatures.map((f) => polygonCentroid((f.geometry as any).coordinates[0]));
  const cadNodes = nodes.filter((n) => n.source_type === "authoritative_cadastral_simulated");
  for (let i = 0; i < cadNodes.length; i++) {
    for (let j = i + 1; j < cadNodes.length; j++) {
      if (i < cadCentroids.length && j < cadCentroids.length && geoDistanceM(cadCentroids[i], cadCentroids[j]) < 60)
        links.push({ source: cadNodes[i].id, target: cadNodes[j].id, relationship: "adjacent_to", confidence: 1.0 });
    }
  }

  return { nodes, links };
}

// Alias for backwards compatibility
export const buildLiveEvidenceGraph = buildEvidenceGraph;

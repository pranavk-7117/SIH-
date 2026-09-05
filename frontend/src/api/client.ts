import { STUDY_AREAS, StudyArea } from "../studyAreas";
import {
  computeLiveHarmonization,
  computeLiveTopology,
  buildLiveEvidenceGraph,
  HarmonizeResult,
  TopologyCheckResult,
  EvidenceGraphData,
  ResidualCase,
} from "../utils/geoEngine";

const API_BASE = import.meta.env.VITE_API_URL || "";

export interface HarmonizeParams {
  areaId: string;
  model: "affine" | "tps";
  authorityWeights: {
    cadastral: number;
    drone: number;
    gnss: number;
    municipal: number;
  };
  dndThreshold: number;
}

export interface ReviewDecisionPayload {
  case_id: string;
  parcel_id: string;
  decision: "accept" | "reject" | "adjust" | "escalate" | "dnd";
  reviewer: string;
  note: string;
}

class ApiClient {
  private backendAvailable: boolean | null = null;

  async checkBackend(): Promise<boolean> {
    if (this.backendAvailable !== null) return this.backendAvailable;
    if (!API_BASE) {
      this.backendAvailable = false;
      return false;
    }
    try {
      const res = await fetch(`${API_BASE}/health`, { method: "GET", signal: AbortSignal.timeout(1500) });
      this.backendAvailable = res.ok;
    } catch {
      this.backendAvailable = false;
    }
    return this.backendAvailable;
  }

  getStudyArea(areaId: string): StudyArea {
    return STUDY_AREAS[areaId] || STUDY_AREAS["pune_kharadi"];
  }

  async runHarmonization(params: HarmonizeParams): Promise<HarmonizeResult> {
    const area = this.getStudyArea(params.areaId);

    // If backend is configured, attempt backend calculation
    if (await this.checkBackend()) {
      try {
        const res = await fetch(`${API_BASE}/harmonize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });
        if (res.ok) {
          const json = await res.json();
          return json;
        }
      } catch (err) {
        console.warn("Backend harmonize error, falling back to local geoEngine:", err);
      }
    }

    // Live In-Browser Computational Engine (Client-side math calculation)
    return computeLiveHarmonization(
      area.cadastral,
      area.buildings,
      area.control,
      {
        model: params.model,
        authorityWeights: params.authorityWeights,
        dndThreshold: params.dndThreshold,
      }
    );
  }

  async runTopologyCheck(harmonizedFC: GeoJSON.FeatureCollection): Promise<TopologyCheckResult[]> {
    if (await this.checkBackend()) {
      try {
        const res = await fetch(`${API_BASE}/validate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ harmonized: harmonizedFC }),
        });
        if (res.ok) {
          const json = await res.json();
          return json.results;
        }
      } catch (err) {
        console.warn("Backend topology error, falling back to local geoEngine:", err);
      }
    }

    return computeLiveTopology(harmonizedFC);
  }

  async getEvidenceGraph(areaId: string, residuals: ResidualCase[]): Promise<EvidenceGraphData> {
    const area = this.getStudyArea(areaId);

    if (await this.checkBackend()) {
      try {
        const res = await fetch(`${API_BASE}/graph?area_id=${areaId}`);
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn("Backend graph error, falling back to local geoEngine:", err);
      }
    }

    return buildLiveEvidenceGraph(
      area.cadastral,
      area.buildings,
      area.control,
      area.municipal,
      residuals
    );
  }

  async submitReview(payload: ReviewDecisionPayload): Promise<{ version: number; stored: boolean }> {
    if (await this.checkBackend()) {
      try {
        const res = await fetch(`${API_BASE}/review`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn("Backend review error, storing locally:", err);
      }
    }

    return { version: 2, stored: true };
  }
}

export const api = new ApiClient();

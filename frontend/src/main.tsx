import React, { useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom/client";
import { Sidebar, Screen } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { LandingPageView } from "./components/LandingPageView";
import { DashboardView } from "./components/DashboardView";
import { NewInvestigationView } from "./components/NewInvestigationView";
import { UploadIngestView } from "./components/UploadIngestView";
import { DataValidationView } from "./components/DataValidationView";
import { CRSNormalizationView } from "./components/CRSNormalizationView";
import { SourceViewerView } from "./components/SourceViewerView";
import { AIExtractionView } from "./components/AIExtractionView";
import { EvidenceGraphView } from "./components/EvidenceGraphView";
import { HarmonizationView } from "./components/HarmonizationView";
import { ConflictDashboardView } from "./components/ConflictDashboardView";
import { DiscrepancyMapView } from "./components/DiscrepancyMapView";
import { EvidenceCardView } from "./components/EvidenceCardView";
import { ReviewDecisionView } from "./components/ReviewDecisionView";
import { ReportsExportView } from "./components/ReportsExportView";
import { AuditTrailView, AuditEntry } from "./components/AuditTrailView";
import { SettingsView } from "./components/SettingsView";
import { STUDY_AREAS } from "./studyAreas";
import { api } from "./api/client";
import { HarmonizeResult, EvidenceGraphData } from "./utils/geoEngine";
import "maplibre-gl/dist/maplibre-gl.css";
import "./styles.css";

export interface AuthorityWeights {
  cadastral: number;
  drone: number;
  gnss: number;
  municipal: number;
}

export const DEFAULT_WEIGHTS: AuthorityWeights = {
  cadastral: 0.95,
  drone: 0.72,
  gnss: 0.85,
  municipal: 0.68,
};

const AREA_IDS = Object.keys(STUDY_AREAS);

const makeAuditEntry = (action: string, details: string, type: AuditEntry["type"]): AuditEntry => ({
  id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  timestamp: new Date().toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }),
  action,
  user: type === "decision" ? "AO (Land Records Officer)" : "System",
  details,
  type,
});

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>("dashboard");
  const [selectedParcelId, setSelectedParcelId] = useState<string>("parcel-101");
  const [activeAreaId, setActiveAreaId] = useState<string>("pune_kharadi");
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [activeInvestigation, setActiveInvestigation] = useState<any>(null);
  const [investigationsList, setInvestigationsList] = useState<any[]>([]);
  const [uploadedSources, setUploadedSources] = useState<any[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load stored investigations on mount from SQLite DB & localStorage
  useEffect(() => {
    const loadStoredInvestigations = async () => {
      try {
        const list = await api.getInvestigations();
        setInvestigationsList(list || []);

        const storedId = localStorage.getItem("bhumi_active_inv_id");
        const targetId = storedId || (list && list.length > 0 ? list[0].id : null);
        if (targetId) {
          const inv = await api.getInvestigation(targetId);
          if (inv && inv.id) {
            setActiveInvestigation(inv);
            if (inv.sources_list && inv.sources_list.length > 0) {
              const restored = inv.sources_list.map((s: any) => ({
                source: s.source_key.charAt(0).toUpperCase() + s.source_key.slice(1),
                file: s.filename,
                format: s.file_format,
                crs: s.original_crs,
                features: String(s.features_count || 1),
                status: s.status === "VALID" ? "Valid" : "Warning",
              }));
              setUploadedSources(restored);

              const restoredLayers: any = {};
              for (const s of inv.sources_list) {
                if (s.data_json) {
                  try {
                    restoredLayers[s.source_key] = JSON.parse(s.data_json);
                  } catch {}
                }
              }
              if (Object.keys(restoredLayers).length > 0) {
                setCustomLayers(restoredLayers);
              }
            }
          }
        }
      } catch (err) {
        console.warn("Failed to load stored investigations:", err);
      }
    };
    loadStoredInvestigations();
  }, []);

  const handleSelectInvestigation = async (invId: string) => {
    try {
      const inv = await api.getInvestigation(invId);
      if (inv && inv.id) {
        setActiveInvestigation(inv);
        localStorage.setItem("bhumi_active_inv_id", inv.id);
        if (inv.sources_list && inv.sources_list.length > 0) {
          const restored = inv.sources_list.map((s: any) => ({
            source: s.source_key.charAt(0).toUpperCase() + s.source_key.slice(1),
            file: s.filename,
            format: s.file_format,
            crs: s.original_crs,
            features: String(s.features_count || 1),
            status: s.status === "VALID" ? "Valid" : "Warning",
          }));
          setUploadedSources(restored);

          const restoredLayers: any = {};
          for (const s of inv.sources_list) {
            if (s.data_json) {
              try {
                restoredLayers[s.source_key] = JSON.parse(s.data_json);
              } catch {}
            }
          }
          setCustomLayers(restoredLayers);
        } else {
          setUploadedSources([]);
          setCustomLayers({});
        }
        showToast(`Loaded investigation ${inv.id}: ${inv.name}`);
      }
    } catch (err) {
      console.error("Error selecting investigation:", err);
    }
  };

  const handleInvestigationCreated = (inv: any) => {
    setActiveInvestigation(inv);
    localStorage.setItem("bhumi_active_inv_id", inv.id);
    setInvestigationsList((prev) => [inv, ...prev.filter((i) => i.id !== inv.id)]);
    showToast(`✓ Investigation ${inv.id} created and stored in database`);
  };

  // Live computation state
  const [harmonizeResult, setHarmonizeResult] = useState<HarmonizeResult | null>(null);
  const [graphData, setGraphData] = useState<EvidenceGraphData | null>(null);
  const [isComputing, setIsComputing] = useState<boolean>(false);
  const [registrationModel, setRegistrationModel] = useState<"affine" | "tps">("tps");
  const [authorityWeights, setAuthorityWeights] = useState<AuthorityWeights>(DEFAULT_WEIGHTS);
  const [dndThreshold, setDndThreshold] = useState<number>(62);
  const [customLayers, setCustomLayers] = useState<{
    cadastral?: any;
    buildings?: any;
    control?: any;
    municipal?: any;
    utilities?: any;
    dsm?: any;
    revenue?: any;
  }>({});

  const activeArea = STUDY_AREAS[activeAreaId];

  // ── Live Harmonization ─────────────────────────────────────────────────
  const runHarmonization = useCallback(async (overrides?: { customLayers?: typeof customLayers }) => {
    if (!activeArea) return;
    setIsComputing(true);
    const startTs = Date.now();
    const activeCustom = overrides?.customLayers || customLayers;
    try {
      const result = await api.runHarmonization({
        areaId: activeAreaId,
        model: registrationModel,
        authorityWeights,
        dndThreshold,
        customLayers: Object.keys(activeCustom).length > 0 ? activeCustom : undefined,
      });
      setHarmonizeResult(result);

      const elapsedMs = Date.now() - startTs;
      addAuditEntry(
        makeAuditEntry(
          `Live ${registrationModel.toUpperCase()} Registration & Alignment`,
          `Computed ${result.model.toUpperCase()} transform on ${result.control_points_used} control points. ` +
          `Post-align RMSE: ${result.rmse} m | Max displacement: ${result.max_residual} m | Inlier ratio: ${result.inlier_ratio}%. ` +
          `Computed in ${elapsedMs} ms.`,
          "process"
        )
      );

      // Auto-build evidence graph with fresh residuals
      const g = await api.getEvidenceGraph(
        activeAreaId,
        result.residuals,
        Object.keys(activeCustom).length > 0 ? activeCustom : undefined
      );
      setGraphData(g);
      addAuditEntry(
        makeAuditEntry(
          "Evidence Graph Rebuilt",
          `Graph updated with ${g.nodes.length} nodes and ${g.links.length} edges across ${activeArea.name}.`,
          "process"
        )
      );

      showToast(`✓ Live ${registrationModel.toUpperCase()} harmonization complete — RMSE: ${result.rmse} m`);
    } catch (err) {
      showToast("⚠ Computation failed — check console for details.");
      console.error("Harmonization error:", err);
    } finally {
      setIsComputing(false);
    }
  }, [activeAreaId, registrationModel, authorityWeights, dndThreshold, customLayers]);

  // Run on mount only when active investigation or uploaded data exists
  useEffect(() => {
    if (activeInvestigation || Object.keys(customLayers).length > 0) {
      runHarmonization();
    }
  }, [activeAreaId, registrationModel, activeInvestigation]);

  // ── Area Switching ─────────────────────────────────────────────────────
  const handleAreaChange = (areaId: string) => {
    setActiveAreaId(areaId);
    setSelectedParcelId(`parcel-${areaId === "pune_kharadi" ? "101" : areaId === "pmrda_wagholi" ? "201" : "301"}`);
    addAuditEntry(
      makeAuditEntry(
        "Study Area Switched",
        `Active pilot area changed to: ${STUDY_AREAS[areaId]?.name || areaId}. Live re-computation triggered.`,
        "process"
      )
    );
  };

  // ── Settings Change → Re-compute ──────────────────────────────────────
  const handleWeightsChange = (weights: AuthorityWeights) => {
    setAuthorityWeights(weights);
  };

  const handleApplySettings = () => {
    runHarmonization();
    showToast("Settings applied — live re-computation triggered.");
  };

  // ── Helpers ────────────────────────────────────────────────────────────
  const addAuditEntry = (entry: AuditEntry) => {
    setAuditLog((prev) => [entry, ...prev]);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDecisionSubmit = async (decision: string, notes: string, parcelId: string) => {
    const parcelNum = parcelId.replace("parcel-", "");
    const resp = await api.submitReview({
      case_id: `case-${parcelNum}`,
      parcel_id: parcelId,
      decision: decision as any,
      reviewer: "AO (Land Records Officer)",
      note: notes || "Verified against evidence card",
    });
    addAuditEntry(
      makeAuditEntry(
        `Decision: ${decision.toUpperCase()}`,
        `Parcel ${parcelNum}: ${decision.toUpperCase()} submitted. Note: "${notes || "Verified against evidence card"}" — Version ${resp.version} created. Original legal record untouched.`,
        "decision"
      )
    );
    showToast(`Decision '${decision.toUpperCase()}' recorded for Parcel ${parcelNum}. Audit trail updated.`);
  };

  const handleExportData = () => {
    const residuals = harmonizeResult?.residuals || [];
    const harmonized = harmonizeResult?.harmonized || activeArea?.buildings;
    const exportPayload = {
      project: "BHUMI-FUSE Urban Land Record Harmonization",
      pilot_area: activeArea?.name || "Kharadi Sector 12",
      timestamp: new Date().toISOString(),
      model_used: registrationModel,
      rmse_m: harmonizeResult?.rmse,
      control_points: harmonizeResult?.control_points_used,
      authority_weights: authorityWeights,
      provenance: activeArea?.provenance,
      harmonized_parcels: harmonized,
      discrepancies: residuals,
      audit_history: auditLog,
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const a = document.createElement("a");
    a.setAttribute("href", dataStr);
    a.setAttribute("download", `bhumi_fuse_${activeAreaId}_harmonized_${Date.now()}.geojson`);
    document.body.appendChild(a);
    a.click();
    a.remove();
    addAuditEntry(
      makeAuditEntry(
        "GeoJSON Package Exported",
        `Exported harmonized GeoJSON for ${activeArea?.name} (RMSE: ${harmonizeResult?.rmse} m).`,
        "export"
      )
    );
    showToast("Harmonized GeoJSON package downloaded successfully.");
  };

  const handleNormalizeTrigger = () => {
    addAuditEntry(makeAuditEntry("Sources Normalized (EPSG:4326)", "Transformed all 4 ingested sources to common WGS84 coordinate reference system.", "process"));
    showToast("All 4 sources normalized to EPSG:4326 (WGS84). Ready to harmonize.");
  };

  const handleUploadData = (
    layerType: "cadastral" | "buildings" | "control" | "municipal" | "utilities" | "dsm" | "revenue",
    geojson: any,
    meta: any
  ) => {
    const updatedCustom = {
      ...customLayers,
      [layerType]: geojson,
    };
    setCustomLayers(updatedCustom);

    const newSource = {
      source: layerType.charAt(0).toUpperCase() + layerType.slice(1),
      file: meta?.filename || `${layerType}_upload.${meta?.file_format || "geojson"}`,
      format: meta?.file_format?.toUpperCase() || (meta?.filename?.endsWith(".csv") ? "CSV" : meta?.filename?.endsWith(".tif") ? "GeoTIFF" : "GeoJSON"),
      crs: meta?.crs || (layerType === "revenue" ? "-" : "EPSG:4326"),
      features: String(meta?.features || meta?.feature_count || meta?.points_parsed || (geojson?.features?.length || 1)),
      status: "Valid" as const,
    };
    setUploadedSources((prev) => {
      const filtered = prev.filter((s) => s.source.toLowerCase() !== layerType.toLowerCase());
      return [...filtered, newSource];
    });

    addAuditEntry(
      makeAuditEntry(
        `Custom ${layerType.toUpperCase()} Ingested`,
        `User uploaded ${meta?.filename || layerType}: ${meta?.features || meta?.feature_count || meta?.points_parsed || "valid"} features parsed and activated in session.`,
        "upload"
      )
    );
    showToast(`✓ Ingested custom ${layerType} dataset — updating session and re-harmonizing...`);
    runHarmonization({ customLayers: updatedCustom });
  };

  const crsRows = uploadedSources.map((s) => ({
    source: s.source,
    orig: s.crs,
    target: s.crs === "-" ? "Attribute only" : "EPSG:32643",
    trans: s.crs === "-" ? "Attribute only" : s.crs === "EPSG:32643" ? "No change" : "Reprojected",
    status: "Completed",
  }));

  // Compute dynamic bounds from uploaded cadastral so map re-centers on user data
  const computeBoundsFromFC = (fc: any): [number, number, number, number] | null => {
    const features = fc?.features || [];
    const pts: number[][] = [];
    for (const f of features) {
      const ring = f?.geometry?.coordinates?.[0];
      if (Array.isArray(ring)) pts.push(...ring);
    }
    if (pts.length === 0) return null;
    const lons = pts.map((p) => p[0]);
    const lats = pts.map((p) => p[1]);
    return [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)];
  };

  const uploadedBounds = customLayers.cadastral ? computeBoundsFromFC(customLayers.cadastral) : null;
  const uploadedCenter: [number, number] | null = uploadedBounds
    ? [(uploadedBounds[0] + uploadedBounds[2]) / 2, (uploadedBounds[1] + uploadedBounds[3]) / 2]
    : null;

  const hasActiveSession = Boolean(activeInvestigation || Object.keys(customLayers).length > 0);

  // Build data bundle for views from live results
  const liveData = {
    ...(hasActiveSession ? activeArea : {}),
    name: activeInvestigation?.name || null,
    cadastral: customLayers.cadastral || (hasActiveSession ? activeArea?.cadastral : { type: "FeatureCollection", features: [] }),
    buildings: customLayers.buildings || (hasActiveSession ? activeArea?.buildings : { type: "FeatureCollection", features: [] }),
    control: customLayers.control || (hasActiveSession ? activeArea?.control : { type: "FeatureCollection", features: [] }),
    municipal: customLayers.municipal || (hasActiveSession ? activeArea?.municipal : { type: "FeatureCollection", features: [] }),
    // Override map center/bounds when user uploads data from a different area
    ...(uploadedBounds ? { bounds: uploadedBounds } : {}),
    ...(uploadedCenter ? { center: uploadedCenter } : {}),
    residuals: harmonizeResult?.residuals || [],
    harmonized: harmonizeResult?.harmonized || { type: "FeatureCollection", features: [] },
    harmonize_meta: harmonizeResult
      ? {
          model: harmonizeResult.model,
          rmse: harmonizeResult.rmse,
          mean_residual: harmonizeResult.mean_residual,
          max_residual: harmonizeResult.max_residual,
          inlier_ratio: harmonizeResult.inlier_ratio,
          ransac_inlier_count: harmonizeResult.ransac_inlier_count,
          ransac_iterations: harmonizeResult.ransac_iterations,
          total_correspondences: harmonizeResult.total_correspondences,
          control_points_used: harmonizeResult.control_points_used,
          dnd_count: harmonizeResult.dnd_count,
          auto_resolved_count: harmonizeResult.auto_resolved_count,
        }
      : null,
  };


  const selectedParcelNum = parseInt(selectedParcelId.replace("parcel-", ""), 10);
  const selectedCase = harmonizeResult?.residuals.find((r) => r.parcel_num === selectedParcelNum)
    || harmonizeResult?.residuals[0];

  if (currentScreen === "landing") {
    return <LandingPageView onEnterApp={(s) => setCurrentScreen(s || "dashboard")} />;
  }

  return (
    <div className="app-container">
      <Sidebar currentScreen={currentScreen} onSelectScreen={setCurrentScreen} />

      <div className="main-wrapper">
        <Topbar
          currentScreen={currentScreen}
          selectedDistrict={activeInvestigation?.name || "BHUMI-FUSE"}
          areaIds={AREA_IDS}
          activeAreaId={activeAreaId}
          onAreaChange={handleAreaChange}
          onNavigate={setCurrentScreen}
          isComputing={isComputing}
          investigations={investigationsList}
          activeInvestigation={activeInvestigation}
          onSelectInvestigation={handleSelectInvestigation}
        />

        <main className="main-content">
          {currentScreen === "dashboard" && (
            <DashboardView
              data={liveData}
              onSelectParcel={(id) => { setSelectedParcelId(id); setCurrentScreen("review"); }}
              onNavigate={setCurrentScreen}
            />
          )}
          {currentScreen === "new_investigation" && (
            <NewInvestigationView
              onInvestigationCreated={handleInvestigationCreated}
              onNavigate={setCurrentScreen}
            />
          )}
          {currentScreen === "upload" && (
            <UploadIngestView
              onNormalize={handleNormalizeTrigger}
              onUploadData={handleUploadData}
              onNavigate={setCurrentScreen}
              onContinue={() => setCurrentScreen("validation")}
              investigation={activeInvestigation}
            />
          )}
          {currentScreen === "validation" && (
            <DataValidationView
              investigation={activeInvestigation}
              uploadedFiles={uploadedSources}
              onNavigate={setCurrentScreen}
            />
          )}
          {currentScreen === "crs_normalization" && (
            <CRSNormalizationView
              investigation={activeInvestigation}
              crsRows={crsRows}
              onNavigate={setCurrentScreen}
            />
          )}
          {currentScreen === "sources" && (
            <SourceViewerView
              data={liveData}
              onContinue={() => setCurrentScreen("extract")}
            />
          )}
          {currentScreen === "extract" && (
            <AIExtractionView
              data={liveData}
              onNavigate={setCurrentScreen}
              onContinue={() => setCurrentScreen("harmonize")}
            />
          )}
          {currentScreen === "harmonize" && (
            <HarmonizationView
              data={liveData}
              harmonizeResult={harmonizeResult}
              isComputing={isComputing}
              model={registrationModel}
              onModelChange={(m) => setRegistrationModel(m)}
              onRunHarmonize={runHarmonization}
              onNavigate={setCurrentScreen}
              onContinue={() => setCurrentScreen("conflict_dashboard")}
            />
          )}
          {currentScreen === "conflict_dashboard" && (
            <ConflictDashboardView
              data={liveData}
              onSelectParcel={(id) => { setSelectedParcelId(id); }}
              onNavigate={setCurrentScreen}
            />
          )}
          {currentScreen === "discrepancy" && (
            <DiscrepancyMapView
              data={liveData}
              selectedParcelId={selectedParcelId}
              onSelectParcel={(id) => { setSelectedParcelId(id); }}
              onNavigate={setCurrentScreen}
              onReview={(id) => { setSelectedParcelId(id); setCurrentScreen("evidence"); }}
            />
          )}
          {currentScreen === "evidence" && (
            <EvidenceCardView
              data={liveData}
              selectedCase={selectedCase || null}
              selectedParcelId={selectedParcelId}
              onSelectParcel={(id) => setSelectedParcelId(id)}
              onNavigate={setCurrentScreen}
              onGoToReview={() => setCurrentScreen("review")}
            />
          )}
          {currentScreen === "review" && (
            <ReviewDecisionView
              data={liveData}
              selectedCase={selectedCase || null}
              selectedParcelId={selectedParcelId}
              onSelectParcel={(id) => setSelectedParcelId(id)}
              onSubmitDecision={handleDecisionSubmit}
              onNavigate={setCurrentScreen}
            />
          )}
          {currentScreen === "graph" && (
            <EvidenceGraphView
              data={liveData}
              graphData={graphData}
              onSelectParcel={(id) => { setSelectedParcelId(id); }}
              onContinue={() => setCurrentScreen("review")}
            />
          )}
          {currentScreen === "reports" && (
            <ReportsExportView
              investigation={activeInvestigation}
              data={liveData}
              onExportGeoJSON={handleExportData}
            />
          )}
          {currentScreen === "audit" && (
            <AuditTrailView
              auditLog={auditLog}
              harmonizeMeta={liveData.harmonize_meta}
              onExport={handleExportData}
            />
          )}
          {currentScreen === "settings" && (
            <SettingsView
              authorityWeights={authorityWeights}
              dndThreshold={dndThreshold}
              registrationModel={registrationModel}
              onWeightsChange={handleWeightsChange}
              onThresholdChange={setDndThreshold}
              onModelChange={setRegistrationModel}
              onApply={handleApplySettings}
            />
          )}
        </main>

        {toastMessage && (
          <div className="floating-toast">
            <span>✓</span> {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

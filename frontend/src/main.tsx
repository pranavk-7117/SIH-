import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { Sidebar, Screen } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { DashboardView } from "./components/DashboardView";
import { UploadIngestView } from "./components/UploadIngestView";
import { SourceViewerView } from "./components/SourceViewerView";
import { AIExtractionView } from "./components/AIExtractionView";
import { EvidenceGraphView } from "./components/EvidenceGraphView";
import { HarmonizationView } from "./components/HarmonizationView";
import { DiscrepancyMapView } from "./components/DiscrepancyMapView";
import { EvidenceCardView } from "./components/EvidenceCardView";
import { ReviewDecisionView } from "./components/ReviewDecisionView";
import { AuditTrailView, AuditEntry } from "./components/AuditTrailView";
import { SettingsView } from "./components/SettingsView";
import { staticDemo } from "./demoData";
import "maplibre-gl/dist/maplibre-gl.css";
import "./styles.css";

const initialAuditLog: AuditEntry[] = [
  {
    id: "aud-001",
    timestamp: "02 Sep 2026 10:30",
    action: "Sources Ingested",
    user: "System",
    details: "Ingested 4 files (Cadastral SHP, Drone GeoTIFF, GNSS CSV, Municipal GPKG).",
    type: "upload",
  },
  {
    id: "aud-002",
    timestamp: "02 Sep 2026 10:32",
    action: "CRS Normalized",
    user: "System",
    details: "Normalized EPSG:32643 to common WGS84 EPSG:4326 reference frame.",
    type: "process",
  },
  {
    id: "aud-003",
    timestamp: "02 Sep 2026 10:35",
    action: "AI Boundary Extraction",
    user: "System",
    details: "Extracted 64 physical parcel contours using SegFormer-B0 (Avg Conf: 89%).",
    type: "process",
  },
  {
    id: "aud-004",
    timestamp: "02 Sep 2026 10:38",
    action: "Evidence Graph Built",
    user: "System",
    details: "Constructed 38 nodes and 56 cross-source relationship edges.",
    type: "process",
  },
  {
    id: "aud-005",
    timestamp: "02 Sep 2026 10:41",
    action: "Registration & TPS Alignment",
    user: "System",
    details: "Computed Thin Plate Spline transform on 48 control points. RMSE: 0.82 m.",
    type: "process",
  },
  {
    id: "aud-006",
    timestamp: "02 Sep 2026 10:45",
    action: "Topology Verification",
    user: "System",
    details: "ST_IsValid executed. 100% polygons valid. No overlaps or gap defects introduced.",
    type: "process",
  },
  {
    id: "aud-007",
    timestamp: "02 Sep 2026 11:15",
    action: "Discrepancy Map Generated",
    user: "AO (Admin Officer)",
    details: "Identified 128 high-priority parcels requiring authorized human review.",
    type: "process",
  },
];

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>("dashboard");
  const [selectedParcelId, setSelectedParcelId] = useState<string>("parcel-101");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("Pune District");
  const [auditLog, setAuditLog] = useState<AuditEntry[]>(initialAuditLog);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleDecisionSubmit = (decision: string, notes: string, parcelId: string) => {
    const parcelNum = parcelId.replace("parcel-", "");
    const newEntry: AuditEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      action: `Decision: ${decision.toUpperCase()}`,
      user: "AO (Land Records Officer)",
      details: `Parcel ${parcelNum}: ${decision.toUpperCase()} action submitted. Note: "${notes || "Verified against evidence card"}" - Version 2 created. Original legal record untouched.`,
      type: "decision",
    };

    setAuditLog((prev) => [newEntry, ...prev]);
    showToast(`Decision '${decision.toUpperCase()}' recorded for Parcel ${parcelNum}. Audit trail updated.`);
  };

  const handleExportData = () => {
    const exportPayload = {
      project: "BHUMI-FUSE Urban Land Record Harmonization",
      pilot_area: "Kharadi Sector 12, Pune, Maharashtra",
      timestamp: new Date().toISOString(),
      provenance: staticDemo.data.provenance,
      harmonized_parcels: staticDemo.data.harmonized,
      discrepancies: staticDemo.data.residuals,
      audit_history: auditLog,
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `bhumi_fuse_kharadi_harmonized_${Date.now()}.geojson`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast("Harmonized GeoJSON package downloaded successfully.");
  };

  const handleNormalizeTrigger = () => {
    const newEntry: AuditEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      action: "Sources Normalized (EPSG:4326)",
      user: "System",
      details: "Transformed all 4 ingested sources to common WGS84 coordinate reference system.",
      type: "process",
    };
    setAuditLog((prev) => [newEntry, ...prev]);
    showToast("All 4 sources normalized to EPSG:4326 (WGS84). Ready to harmonize.");
  };

  return (
    <div className="app-container">
      {/* Global Dark Emerald Sidebar */}
      <Sidebar currentScreen={currentScreen} onSelectScreen={setCurrentScreen} />

      {/* Main Content Area */}
      <div className="main-wrapper">
        <Topbar
          currentScreen={currentScreen}
          onExport={handleExportData}
          selectedDistrict={selectedDistrict}
          onSelectDistrict={setSelectedDistrict}
        />

        {currentScreen === "dashboard" && (
          <DashboardView
            data={staticDemo.data}
            onNavigate={setCurrentScreen}
            onSelectParcel={setSelectedParcelId}
          />
        )}

        {currentScreen === "upload" && (
          <UploadIngestView
            onNavigate={setCurrentScreen}
            provenance={staticDemo.data.provenance}
            onTriggerNormalize={handleNormalizeTrigger}
          />
        )}

        {currentScreen === "source" && (
          <SourceViewerView data={staticDemo.data} onNavigate={setCurrentScreen} />
        )}

        {currentScreen === "extract" && (
          <AIExtractionView data={staticDemo.data} onNavigate={setCurrentScreen} />
        )}

        {currentScreen === "graph" && (
          <EvidenceGraphView
            graph={staticDemo.data.graph}
            selectedParcelId={selectedParcelId}
            onSelectParcel={setSelectedParcelId}
            onNavigate={setCurrentScreen}
          />
        )}

        {currentScreen === "harmonize" && (
          <HarmonizationView data={staticDemo.data} onNavigate={setCurrentScreen} />
        )}

        {currentScreen === "discrepancy" && (
          <DiscrepancyMapView
            data={staticDemo.data}
            selectedParcelId={selectedParcelId}
            onSelectParcel={setSelectedParcelId}
            onNavigate={setCurrentScreen}
          />
        )}

        {currentScreen === "evidence_card" && (
          <EvidenceCardView
            selectedParcelId={selectedParcelId}
            data={staticDemo.data}
            onNavigate={setCurrentScreen}
          />
        )}

        {currentScreen === "review" && (
          <ReviewDecisionView
            selectedParcelId={selectedParcelId}
            data={staticDemo.data}
            onNavigate={setCurrentScreen}
            onSubmitDecision={handleDecisionSubmit}
          />
        )}

        {currentScreen === "audit" && (
          <AuditTrailView auditLog={auditLog} onExport={handleExportData} />
        )}

        {currentScreen === "settings" && <SettingsView />}
      </div>

      {/* Interactive Toast Notifications */}
      {toastMessage && (
        <div className="floating-toast">
          <span>✓ {toastMessage}</span>
        </div>
      )}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);

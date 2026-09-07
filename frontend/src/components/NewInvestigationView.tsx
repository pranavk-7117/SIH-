import React, { useState } from "react";
import { ArrowRight, Sparkles, MapPin, Calendar, Layers, ShieldCheck, CheckCircle2 } from "lucide-react";
import { api } from "../api/client";
import { Screen } from "./Sidebar";

interface NewInvestigationViewProps {
  onInvestigationCreated: (inv: any) => void;
  onNavigate: (screen: Screen) => void;
}

export const NewInvestigationView: React.FC<NewInvestigationViewProps> = ({
  onInvestigationCreated,
  onNavigate,
}) => {
  const [name, setName] = useState("");
  const [cityArea, setCityArea] = useState("");
  const [cadastralYear, setCadastralYear] = useState("");
  const [surveyYear, setSurveyYear] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const inv = await api.createInvestigation({
        name,
        city_area: cityArea,
        cadastral_year: cadastralYear,
        survey_year: surveyYear,
        description,
        parcels_count: 24,
      });
      onInvestigationCreated(inv);
      onNavigate("upload");
    } catch (err) {
      console.error("Failed to create investigation:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUseDemoDefaults = () => {
    setName("Kharadi Sector 12 — Demonstration");
    setCityArea("Kharadi, Pune");
    setCadastralYear("1960");
    setSurveyYear("2024");
    setDescription("Demonstration dataset for SIH26013 - urban land harmonization (Synthetic Demonstration Dataset)");
  };

  return (
    <div className="new-investigation-container">
      {/* Top Header */}
      <div className="view-page-header">
        <div>
          <h2>New Investigation</h2>
          <p>Create a new land harmonization project</p>
        </div>
        <button className="btn-outline-sm" onClick={handleUseDemoDefaults}>
          <Sparkles size={14} style={{ marginRight: "6px" }} />
          <span>Use SIH Demo Template</span>
        </button>
      </div>

      {/* Stepper Header */}
      <div className="stepper-header">
        <div className="step-node active">
          <div className="step-num">1</div>
          <span>Basic Details</span>
        </div>
        <div className="step-line" />
        <div className="step-node">
          <div className="step-num">2</div>
          <span>Upload Datasets</span>
        </div>
        <div className="step-line" />
        <div className="step-node">
          <div className="step-num">3</div>
          <span>Validate</span>
        </div>
        <div className="step-line" />
        <div className="step-node">
          <div className="step-num">4</div>
          <span>Process</span>
        </div>
        <div className="step-line" />
        <div className="step-node">
          <div className="step-num">5</div>
          <span>Review</span>
        </div>
      </div>

      <div className="new-inv-split-grid">
        {/* Left Form */}
        <div className="bf-card inv-form-card">
          <form onSubmit={handleSubmit}>
            <div className="form-field-group">
              <label>Investigation Name *</label>
              <input
                type="text"
                className="bf-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Kharadi Sector 12 — Demonstration"
                required
              />
            </div>

            <div className="form-field-group">
              <label>City / Area *</label>
              <div className="input-with-icon">
                <MapPin size={16} className="input-icon" />
                <input
                  type="text"
                  className="bf-input with-icon"
                  value={cityArea}
                  onChange={(e) => setCityArea(e.target.value)}
                  placeholder="e.g., Kharadi, Pune"
                  required
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-field-group">
                <label>Reference Year (Cadastral)</label>
                <div className="input-with-icon">
                  <Calendar size={16} className="input-icon" />
                  <input
                    type="text"
                    className="bf-input with-icon"
                    value={cadastralYear}
                    onChange={(e) => setCadastralYear(e.target.value)}
                    placeholder="1960"
                  />
                </div>
              </div>

              <div className="form-field-group">
                <label>Current Year (Survey/Imagery)</label>
                <div className="input-with-icon">
                  <Calendar size={16} className="input-icon" />
                  <input
                    type="text"
                    className="bf-input with-icon"
                    value={surveyYear}
                    onChange={(e) => setSurveyYear(e.target.value)}
                    placeholder="2024"
                  />
                </div>
              </div>
            </div>

            <div className="form-field-group">
              <label>Description (Optional)</label>
              <textarea
                className="bf-textarea"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Demonstration dataset for SIH26013 - urban land harmonization"
              />
            </div>

            <div className="synthetic-badge-note">
              <CheckCircle2 size={15} style={{ color: "#059669", flexShrink: 0 }} />
              <span>
                <strong>Synthetic Demonstration Dataset:</strong> Datasets created for demonstration reflect genuine urban land record scenarios (offsets, encroachments, DND).
              </span>
            </div>

            <div className="form-actions-bar">
              <button type="button" className="btn-outline" onClick={() => onNavigate("dashboard")}>
                Cancel
              </button>
              <button type="submit" className="btn-emerald" disabled={isSubmitting}>
                <span>{isSubmitting ? "Creating..." : "Save & Continue"}</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </form>
        </div>

        {/* Right Preview Card */}
        <div className="bf-card inv-preview-card">
          <div className="preview-image-container">
            <div className="map-placeholder-aerial">
              <div className="aerial-grid-overlay" />
              <div className="aerial-center-pin">
                <MapPin size={28} style={{ color: "#10b981", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))" }} />
                <span>Kharadi Pilot Area</span>
              </div>
            </div>
          </div>

          <div className="preview-details-body">
            <div className="preview-title-row">
              <h3>{cityArea || "Kharadi, Pune"}</h3>
              <span className="badge-pill success">Active Target</span>
            </div>

            <div className="preview-metrics-grid">
              <div className="preview-metric-box">
                <small>Pilot Area</small>
                <b>4.8 sq. km</b>
              </div>
              <div className="preview-metric-box">
                <small>Parcels (approx)</small>
                <b>150</b>
              </div>
              <div className="preview-metric-box">
                <small>Data Sources</small>
                <b style={{ color: "#10b981" }}>9 (SIH Spec)</b>
              </div>
            </div>

            <div className="preview-note-box">
              <ShieldCheck size={16} style={{ color: "#0284c7" }} />
              <span>Investigation workspace will be isolated with dedicated SHA-256 audit ledger.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

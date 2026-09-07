import React from "react";
import { ArrowRight, Layers, ShieldCheck, Cpu, Database, CheckCircle2 } from "lucide-react";
import { Screen } from "./Sidebar";

interface LandingPageViewProps {
  onEnterApp: (screen?: Screen) => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({ onEnterApp }) => {
  return (
    <div className="landing-page-root">
      {/* Official Top Ministry Header */}
      <header className="landing-gov-header">
        <div className="gov-emblem-section">
          <div className="national-emblem-badge">
            <span className="emblem-symbol">🏛️</span>
            <div className="emblem-text">
              <span className="gov-title">Government of India</span>
              <span className="ministry-title">Ministry of Panchayati Raj · NAKSHA Programme</span>
            </div>
          </div>
        </div>

        <nav className="landing-nav-links">
          <button className="landing-nav-item active">Home</button>
          <button className="landing-nav-item" onClick={() => onEnterApp("dashboard")}>Dashboard</button>
          <button className="landing-nav-item" onClick={() => onEnterApp("new_investigation")}>New Investigation</button>
          <button className="landing-nav-item" onClick={() => onEnterApp("upload")}>Upload & Ingest</button>
          <button className="landing-nav-item" onClick={() => onEnterApp("conflict_dashboard")}>Conflict Center</button>
          <button className="landing-login-btn" onClick={() => onEnterApp("dashboard")}>
            <span>Portal Login</span>
          </button>
        </nav>
      </header>

      {/* Hero Banner Section */}
      <section className="landing-hero-container">
        <div className="hero-backdrop-overlay" />
        <div className="landing-hero-content">
          <div className="hero-badge-pill">
            <span className="pulse-dot" />
            <span>SIH-26013 AI Geospatial Governance Platform</span>
          </div>

          <div className="hero-title-group">
            <div className="hero-logo-box">
              <span className="hero-logo-icon">💠</span>
              <h1 className="hero-brand-title">BHUMI-FUSE</h1>
            </div>
            <h2 className="hero-main-heading">
              AI-Enabled Geospatial Integration for Urban Land Governance
            </h2>
            <p className="hero-tagline">
              Integrate &bull; Harmonize &bull; Govern &mdash; For Accurate, Transparent and Inclusive Land Records
            </p>
          </div>

          {/* 4 Pillars Grid */}
          <div className="hero-pillars-grid">
            <div className="pillar-card">
              <div className="pillar-icon-box" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
                <Layers size={22} />
              </div>
              <h3>Multi-Source Integration</h3>
              <p>Cadastral, Drone ORI, GNSS, DSM/DTM, Municipal & Utilities unified in one CRS</p>
            </div>

            <div className="pillar-card">
              <div className="pillar-icon-box" style={{ background: "rgba(59, 130, 246, 0.15)", color: "#3b82f6" }}>
                <Cpu size={22} />
              </div>
              <h3>AI-Powered Analytics</h3>
              <p>RANSAC correspondence filtering, True TPS warping, and directional change detection</p>
            </div>

            <div className="pillar-card">
              <div className="pillar-icon-box" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}>
                <ShieldCheck size={22} />
              </div>
              <h3>Conflict Resolution</h3>
              <p>Evidence-weighted fusion with explainable Do-Not-Decide (DND) routing</p>
            </div>

            <div className="pillar-card">
              <div className="pillar-icon-box" style={{ background: "rgba(99, 102, 241, 0.15)", color: "#6366f1" }}>
                <Database size={22} />
              </div>
              <h3>Transparent Governance</h3>
              <p>Non-destructive immutable parcel ledger with SHA-256 chained audit verification</p>
            </div>
          </div>

          {/* CTA Button Group */}
          <div className="hero-actions-row">
            <button className="btn-hero-primary" onClick={() => onEnterApp("dashboard")}>
              <span>Launch Command Center</span>
              <ArrowRight size={16} />
            </button>
            <button className="btn-hero-secondary" onClick={() => onEnterApp("new_investigation")}>
              <span>+ Create Investigation</span>
            </button>
            <button className="btn-hero-outline" onClick={() => onEnterApp("upload")}>
              <span>Upload &amp; Ingest Datasets</span>
            </button>
          </div>

          <div className="hero-quote-box">
            <span>&ldquo;From Disparate Data to a Unified Tomorrow&rdquo;</span>
          </div>
        </div>
      </section>

      {/* Official Government Footer */}
      <footer className="landing-gov-footer">
        <div className="footer-national-branding">
          <div className="emblem-group">
            <span style={{ fontSize: "28px" }}>🏛️</span>
            <div>
              <b>Government of India &bull; Ministry of Panchayati Raj</b>
              <p>BHUMI-FUSE: AI for Unified Land Governance &bull; NAKSHA Programme</p>
            </div>
          </div>
          <p className="footer-motto">&ldquo;Accurate Land Records &bull; Stronger Communities &bull; A Developed India&rdquo;</p>
        </div>

        <div className="footer-initiative-badges">
          <span className="init-badge">Digital India</span>
          <span className="init-badge">Atmanirbhar Bharat</span>
          <span className="init-badge">Viksit Bharat 2047</span>
          <span className="init-badge status-ready">
            <CheckCircle2 size={13} style={{ marginRight: "4px" }} />
            Ready for Data Ingestion
          </span>
        </div>
      </footer>
    </div>
  );
};

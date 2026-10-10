import React, { useEffect, useState } from 'react';
import axiosClient from './api/axiosClient';
import { Calendar, Heart, Sparkles, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import './App.css';

function App() {
  const [healthStatus, setHealthStatus] = useState({
    loading: true,
    connected: false,
    data: null,
    error: null,
  });

  const checkBackendHealth = async () => {
    setHealthStatus((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await axiosClient.get('/health');
      setHealthStatus({
        loading: false,
        connected: true,
        data: response.data,
        error: null,
      });
    } catch (err) {
      setHealthStatus({
        loading: false,
        connected: false,
        data: null,
        error: err.message || 'Cannot connect to backend',
      });
    }
  };

  useEffect(() => {
    checkBackendHealth();
  }, []);

  return (
    <div className="setup-container">
      {/* Decorative scrap tape */}
      <div className="washi-tape"></div>

      <header className="brand-header">
        <div className="brand-badge">
          <Calendar className="brand-icon" size={24} />
          <span>PHASE 1: ARCHITECTURE & BASELINE SETUP</span>
        </div>
        <h1 className="brand-title">MEMORA</h1>
        <p className="brand-tagline">"Every Date Has a Story."</p>
      </header>

      <main className="setup-card polaroid-card">
        <div className="card-top-pin">
          <Heart size={16} fill="#FAD2E1" color="#D47B97" />
        </div>

        <h2 className="section-title">
          <Sparkles size={20} color="#8E7CC3" /> System Status & Connectivity
        </h2>
        <p className="section-desc">
          Verifying core architecture, client-server communication, and scrapbook theme foundations.
        </p>

        <div className={`status-banner ${healthStatus.connected ? 'status-ok' : healthStatus.loading ? 'status-loading' : 'status-err'}`}>
          {healthStatus.loading ? (
            <div className="status-row">
              <RefreshCw className="spin-icon" size={20} />
              <span>Checking backend connection at <code>/api/health</code>...</span>
            </div>
          ) : healthStatus.connected ? (
            <div className="status-row">
              <CheckCircle2 size={22} color="#16a34a" />
              <div>
                <strong>Backend Connected Successfully</strong>
                <p className="status-meta">
                  API: {healthStatus.data?.message} | Tagline: {healthStatus.data?.tagline}
                </p>
              </div>
            </div>
          ) : (
            <div className="status-row">
              <AlertCircle size={22} color="#dc2626" />
              <div>
                <strong>Backend Not Reachable</strong>
                <p className="status-meta">
                  {healthStatus.error} (Ensure the backend server is running on port 5000)
                </p>
              </div>
            </div>
          )}

          <button className="btn-retry" onClick={checkBackendHealth} disabled={healthStatus.loading}>
            <RefreshCw size={14} className={healthStatus.loading ? 'spin-icon' : ''} />
            Recheck
          </button>
        </div>

        <div className="palette-preview">
          <h3 className="palette-title">Scrapbook Aesthetic Palette</h3>
          <div className="color-swatches">
            <div className="swatch-item">
              <div className="swatch" style={{ background: '#FAF7F2', border: '1px solid #EFE7DE' }}></div>
              <span>Warm Cream</span>
            </div>
            <div className="swatch-item">
              <div className="swatch" style={{ background: '#E8E1F8' }}></div>
              <span>Lavender</span>
            </div>
            <div className="swatch-item">
              <div className="swatch" style={{ background: '#FAD2E1' }}></div>
              <span>Blush Pink</span>
            </div>
            <div className="swatch-item">
              <div className="swatch" style={{ background: '#67588B' }}></div>
              <span style={{ color: '#67588B' }}>Muted Purple</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="setup-footer">
        MEMORA Scrapbook Calendar • Production-Minded MERN Architecture
      </footer>
    </div>
  );
}

export default App;

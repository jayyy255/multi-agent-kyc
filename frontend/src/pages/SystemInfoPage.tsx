import React, { useEffect, useState } from 'react';
import {
  Activity,
  Database,
  RefreshCw,
  Server,
} from 'lucide-react';
import { kycApi } from '../api/endpoints';
import { HealthResponse, VersionResponse } from '../types/kyc';

export const SystemInfoPage: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [version, setVersion] = useState<VersionResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSystemData = async () => {
    setLoading(true);
    try {
      const [h, v] = await Promise.all([kycApi.getHealth(), kycApi.getVersion()]);
      setHealth(h);
      setVersion(v);
    } catch {
      setHealth(null);
      setVersion(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemData();
  }, []);

  const endpointsList = [
    { method: 'POST', path: '/api/v1/documents/classify', name: 'classify_document', desc: 'Identifies document type (passport, ID, proof of address) and confidence score.' },
    { method: 'POST', path: '/api/v1/documents/extract', name: 'extract_document_fields', desc: 'Extracts structured key-values (names, dates, IDs) from document text.' },
    { method: 'POST', path: '/api/v1/documents/validate', name: 'validate_fields', desc: 'Validates extracted fields against deterministic rules and customer profile.' },
    { method: 'POST', path: '/api/v1/cases/check-requirements', name: 'check_requirements', desc: 'Evaluates if mandatory identity and address document checklist is fulfilled.' },
    { method: 'POST', path: '/api/v1/cases/compare-customer-data', name: 'compare_customer_data', desc: 'Compares customer record attributes across all case documents.' },
    { method: 'POST', path: '/api/v1/cases/detect-inconsistencies', name: 'detect_inconsistencies', desc: 'Finds conflicting names, dates, or numbers between uploaded files.' },
    { method: 'GET', path: '/health', name: 'check_health', desc: 'Operational health check for container probes.' },
    { method: 'GET', path: '/api/v1/version', name: 'get_version', desc: 'Service version and environment discovery endpoint.' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">System & Architecture Specifications</h1>
          <p className="page-description">
            Live backend discovery, environment details, and worker service integration contracts.
          </p>
        </div>
        <button onClick={fetchSystemData} disabled={loading} className="btn btn-secondary btn-sm">
          <RefreshCw size={14} className={loading ? 'spin-icon' : ''} /> Refresh Status
        </button>
      </div>

      {/* Connectivity & Service Status Cards */}
      <div className="grid-3">
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Server size={20} color="#2563eb" />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Backend Service
            </span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {version?.service || 'multi-agent-kyc-backend'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Environment: <strong>{version?.environment || 'development'}</strong>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Activity size={20} color={health?.status === 'healthy' ? '#16a34a' : '#dc2626'} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Health Status
            </span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: health?.status === 'healthy' ? 'var(--success-700)' : 'var(--danger-700)' }}>
            {health?.status ? health.status.toUpperCase() : 'OFFLINE'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Version: <strong>v{version?.version || '0.1.0'}</strong>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Database size={20} color="#0891b2" />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              API Base URL
            </span>
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
            {import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Prefix: <strong>{version?.api_prefix || '/api/v1'}</strong>
          </div>
        </div>
      </div>

      {/* Architecture Integration Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="section-title" style={{ marginBottom: 0 }}>
              Available Worker Services & Integration Points
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Endpoints callable by Power Automate HTTP actions & Copilot Studio tools
            </span>
          </div>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>HTTP Method</th>
                <th>Endpoint Route</th>
                <th>Copilot Action Name</th>
                <th>Worker Task Description</th>
              </tr>
            </thead>
            <tbody>
              {endpointsList.map((ep, i) => (
                <tr key={i}>
                  <td>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: ep.method === 'POST' ? '#eff6ff' : '#f1f5f9',
                        color: ep.method === 'POST' ? '#1d4ed8' : '#475569',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {ep.method}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--primary-700)' }}>
                    {ep.path}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                    <code>{ep.name}</code>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {ep.desc}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

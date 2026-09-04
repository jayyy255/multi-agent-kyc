import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  FileText,
  Layers,
  Play,
  RotateCcw,
  Users,
} from 'lucide-react';
import { useCases } from '../context/CaseContext';
import { MetricCard } from '../components/common/MetricCard';
import { StatusBadge } from '../components/common/StatusBadge';

interface OverviewPageProps {
  setActiveTab: (tab: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ setActiveTab }) => {
  const { cases, selectCase, resetDemoCases } = useCases();

  // Compute demo metrics
  const totalCases = cases.length;
  const totalDocs = cases.reduce((acc, c) => acc + c.documents.length, 0);
  const needsInfoCount = cases.filter((c) => c.status === 'in_progress' || c.validation_status === 'needs_information').length;
  const reviewCount = cases.filter((c) => c.requires_manual_review || c.status === 'escalated').length;

  const handleCaseClick = (caseId: string) => {
    selectCase(caseId);
    setActiveTab('cases');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Welcome & Overview Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">KYC Operations Overview</h1>
          <p className="page-description">
            Intelligent multi-agent onboarding dashboard powered by deterministic FastAPI worker tools.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={resetDemoCases}
            className="btn btn-secondary btn-sm"
            title="Reset synthetic demo cases to default state"
          >
            <RotateCcw size={14} /> Reset Demo Data
          </button>
          <button
            onClick={() => setActiveTab('document-processing')}
            className="btn btn-primary btn-sm"
          >
            <Play size={14} /> Open Document Playground
          </button>
        </div>
      </div>

      {/* Demo Metrics Cards */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            DEMO METRICS (SYNTHETIC DATA)
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
            Real-time calculations from local case states
          </span>
        </div>
        <div className="grid-4">
          <MetricCard
            title="Total Demo Cases"
            value={totalCases}
            subtitle="Synthetic active onboarding profiles"
            icon={Users}
            variant="info"
          />
          <MetricCard
            title="Processed Documents"
            value={totalDocs}
            subtitle="Passports, utility bills, driver licenses"
            icon={FileText}
            variant="default"
          />
          <MetricCard
            title="Needs Information"
            value={needsInfoCount}
            subtitle="Missing mandatory KYC fields"
            icon={Clock}
            variant="warning"
          />
          <MetricCard
            title="Review Queue"
            value={reviewCount}
            subtitle="High-risk or conflicting cases"
            icon={AlertTriangle}
            variant="danger"
          />
        </div>
      </div>

      {/* Multi-Agent Architecture Explanation Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: 'white',
          border: '1px solid #334155',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ maxWidth: '720px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Layers size={18} color="#38bdf8" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Agentic Workflow Orchestration
              </span>
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px', color: '#f8fafc' }}>
              Supervisor Agent & Worker Tool Architecture
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.6 }}>
              Unlike fixed pipelines, this platform separates high-level case reasoning (Microsoft Copilot Studio) from bounded, deterministic worker tools (FastAPI). The supervisor dynamically triggers classification, extraction, or validation depending on real-time state.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignSelf: 'center' }}>
            <button
              onClick={() => setActiveTab('system-info')}
              className="btn"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.2)' }}
            >
              View System Specs <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Cases Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="section-title" style={{ marginBottom: 0 }}>Recent KYC Onboarding Cases</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Click any row to open the detailed case inspector
            </span>
          </div>
          <button onClick={() => setActiveTab('cases')} className="btn btn-secondary btn-sm">
            View All Cases <ArrowRight size={14} />
          </button>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Customer Name</th>
                <th>Tier</th>
                <th>Documents</th>
                <th>Validation</th>
                <th>Risk Level</th>
                <th>Recommendation</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr
                  key={c.case_id}
                  onClick={() => handleCaseClick(c.case_id)}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--primary-600)' }}>
                    {c.case_id}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{c.customer_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{c.customer_id}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.customer_tier}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {c.documents.map((d, i) => (
                        <StatusBadge key={i} type="docType" value={d.document_type} />
                      ))}
                    </div>
                  </td>
                  <td>
                    <StatusBadge type="validation" value={c.validation_status} />
                  </td>
                  <td>
                    <StatusBadge type="risk" value={c.risk_level} />
                  </td>
                  <td>
                    <StatusBadge type="recommendation" value={c.recommendation} />
                  </td>
                  <td>
                    <StatusBadge type="status" value={c.status} />
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

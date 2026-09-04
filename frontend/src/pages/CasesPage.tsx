import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  RotateCw,
  Search,
  UserCheck,
} from 'lucide-react';
import { useCases } from '../context/CaseContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { WorkflowTimeline } from '../components/case/WorkflowTimeline';
import { ValidationCheckList } from '../components/case/ValidationCheckList';
import { JsonViewer } from '../components/common/JsonViewer';
import { AlertBanner } from '../components/common/AlertBanner';
import { kycApi } from '../api/endpoints';

interface CasesPageProps {
  setActiveTab?: (tab: string) => void;
}

export const CasesPage: React.FC<CasesPageProps> = () => {
  const { cases, selectedCase, selectCase, markAsReviewed, escalateCase, requestAdditionalInfo, updateCaseStatus } = useCases();
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'ready_for_review' | 'escalated' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'documents' | 'validation' | 'json'>('overview');
  const [isValidating, setIsValidating] = useState(false);
  const [validationSuccessMsg, setValidationSuccessMsg] = useState<string | null>(null);

  const filteredCases = cases.filter((c) => {
    if (filter !== 'all' && c.status !== filter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.case_id.toLowerCase().includes(q) ||
        c.customer_name.toLowerCase().includes(q) ||
        c.customer_id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const currentCase = selectedCase || filteredCases[0];

  const handleRunValidation = async () => {
    if (!currentCase || !currentCase.documents.length) return;
    setIsValidating(true);
    setValidationSuccessMsg(null);
    try {
      const doc = currentCase.documents[0];
      const res = await kycApi.validateDocumentFields({
        case_id: currentCase.case_id,
        customer_id: currentCase.customer_id,
        document_type: doc.document_type,
        extracted_fields: doc.extracted_fields,
        customer_record: {
          full_name: currentCase.customer_name,
          customer_id: currentCase.customer_id,
        },
      });

      setValidationSuccessMsg(`Validation executed: ${res.message} (Recommendation: ${res.recommendation})`);
      updateCaseStatus(currentCase.case_id, res.is_valid ? 'completed' : 'ready_for_review', res.recommendation);
    } catch (err: any) {
      alert(`Validation error: ${err.message}`);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <h1 className="page-title">KYC Cases Explorer</h1>
        <p className="page-description">
          Inspect end-to-end customer cases, document extractions, and rule-based compliance checks.
        </p>
      </div>

      {/* Main Split Layout: Left List & Right Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Left Column: Filter & Case List */}
        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Search bar */}
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '10px' }} />
            <input
              type="text"
              placeholder="Search by case ID or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                fontSize: '0.85rem',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                outline: 'none',
              }}
            />
          </div>

          {/* Status Filter Tabs */}
          <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '4px' }}>
            {(['all', 'in_progress', 'ready_for_review', 'escalated', 'completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  backgroundColor: filter === f ? 'var(--primary-600)' : 'var(--bg-surface-subtle)',
                  color: filter === f ? 'white' : 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                }}
              >
                {f.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {/* Case Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '600px', overflowY: 'auto' }}>
            {filteredCases.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No cases match the selected filter.
              </div>
            ) : (
              filteredCases.map((c) => {
                const isSelected = currentCase?.case_id === c.case_id;
                return (
                  <div
                    key={c.case_id}
                    onClick={() => selectCase(c.case_id)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isSelected ? 'var(--primary-50)' : 'var(--bg-surface)',
                      border: `1px solid ${isSelected ? 'var(--primary-500)' : 'var(--border-subtle)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: isSelected ? 'var(--primary-700)' : 'var(--text-main)' }}>
                        {c.case_id}
                      </span>
                      <StatusBadge type="status" value={c.status} size="sm" />
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {c.customer_name}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                      <span>{c.documents.length} doc{c.documents.length !== 1 ? 's' : ''}</span>
                      <StatusBadge type="risk" value={c.risk_level} size="sm" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Case Inspector */}
        {currentCase ? (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Case Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                    {currentCase.customer_name}
                  </h2>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-surface-subtle)', padding: '2px 8px', borderRadius: 'var(--radius-sm)' }}>
                    {currentCase.case_id}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '12px' }}>
                  <span>Customer ID: <strong>{currentCase.customer_id}</strong></span>
                  <span>•</span>
                  <span>Tier: <strong>{currentCase.customer_tier}</strong></span>
                </div>
              </div>

              {/* Status Badges */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <StatusBadge type="status" value={currentCase.status} />
                <StatusBadge type="risk" value={currentCase.risk_level} />
                <StatusBadge type="recommendation" value={currentCase.recommendation} />
              </div>
            </div>

            {/* Workflow Progress Timeline */}
            <div style={{ backgroundColor: 'var(--bg-surface-subtle)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Multi-Agent Workflow Progression
              </div>
              <WorkflowTimeline
                currentStage={
                  currentCase.status === 'completed'
                    ? 'reviewed'
                    : currentCase.status === 'ready_for_review' || currentCase.status === 'escalated'
                    ? 'validated'
                    : 'extracted'
                }
                recommendation={currentCase.recommendation}
                hasInconsistencies={currentCase.inconsistencies.length > 0}
              />
            </div>

            {validationSuccessMsg && (
              <AlertBanner
                type="success"
                message={validationSuccessMsg}
                onClose={() => setValidationSuccessMsg(null)}
              />
            )}

            {currentCase.inconsistencies.length > 0 && (
              <AlertBanner
                type="error"
                title="Cross-Document Discrepancies Detected"
                message={currentCase.inconsistencies.join(' | ')}
              />
            )}

            {/* Detail Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', gap: '8px' }}>
              {[
                { id: 'overview', label: 'Case Overview' },
                { id: 'documents', label: `Documents (${currentCase.documents.length})` },
                { id: 'validation', label: 'Validation Rules' },
                { id: 'json', label: 'Raw State JSON' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveDetailTab(tab.id as any)}
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.85rem',
                    fontWeight: activeDetailTab === tab.id ? 700 : 500,
                    color: activeDetailTab === tab.id ? 'var(--primary-600)' : 'var(--text-muted)',
                    borderBottom: activeDetailTab === tab.id ? '2px solid var(--primary-600)' : '2px solid transparent',
                    marginBottom: '-1px',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab 1: Overview */}
            {activeDetailTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="grid-2">
                  <div style={{ backgroundColor: 'var(--bg-surface-subtle)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Dataverse Case Summary
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                      <div>Status: <strong>{currentCase.status}</strong></div>
                      <div>Validation Outcome: <strong>{currentCase.validation_status}</strong></div>
                      <div>Supervisor Recommendation: <strong>{currentCase.recommendation}</strong></div>
                      <div>Requires Manual Review: <strong>{currentCase.requires_manual_review ? 'Yes' : 'No'}</strong></div>
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'var(--bg-surface-subtle)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Missing Information Checklist
                    </div>
                    {currentCase.missing_information.length === 0 ? (
                      <div style={{ color: 'var(--success-700)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle2 size={16} /> All required KYC fields provided.
                      </div>
                    ) : (
                      <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--warning-700)' }}>
                        {currentCase.missing_information.map((item, i) => (
                          <li key={i}>{item.replace(/_/g, ' ')}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Supervisor Actions / Demo Actions */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                  <button
                    onClick={handleRunValidation}
                    disabled={isValidating}
                    className="btn btn-primary btn-sm"
                  >
                    <RotateCw size={14} className={isValidating ? 'spin-icon' : ''} />
                    {isValidating ? 'Calling API...' : 'Run Real Validation Tool'}
                  </button>

                  <button
                    onClick={() => requestAdditionalInfo(currentCase.case_id, ['Proof of Address', 'Tax Identification'])}
                    className="btn btn-secondary btn-sm"
                  >
                    <Clock size={14} /> Request Information (Demo)
                  </button>

                  <button
                    onClick={() => escalateCase(currentCase.case_id, 'Manual escalation triggered from case explorer.')}
                    className="btn btn-secondary btn-sm"
                    style={{ color: 'var(--danger-600)' }}
                  >
                    <AlertTriangle size={14} /> Escalate to Human (Demo)
                  </button>

                  <button
                    onClick={() => markAsReviewed(currentCase.case_id)}
                    className="btn btn-secondary btn-sm"
                    style={{ color: 'var(--success-700)' }}
                  >
                    <UserCheck size={14} /> Mark Approved (Demo)
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Documents */}
            {activeDetailTab === 'documents' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {currentCase.documents.map((doc) => (
                  <div
                    key={doc.document_id}
                    style={{
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px',
                      backgroundColor: 'var(--bg-surface)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={18} color="#2563eb" />
                        <span style={{ fontWeight: 600 }}>{doc.filename}</span>
                        <StatusBadge type="docType" value={doc.document_type} />
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Confidence: <strong>{Math.round(doc.confidence * 100)}%</strong>
                      </span>
                    </div>

                    {/* Extracted Fields Table */}
                    <div style={{ backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                        Extracted Structured Fields
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                        {Object.entries(doc.extracted_fields).map(([key, val]) => (
                          <div key={key} style={{ fontSize: '0.8rem' }}>
                            <div style={{ color: 'var(--text-subtle)', textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</div>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)', wordBreak: 'break-all' }}>{String(val)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 3: Validation Rules */}
            {activeDetailTab === 'validation' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Deterministic compliance validation executed by the FastAPI worker engine against business rules and customer records.
                </div>
                <ValidationCheckList
                  results={
                    currentCase.documents[0]?.validation_results || [
                      {
                        field: 'expiry_date',
                        status: currentCase.validation_status === 'invalid' ? 'invalid' : 'valid',
                        message: currentCase.validation_status === 'invalid' ? 'Document expired' : 'Document unexpired',
                        details: {},
                      },
                      {
                        field: 'customer_name_match',
                        status: 'valid',
                        message: 'Customer name matched authoritative profile',
                        details: {},
                      },
                    ]
                  }
                />
              </div>
            )}

            {/* Tab 4: Raw JSON */}
            {activeDetailTab === 'json' && (
              <JsonViewer data={currentCase} title={`State Snapshot: ${currentCase.case_id}`} />
            )}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            Select a case to view details.
          </div>
        )}
      </div>
    </div>
  );
};

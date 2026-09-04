import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  UserCheck,
} from 'lucide-react';
import { useCases } from '../context/CaseContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { AlertBanner } from '../components/common/AlertBanner';

interface ReviewQueuePageProps {
  setActiveTab: (tab: string) => void;
}

export const ReviewQueuePage: React.FC<ReviewQueuePageProps> = ({ setActiveTab }) => {
  const { cases, selectCase, markAsReviewed, escalateCase, requestAdditionalInfo } = useCases();
  const [successActionMsg, setSuccessActionMsg] = useState<string | null>(null);

  // Review queue includes cases requiring review, escalated, or with missing info
  const reviewCases = cases.filter(
    (c) => c.requires_manual_review || c.status === 'escalated' || c.status === 'ready_for_review' || c.validation_status === 'needs_information'
  );

  const handleAction = (caseId: string, actionType: 'approve' | 'request_info' | 'escalate') => {
    if (actionType === 'approve') {
      markAsReviewed(caseId);
      setSuccessActionMsg(`Case ${caseId} marked as manually approved (Demo action).`);
    } else if (actionType === 'request_info') {
      requestAdditionalInfo(caseId, ['Updated Proof of Address', 'Identity Re-verification']);
      setSuccessActionMsg(`Information request sent for Case ${caseId} (Demo action).`);
    } else if (actionType === 'escalate') {
      escalateCase(caseId, 'Compliance officer escalated case for senior management review.');
      setSuccessActionMsg(`Case ${caseId} escalated to Senior Compliance (Demo action).`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 className="page-title">Compliance Review Queue</h1>
        <p className="page-description">
          Cases routed for Human-in-the-Loop exception handling, discrepancy reconciliation, or missing document requests.
        </p>
      </div>

      {successActionMsg && (
        <AlertBanner
          type="success"
          message={successActionMsg}
          onClose={() => setSuccessActionMsg(null)}
        />
      )}

      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="section-title" style={{ marginBottom: 0 }}>
              Flagged Cases Awaiting Officer Review ({reviewCases.length})
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Synthetic cases generated based on deterministic rule failures or low confidence
            </span>
          </div>
        </div>

        {reviewCases.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={36} color="#16a34a" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
              All reviews completed
            </div>
            <p style={{ fontSize: '0.85rem' }}>No cases currently require manual compliance intervention.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {reviewCases.map((c) => (
              <div
                key={c.case_id}
                style={{
                  border: `1px solid ${c.risk_level === 'high' ? 'var(--danger-border)' : 'var(--border-subtle)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '18px',
                  backgroundColor: c.risk_level === 'high' ? 'var(--danger-50)' : 'var(--bg-surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}>
                      {c.case_id}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-main)' }}>
                      {c.customer_name}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({c.customer_id})</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <StatusBadge type="risk" value={c.risk_level} />
                    <StatusBadge type="recommendation" value={c.recommendation} />
                    <StatusBadge type="status" value={c.status} />
                  </div>
                </div>

                {/* Reasons for review */}
                <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', backgroundColor: 'rgba(255, 255, 255, 0.7)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Reason for Human Review:
                  </div>
                  {c.inconsistencies.length > 0 ? (
                    <ul style={{ paddingLeft: '18px', color: 'var(--danger-700)' }}>
                      {c.inconsistencies.map((inc, i) => (
                        <li key={i}>{inc}</li>
                      ))}
                    </ul>
                  ) : c.missing_information.length > 0 ? (
                    <div style={{ color: 'var(--warning-700)' }}>
                      Missing required information: {c.missing_information.join(', ')}
                    </div>
                  ) : (
                    <div>Flagged for routine manual verification.</div>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', paddingTop: '6px' }}>
                  <button
                    onClick={() => {
                      selectCase(c.case_id);
                      setActiveTab('cases');
                    }}
                    className="btn btn-secondary btn-sm"
                  >
                    Open Case Inspector <ExternalLink size={12} />
                  </button>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleAction(c.case_id, 'request_info')}
                      className="btn btn-secondary btn-sm"
                    >
                      <Clock size={14} /> Request Information (Demo)
                    </button>
                    <button
                      onClick={() => handleAction(c.case_id, 'escalate')}
                      className="btn btn-secondary btn-sm"
                      style={{ color: 'var(--danger-600)' }}
                    >
                      <AlertTriangle size={14} /> Escalate (Demo)
                    </button>
                    <button
                      onClick={() => handleAction(c.case_id, 'approve')}
                      className="btn btn-primary btn-sm"
                      style={{ backgroundColor: 'var(--success-600)' }}
                    >
                      <UserCheck size={14} /> Mark Approved (Demo)
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

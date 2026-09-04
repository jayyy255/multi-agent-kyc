import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Clock,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useApiActivity } from '../context/ApiActivityContext';
import { JsonViewer } from '../components/common/JsonViewer';
import { kycApi } from '../api/endpoints';

export const ApiActivityPage: React.FC = () => {
  const { activities, clearActivities } = useApiActivity();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pingLoading, setPingLoading] = useState(false);

  const handleTestPing = async () => {
    setPingLoading(true);
    try {
      await kycApi.getHealth();
      await kycApi.getVersion();
    } catch {
      // Logged automatically
    } finally {
      setPingLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">Technical API Activity Log</h1>
          <p className="page-description">
            Real-time audit log of HTTP requests and responses exchanged with the FastAPI worker backend.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleTestPing}
            disabled={pingLoading}
            className="btn btn-secondary btn-sm"
          >
            <Activity size={14} /> {pingLoading ? 'Testing...' : 'Test Ping Worker'}
          </button>
          <button
            onClick={clearActivities}
            disabled={activities.length === 0}
            className="btn btn-secondary btn-sm"
          >
            <Trash2 size={14} /> Clear Log
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="section-title" style={{ marginBottom: 0 }}>
              Live Request Log ({activities.length})
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Click any log entry to inspect full request/response JSON payloads
            </span>
          </div>
        </div>

        {activities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <Activity size={32} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
              No API requests logged yet
            </div>
            <p style={{ fontSize: '0.85rem' }}>
              Perform actions on the <strong>Document Processing</strong> or <strong>Validation</strong> pages, or click <strong>Test Ping Worker</strong>.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activities.map((act) => {
              const isSelected = selectedId === act.id;
              const isSuccess = act.success;

              return (
                <div
                  key={act.id}
                  style={{
                    border: `1px solid ${isSelected ? 'var(--primary-500)' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    backgroundColor: 'var(--bg-surface)',
                  }}
                >
                  <div
                    onClick={() => setSelectedId(isSelected ? null : act.id)}
                    style={{
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'var(--primary-50)' : 'transparent',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {isSuccess ? (
                        <CheckCircle2 size={18} color="#16a34a" />
                      ) : (
                        <XCircle size={18} color="#dc2626" />
                      )}
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: act.method === 'POST' ? '#eff6ff' : '#f1f5f9',
                          color: act.method === 'POST' ? '#1d4ed8' : '#475569',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {act.method}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {act.endpoint}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          color: isSuccess ? 'var(--success-700)' : 'var(--danger-700)',
                        }}
                      >
                        HTTP {act.status}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} /> {act.durationMs} ms
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                        {new Date(act.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <div style={{ padding: '16px', backgroundColor: 'var(--bg-surface-subtle)', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {act.error && (
                        <div style={{ color: 'var(--danger-700)', fontSize: '0.85rem', fontWeight: 600 }}>
                          Error: {act.error}
                        </div>
                      )}

                      {act.requestPayload && (
                        <JsonViewer data={act.requestPayload} title={`Request Payload [${act.method} ${act.endpoint}]`} />
                      )}

                      {act.responsePayload && (
                        <JsonViewer data={act.responsePayload} title={`Response Payload (HTTP ${act.status})`} />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

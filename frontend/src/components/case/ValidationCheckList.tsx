import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle } from 'lucide-react';
import { ValidationResultItem } from '../../types/kyc';

interface ValidationCheckListProps {
  results: ValidationResultItem[];
  emptyMessage?: string;
}

export const ValidationCheckList: React.FC<ValidationCheckListProps> = ({
  results,
  emptyMessage = 'No validation rules evaluated yet.',
}) => {
  if (!results || results.length === 0) {
    return <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{emptyMessage}</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {results.map((item, idx) => {
        const isValid = item.status === 'valid';
        const isMissing = item.status === 'missing';
        const isInconsistent = item.status === 'inconsistent' || item.status === 'invalid';

        let bg = 'var(--bg-surface-subtle)';
        let iconColor = '#64748b';
        let Icon = HelpCircle;

        if (isValid) {
          bg = 'var(--success-50)';
          iconColor = 'var(--success-600)';
          Icon = CheckCircle2;
        } else if (isMissing) {
          bg = 'var(--warning-50)';
          iconColor = 'var(--warning-600)';
          Icon = AlertTriangle;
        } else if (isInconsistent) {
          bg = 'var(--danger-50)';
          iconColor = 'var(--danger-600)';
          Icon = XCircle;
        }

        return (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '10px 14px',
              backgroundColor: bg,
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(0, 0, 0, 0.05)',
              fontSize: '0.85rem',
            }}
          >
            <Icon size={18} color={iconColor} style={{ marginTop: '2px', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)', textTransform: 'capitalize' }}>
                  {item.field.replace(/_/g, ' ')}
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    color: iconColor,
                  }}
                >
                  {item.status}
                </span>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{item.message}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

interface AlertBannerProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  onClose?: () => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  type = 'info',
  title,
  message,
  onClose,
}) => {
  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'var(--success-50)',
          border: 'var(--success-border)',
          color: 'var(--success-700)',
          Icon: CheckCircle2,
        };
      case 'warning':
        return {
          bg: 'var(--warning-50)',
          border: 'var(--warning-border)',
          color: 'var(--warning-700)',
          Icon: AlertTriangle,
        };
      case 'error':
        return {
          bg: 'var(--danger-50)',
          border: 'var(--danger-border)',
          color: 'var(--danger-700)',
          Icon: AlertCircle,
        };
      default:
        return {
          bg: 'var(--info-50)',
          border: 'var(--info-border)',
          color: 'var(--info-700)',
          Icon: Info,
        };
    }
  };

  const { bg, border, color, Icon } = getStyles();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '12px 16px',
        backgroundColor: bg,
        border: `1px solid ${border}`,
        borderRadius: 'var(--radius-md)',
        color,
        fontSize: '0.875rem',
      }}
    >
      <Icon size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
      <div style={{ flex: 1 }}>
        {title && <div style={{ fontWeight: 600, marginBottom: '2px' }}>{title}</div>}
        <div>{message}</div>
      </div>
      {onClose && (
        <button onClick={onClose} style={{ color, opacity: 0.7, padding: '2px' }}>
          <X size={16} />
        </button>
      )}
    </div>
  );
};

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  text?: string;
  size?: number;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  text = 'Processing request...',
  size = 20,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        padding: '24px',
        color: 'var(--text-muted)',
        fontSize: '0.875rem',
      }}
    >
      <Loader2 size={size} className="spin-icon" style={{ animation: 'spin 1s linear infinite' }} />
      {text && <span>{text}</span>}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

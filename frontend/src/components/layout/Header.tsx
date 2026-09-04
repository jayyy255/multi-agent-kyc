import React, { useEffect, useState } from 'react';
import {
  Database,
  RefreshCw,
  Server,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { kycApi } from '../../api/endpoints';
import { HealthResponse } from '../../types/kyc';

interface HeaderProps {
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({ activeTab }) => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const res = await kycApi.getHealth();
      setHealth(res);
    } catch {
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // 30s heartbeat
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="top-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'capitalize' }}>
          {activeTab.replace(/-/g, ' ')}
        </h2>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            backgroundColor: '#eff6ff',
            color: '#1d4ed8',
            border: '1px solid #bfdbfe',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
        >
          <Database size={13} />
          Synthetic Data • Demo Mode
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Backend Connectivity Status */}
        <div
          onClick={checkHealth}
          title="Click to re-check FastAPI backend health status"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            backgroundColor: health?.status === 'healthy' ? 'var(--success-50)' : 'var(--danger-50)',
            border: `1px solid ${health?.status === 'healthy' ? 'var(--success-border)' : 'var(--danger-border)'}`,
            borderRadius: 'var(--radius-md)',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: health?.status === 'healthy' ? 'var(--success-700)' : 'var(--danger-700)',
            cursor: 'pointer',
          }}
        >
          {loading ? (
            <RefreshCw size={14} className="spin-icon" style={{ animation: 'spin 1s linear infinite' }} />
          ) : health?.status === 'healthy' ? (
            <Wifi size={14} />
          ) : (
            <WifiOff size={14} />
          )}
          <span>
            {loading ? 'Checking...' : health?.status === 'healthy' ? 'FastAPI Worker Online' : 'Backend Unreachable'}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            padding: '6px 10px',
            backgroundColor: 'var(--bg-surface-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <Server size={14} color="#64748b" />
          <span>Port 8000</span>
        </div>
      </div>
    </header>
  );
};

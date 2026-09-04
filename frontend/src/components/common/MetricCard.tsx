import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  badge?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  badge,
}) => {
  const getIconColor = () => {
    switch (variant) {
      case 'success':
        return '#16a34a';
      case 'warning':
        return '#d97706';
      case 'danger':
        return '#dc2626';
      case 'info':
        return '#2563eb';
      default:
        return '#475569';
    }
  };

  const getIconBg = () => {
    switch (variant) {
      case 'success':
        return '#f0fdf4';
      case 'warning':
        return '#fffbeb';
      case 'danger':
        return '#fef2f2';
      case 'info':
        return '#eff6ff';
      default:
        return '#f1f5f9';
    }
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {title}
        </span>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: getIconBg(),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: getIconColor(),
          }}
        >
          <Icon size={20} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
        <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.03em' }}>
          {value}
        </span>
        {badge && (
          <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
            {badge}
          </span>
        )}
      </div>
      {subtitle && (
        <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
          {subtitle}
        </span>
      )}
    </div>
  );
};

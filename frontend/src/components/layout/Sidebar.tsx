import React from 'react';
import {
  Activity,
  CheckSquare,
  FileSearch,
  Info,
  Layers,
  LayoutDashboard,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useCases } from '../../context/CaseContext';
import { useApiActivity } from '../../context/ApiActivityContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { cases } = useCases();
  const { activities } = useApiActivity();

  const reviewCount = cases.filter((c) => c.requires_manual_review || c.status === 'escalated').length;

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'cases', label: 'KYC Cases', icon: Users, badge: cases.length },
    { id: 'document-processing', label: 'Document Processing', icon: FileSearch },
    { id: 'validation', label: 'Deterministic Validation', icon: ShieldCheck },
    { id: 'review-queue', label: 'Review Queue', icon: CheckSquare, badge: reviewCount, badgeColor: '#ef4444' },
    { id: 'api-activity', label: 'API Activity', icon: Activity, badge: activities.length },
    { id: 'system-info', label: 'System Information', icon: Info },
  ];

  return (
    <aside className="sidebar">
      {/* Brand & Logo Header */}
      <div
        style={{
          padding: '24px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
          }}
        >
          <ShieldCheck size={22} />
        </div>
        <div>
          <h1 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            KYC Intelligence
          </h1>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}>
            Multi-Agent Automation
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div
          style={{
            fontSize: '0.68rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#64748b',
            fontWeight: 700,
            padding: '8px 12px 4px',
          }}
        >
          Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isActive ? 'rgba(37, 99, 235, 0.2)' : 'transparent',
                color: isActive ? '#60a5fa' : '#cbd5e1',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.875rem',
                border: isActive ? '1px solid rgba(96, 165, 250, 0.3)' : '1px solid transparent',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon size={18} color={isActive ? '#60a5fa' : '#94a3b8'} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  style={{
                    backgroundColor: item.badgeColor || '#334155',
                    color: 'white',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Architecture Footer Notice */}
      <div
        style={{
          padding: '16px',
          margin: '12px',
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <Layers size={14} color="#38bdf8" />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#e2e8f0' }}>Agentic Framework</span>
        </div>
        <p style={{ fontSize: '0.7rem', color: '#94a3b8', lineHeight: 1.4 }}>
          Stateless FastAPI worker micro-services ready for Microsoft Copilot Studio supervisor orchestration.
        </p>
      </div>
    </aside>
  );
};

import React from 'react';
import { CheckCircle2, AlertCircle, FileSearch, Filter, ShieldCheck, UserCheck } from 'lucide-react';

interface WorkflowTimelineProps {
  currentStage?: 'intake' | 'classified' | 'extracted' | 'validated' | 'reviewed';
  recommendation?: string;
  hasInconsistencies?: boolean;
}

export const WorkflowTimeline: React.FC<WorkflowTimelineProps> = ({
  currentStage = 'validated',
  hasInconsistencies = false,
}) => {
  const stages = [
    { id: 'intake', label: 'Document Intake', icon: FileSearch },
    { id: 'classified', label: 'Classification', icon: Filter },
    { id: 'extracted', label: 'Field Extraction', icon: FileSearch },
    { id: 'validated', label: 'Deterministic Validation', icon: ShieldCheck },
    { id: 'reviewed', label: 'Supervisor Decision', icon: UserCheck },
  ];

  const getStageIndex = (stageId: string) => {
    switch (stageId) {
      case 'intake':
        return 0;
      case 'classified':
        return 1;
      case 'extracted':
        return 2;
      case 'validated':
        return 3;
      case 'reviewed':
        return 4;
      default:
        return 3;
    }
  };

  const activeIdx = getStageIndex(currentStage);

  return (
    <div style={{ padding: '12px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        {/* Background track */}
        <div
          style={{
            position: 'absolute',
            top: '18px',
            left: '20px',
            right: '20px',
            height: '2px',
            backgroundColor: 'var(--border-subtle)',
            zIndex: 1,
          }}
        />

        {stages.map((stage, idx) => {
          const isCompleted = idx < activeIdx || (idx === activeIdx && currentStage === 'reviewed');
          const isCurrent = idx === activeIdx && currentStage !== 'reviewed';
          const isWarning = isCurrent && hasInconsistencies;

          const Icon = stage.icon;

          let iconBg = '#f1f5f9';
          let iconColor = '#94a3b8';
          let borderColor = '#cbd5e1';

          if (isCompleted) {
            iconBg = 'var(--success-50)';
            iconColor = 'var(--success-600)';
            borderColor = 'var(--success-500)';
          } else if (isCurrent) {
            if (isWarning) {
              iconBg = 'var(--danger-50)';
              iconColor = 'var(--danger-600)';
              borderColor = 'var(--danger-500)';
            } else {
              iconBg = 'var(--primary-50)';
              iconColor = 'var(--primary-600)';
              borderColor = 'var(--primary-600)';
            }
          }

          return (
            <div
              key={stage.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                zIndex: 2,
                flex: 1,
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: iconBg,
                  border: `2px solid ${borderColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: iconColor,
                }}
              >
                {isCompleted ? <CheckCircle2 size={18} /> : isWarning ? <AlertCircle size={18} /> : <Icon size={18} />}
              </div>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: isCurrent ? 700 : 500,
                  color: isCurrent ? 'var(--text-main)' : 'var(--text-muted)',
                  textAlign: 'center',
                }}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

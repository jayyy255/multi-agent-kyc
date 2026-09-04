import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Shield,
} from 'lucide-react';

interface StatusBadgeProps {
  type?: 'status' | 'validation' | 'risk' | 'recommendation' | 'docType';
  value: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  type = 'status',
  value,
}) => {
  const normalized = (value || '').toLowerCase().replace(/_/g, ' ');

  // 1. Risk Badges
  if (type === 'risk') {
    if (value === 'low') {
      return (
        <span className="badge badge-success">
          <ShieldCheck size={14} /> Low Risk
        </span>
      );
    }
    if (value === 'medium') {
      return (
        <span className="badge badge-warning">
          <Shield size={14} /> Medium Risk
        </span>
      );
    }
    if (value === 'high') {
      return (
        <span className="badge badge-danger">
          <ShieldAlert size={14} /> High Risk
        </span>
      );
    }
  }

  // 2. Validation Badges
  if (type === 'validation') {
    if (value === 'valid') {
      return (
        <span className="badge badge-success">
          <CheckCircle2 size={14} /> Valid
        </span>
      );
    }
    if (value === 'needs_information') {
      return (
        <span className="badge badge-warning">
          <Clock size={14} /> Needs Information
        </span>
      );
    }
    if (value === 'requires_review') {
      return (
        <span className="badge badge-danger">
          <AlertTriangle size={14} /> Requires Review
        </span>
      );
    }
    if (value === 'invalid') {
      return (
        <span className="badge badge-danger">
          <XCircle size={14} /> Invalid
        </span>
      );
    }
  }

  // 3. Recommendation Badges
  if (type === 'recommendation') {
    if (value === 'proceed') {
      return (
        <span className="badge badge-success">
          <CheckCircle2 size={14} /> Proceed
        </span>
      );
    }
    if (value === 'request_additional_information') {
      return (
        <span className="badge badge-warning">
          <Clock size={14} /> Request Info
        </span>
      );
    }
    if (value === 'escalate_human_review') {
      return (
        <span className="badge badge-danger">
          <AlertTriangle size={14} /> Escalate to Human
        </span>
      );
    }
  }

  // 4. Document Types
  if (type === 'docType') {
    return (
      <span className="badge badge-neutral" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
        {value.replace(/_/g, ' ')}
      </span>
    );
  }

  // 5. Default Case Status
  if (value === 'completed') {
    return (
      <span className="badge badge-success">
        <CheckCircle2 size={14} /> Approved
      </span>
    );
  }
  if (value === 'escalated') {
    return (
      <span className="badge badge-danger">
        <AlertTriangle size={14} /> Escalated
      </span>
    );
  }
  if (value === 'ready_for_review') {
    return (
      <span className="badge badge-info">
        <Clock size={14} /> Ready for Review
      </span>
    );
  }
  if (value === 'in_progress') {
    return (
      <span className="badge badge-warning">
        <Clock size={14} /> In Progress
      </span>
    );
  }

  return <span className="badge badge-neutral">{normalized}</span>;
};

import React, { createContext, useContext, useState } from 'react';
import { INITIAL_DEMO_CASES } from '../data/demoCases';
import { KycCase, ReviewRecommendation, ValidationStatus } from '../types/kyc';

interface CaseContextType {
  cases: KycCase[];
  selectedCase: KycCase | null;
  selectCase: (caseId: string) => void;
  updateCaseStatus: (caseId: string, status: KycCase['status'], recommendation?: ReviewRecommendation) => void;
  markAsReviewed: (caseId: string, notes?: string) => void;
  requestAdditionalInfo: (caseId: string, requestedFields: string[]) => void;
  escalateCase: (caseId: string, reason: string) => void;
  addOrUpdateCase: (updated: KycCase) => void;
  resetDemoCases: () => void;
}

const CaseContext = createContext<CaseContextType | undefined>(undefined);

export const CaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cases, setCases] = useState<KycCase[]>(INITIAL_DEMO_CASES);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(INITIAL_DEMO_CASES[0].case_id);

  const selectedCase = cases.find((c) => c.case_id === selectedCaseId) || cases[0] || null;

  const selectCase = (caseId: string) => {
    setSelectedCaseId(caseId);
  };

  const updateCaseStatus = (
    caseId: string,
    status: KycCase['status'],
    recommendation?: ReviewRecommendation
  ) => {
    setCases((prev) =>
      prev.map((c) => {
        if (c.case_id === caseId) {
          return {
            ...c,
            status,
            recommendation: recommendation || c.recommendation,
            updated_at: new Date().toISOString(),
          };
        }
        return c;
      })
    );
  };

  const markAsReviewed = (caseId: string) => {
    setCases((prev) =>
      prev.map((c) => {
        if (c.case_id === caseId) {
          return {
            ...c,
            status: 'completed',
            requires_manual_review: false,
            recommendation: 'proceed',
            validation_status: 'valid' as ValidationStatus,
            updated_at: new Date().toISOString(),
          };
        }
        return c;
      })
    );
  };

  const requestAdditionalInfo = (caseId: string, requestedFields: string[]) => {
    setCases((prev) =>
      prev.map((c) => {
        if (c.case_id === caseId) {
          return {
            ...c,
            status: 'in_progress',
            recommendation: 'request_additional_information',
            validation_status: 'needs_information' as ValidationStatus,
            missing_information: Array.from(new Set([...c.missing_information, ...requestedFields])),
            updated_at: new Date().toISOString(),
          };
        }
        return c;
      })
    );
  };

  const escalateCase = (caseId: string, reason: string) => {
    setCases((prev) =>
      prev.map((c) => {
        if (c.case_id === caseId) {
          return {
            ...c,
            status: 'escalated',
            requires_manual_review: true,
            recommendation: 'escalate_human_review',
            risk_level: 'high',
            inconsistencies: Array.from(new Set([...c.inconsistencies, reason])),
            updated_at: new Date().toISOString(),
          };
        }
        return c;
      })
    );
  };

  const addOrUpdateCase = (updated: KycCase) => {
    setCases((prev) => {
      const idx = prev.findIndex((c) => c.case_id === updated.case_id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updated;
        return next;
      }
      return [updated, ...prev];
    });
  };

  const resetDemoCases = () => {
    setCases(INITIAL_DEMO_CASES);
    setSelectedCaseId(INITIAL_DEMO_CASES[0].case_id);
  };

  return (
    <CaseContext.Provider
      value={{
        cases,
        selectedCase,
        selectCase,
        updateCaseStatus,
        markAsReviewed,
        requestAdditionalInfo,
        escalateCase,
        addOrUpdateCase,
        resetDemoCases,
      }}
    >
      {children}
    </CaseContext.Provider>
  );
};

export const useCases = () => {
  const context = useContext(CaseContext);
  if (!context) {
    throw new Error('useCases must be used within a CaseProvider');
  }
  return context;
};

/**
 * Typed API endpoints corresponding to the FastAPI KYC backend services.
 */

import { apiClient } from './client';
import {
  DataComparisonRequest,
  DataComparisonResponse,
  DocumentClassifyRequest,
  DocumentClassifyResponse,
  DocumentExtractRequest,
  DocumentExtractResponse,
  DocumentValidateRequest,
  DocumentValidateResponse,
  HealthResponse,
  InconsistencyDetectRequest,
  InconsistencyDetectResponse,
  RequirementsCheckRequest,
  RequirementsCheckResponse,
  VersionResponse,
} from '../types/kyc';

export const kycApi = {
  // Health & Discovery
  getHealth: () => apiClient<HealthResponse>('/health'),
  getVersion: () => apiClient<VersionResponse>('/api/v1/version'),

  // Worker Services
  classifyDocument: (payload: DocumentClassifyRequest) =>
    apiClient<DocumentClassifyResponse>('/api/v1/documents/classify', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  extractDocumentFields: (payload: DocumentExtractRequest) =>
    apiClient<DocumentExtractResponse>('/api/v1/documents/extract', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  validateDocumentFields: (payload: DocumentValidateRequest) =>
    apiClient<DocumentValidateResponse>('/api/v1/documents/validate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Case-Level Analysis Tools
  checkRequirements: (payload: RequirementsCheckRequest) =>
    apiClient<RequirementsCheckResponse>('/api/v1/cases/check-requirements', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  compareCustomerData: (payload: DataComparisonRequest) =>
    apiClient<DataComparisonResponse>('/api/v1/cases/compare-customer-data', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  detectInconsistencies: (payload: InconsistencyDetectRequest) =>
    apiClient<InconsistencyDetectResponse>('/api/v1/cases/detect-inconsistencies', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

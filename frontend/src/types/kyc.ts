/**
 * KYC Domain TypeScript Models matching Python FastAPI Pydantic schemas.
 */

export type DocumentType =
  | 'passport'
  | 'national_id'
  | 'driving_license'
  | 'proof_of_address'
  | 'bank_statement'
  | 'tax_document'
  | 'unknown';

export type ValidationStatus =
  | 'valid'
  | 'invalid'
  | 'needs_information'
  | 'requires_review';

export type FieldValidationStatus =
  | 'valid'
  | 'invalid'
  | 'missing'
  | 'inconsistent'
  | 'unverified';

export type RiskLevel = 'low' | 'medium' | 'high';

export type ReviewRecommendation =
  | 'proceed'
  | 'request_additional_information'
  | 'escalate_human_review'
  | 'reject';

// ----------------------------------------------------
// Request Types
// ----------------------------------------------------

export interface DocumentClassifyRequest {
  document_id: string;
  filename?: string;
  content_type?: string;
  document_text?: string;
  file_path?: string;
  file_reference?: string;
  metadata?: Record<string, any>;
}

export interface DocumentExtractRequest {
  document_id: string;
  document_type: DocumentType;
  document_text?: string;
  file_reference?: string;
  extraction_config?: Record<string, any>;
}

export interface DocumentValidateRequest {
  case_id: string;
  customer_id?: string;
  document_type: DocumentType;
  extracted_fields: Record<string, any>;
  customer_record?: Record<string, any>;
  required_fields?: string[];
  reference_date?: string;
}

export interface RequirementsCheckRequest {
  case_id: string;
  customer_tier?: string;
  provided_document_types: DocumentType[];
  required_document_types?: DocumentType[];
}

export interface DataComparisonRequest {
  case_id: string;
  customer_record: Record<string, any>;
  document_extractions: Record<string, Record<string, any>>;
}

export interface InconsistencyDetectRequest {
  case_id: string;
  documents_data: Array<{
    document_type: string;
    extracted_fields: Record<string, any>;
  }>;
  customer_record?: Record<string, any>;
}

// ----------------------------------------------------
// Response Types
// ----------------------------------------------------

export interface DocumentClassifyResponse {
  success: boolean;
  document_id: string;
  document_type: DocumentType;
  confidence: number;
  extracted_metadata: Record<string, any>;
  requires_manual_review: boolean;
  warnings: string[];
  message: string;
}

export interface DocumentExtractResponse {
  success: boolean;
  document_id: string;
  document_type: DocumentType;
  extracted_fields: Record<string, any>;
  missing_fields: string[];
  confidence: number;
  requires_manual_review: boolean;
  warnings: string[];
  message: string;
}

export interface ValidationResultItem {
  field: string;
  status: FieldValidationStatus;
  message: string;
  details: Record<string, any>;
}

export interface DocumentValidateResponse {
  success: boolean;
  case_id: string;
  is_valid: boolean;
  validation_status: ValidationStatus;
  validation_results: ValidationResultItem[];
  missing_information: string[];
  inconsistencies: string[];
  requires_manual_review: boolean;
  recommendation: ReviewRecommendation;
  risk_level: RiskLevel;
  message: string;
}

export interface RequirementsCheckResponse {
  case_id: string;
  satisfied: boolean;
  missing_document_types: DocumentType[];
  provided_document_types: DocumentType[];
  recommendation: ReviewRecommendation;
  message: string;
}

export interface DataComparisonItem {
  attribute: string;
  customer_record_value: any;
  document_value: any;
  is_match: boolean;
  discrepancy_note?: string;
}

export interface DataComparisonResponse {
  case_id: string;
  all_matched: boolean;
  comparison_results: DataComparisonItem[];
  risk_level: RiskLevel;
  recommendation: ReviewRecommendation;
  message: string;
}

export interface InconsistencyDetectResponse {
  case_id: string;
  has_inconsistencies: boolean;
  inconsistencies: string[];
  risk_level: RiskLevel;
  recommendation: ReviewRecommendation;
  message: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  service: string;
}

export interface VersionResponse {
  service: string;
  version: string;
  environment: string;
  api_prefix: string;
}

export interface ErrorResponse {
  success: boolean;
  error_code: string;
  message: string;
  details: Record<string, any>;
}

// ----------------------------------------------------
// UI Case Domain Entity
// ----------------------------------------------------

export interface KycCase {
  case_id: string;
  customer_id: string;
  customer_name: string;
  customer_tier: string;
  status: 'new' | 'in_progress' | 'ready_for_review' | 'completed' | 'escalated';
  risk_level: RiskLevel;
  recommendation: ReviewRecommendation;
  documents: Array<{
    document_id: string;
    document_type: DocumentType;
    filename: string;
    status: 'unprocessed' | 'classified' | 'extracted' | 'validated';
    confidence: number;
    extracted_fields: Record<string, any>;
    missing_fields: string[];
    validation_results?: ValidationResultItem[];
  }>;
  validation_status: ValidationStatus;
  missing_information: string[];
  inconsistencies: string[];
  requires_manual_review: boolean;
  created_at: string;
  updated_at: string;
}

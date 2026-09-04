import React, { useState } from 'react';
import {
  AlertTriangle,
  FileSearch,
  Filter,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { SAMPLE_DOCUMENTS, SampleDocumentItem } from '../data/sampleDocuments';
import { kycApi } from '../api/endpoints';
import {
  DocumentClassifyResponse,
  DocumentExtractResponse,
  DocumentType,
  DocumentValidateResponse,
} from '../types/kyc';
import { StatusBadge } from '../components/common/StatusBadge';
import { ValidationCheckList } from '../components/case/ValidationCheckList';
import { JsonViewer } from '../components/common/JsonViewer';
import { AlertBanner } from '../components/common/AlertBanner';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const DocumentProcessingPage: React.FC = () => {
  const [selectedSample, setSelectedSample] = useState<SampleDocumentItem>(SAMPLE_DOCUMENTS[0]);
  const [documentId, setDocumentId] = useState<string>(SAMPLE_DOCUMENTS[0].id);
  const [filename, setFilename] = useState<string>(SAMPLE_DOCUMENTS[0].filename);
  const [contentType, setContentType] = useState<string>(SAMPLE_DOCUMENTS[0].content_type);
  const [documentText, setDocumentText] = useState<string>(SAMPLE_DOCUMENTS[0].document_text);

  // API Call States
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Results
  const [classifyResult, setClassifyResult] = useState<DocumentClassifyResponse | null>(null);
  const [extractResult, setExtractResult] = useState<DocumentExtractResponse | null>(null);
  const [validateResult, setValidateResult] = useState<DocumentValidateResponse | null>(null);

  const handleSelectSample = (sample: SampleDocumentItem) => {
    setSelectedSample(sample);
    setDocumentId(sample.id);
    setFilename(sample.filename);
    setContentType(sample.content_type);
    setDocumentText(sample.document_text);
    setClassifyResult(null);
    setExtractResult(null);
    setValidateResult(null);
    setErrorMsg(null);
  };

  // 1. Call Classify API
  const handleClassify = async (): Promise<DocumentType> => {
    setLoadingAction('classify');
    setErrorMsg(null);
    try {
      const res = await kycApi.classifyDocument({
        document_id: documentId,
        filename,
        content_type: contentType,
        document_text: documentText,
      });
      setClassifyResult(res);
      return res.document_type;
    } catch (err: any) {
      setErrorMsg(`Classification Error: ${err.message}`);
      throw err;
    } finally {
      setLoadingAction(null);
    }
  };

  // 2. Call Extract API
  const handleExtract = async (targetType?: DocumentType): Promise<Record<string, any>> => {
    setLoadingAction('extract');
    setErrorMsg(null);
    try {
      const docTypeToUse = targetType || classifyResult?.document_type || selectedSample.document_type;
      const res = await kycApi.extractDocumentFields({
        document_id: documentId,
        document_type: docTypeToUse,
        document_text: documentText,
      });
      setExtractResult(res);
      return res.extracted_fields;
    } catch (err: any) {
      setErrorMsg(`Extraction Error: ${err.message}`);
      throw err;
    } finally {
      setLoadingAction(null);
    }
  };

  // 3. Call Validate API
  const handleValidate = async (fieldsToUse?: Record<string, any>, docTypeToUse?: DocumentType) => {
    setLoadingAction('validate');
    setErrorMsg(null);
    try {
      const type = docTypeToUse || classifyResult?.document_type || selectedSample.document_type;
      const fields = fieldsToUse || extractResult?.extracted_fields || {};

      const res = await kycApi.validateDocumentFields({
        case_id: `case-${documentId}`,
        customer_id: 'cust-demo-8821',
        document_type: type,
        extracted_fields: fields,
        customer_record: {
          full_name: 'Eleanor Jane Smith',
          date_of_birth: '1992-05-14',
          country_of_residence: 'USA',
          address: '742 Evergreen Terrace, Apt 4B, Springfield, OR 97477',
        },
        reference_date: '2026-09-01',
      });
      setValidateResult(res);
    } catch (err: any) {
      setErrorMsg(`Validation Error: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  // 4. Run Full Agentic Multi-Step Workflow
  const handleRunFullPipeline = async () => {
    setErrorMsg(null);
    try {
      const identifiedType = await handleClassify();
      const extracted = await handleExtract(identifiedType);
      await handleValidate(extracted, identifiedType);
    } catch {
      // Handled in individual functions
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">Document Processing & Worker Execution</h1>
          <p className="page-description">
            Interact with live worker tools to classify documents, extract entities, and validate deterministic compliance rules.
          </p>
        </div>
        <button
          onClick={handleRunFullPipeline}
          disabled={loadingAction !== null}
          className="btn btn-primary"
          style={{ backgroundColor: '#1e40af', boxShadow: '0 2px 8px rgba(30, 64, 175, 0.3)' }}
        >
          <Sparkles size={16} /> Run Full Agent Workflow (Classify $\rightarrow$ Extract $\rightarrow$ Validate)
        </button>
      </div>

      {errorMsg && (
        <AlertBanner
          type="error"
          title="Backend Worker API Error"
          message={errorMsg}
          onClose={() => setErrorMsg(null)}
        />
      )}

      {/* Main Grid: Input Setup & Response Inspector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 480px) 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Left Card: Document Scenarios & Input Editor */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card-header" style={{ marginBottom: 0 }}>
            <div>
              <h3 className="section-title" style={{ marginBottom: 0 }}>Synthetic Scenario Selector</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Choose a preconfigured document scenario
              </span>
            </div>
          </div>

          {/* Scenario Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {SAMPLE_DOCUMENTS.map((sample) => {
              const isSelected = selectedSample.id === sample.id;
              return (
                <div
                  key={sample.id}
                  onClick={() => handleSelectSample(sample)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isSelected ? 'var(--primary-50)' : 'var(--bg-surface-subtle)',
                    border: `1px solid ${isSelected ? 'var(--primary-500)' : 'var(--border-subtle)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: isSelected ? 'var(--primary-700)' : 'var(--text-main)' }}>
                      {sample.name}
                    </span>
                    <StatusBadge type="docType" value={sample.document_type} />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sample.description}</div>
                </div>
              );
            })}
          </div>

          {/* Editable Document Text Body */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Document Text / OCR Payload
              </label>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                {documentText.length} characters
              </span>
            </div>
            <textarea
              value={documentText}
              onChange={(e) => setDocumentText(e.target.value)}
              rows={9}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '0.8rem',
                fontFamily: 'var(--font-mono)',
                backgroundColor: 'var(--bg-surface-subtle)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                lineHeight: 1.4,
              }}
            />
          </div>

          {/* Individual Action Triggers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '6px' }}>
            <button
              onClick={() => handleClassify()}
              disabled={loadingAction !== null}
              className="btn btn-secondary btn-sm"
              style={{ flexDirection: 'column', padding: '10px 6px', gap: '4px' }}
            >
              <Filter size={16} color="#2563eb" />
              <span style={{ fontSize: '0.75rem' }}>1. Classify</span>
            </button>

            <button
              onClick={() => handleExtract()}
              disabled={loadingAction !== null}
              className="btn btn-secondary btn-sm"
              style={{ flexDirection: 'column', padding: '10px 6px', gap: '4px' }}
            >
              <FileSearch size={16} color="#0891b2" />
              <span style={{ fontSize: '0.75rem' }}>2. Extract</span>
            </button>

            <button
              onClick={() => handleValidate()}
              disabled={loadingAction !== null}
              className="btn btn-secondary btn-sm"
              style={{ flexDirection: 'column', padding: '10px 6px', gap: '4px' }}
            >
              <ShieldCheck size={16} color="#16a34a" />
              <span style={{ fontSize: '0.75rem' }}>3. Validate</span>
            </button>
          </div>
        </div>

        {/* Right Column: Execution Output & Diagnostics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loadingAction && <LoadingSpinner text={`Executing worker: ${loadingAction.toUpperCase()}...`} />}

          {/* 1. Classification Output */}
          {classifyResult && (
            <div className="card" style={{ borderLeft: '4px solid #2563eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Filter size={18} color="#2563eb" />
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Classification Result</h4>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Confidence: <strong>{Math.round(classifyResult.confidence * 100)}%</strong>
                  </span>
                  <StatusBadge type="docType" value={classifyResult.document_type} />
                </div>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                {classifyResult.message}
              </p>
              {classifyResult.requires_manual_review && (
                <div style={{ color: 'var(--warning-700)', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={14} /> Flagged for manual review due to classification ambiguity.
                </div>
              )}
            </div>
          )}

          {/* 2. Extraction Output */}
          {extractResult && (
            <div className="card" style={{ borderLeft: '4px solid #0891b2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileSearch size={18} color="#0891b2" />
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Structured Extraction Result</h4>
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Confidence: <strong>{Math.round(extractResult.confidence * 100)}%</strong>
                </span>
              </div>

              {/* Extracted Key-Values */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', backgroundColor: 'var(--bg-surface-subtle)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                {Object.entries(extractResult.extracted_fields).map(([key, val]) => (
                  <div key={key}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'capitalize' }}>
                      {key.replace(/_/g, ' ')}
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', wordBreak: 'break-all' }}>
                      {String(val)}
                    </div>
                  </div>
                ))}
              </div>

              {extractResult.missing_fields.length > 0 && (
                <div style={{ marginTop: '10px', fontSize: '0.78rem', color: 'var(--warning-700)' }}>
                  Missing Expected Fields: {extractResult.missing_fields.join(', ')}
                </div>
              )}
            </div>
          )}

          {/* 3. Validation Output */}
          {validateResult && (
            <div className="card" style={{ borderLeft: `4px solid ${validateResult.is_valid ? '#16a34a' : '#dc2626'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} color={validateResult.is_valid ? '#16a34a' : '#dc2626'} />
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Deterministic Validation</h4>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <StatusBadge type="validation" value={validateResult.validation_status} />
                  <StatusBadge type="recommendation" value={validateResult.recommendation} />
                </div>
              </div>

              <ValidationCheckList results={validateResult.validation_results} />
            </div>
          )}

          {/* Raw JSON Debugging Panel */}
          {(classifyResult || extractResult || validateResult) && (
            <JsonViewer
              data={{
                classification: classifyResult,
                extraction: extractResult,
                validation: validateResult,
              }}
              title="Technical API Response Payloads"
              defaultExpanded={false}
            />
          )}

          {!classifyResult && !extractResult && !validateResult && !loadingAction && (
            <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <FileSearch size={32} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                No worker execution triggered yet
              </div>
              <p style={{ fontSize: '0.85rem' }}>
                Select a scenario on the left and click <strong>Classify</strong>, <strong>Extract</strong>, <strong>Validate</strong>, or run the full workflow.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

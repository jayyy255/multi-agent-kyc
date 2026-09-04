import React, { useState } from 'react';
import {
  ShieldCheck,
} from 'lucide-react';
import { kycApi } from '../api/endpoints';
import { DocumentType, DocumentValidateResponse } from '../types/kyc';
import { StatusBadge } from '../components/common/StatusBadge';
import { ValidationCheckList } from '../components/case/ValidationCheckList';
import { JsonViewer } from '../components/common/JsonViewer';
import { AlertBanner } from '../components/common/AlertBanner';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const VALIDATION_PRESETS = [
  {
    id: 'preset-valid',
    name: '1. Valid Passport & Profile Match',
    description: 'Fully compliant passport matching customer CRM profile.',
    docType: 'passport' as DocumentType,
    extracted: {
      full_name: 'Eleanor Jane Smith',
      passport_number: 'P98765432',
      date_of_birth: '1992-05-14',
      expiry_date: '2030-06-01',
      nationality: 'USA',
    },
    customer: {
      full_name: 'Eleanor Jane Smith',
      date_of_birth: '1992-05-14',
      country_of_residence: 'USA',
    },
  },
  {
    id: 'preset-expired',
    name: '2. Expired Passport',
    description: 'Passport with expiration date in 2020 to test expiry checks.',
    docType: 'passport' as DocumentType,
    extracted: {
      full_name: 'Robert Christopher Johnson',
      passport_number: 'G10293847',
      date_of_birth: '1980-03-22',
      expiry_date: '2020-01-15',
    },
    customer: {
      full_name: 'Robert Christopher Johnson',
      date_of_birth: '1980-03-22',
    },
  },
  {
    id: 'preset-underage',
    name: '3. Underage Applicant (< 18)',
    description: 'Applicant with DOB in 2015 to test minimum age requirement.',
    docType: 'passport' as DocumentType,
    extracted: {
      full_name: 'Tommy Vance',
      passport_number: 'P11223344',
      date_of_birth: '2015-08-10',
      expiry_date: '2030-08-10',
    },
    customer: {
      full_name: 'Tommy Vance',
      date_of_birth: '2015-08-10',
    },
  },
  {
    id: 'preset-mismatch',
    name: '4. Name Discrepancy Conflict',
    description: 'Document name differs completely from customer master profile.',
    docType: 'passport' as DocumentType,
    extracted: {
      full_name: 'Arthur Pendelton',
      passport_number: 'P99008811',
      date_of_birth: '1988-04-12',
      expiry_date: '2029-04-12',
    },
    customer: {
      full_name: 'Eleanor Jane Smith',
      date_of_birth: '1992-05-14',
    },
  },
];

export const ValidationPage: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState(VALIDATION_PRESETS[0]);
  const [caseId] = useState('case-val-001');
  const [docType, setDocType] = useState<DocumentType>(VALIDATION_PRESETS[0].docType);
  const [extractedJson, setExtractedJson] = useState(JSON.stringify(VALIDATION_PRESETS[0].extracted, null, 2));
  const [customerJson, setCustomerJson] = useState(JSON.stringify(VALIDATION_PRESETS[0].customer, null, 2));
  const [referenceDate] = useState('2026-09-01');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DocumentValidateResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleApplyPreset = (preset: typeof VALIDATION_PRESETS[0]) => {
    setSelectedPreset(preset);
    setDocType(preset.docType);
    setExtractedJson(JSON.stringify(preset.extracted, null, 2));
    setCustomerJson(JSON.stringify(preset.customer, null, 2));
    setResult(null);
    setErrorMsg(null);
  };

  const handleValidate = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      let extracted: Record<string, any> = {};
      let customer: Record<string, any> = {};

      try {
        extracted = JSON.parse(extractedJson);
      } catch {
        throw new Error('Extracted fields is not valid JSON.');
      }

      try {
        customer = JSON.parse(customerJson);
      } catch {
        throw new Error('Customer record is not valid JSON.');
      }

      const res = await kycApi.validateDocumentFields({
        case_id: caseId,
        customer_id: 'cust-demo',
        document_type: docType,
        extracted_fields: extracted,
        customer_record: customer,
        reference_date: referenceDate,
      });

      setResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Validation execution failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 className="page-title">Deterministic Validation Engine</h1>
        <p className="page-description">
          Test business compliance logic: expiry calculations, age thresholds, passport formats, and customer record fuzzy matching.
        </p>
      </div>

      {errorMsg && (
        <AlertBanner
          type="error"
          title="Validation Error"
          message={errorMsg}
          onClose={() => setErrorMsg(null)}
        />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 460px) 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Left Column: Presets and Configuration */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 className="section-title" style={{ marginBottom: '8px' }}>Validation Scenarios</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {VALIDATION_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: selectedPreset.id === preset.id ? 'var(--primary-50)' : 'var(--bg-surface-subtle)',
                    border: `1px solid ${selectedPreset.id === preset.id ? 'var(--primary-500)' : 'var(--border-subtle)'}`,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{preset.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{preset.description}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Document Type
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as DocumentType)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  marginTop: '4px',
                  fontSize: '0.85rem',
                }}
              >
                <option value="passport">Passport</option>
                <option value="driving_license">Driving License</option>
                <option value="proof_of_address">Proof of Address</option>
                <option value="bank_statement">Bank Statement</option>
                <option value="national_id">National ID</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Extracted Document Fields (JSON)
              </label>
              <textarea
                value={extractedJson}
                onChange={(e) => setExtractedJson(e.target.value)}
                rows={6}
                style={{
                  width: '100%',
                  padding: '8px',
                  fontSize: '0.78rem',
                  fontFamily: 'var(--font-mono)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  marginTop: '4px',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Customer CRM Profile (JSON)
              </label>
              <textarea
                value={customerJson}
                onChange={(e) => setCustomerJson(e.target.value)}
                rows={5}
                style={{
                  width: '100%',
                  padding: '8px',
                  fontSize: '0.78rem',
                  fontFamily: 'var(--font-mono)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  marginTop: '4px',
                }}
              />
            </div>

            <button
              onClick={handleValidate}
              disabled={loading}
              className="btn btn-primary"
              style={{ marginTop: '8px' }}
            >
              <ShieldCheck size={16} />
              {loading ? 'Evaluating Rules...' : 'Execute Validation Engine'}
            </button>
          </div>
        </div>

        {/* Right Column: Validation Output */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loading && <LoadingSpinner text="Running deterministic validation checks..." />}

          {result && (
            <div className="card" style={{ borderLeft: `5px solid ${result.is_valid ? '#16a34a' : '#dc2626'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={20} color={result.is_valid ? '#16a34a' : '#dc2626'} />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                      Validation Outcome: {result.validation_status.toUpperCase()}
                    </h3>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {result.message}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <StatusBadge type="risk" value={result.risk_level} />
                  <StatusBadge type="recommendation" value={result.recommendation} />
                </div>
              </div>

              {/* Inconsistency Alerts */}
              {result.inconsistencies.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                  <AlertBanner
                    type="error"
                    title="Discrepancies Identified"
                    message={result.inconsistencies.join(' | ')}
                  />
                </div>
              )}

              {/* Check results */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Individual Rule Checks
                </div>
                <ValidationCheckList results={result.validation_results} />
              </div>

              <JsonViewer data={result} title="Validation API Response Payload" defaultExpanded={false} />
            </div>
          )}

          {!result && !loading && (
            <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <ShieldCheck size={32} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                Validation results will appear here
              </div>
              <p style={{ fontSize: '0.85rem' }}>
                Choose a scenario on the left and click <strong>Execute Validation Engine</strong>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { kycApi } from '../api/endpoints';

describe('KYC API Client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls /health correctly and parses JSON', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ status: 'healthy', service: 'multi-agent-kyc-backend' }),
    });

    const res = await kycApi.getHealth();
    expect(res.status).toBe('healthy');
    expect(res.service).toBe('multi-agent-kyc-backend');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/health'),
      expect.anything()
    );
  });

  it('calls /api/v1/documents/classify with POST JSON body', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () =>
        Promise.resolve({
          success: true,
          document_id: 'doc-123',
          document_type: 'passport',
          confidence: 0.95,
          extracted_metadata: {},
          requires_manual_review: false,
          warnings: [],
          message: 'Document classified successfully',
        }),
    });

    const res = await kycApi.classifyDocument({
      document_id: 'doc-123',
      filename: 'passport.pdf',
      document_text: 'PASSPORT',
    });

    expect(res.document_type).toBe('passport');
    expect(res.confidence).toBe(0.95);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/documents/classify'),
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  it('handles backend network errors gracefully with ApiError', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

    await expect(kycApi.getHealth()).rejects.toThrow(/Backend service unreachable/);
  });
});

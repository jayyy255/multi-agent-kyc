import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';

describe('KYC Onboarding Frontend Application', () => {
  beforeEach(() => {
    // Mock globalThis.fetch for health checks
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/health')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ status: 'healthy', service: 'multi-agent-kyc-backend' }),
        });
      }
      if (url.includes('/api/v1/version')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () =>
            Promise.resolve({
              service: 'multi-agent-kyc-backend',
              version: '0.1.0',
              environment: 'development',
              api_prefix: '/api/v1',
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ success: true }),
      });
    });
  });

  it('renders brand title and sidebar navigation correctly', () => {
    render(<App />);
    expect(screen.getByText('KYC Intelligence')).toBeInTheDocument();
    expect(screen.getByText('Multi-Agent Automation')).toBeInTheDocument();
    expect(screen.getByText('KYC Operations Overview')).toBeInTheDocument();
  });

  it('navigates between pages smoothly', () => {
    render(<App />);

    // Navigate to KYC Cases
    const casesNavBtn = screen.getByRole('button', { name: /KYC Cases/i });
    fireEvent.click(casesNavBtn);
    expect(screen.getByText('KYC Cases Explorer')).toBeInTheDocument();

    // Navigate to Document Processing
    const docProcNavBtn = screen.getByRole('button', { name: /Document Processing/i });
    fireEvent.click(docProcNavBtn);
    expect(screen.getByText('Document Processing & Worker Execution')).toBeInTheDocument();

    // Navigate to Deterministic Validation
    const valNavBtn = screen.getByRole('button', { name: /Deterministic Validation/i });
    fireEvent.click(valNavBtn);
    expect(screen.getByText('Deterministic Validation Engine')).toBeInTheDocument();

    // Navigate to Review Queue
    const reviewNavBtn = screen.getByRole('button', { name: /Review Queue/i });
    fireEvent.click(reviewNavBtn);
    expect(screen.getByText('Compliance Review Queue')).toBeInTheDocument();

    // Navigate to System Info
    const sysNavBtn = screen.getByRole('button', { name: /System Information/i });
    fireEvent.click(sysNavBtn);
    expect(screen.getByText('System & Architecture Specifications')).toBeInTheDocument();
  });
});

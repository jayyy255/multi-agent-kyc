/**
 * Centralized API client for communicating with FastAPI backend worker services.
 */

import { ApiActivityItem } from '../types/activity';
import { ErrorResponse } from '../types/kyc';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

type ActivityListener = (item: ApiActivityItem) => void;
const listeners: Set<ActivityListener> = new Set();

export function subscribeToApiActivity(listener: ActivityListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyActivity(item: ApiActivityItem) {
  listeners.forEach((fn) => fn(item));
}

export class ApiError extends Error {
  public status: number;
  public errorCode: string;
  public details: Record<string, any>;

  constructor(status: number, errorCode: string, message: string, details: Record<string, any> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errorCode = errorCode;
    this.details = details;
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const method = (options.method || 'GET').toUpperCase() as 'GET' | 'POST' | 'PUT' | 'DELETE';
  const startTime = performance.now();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  let requestPayload: any = undefined;
  if (options.body && typeof options.body === 'string') {
    try {
      requestPayload = JSON.parse(options.body);
    } catch {
      requestPayload = options.body;
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const durationMs = Math.round(performance.now() - startTime);
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    let responseData: any = null;
    if (isJson) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    // Log Activity
    notifyActivity({
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      method,
      endpoint,
      status: response.status,
      durationMs,
      requestPayload,
      responsePayload: responseData,
      success: response.ok,
      error: response.ok ? undefined : (responseData?.message || `HTTP ${response.status}`),
    });

    if (!response.ok) {
      const errData = (isJson ? responseData : {}) as Partial<ErrorResponse>;
      throw new ApiError(
        response.status,
        errData.error_code || 'HTTP_ERROR',
        errData.message || `Request failed with status ${response.status}`,
        errData.details || {}
      );
    }

    return responseData as T;
  } catch (error: any) {
    const durationMs = Math.round(performance.now() - startTime);
    if (!(error instanceof ApiError)) {
      notifyActivity({
        id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        timestamp: new Date().toISOString(),
        method,
        endpoint,
        status: 0,
        durationMs,
        requestPayload,
        error: error.message || 'Network error / backend unavailable',
        success: false,
      });

      throw new ApiError(
        0,
        'NETWORK_ERROR',
        `Backend service unreachable at ${BASE_URL}. Ensure FastAPI is running on port 8000.`,
        { originalError: error.message }
      );
    }
    throw error;
  }
}

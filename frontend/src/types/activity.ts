/**
 * API Activity Log entry models.
 */

export interface ApiActivityItem {
  id: string;
  timestamp: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  status: number;
  durationMs: number;
  requestPayload?: any;
  responsePayload?: any;
  error?: string;
  success: boolean;
}

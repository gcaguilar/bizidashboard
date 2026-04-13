import { describe, expect, it } from 'vitest';
import { errorResponse, warningResponse } from '@/lib/api-response';

describe('api-response', () => {
  describe('errorResponse', () => {
    it('creates error response with default status 500', () => {
      const response = errorResponse('Something went wrong');
      
      expect(response.status).toBe(500);
      expect(response.headers.get('content-type')).toContain('application/json');
    });

    it('includes timestamp in body', async () => {
      const response = errorResponse('Error message');
      const body = await response.json();
      
      expect(body).toHaveProperty('timestamp');
      expect(body).toHaveProperty('dataState', 'error');
      expect(body).toHaveProperty('error', 'Error message');
    });

    it('accepts custom status code', () => {
      const response = errorResponse('Bad request', 400);
      
      expect(response.status).toBe(400);
    });

    it('includes requestId when provided', async () => {
      const response = errorResponse('Error', 500, 'req-123');
      const body = await response.json();
      
      expect(body).toHaveProperty('requestId', 'req-123');
    });

    it('sets dataState to error', async () => {
      const response = errorResponse('Error');
      const body = await response.json();
      
      expect(body.dataState).toBe('error');
    });
  });

  describe('warningResponse', () => {
    it('creates warning response with status 200', () => {
      const response = warningResponse('Warning message');
      
      expect(response.status).toBe(200);
    });

    it('includes warning and dataState in body', async () => {
      const response = warningResponse('Warning message');
      const body = await response.json();
      
      expect(body).toHaveProperty('warning', 'Warning message');
      expect(body).toHaveProperty('dataState', 'warning');
      expect(body).toHaveProperty('timestamp');
    });

    it('includes requestId when provided', async () => {
      const response = warningResponse('Warning', 'req-456');
      const body = await response.json();
      
      expect(body).toHaveProperty('requestId', 'req-456');
    });
  });
});
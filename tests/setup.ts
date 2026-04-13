/**
 * Global test setup
 * 
 * This file runs before all tests to set up the test environment.
 */

// Set required environment variables for security functions
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-testing-only';
process.env.SIGNATURE_SECRET = process.env.SIGNATURE_SECRET || 'test-signature-secret-for-testing-only';

// Set other required environment variables
process.env.CITY = process.env.CITY || 'zaragoza';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';

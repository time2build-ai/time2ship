// Set up environment variables for testing
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'time2ship_test';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'postgres';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-32-characters-long';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-characters-long';

// Mock uuid to avoid ESM issues in Jest
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234-5678-9012'),
}));

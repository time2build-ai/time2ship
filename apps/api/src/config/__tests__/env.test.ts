describe('Environment Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should load and validate environment configuration', () => {
    process.env.JWT_ACCESS_SECRET = 'test-access-secret-minimum-32-chars';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-minimum-32-chars';
    process.env.DB_PASSWORD = 'testpassword';
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3001';
    process.env.DB_HOST = 'localhost';
    process.env.DB_PORT = '5432';
    process.env.DB_NAME = 'time2ship';
    process.env.DB_USER = 'postgres';

    const { env } = require('../env');

    expect(env.JWT_ACCESS_SECRET).toBe('test-access-secret-minimum-32-chars');
    expect(env.JWT_REFRESH_SECRET).toBe('test-refresh-secret-minimum-32-chars');
    expect(env.DB_PASSWORD).toBe('testpassword');
    expect(env.NODE_ENV).toBe('test');
    expect(env.PORT).toBe('3001');
  });

  it('should throw error for short JWT access secret', () => {
    process.env.JWT_ACCESS_SECRET = 'short';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-minimum-32-chars';
    process.env.DB_PASSWORD = 'testpassword';

    expect(() => {
      jest.resetModules();
      require('../env');
    }).toThrow();
  });

  it('should throw error for short JWT refresh secret', () => {
    process.env.JWT_ACCESS_SECRET = 'test-access-secret-minimum-32-chars';
    process.env.JWT_REFRESH_SECRET = 'short';
    process.env.DB_PASSWORD = 'testpassword';

    expect(() => {
      jest.resetModules();
      require('../env');
    }).toThrow();
  });

  it('should throw error for missing DB password', () => {
    process.env.JWT_ACCESS_SECRET = 'test-access-secret-minimum-32-chars';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-minimum-32-chars';
    delete process.env.DB_PASSWORD;

    expect(() => {
      jest.resetModules();
      require('../env');
    }).toThrow();
  });

  it('should use default values for optional fields', () => {
    process.env.JWT_ACCESS_SECRET = 'test-access-secret-minimum-32-chars';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-minimum-32-chars';
    process.env.DB_PASSWORD = 'testpassword';
    delete process.env.NODE_ENV;
    delete process.env.PORT;

    jest.resetModules();
    const { env } = require('../env');

    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe('3001');
  });
});

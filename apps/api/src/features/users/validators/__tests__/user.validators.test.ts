import { createUserSchema, updateUserSchema } from '../user.validators';

describe('User Validators', () => {
  describe('createUserSchema', () => {
    it('should validate correct user data', () => {
      const validData = {
        body: {
          email: 'test@example.com',
          password: 'Password123!',
        },
      };

      expect(() => createUserSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid email', () => {
      const invalidData = {
        body: {
          email: 'invalid-email',
          password: 'Password123!',
        },
      };

      expect(() => createUserSchema.parse(invalidData)).toThrow();
    });

    it('should reject weak password (no uppercase)', () => {
      const invalidData = {
        body: {
          email: 'test@example.com',
          password: 'password123!',
        },
      };

      expect(() => createUserSchema.parse(invalidData)).toThrow();
    });

    it('should reject weak password (no special char)', () => {
      const invalidData = {
        body: {
          email: 'test@example.com',
          password: 'Password123',
        },
      };

      expect(() => createUserSchema.parse(invalidData)).toThrow();
    });

    it('should reject short password', () => {
      const invalidData = {
        body: {
          email: 'test@example.com',
          password: 'Pass1!',
        },
      };

      expect(() => createUserSchema.parse(invalidData)).toThrow();
    });
  });

  describe('updateUserSchema', () => {
    it('should validate partial updates', () => {
      const validData = {
        body: {
          email: 'newemail@example.com',
        },
        params: {
          id: '123e4567-e89b-12d3-a456-426614174000',
        },
      };

      expect(() => updateUserSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid UUID in params', () => {
      const invalidData = {
        body: {
          email: 'test@example.com',
        },
        params: {
          id: 'invalid-uuid',
        },
      };

      expect(() => updateUserSchema.parse(invalidData)).toThrow();
    });
  });
});

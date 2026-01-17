import { UserService } from '../user.service';
import { db } from '@/config/database';
import { AppError } from '@/common/utils/errors';
import bcrypt from 'bcrypt';

jest.mock('@/config/database');
jest.mock('bcrypt');

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    jest.clearAllMocks();
    userService = new UserService();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        password: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.query.users.findFirst as jest.Mock) = jest.fn().mockResolvedValue(null);
      (bcrypt.hash as jest.Mock) = jest.fn().mockResolvedValue('hashed_password');
      (db.insert as jest.Mock) = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockUser]),
        }),
      });

      const result = await userService.create('test@example.com', 'Password123!');

      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe('test@example.com');
      expect(bcrypt.hash).toHaveBeenCalledWith('Password123!', 10);
    });

    it('should throw AppError when user already exists', async () => {
      (db.query.users.findFirst as jest.Mock) = jest.fn().mockResolvedValue({
        id: '123',
        email: 'test@example.com',
      });

      await expect(
        userService.create('test@example.com', 'Password123!')
      ).rejects.toThrow(AppError);
    });
  });

  describe('findById', () => {
    it('should return user without password', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        password: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.query.users.findFirst as jest.Mock) = jest.fn().mockResolvedValue(mockUser);

      const result = await userService.findById('123');

      expect(result).not.toHaveProperty('password');
      expect(result.id).toBe('123');
    });

    it('should throw AppError when user not found', async () => {
      (db.query.users.findFirst as jest.Mock) = jest.fn().mockResolvedValue(null);

      await expect(userService.findById('999')).rejects.toThrow(AppError);
    });
  });

  describe('findByEmail', () => {
    it('should return user with password for auth', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        password: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.query.users.findFirst as jest.Mock) = jest.fn().mockResolvedValue(mockUser);

      const result = await userService.findByEmail('test@example.com');

      expect(result).toHaveProperty('password');
      expect(result.email).toBe('test@example.com');
    });

    it('should throw AppError when user not found', async () => {
      (db.query.users.findFirst as jest.Mock) = jest.fn().mockResolvedValue(null);

      await expect(userService.findByEmail('notfound@example.com')).rejects.toThrow(
        AppError
      );
    });
  });

  describe('update', () => {
    it('should update user email', async () => {
      const existingUser = {
        id: '123',
        email: 'old@example.com',
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedUser = {
        ...existingUser,
        email: 'new@example.com',
      };

      (db.query.users.findFirst as jest.Mock) = jest.fn().mockResolvedValue(existingUser);
      (db.update as jest.Mock) = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedUser]),
          }),
        }),
      });

      const result = await userService.update('123', { email: 'new@example.com' });

      expect(result.email).toBe('new@example.com');
      expect(result).not.toHaveProperty('password');
    });

    it('should update user password', async () => {
      const existingUser = {
        id: '123',
        email: 'test@example.com',
        password: 'old_hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.query.users.findFirst as jest.Mock) = jest.fn().mockResolvedValue(existingUser);
      (bcrypt.hash as jest.Mock) = jest.fn().mockResolvedValue('new_hash');
      (db.update as jest.Mock) = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([
              { ...existingUser, password: 'new_hash' },
            ]),
          }),
        }),
      });

      await userService.update('123', { password: 'NewPassword123!' });

      expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword123!', 10);
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      const existingUser = {
        id: '123',
        email: 'test@example.com',
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.query.users.findFirst as jest.Mock) = jest.fn().mockResolvedValue(existingUser);
      (db.delete as jest.Mock) = jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });

      await expect(userService.delete('123')).resolves.not.toThrow();
    });

    it('should throw AppError when user not found', async () => {
      (db.query.users.findFirst as jest.Mock) = jest.fn().mockResolvedValue(null);

      await expect(userService.delete('999')).rejects.toThrow(AppError);
    });
  });
});

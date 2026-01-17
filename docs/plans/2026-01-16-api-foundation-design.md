# API Foundation Design

**Date**: 2026-01-16
**Status**: Approved
**Scope**: Complete API foundation with users and auth features

## Overview

This design implements a feature-based architecture with layered internals for the Time2Ship API boilerplate. It provides a production-ready foundation with complete user management and authentication features that demonstrate all architectural patterns.

## Architecture Principles

- **Feature Independence** - Self-contained vertical slices
- **Routes → Services → Database** - Clear data flow through layers
- **Type Safety** - Strict TypeScript, no `any` types
- **Validation at Boundaries** - Zod validates incoming requests, trust internal data
- **Explicit Over Implicit** - Clear, readable code over abstractions

## Technology Stack

- **Framework**: Express + TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod
- **Authentication**: JWT (access + refresh tokens)
- **Password Hashing**: bcrypt
- **Testing**: Jest
- **Security**: Helmet, CORS
- **Logging**: Morgan

## Project Structure

```
apps/api/src/
├── features/                    # Feature modules (vertical slices)
│   ├── users/
│   │   ├── routes/
│   │   │   ├── index.ts
│   │   │   └── user.routes.ts
│   │   ├── services/
│   │   │   └── user.service.ts
│   │   ├── validators/
│   │   │   └── user.validators.ts
│   │   ├── schemas/
│   │   │   └── user.schema.ts
│   │   ├── types/
│   │   │   └── user.types.ts
│   │   └── __tests__/
│   │       ├── user.service.test.ts
│   │       └── user.routes.test.ts
│   ├── auth/
│   │   ├── routes/
│   │   │   ├── index.ts
│   │   │   └── auth.routes.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   └── token.service.ts
│   │   ├── validators/
│   │   │   └── auth.validators.ts
│   │   ├── schemas/
│   │   │   └── refresh-token.schema.ts
│   │   ├── types/
│   │   │   └── auth.types.ts
│   │   ├── middleware/
│   │   │   └── authenticate.ts
│   │   └── __tests__/
│   │       ├── auth.service.test.ts
│   │       └── auth.routes.test.ts
│   └── index.ts                 # Feature router registration
├── common/                      # Shared utilities
│   ├── utils/
│   │   └── errors.ts            # AppError classes
│   ├── constants/
│   │   └── index.ts             # Shared constants
│   └── helpers/
│       └── index.ts             # Helper functions
├── config/
│   ├── database.ts              # Drizzle connection
│   └── env.ts                   # Environment validation
├── middleware/
│   ├── errorHandler.ts          # Global error handler
│   ├── notFoundHandler.ts       # 404 handler
│   ├── asyncHandler.ts          # Async wrapper
│   └── validate.ts              # Zod validation middleware
├── types/
│   └── index.ts                 # Global types
└── index.ts                     # Entry point
```

## Database Schema

### Users Table

```typescript
{
  id: uuid (primary key, auto-generated)
  email: varchar(255) (unique, not null)
  password: varchar(255) (not null, bcrypt hashed)
  createdAt: timestamp (default now)
  updatedAt: timestamp (default now)
}
```

### Refresh Tokens Table

```typescript
{
  id: uuid (primary key, auto-generated)
  token: varchar(500) (unique, not null)
  userId: uuid (foreign key → users.id, cascade delete)
  expiresAt: timestamp (not null)
  isRevoked: boolean (default false)
  createdAt: timestamp (default now)
}
```

## Authentication Strategy

### JWT Token Flow

**Access Token**:
- Expiry: 15 minutes
- Payload: `{ userId, email }`
- Used for API authorization

**Refresh Token**:
- Expiry: 7 days
- Stored in database
- Used to generate new token pairs
- Supports token rotation (old token revoked on refresh)

### Authentication Flow

1. **Register/Login**: Returns access + refresh tokens
2. **API Requests**: Client sends `Authorization: Bearer <access_token>`
3. **Token Refresh**: Client sends refresh token → receives new token pair
4. **Logout**: Revokes refresh token in database

## Validation Strategy

### Password Requirements

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

### Email Validation

- Valid email format (Zod email validator)

### Request Validation

All route inputs validated via Zod middleware:

```typescript
router.post('/', validate(createUserSchema), asyncHandler(handler));
```

Validation errors return 400 with detailed messages.

## Service Layer Design

### UserService

**Methods**:
- `create(email, password)` - Create user, hash password, check duplicates
- `findById(id)` - Find user by ID, exclude password
- `findByEmail(email)` - Find user by email, include password (for auth)
- `update(id, data)` - Update email/password
- `delete(id)` - Delete user

**Error Handling**: Throws `AppError` with appropriate status codes

### AuthService

**Methods**:
- `register(email, password)` - Create user + generate tokens
- `login(email, password)` - Verify credentials + generate tokens
- `refresh(refreshToken)` - Rotate tokens (revoke old, issue new)
- `logout(refreshToken)` - Revoke refresh token

**Dependencies**: Uses `UserService` and `TokenService`

### TokenService

**Methods**:
- `generateAccessToken(userId, email)` - Create JWT access token
- `generateRefreshToken(userId)` - Create JWT refresh token
- `storeRefreshToken(token, userId)` - Save to database
- `verifyRefreshToken(token)` - Validate JWT + database record
- `revokeRefreshToken(token)` - Mark as revoked
- `revokeAllUserTokens(userId)` - Revoke all tokens for user
- `verifyAccessToken(token)` - Validate JWT signature

## API Endpoints

### Auth Endpoints (Public)

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user

### User Endpoints (Protected)

- `GET /api/v1/users/:id` - Get user by ID
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user

### Health Check

- `GET /health` - Server health status

## Error Handling

### Error Classes

**AppError** - Base error class with status code
- `NotFoundError` (404)
- `UnauthorizedError` (401)
- `ConflictError` (409)

### Error Response Format

```json
{
  "success": false,
  "message": "Error description"
}
```

### Success Response Format

```json
{
  "success": true,
  "data": { ... }
}
```

## Testing Strategy

### Coverage Requirements

- Minimum 80% coverage for services
- Unit tests for all service methods
- Integration tests for route handlers

### Test Examples Provided

**Service Tests**:
- User creation (success + duplicate error)
- Find by ID (success + not found error)
- Password hashing verification
- Token generation and verification

**Route Tests**:
- Registration (success + validation errors)
- Login (success + invalid credentials)
- Protected routes (with/without auth)
- Token refresh flow

### Mocking Strategy

- Mock database calls
- Mock service dependencies
- Use supertest for route testing

## Environment Configuration

### Required Variables

```bash
# Server
NODE_ENV=development
PORT=3001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=time2ship
DB_USER=postgres
DB_PASSWORD=postgres

# JWT Secrets (32+ characters)
JWT_ACCESS_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-secret-here
```

### Validation

Environment variables validated on startup using Zod. Application fails fast if required vars missing or invalid.

## Database Setup

### Drizzle Configuration

```typescript
// drizzle.config.ts
{
  schema: './src/features/**/schemas/*.schema.ts',
  out: './drizzle/migrations',
  driver: 'pg',
}
```

### Migration Commands

- `npm run db:generate` - Generate migration files
- `npm run db:migrate` - Run migrations
- `npm run db:studio` - Open Drizzle Studio
- `npm run db:seed` - Seed test data

### Seed Data

Two test users created:
- `test@example.com` / `Test1234!`
- `admin@example.com` / `Admin1234!`

## Dependencies to Add

### Production

```json
{
  "drizzle-orm": "^0.29.0",
  "pg": "^8.11.3",
  "zod": "^3.22.4",
  "bcrypt": "^5.1.1",
  "jsonwebtoken": "^9.0.2"
}
```

### Development

```json
{
  "drizzle-kit": "^0.20.0",
  "@types/pg": "^8.10.9",
  "@types/bcrypt": "^5.0.2",
  "@types/jsonwebtoken": "^9.0.5",
  "jest": "^29.7.0",
  "ts-jest": "^29.1.1",
  "@types/jest": "^29.5.8",
  "supertest": "^6.3.3",
  "@types/supertest": "^2.0.16"
}
```

## Docker Compose Integration

Database configuration ready for docker-compose.yml:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: time2ship
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
```

## Type Safety

### Strict TypeScript Rules

- No `any` types
- Explicit return types on all functions
- Interfaces for objects, types for unions
- Path aliases (`@/`) for clean imports

### Import Organization

1. External dependencies
2. Internal modules (`@/`)
3. Relative imports (same feature)
4. Type imports (`import type`)

## Security Features

- Password hashing with bcrypt (cost factor 10)
- JWT secrets from environment
- Helmet for security headers
- CORS configuration
- Input validation on all endpoints
- Token rotation on refresh
- Database-backed token revocation

## Development Workflow

1. Start PostgreSQL (docker-compose)
2. Run migrations: `npm run db:migrate`
3. Seed database: `npm run db:seed`
4. Start dev server: `npm run dev`
5. Run tests: `npm test`

## Next Steps for Developers

This foundation provides:
- Complete working example of feature-based architecture
- All layers demonstrated (routes, services, validators, schemas)
- Authentication patterns ready to use
- Testing examples to follow
- Clean structure to extend

To add new features:
1. Create feature folder in `features/`
2. Follow users/auth structure
3. Register routes in `features/index.ts`
4. Add tests following examples
5. Update API documentation

## Design Validation

✅ Feature-based architecture implemented
✅ All layers present (routes, services, validators, schemas)
✅ PostgreSQL + Drizzle ORM configured
✅ JWT access + refresh token strategy
✅ Comprehensive password validation
✅ bcrypt password hashing
✅ Jest testing with examples
✅ Environment validation with Zod
✅ Migrations and seed scripts
✅ Production-ready security practices
✅ Clear separation of concerns
✅ Type-safe throughout

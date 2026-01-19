# Authentication

## Overview

Time2Ship includes a complete authentication system built with JWT (JSON Web Tokens), featuring access and refresh tokens, secure password hashing, and httpOnly cookies for session management.

## Features

- ✅ **User Registration** - Email/password with validation
- ✅ **Login System** - JWT access + refresh tokens
- ✅ **Token Refresh** - Automatic token renewal
- ✅ **Email Verification** - Optional verification flow
- ✅ **Password Reset** - Secure reset via email
- ✅ **Session Management** - httpOnly cookies for security

## How It Works

### JWT Access Tokens

Short-lived tokens (15 minutes) used for authenticating API requests.

- Stored in httpOnly cookies (not accessible via JavaScript)
- Validated on protected routes via middleware
- Contains user ID and role information

### Refresh Tokens

Long-lived tokens (7 days) used to obtain new access tokens.

- Stored in httpOnly cookies
- Used only for the `/api/auth/refresh` endpoint
- Rotated on each refresh for security

### httpOnly Cookies

Both tokens are stored in httpOnly cookies to prevent XSS attacks:

- Not accessible via JavaScript
- Automatically sent with requests
- Secure flag in production (HTTPS only)

## API Endpoints

| Endpoint             | Method | Description          | Auth Required |
| -------------------- | ------ | -------------------- | ------------- |
| `/api/auth/register` | POST   | 📝 User registration | No            |
| `/api/auth/login`    | POST   | 🔑 User login        | No            |
| `/api/auth/refresh`  | POST   | 🔄 Refresh tokens    | Refresh Token |
| `/api/auth/logout`   | POST   | 👋 User logout       | Yes           |
| `/api/auth/me`       | GET    | 👤 Get current user  | Yes           |

## Usage Examples

### Registration

```typescript
const response = await fetch('http://localhost:3001/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // Important: include cookies
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePass123!',
    name: 'John Doe'
  })
});

const data = await response.json();
// Cookies are automatically set
```

### Login

```typescript
const response = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePass123!'
  })
});

const { user } = await response.json();
// Access token and refresh token cookies are set
```

### Making Authenticated Requests

```typescript
const response = await fetch('http://localhost:3001/api/auth/me', {
  method: 'GET',
  credentials: 'include' // Sends cookies automatically
});

const { user } = await response.json();
```

### Logout

```typescript
const response = await fetch('http://localhost:3001/api/auth/logout', {
  method: 'POST',
  credentials: 'include'
});

// Cookies are cleared
```

## Customization Guide

### Changing Token Expiration

Edit `apps/api/src/features/auth/services/auth.service.ts`:

```typescript
// Access token expiration (default: 15m)
const accessToken = jwt.sign(payload, JWT_ACCESS_SECRET, {
  expiresIn: '15m' // Change this
});

// Refresh token expiration (default: 7d)
const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, {
  expiresIn: '7d' // Change this
});
```

### Adding Additional User Fields

1. Update database schema in `apps/api/drizzle/schema/users.ts`
2. Generate migration: `npm run db:generate`
3. Apply migration: `npm run db:migrate`
4. Update validators in `apps/api/src/features/auth/validators/`

### Implementing Email Verification

The structure is already in place. To enable:

1. Update `apps/api/src/features/auth/services/auth.service.ts`
2. Add email verification endpoint in routes
3. Configure email service in `apps/api/src/common/services/email.service.ts`

### Adding OAuth Providers

To add Google, GitHub, etc.:

1. Install passport: `npm install passport passport-google-oauth20`
2. Create OAuth strategy in `apps/api/src/features/auth/strategies/`
3. Add OAuth routes
4. Update frontend with OAuth buttons

## Security Considerations

- 🔒 **Password Hashing** - Uses bcrypt with salt rounds
- 🔒 **httpOnly Cookies** - Prevents XSS attacks
- 🔒 **Secure Cookies** - HTTPS-only in production
- 🔒 **Token Rotation** - Refresh tokens are rotated
- 🔒 **CORS** - Configured for allowed origins only
- 🔒 **Helmet** - Security headers enabled

## Related Documentation

- [Getting Started](getting-started.md) - Environment setup
- [Architecture](architecture.md) - Backend structure
- [Testing](testing.md) - Testing auth endpoints

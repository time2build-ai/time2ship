# Password Reset Feature Design

**Date:** 2026-01-17
**Feature:** Email-Based OTP Password Reset Flow

## Overview

A secure three-page password reset flow using email-based OTPs with database storage, following the existing feature-based architecture in both API and client apps.

## User Flow

1. **Page 1: Request Reset** (`/forgot-password`)
   - User enters email address
   - System sends 6-digit OTP via email
   - Navigate to verification page

2. **Page 2: Verify OTP** (`/verify-otp`)
   - User enters 6-digit OTP from email
   - System validates OTP and issues reset token
   - Navigate to password reset page

3. **Page 3: Reset Password** (`/reset-password`)
   - User enters new password (with confirmation)
   - System validates reset token and updates password
   - Navigate to login page

## API Architecture

### Database Schema

**New Table: `password_resets`**

```sql
CREATE TABLE password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  otp VARCHAR(255) NOT NULL,              -- bcrypt hashed
  expires_at TIMESTAMP NOT NULL,          -- 15 minutes from creation
  used BOOLEAN DEFAULT FALSE NOT NULL,
  reset_token VARCHAR(500),               -- JWT token after OTP verification
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_password_resets_email ON password_resets(email);
CREATE INDEX idx_password_resets_expires_at ON password_resets(expires_at);
CREATE INDEX idx_password_resets_reset_token ON password_resets(reset_token);
```

### Feature Structure

Location: `apps/api/src/features/auth/`

**New Files:**
- `schemas/password-reset.schema.ts` - Drizzle schema definition
- `services/password-reset.service.ts` - Business logic for password reset flow
- `validators/password-reset.validators.ts` - Zod validation schemas
- `controllers/password-reset.controller.ts` - HTTP request handlers

**Modified Files:**
- `routes/auth.routes.ts` - Add three new endpoints
- `services/email.service.ts` - Update password reset email template

### API Endpoints

#### 1. POST `/auth/forgot-password`

**Request:**
```typescript
{
  email: string
}
```

**Response:**
```typescript
{
  message: "If an account exists with that email, you'll receive a code"
}
```

**Logic:**
1. Validate email format (Zod)
2. Check rate limiting: max 3 requests per email per hour
3. Delete expired/used records for this email (cleanup)
4. Check if user exists (silent - don't reveal)
5. If user exists:
   - Generate 6-digit OTP using `crypto.randomInt(100000, 999999)`
   - Hash OTP with bcrypt
   - Store record with 15-minute expiration
   - Send email with OTP code
6. Always return success message (prevent enumeration)

**Rate Limiting:**
- Count non-expired requests for email in last hour
- Reject if >= 3 requests
- Return 429 status with generic message

#### 2. POST `/auth/verify-reset-otp`

**Request:**
```typescript
{
  email: string,
  otp: string  // 6 digits
}
```

**Response:**
```typescript
{
  resetToken: string  // JWT token
}
```

**Logic:**
1. Validate request (Zod)
2. Look up non-expired, unused OTP record by email
3. Compare submitted OTP with hashed OTP using bcrypt
4. If valid:
   - Mark OTP as `used: true`
   - Generate JWT reset token (10-minute expiration)
   - Payload: `{ email, type: 'password-reset' }`
   - Store token in `reset_token` field
   - Return token to client
5. If invalid/expired: return 400 with generic error

**Error Responses:**
- Invalid/expired OTP: `400 - "Invalid or expired code"`
- Already used: `400 - "Invalid or expired code"`

#### 3. POST `/auth/reset-password`

**Request:**
```typescript
{
  resetToken: string,
  password: string
}
```

**Response:**
```typescript
{
  message: "Password reset successfully"
}
```

**Logic:**
1. Validate request (Zod with password strength rules)
2. Verify JWT signature and expiration
3. Extract email from JWT payload
4. Look up reset record by token, ensure not used
5. Find user by email
6. Hash new password with bcrypt
7. Update user password
8. Mark reset record as `used: true`
9. Return success response

**Error Responses:**
- Invalid/expired token: `401 - "Reset session expired, please start over"`
- Token already used: `401 - "Reset session expired, please start over"`

### Password Reset Service

**Class: `PasswordResetService`**

**Methods:**

```typescript
class PasswordResetService {
  async requestPasswordReset(email: string): Promise<void>
  async verifyOTP(email: string, otp: string): Promise<string>
  async resetPassword(resetToken: string, newPassword: string): Promise<void>
  private async checkRateLimit(email: string): Promise<void>
  private async cleanupOldRecords(email: string): Promise<void>
  private generateOTP(): string
  private generateResetToken(email: string): string
}
```

**Key Implementation Details:**

- **OTP Generation:** `crypto.randomInt(100000, 999999).toString()`
- **OTP Hashing:** Use bcrypt with same salt rounds as passwords
- **Reset Token:** JWT with 10-minute expiration, signed with `JWT_SECRET`
- **Rate Limiting:** Count records where `created_at > NOW() - INTERVAL '1 hour'`
- **Cleanup:** Delete records where `expires_at < NOW() OR used = true` for given email

### Email Template Update

**Modify:** `emailService.sendPasswordResetEmail()`

**Current:** Sends token-based reset link
**New:** Send OTP code display

**Template Changes:**
```html
Your password reset code is:

[Large, prominent display of 6-digit code]

This code will expire in 15 minutes.

If you didn't request this, ignore this email.
```

## Client Architecture

### Page Structure

Location: `apps/client/app/(auth)/`

#### 1. `/forgot-password/page.tsx`

**Components:**
- `ForgotPasswordForm` component
- Email input field
- Submit button
- Back to login link

**Server Action:** `forgotPasswordAction`
- Calls `POST /auth/forgot-password`
- On success: navigate to `/verify-otp?email={email}`
- Use `useActionState` for form state

**UI Elements:**
- Heading: "Reset your password"
- Description: "Enter your email and we'll send you a code"
- Success message via toast
- Error handling via form state

#### 2. `/verify-otp/page.tsx`

**Components:**
- `VerifyOTPForm` component
- Custom `<OTPInput>` component (6 boxes)
- Resend code link
- Countdown timer (15 minutes)

**Server Action:** `verifyOTPAction`
- Calls `POST /auth/verify-reset-otp`
- On success: store reset token, navigate to `/reset-password`
- Use `useActionState` for form state

**OTP Input Component:**
```typescript
<OTPInput>
  - 6 individual input boxes
  - Auto-focus next on digit entry
  - Auto-submit when complete
  - Paste support (splits "123456")
  - Numeric keyboard (inputMode="numeric")
  - Clear all button
</OTPInput>
```

**Additional Features:**
- Read email from URL params
- Show countdown timer based on request time
- "Resend code" link (calls forgot-password again)
- Show email being verified

#### 3. `/reset-password/page.tsx`

**Components:**
- `ResetPasswordForm` component
- New password input
- Confirm password input
- Password strength indicator
- Submit button

**Server Action:** `resetPasswordAction`
- Requires reset token (redirect if missing)
- Calls `POST /auth/reset-password`
- On success: navigate to `/login` with success toast
- Use `useActionState` for form state

**Validation:**
- Client-side: passwords match, meet requirements
- Server-side: Zod validation in API
- Show password strength indicator
- Show requirements checklist

### Modified Files

**`app/(auth)/login/components/login-form.tsx`**

Add "Forgot password?" link:
```tsx
<Link
  href="/forgot-password"
  className="text-sm text-accent-primary hover:text-accent-primary-soft"
>
  Forgot password?
</Link>
```

Position: Below password input, above submit button

### Shared Components

**New Component:** `src/shared/components/ui/otp-input.tsx`

```typescript
interface OTPInputProps {
  length: number;          // default: 6
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  error?: string;
}
```

**Features:**
- Individual boxes for each digit
- Auto-advance on input
- Backspace navigation
- Paste handling
- Mobile-friendly numeric keyboard
- Accessible (ARIA labels)
- Error state styling

### State Management

**URL Search Params:**
- Email passed via query string: `/verify-otp?email={email}`
- Visible to user, bookmarkable
- Read with `useSearchParams()`

**Reset Token Storage:**
- Store in component state (not localStorage)
- Pass to reset-password page via navigation state
- Clear after successful reset
- Redirect to forgot-password if missing

**Form State:**
- Use Next.js `useActionState` hook
- Follow existing pattern from login/register
- Error format: `{ error?: string, errors?: Record<string, string[]> }`

## Security Measures

### OTP Security

1. **Hashing:** Store bcrypt-hashed OTPs, never plain text
2. **Single-Use:** Mark as `used: true` immediately after verification
3. **Expiration:** 15-minute TTL with database-level validation
4. **Rate Limiting:** 3 requests per email per hour
5. **No Enumeration:** Generic error messages, silent success

### Reset Token Security

1. **Short-Lived:** 10-minute JWT expiration
2. **Database Validation:** Not purely stateless, validated against DB record
3. **Single-Use:** Marked as used after password reset
4. **Minimal Payload:** `{ email, type: 'password-reset' }`
5. **Signed:** Using JWT_SECRET from environment

### Additional Protections

1. **Email Enumeration Prevention:**
   - Always return success on forgot-password
   - No hints about email existence
   - Same timing for existing/non-existing emails

2. **No Information Leakage:**
   - Generic error messages at all steps
   - Don't reveal which step failed
   - No distinction between invalid OTP vs expired

3. **Password Security:**
   - New password hashed with bcrypt
   - Password strength requirements enforced
   - Validated on both client and server

4. **Automatic Cleanup:**
   - On-demand deletion of expired/used records
   - Prevents database bloat
   - Removes sensitive data after use

## Testing Strategy

### API Tests

**`password-reset.service.test.ts`** - Unit tests:
- ✓ Generate OTP correctly
- ✓ Hash OTP before storing
- ✓ Respect 15-minute expiration
- ✓ Rate limiting works (3 per hour)
- ✓ Verify OTP correctly
- ✓ Reject expired OTP
- ✓ Reject already-used OTP
- ✓ Generate valid reset token
- ✓ Reset password successfully
- ✓ Reject invalid reset token
- ✓ Reject expired reset token
- ✓ Cleanup old records on request
- ✓ Silent success for non-existent email

**`password-reset.controller.test.ts`** - Integration tests:
- ✓ POST /forgot-password returns 200
- ✓ POST /forgot-password respects rate limit (429)
- ✓ POST /verify-reset-otp returns token on valid OTP
- ✓ POST /verify-reset-otp returns 400 on invalid OTP
- ✓ POST /reset-password updates password
- ✓ POST /reset-password returns 401 on invalid token
- ✓ Full flow: request → verify → reset

### Client Tests

**Component Tests:**
- ✓ OTPInput renders 6 boxes
- ✓ OTPInput auto-advances on input
- ✓ OTPInput handles paste
- ✓ OTPInput calls onComplete when full
- ✓ Forms show validation errors
- ✓ Forms show loading states

**Server Action Tests:**
- ✓ forgotPasswordAction calls API correctly
- ✓ verifyOTPAction handles errors
- ✓ resetPasswordAction validates passwords match

### Manual Testing Checklist

- [ ] Email delivery in dev mode (check logs)
- [ ] Full happy path: request → verify → reset → login
- [ ] Expired OTP shows appropriate error
- [ ] Invalid OTP shows appropriate error
- [ ] Token expiration redirects correctly
- [ ] Resend OTP creates new code
- [ ] Rate limiting blocks after 3 requests
- [ ] Non-existent email shows success (no enumeration)
- [ ] Password requirements enforced
- [ ] Mobile: numeric keyboard appears for OTP
- [ ] Mobile: paste works for OTP
- [ ] Back button doesn't break flow
- [ ] Toast notifications appear correctly

## Implementation Checklist

### API Implementation

- [ ] Create database migration file
- [ ] Create `password-reset.schema.ts` (Drizzle)
- [ ] Create `password-reset.service.ts`
  - [ ] `requestPasswordReset()` method
  - [ ] `verifyOTP()` method
  - [ ] `resetPassword()` method
  - [ ] `checkRateLimit()` private method
  - [ ] `cleanupOldRecords()` private method
  - [ ] `generateOTP()` private method
  - [ ] `generateResetToken()` private method
- [ ] Create `password-reset.validators.ts` (3 Zod schemas)
- [ ] Create `password-reset.controller.ts` (3 handlers)
- [ ] Update `auth.routes.ts` (add 3 routes)
- [ ] Update `emailService.sendPasswordResetEmail()` (OTP template)
- [ ] Write service unit tests
- [ ] Write controller integration tests
- [ ] Run database migration

### Client Implementation

- [ ] Create `app/(auth)/forgot-password/page.tsx`
- [ ] Create `app/(auth)/forgot-password/actions.ts`
- [ ] Create `app/(auth)/forgot-password/components/forgot-password-form.tsx`
- [ ] Create `app/(auth)/verify-otp/page.tsx`
- [ ] Create `app/(auth)/verify-otp/actions.ts`
- [ ] Create `app/(auth)/verify-otp/components/verify-otp-form.tsx`
- [ ] Create `app/(auth)/reset-password/page.tsx`
- [ ] Create `app/(auth)/reset-password/actions.ts`
- [ ] Create `app/(auth)/reset-password/components/reset-password-form.tsx`
- [ ] Create `src/shared/components/ui/otp-input.tsx`
- [ ] Update `app/(auth)/login/components/login-form.tsx` (add link)
- [ ] Write component tests
- [ ] Test full flow manually

## Success Criteria

1. ✓ User can request password reset with just email
2. ✓ User receives 6-digit OTP via email within seconds
3. ✓ User can verify OTP and proceed to password reset
4. ✓ User can set new password and login successfully
5. ✓ OTPs expire after 15 minutes
6. ✓ Reset tokens expire after 10 minutes
7. ✓ Rate limiting prevents abuse (3 requests/hour)
8. ✓ No email enumeration possible
9. ✓ All data properly cleaned up after use
10. ✓ Comprehensive test coverage (>80%)

## Future Enhancements (Out of Scope)

- SMS-based OTP as alternative
- Remember trusted devices
- Password reset via security questions
- Admin dashboard for monitoring reset attempts
- Advanced fraud detection
- WebAuthn/passkey support

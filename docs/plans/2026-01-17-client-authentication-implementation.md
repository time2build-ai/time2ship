# Client Authentication System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build complete Next.js authentication system with login, register, protected dashboard, and automatic token refresh using cookie-based sessions.

**Architecture:** Server-first Next.js 16+ App Router with Server Actions for auth flow, httpOnly cookies for token storage, middleware for route protection and automatic token refresh, and progressive enhancement (forms work without JavaScript).

**Tech Stack:** Next.js 16+, React 19, TypeScript, Tailwind CSS v4, Zod validation, Sonner toasts, jose (JWT decoding)

---

## Phase 1: Foundation & Dependencies

### Task 1: Install Required Dependencies

**Files:**
- Modify: `apps/client/package.json`

**Step 1: Install dependencies**

```bash
cd apps/client
npm install zod sonner clsx tailwind-merge jose
npm install -D @types/node
```

Expected: Dependencies installed successfully

**Step 2: Verify installation**

```bash
npm list zod sonner clsx tailwind-merge jose
```

Expected: All packages listed with versions

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add auth dependencies (zod, sonner, jose, clsx, tailwind-merge)"
```

---

### Task 2: Configure TypeScript Path Aliases

**Files:**
- Modify: `apps/client/tsconfig.json`

**Step 1: Update tsconfig paths**

Replace the `paths` section in `compilerOptions`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/shared/*": ["./src/shared/*"],
      "@/config/*": ["./src/config/*"]
    }
  }
}
```

**Step 2: Verify TypeScript accepts config**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add tsconfig.json
git commit -m "config: update TypeScript path aliases for @/shared pattern"
```

---

### Task 3: Create Environment Configuration

**Files:**
- Create: `apps/client/.env.example`
- Create: `apps/client/.env.local`
- Create: `apps/client/src/shared/lib/env.ts`

**Step 1: Create .env.example**

```bash
# apps/client/.env.example
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Time2Ship
```

**Step 2: Create .env.local**

Copy from .env.example:

```bash
cp apps/client/.env.example apps/client/.env.local
```

**Step 3: Create env validation file**

Create `apps/client/src/shared/lib/env.ts`:

```typescript
import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_APP_NAME: z.string().min(1),
});

// Validate on module load
export const env = envSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
});
```

**Step 4: Test env validation**

```bash
npm run dev
```

Expected: Server starts without env validation errors, or shows clear error if env vars missing

Stop the server with Ctrl+C.

**Step 5: Update .gitignore**

Verify `.env.local` is in `.gitignore` (should already be there from Next.js default):

```bash
grep -q ".env.local" .gitignore && echo "Already ignored" || echo ".env*.local" >> .gitignore
```

**Step 6: Commit**

```bash
git add .env.example src/shared/lib/env.ts .gitignore
git commit -m "config: add environment variable validation with Zod"
```

---

### Task 4: Create Utility Functions

**Files:**
- Create: `apps/client/src/shared/lib/utils.ts`

**Step 1: Create utils file**

Create `apps/client/src/shared/lib/utils.ts`:

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with proper conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/shared/lib/utils.ts
git commit -m "feat: add cn utility for Tailwind class merging"
```

---

## Phase 2: Base UI Components

### Task 5: Create Button Component

**Files:**
- Create: `apps/client/src/shared/components/ui/button.tsx`

**Step 1: Create Button component**

Create `apps/client/src/shared/components/ui/button.tsx`:

```typescript
import { cn } from '@/shared/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', loading = false, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'rounded-lg px-4 py-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
          variant === 'primary' &&
            'bg-black text-white hover:bg-gray-800 focus:ring-gray-900 dark:bg-white dark:text-black dark:hover:bg-gray-200',
          variant === 'secondary' &&
            'bg-gray-200 text-black hover:bg-gray-300 focus:ring-gray-400 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600',
          variant === 'outline' &&
            'border border-gray-300 bg-transparent hover:bg-gray-50 focus:ring-gray-400 dark:border-gray-600 dark:hover:bg-gray-800',
          (loading || disabled) && 'cursor-not-allowed opacity-50',
          className
        )}
        disabled={loading || disabled}
        {...props}
      >
        {loading ? 'Loading...' : children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

**Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/shared/components/ui/button.tsx
git commit -m "feat: add Button component with variants and loading state"
```

---

### Task 6: Create Input Component

**Files:**
- Create: `apps/client/src/shared/components/ui/input.tsx`

**Step 1: Create Input component**

Create `apps/client/src/shared/components/ui/input.tsx`:

```typescript
import { cn } from '@/shared/lib/utils';
import { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={props.id || props.name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white dark:focus:ring-white',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
```

**Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/shared/components/ui/input.tsx
git commit -m "feat: add Input component with label and error support"
```

---

### Task 7: Create Card Component

**Files:**
- Create: `apps/client/src/shared/components/ui/card.tsx`

**Step 1: Create Card component**

Create `apps/client/src/shared/components/ui/card.tsx`:

```typescript
import { cn } from '@/shared/lib/utils';
import { HTMLAttributes, forwardRef } from 'react';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900',
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex flex-col space-y-1.5 p-6', className)}
        {...props}
      />
    );
  }
);

CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn('text-lg font-semibold leading-none tracking-tight', className)}
        {...props}
      />
    );
  }
);

CardTitle.displayName = 'CardTitle';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />;
  }
);

CardContent.displayName = 'CardContent';
```

**Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/shared/components/ui/card.tsx
git commit -m "feat: add Card component with Header, Title, and Content subcomponents"
```

---

### Task 8: Set Up Toast Notifications

**Files:**
- Modify: `apps/client/app/layout.tsx`

**Step 1: Add Toaster to root layout**

Modify `apps/client/app/layout.tsx` to add Sonner Toaster:

```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Time2Ship",
  description: "Ship your SaaS faster",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
```

**Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Test dev server**

```bash
npm run dev
```

Expected: Server starts without errors. Stop with Ctrl+C.

**Step 4: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: add Sonner toast notifications to root layout"
```

---

## Phase 3: API Client & Validators

### Task 9: Create Zod Validators

**Files:**
- Create: `apps/client/src/shared/lib/validators/auth.ts`

**Step 1: Create auth validators**

Create `apps/client/src/shared/lib/validators/auth.ts`:

```typescript
import { z } from 'zod';

/**
 * Password validation schema matching API requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

/**
 * Login form validation (no password strength check on login)
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Registration form validation (includes password strength)
 */
export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: passwordSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
```

**Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/shared/lib/validators/auth.ts
git commit -m "feat: add Zod validators for login and register forms"
```

---

### Task 10: Create API Client

**Files:**
- Create: `apps/client/src/shared/lib/api/client.ts`

**Step 1: Create base API client**

Create `apps/client/src/shared/lib/api/client.ts`:

```typescript
import { env } from '@/shared/lib/env';

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Make a request to the API backend
 */
export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${env.NEXT_PUBLIC_API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || 'Something went wrong',
      };
    }

    return { success: true, data: data.data || data };
  } catch (error) {
    console.error('API request failed:', error);
    return {
      success: false,
      error: 'Network error. Please try again.',
    };
  }
}
```

**Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/shared/lib/api/client.ts
git commit -m "feat: add base API client with error handling"
```

---

### Task 11: Create Auth API Endpoints

**Files:**
- Create: `apps/client/src/shared/lib/api/auth.ts`

**Step 1: Create auth API endpoints**

Create `apps/client/src/shared/lib/api/auth.ts`:

```typescript
import { apiRequest } from './client';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends AuthTokens {
  user: {
    id: string;
    email: string;
  };
}

export interface RegisterResponse extends AuthTokens {
  user: {
    id: string;
    email: string;
  };
}

export const authApi = {
  /**
   * Login with email and password
   */
  login: (data: { email: string; password: string }) =>
    apiRequest<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Register a new user
   */
  register: (data: { email: string; password: string }) =>
    apiRequest<RegisterResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Refresh access token using refresh token
   */
  refresh: (refreshToken: string) =>
    apiRequest<AuthTokens>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),

  /**
   * Logout and revoke refresh token
   */
  logout: (refreshToken: string) =>
    apiRequest<void>('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),
};
```

**Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/shared/lib/api/auth.ts
git commit -m "feat: add auth API endpoints (login, register, refresh, logout)"
```

---

## Phase 4: Session Management & Token Utilities

### Task 12: Create Token Utilities

**Files:**
- Create: `apps/client/src/shared/lib/auth/tokens.ts`

**Step 1: Create token utilities**

Create `apps/client/src/shared/lib/auth/tokens.ts`:

```typescript
import { jwtVerify, decodeJwt } from 'jose';

/**
 * Decode JWT token without verification (for reading expiry time)
 */
export function decodeToken(token: string): {
  exp?: number;
  userId?: string;
  email?: string;
} {
  try {
    return decodeJwt(token);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return {};
  }
}

/**
 * Get token expiration timestamp (milliseconds)
 */
export function getTokenExpiry(token: string): number {
  const decoded = decodeToken(token);
  if (!decoded.exp) {
    return 0;
  }
  return decoded.exp * 1000; // Convert to milliseconds
}

/**
 * Check if token is expired or will expire soon
 */
export function isTokenExpiringSoon(token: string, bufferMs: number = 5 * 60 * 1000): boolean {
  const expiry = getTokenExpiry(token);
  return expiry < Date.now() + bufferMs;
}
```

**Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/shared/lib/auth/tokens.ts
git commit -m "feat: add JWT token utilities for decoding and expiry checks"
```

---

### Task 13: Create Session Helper Functions

**Files:**
- Create: `apps/client/src/shared/lib/auth/session.ts`

**Step 1: Create session helpers**

Create `apps/client/src/shared/lib/auth/session.ts`:

```typescript
import { cookies } from 'next/headers';
import { decodeToken } from './tokens';

export interface User {
  id: string;
  email: string;
}

/**
 * Get current user from access token cookie
 */
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value;

  if (!accessToken) {
    return null;
  }

  const decoded = decodeToken(accessToken);

  if (!decoded.userId || !decoded.email) {
    return null;
  }

  return {
    id: decoded.userId,
    email: decoded.email,
  };
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * Cookie options for auth tokens
 */
export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};
```

**Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/shared/lib/auth/session.ts
git commit -m "feat: add session helper functions for user authentication"
```

---

## Phase 5: Authentication Pages & Actions

### Task 14: Create Login Server Action

**Files:**
- Create: `apps/client/app/(auth)/login/actions.ts`

**Step 1: Create login action**

Create `apps/client/app/(auth)/login/actions.ts`:

```typescript
'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { loginSchema } from '@/shared/lib/validators/auth';
import { authApi } from '@/shared/lib/api/auth';
import { cookieOptions } from '@/shared/lib/auth/session';

export async function loginAction(prevState: any, formData: FormData) {
  // Validate input
  const result = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors,
    };
  }

  // Call API
  const response = await authApi.login(result.data);

  if (!response.success) {
    return {
      success: false,
      error: response.error,
    };
  }

  // Set cookies
  const cookieStore = await cookies();

  cookieStore.set('accessToken', response.data.accessToken, {
    ...cookieOptions,
    maxAge: 60 * 15, // 15 minutes
  });

  cookieStore.set('refreshToken', response.data.refreshToken, {
    ...cookieOptions,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  // Redirect to dashboard
  redirect('/app');
}
```

**Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add app/\(auth\)/login/actions.ts
git commit -m "feat: add login Server Action with cookie management"
```

---

### Task 15: Create Login Form Component

**Files:**
- Create: `apps/client/app/(auth)/login/components/login-form.tsx`

**Step 1: Create login form**

Create `apps/client/app/(auth)/login/components/login-form.tsx`:

```typescript
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useEffect } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { loginAction } from '../actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} className="w-full">
      Log In
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useFormState(loginAction, null);

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state?.error]);

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Welcome back</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Sign in to your account
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <Input
          name="email"
          type="email"
          label="Email"
          placeholder="you@example.com"
          autoComplete="email"
          required
          error={state?.errors?.email?.[0]}
        />

        <Input
          name="password"
          type="password"
          label="Password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
          error={state?.errors?.password?.[0]}
        />

        <SubmitButton />
      </form>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Don't have an account?{' '}
        <Link href="/register" className="font-medium text-black hover:underline dark:text-white">
          Sign up
        </Link>
      </p>
    </div>
  );
}
```

**Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add app/\(auth\)/login/components/login-form.tsx
git commit -m "feat: add LoginForm component with validation and error handling"
```

---

### Task 16: Create Login Page

**Files:**
- Create: `apps/client/app/(auth)/login/page.tsx`

**Step 1: Create login page**

Create `apps/client/app/(auth)/login/page.tsx`:

```typescript
import { LoginForm } from './components/login-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login | Time2Ship',
  description: 'Sign in to your account',
};

export default function LoginPage() {
  return <LoginForm />;
}
```

**Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add app/\(auth\)/login/page.tsx
git commit -m "feat: add login page with metadata"
```

---

### Task 17: Create Auth Layout

**Files:**
- Create: `apps/client/app/(auth)/layout.tsx`

**Step 1: Create auth layout**

Create `apps/client/app/(auth)/layout.tsx`:

```typescript
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-black">
      {children}
    </div>
  );
}
```

**Step 2: Test login page in dev server**

```bash
npm run dev
```

Visit http://localhost:3000/login in browser. Should see centered login form.

Stop server with Ctrl+C.

**Step 3: Commit**

```bash
git add app/\(auth\)/layout.tsx
git commit -m "feat: add auth layout with centered design"
```

---

### Task 18: Create Register Server Action

**Files:**
- Create: `apps/client/app/(auth)/register/actions.ts`

**Step 1: Create register action**

Create `apps/client/app/(auth)/register/actions.ts`:

```typescript
'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { registerSchema } from '@/shared/lib/validators/auth';
import { authApi } from '@/shared/lib/api/auth';
import { cookieOptions } from '@/shared/lib/auth/session';

export async function registerAction(prevState: any, formData: FormData) {
  // Validate input
  const result = registerSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors,
    };
  }

  // Call API
  const response = await authApi.register(result.data);

  if (!response.success) {
    return {
      success: false,
      error: response.error,
    };
  }

  // Set cookies
  const cookieStore = await cookies();

  cookieStore.set('accessToken', response.data.accessToken, {
    ...cookieOptions,
    maxAge: 60 * 15, // 15 minutes
  });

  cookieStore.set('refreshToken', response.data.refreshToken, {
    ...cookieOptions,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  // Redirect to dashboard
  redirect('/app');
}
```

**Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add app/\(auth\)/register/actions.ts
git commit -m "feat: add register Server Action with validation"
```

---

### Task 19: Create Register Form Component

**Files:**
- Create: `apps/client/app/(auth)/register/components/register-form.tsx`

**Step 1: Create register form**

Create `apps/client/app/(auth)/register/components/register-form.tsx`:

```typescript
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useEffect } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { registerAction } from '../actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} className="w-full">
      Create Account
    </Button>
  );
}

export function RegisterForm() {
  const [state, formAction] = useFormState(registerAction, null);

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state?.error]);

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Create an account</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Get started with Time2Ship
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <Input
          name="email"
          type="email"
          label="Email"
          placeholder="you@example.com"
          autoComplete="email"
          required
          error={state?.errors?.email?.[0]}
        />

        <div className="space-y-1">
          <Input
            name="password"
            type="password"
            label="Password"
            placeholder="••••••••"
            autoComplete="new-password"
            required
            error={state?.errors?.password?.[0]}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Must be at least 8 characters with uppercase, lowercase, number, and special character
          </p>
        </div>

        <SubmitButton />
      </form>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-black hover:underline dark:text-white">
          Sign in
        </Link>
      </p>
    </div>
  );
}
```

**Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add app/\(auth\)/register/components/register-form.tsx
git commit -m "feat: add RegisterForm with password requirements hint"
```

---

### Task 20: Create Register Page

**Files:**
- Create: `apps/client/app/(auth)/register/page.tsx`

**Step 1: Create register page**

Create `apps/client/app/(auth)/register/page.tsx`:

```typescript
import { RegisterForm } from './components/register-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register | Time2Ship',
  description: 'Create a new account',
};

export default function RegisterPage() {
  return <RegisterForm />;
}
```

**Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add app/\(auth\)/register/page.tsx
git commit -m "feat: add register page with metadata"
```

---

## Phase 6: Middleware & Route Protection

### Task 21: Create Middleware

**Files:**
- Create: `apps/client/middleware.ts`

**Step 1: Create middleware**

Create `apps/client/middleware.ts`:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isTokenExpiringSoon } from '@/shared/lib/auth/tokens';
import { authApi } from '@/shared/lib/api/auth';

export async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;
  const path = request.nextUrl.pathname;

  // Protect /app/* routes
  if (path.startsWith('/app')) {
    if (!accessToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Check if token needs refresh (expires in <5 minutes)
    if (isTokenExpiringSoon(accessToken, 5 * 60 * 1000) && refreshToken) {
      const newTokens = await authApi.refresh(refreshToken);

      if (newTokens.success) {
        const response = NextResponse.next();

        response.cookies.set('accessToken', newTokens.data.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 15, // 15 minutes
        });

        response.cookies.set('refreshToken', newTokens.data.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        return response;
      } else {
        // Refresh failed, redirect to login
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('accessToken');
        response.cookies.delete('refreshToken');
        return response;
      }
    }
  }

  // Redirect authenticated users away from auth pages
  if ((path === '/login' || path === '/register') && accessToken) {
    return NextResponse.redirect(new URL('/app', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*', '/login', '/register'],
};
```

**Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat: add middleware for route protection and token refresh"
```

---

## Phase 7: Dashboard & App Layout

### Task 22: Create Logout Server Action

**Files:**
- Create: `apps/client/app/(app)/actions.ts`

**Step 1: Create logout action**

Create `apps/client/app/(app)/actions.ts`:

```typescript
'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { authApi } from '@/shared/lib/api/auth';

export async function logoutAction() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refreshToken')?.value;

  if (refreshToken) {
    // Call API to revoke token (don't wait for response)
    await authApi.logout(refreshToken).catch(() => {
      // Ignore errors - we're logging out anyway
    });
  }

  // Delete cookies
  cookieStore.delete('accessToken');
  cookieStore.delete('refreshToken');

  // Redirect to login
  redirect('/login');
}
```

**Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add app/\(app\)/actions.ts
git commit -m "feat: add logout Server Action"
```

---

### Task 23: Create Logout Button Component

**Files:**
- Create: `apps/client/app/(app)/components/logout-button.tsx`

**Step 1: Create logout button**

Create `apps/client/app/(app)/components/logout-button.tsx`:

```typescript
'use client';

import { useFormStatus } from 'react-dom';
import { Button } from '@/shared/components/ui/button';
import { logoutAction } from '../actions';

function LogoutButtonInner() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="outline"
      loading={pending}
      className="w-full"
    >
      Logout
    </Button>
  );
}

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <LogoutButtonInner />
    </form>
  );
}
```

**Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add app/\(app\)/components/logout-button.tsx
git commit -m "feat: add LogoutButton component"
```

---

### Task 24: Create Sidebar Component

**Files:**
- Create: `apps/client/app/(app)/components/sidebar.tsx`

**Step 1: Create sidebar**

Create `apps/client/app/(app)/components/sidebar.tsx`:

```typescript
import Link from 'next/link';
import { LogoutButton } from './logout-button';

export function Sidebar() {
  return (
    <aside className="hidden w-64 border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 md:block">
      <div className="flex h-full flex-col">
        {/* Logo/Brand */}
        <div className="border-b border-gray-200 p-6 dark:border-gray-800">
          <h2 className="text-xl font-bold">Time2Ship</h2>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          <Link
            href="/app"
            className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Dashboard
          </Link>
          <Link
            href="/app/settings"
            className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Settings
          </Link>
        </nav>

        {/* Logout */}
        <div className="border-t border-gray-200 p-4 dark:border-gray-800">
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}
```

**Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add app/\(app\)/components/sidebar.tsx
git commit -m "feat: add Sidebar component with navigation and logout"
```

---

### Task 25: Create Header Component

**Files:**
- Create: `apps/client/app/(app)/components/header.tsx`

**Step 1: Create header**

Create `apps/client/app/(app)/components/header.tsx`:

```typescript
import { getCurrentUser } from '@/shared/lib/auth/session';

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          {/* Mobile menu button placeholder */}
          <button className="md:hidden">
            <span className="sr-only">Open menu</span>
            {/* Add menu icon here if needed */}
          </button>
        </div>

        {/* User info */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {user?.email}
          </span>
        </div>
      </div>
    </header>
  );
}
```

**Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add app/\(app\)/components/header.tsx
git commit -m "feat: add Header component with user email display"
```

---

### Task 26: Create App Layout

**Files:**
- Create: `apps/client/app/(app)/layout.tsx`

**Step 1: Create app layout**

Create `apps/client/app/(app)/layout.tsx`:

```typescript
import { Sidebar } from './components/sidebar';
import { Header } from './components/header';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-black">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <Header />

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
```

**Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add app/\(app\)/layout.tsx
git commit -m "feat: add app layout with sidebar and header"
```

---

### Task 27: Create Dashboard Page

**Files:**
- Create: `apps/client/app/(app)/page.tsx`

**Step 1: Create dashboard page**

Create `apps/client/app/(app)/page.tsx`:

```typescript
import { getCurrentUser } from '@/shared/lib/auth/session';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | Time2Ship',
  description: 'Your application dashboard',
};

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user?.email}!</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Here's what's happening with your account
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
              Active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 dark:text-gray-400">
              Your app features will go here
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 dark:text-gray-400">
              Placeholder for onboarding steps
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

**Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add app/\(app\)/page.tsx
git commit -m "feat: add dashboard page with welcome message and placeholder cards"
```

---

## Phase 8: Landing Page Setup

### Task 28: Move Existing Homepage to Landing Route

**Files:**
- Create: `apps/client/app/(landing)/layout.tsx`
- Move: `apps/client/app/page.tsx` → `apps/client/app/(landing)/page.tsx`

**Step 1: Create landing layout**

Create `apps/client/app/(landing)/layout.tsx`:

```typescript
export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

**Step 2: Move homepage to landing route**

```bash
mkdir -p apps/client/app/\(landing\)
git mv apps/client/app/page.tsx apps/client/app/\(landing\)/page.tsx
```

**Step 3: Update landing page**

Modify `apps/client/app/(landing)/page.tsx` to add login link:

```typescript
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/shared/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Welcome to Time2Ship
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Ship your SaaS faster with our authentication boilerplate.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <Link href="/login">
            <Button className="w-full md:w-auto">
              Get Started
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="outline" className="w-full md:w-auto">
              Sign Up
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
```

**Step 4: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 5: Commit**

```bash
git add app/\(landing\)/layout.tsx app/\(landing\)/page.tsx
git commit -m "feat: move homepage to landing route group with auth links"
```

---

## Phase 9: Testing & Verification

### Task 29: Manual Testing - Complete Auth Flow

**Step 1: Start both servers**

Terminal 1 (API):
```bash
cd apps/api
npm run dev
```

Terminal 2 (Client):
```bash
cd apps/client
npm run dev
```

**Step 2: Test registration flow**

1. Visit http://localhost:3000
2. Click "Sign Up"
3. Fill form with valid email and password (e.g., test@example.com, Test123!@#)
4. Submit form
5. Should redirect to /app dashboard
6. Should see welcome message with email

**Step 3: Test logout**

1. Click "Logout" button in sidebar
2. Should redirect to /login
3. Should not be able to access /app (redirects to /login)

**Step 4: Test login flow**

1. Visit http://localhost:3000/login
2. Enter credentials from registration
3. Submit form
4. Should redirect to /app dashboard

**Step 5: Test protected routes**

1. While logged in, visit http://localhost:3000/app
2. Should see dashboard
3. Logout
4. Try to visit http://localhost:3000/app
5. Should redirect to /login

**Step 6: Test auth page redirects**

1. While logged in, try to visit http://localhost:3000/login
2. Should redirect to /app
3. Same for /register

**Step 7: Document any issues**

Create a file `TESTING_NOTES.md` if any issues found, otherwise proceed.

**Step 8: Stop servers**

Ctrl+C in both terminals.

**Step 9: Commit if changes made**

```bash
git add -A
git commit -m "test: verify complete authentication flow works end-to-end"
```

---

### Task 30: Add README Documentation

**Files:**
- Create: `apps/client/README.md`

**Step 1: Create README**

Create `apps/client/README.md`:

```markdown
# Time2Ship Client Application

Next.js 16+ frontend application with complete authentication system.

## Features

- ✅ Cookie-based authentication with httpOnly cookies
- ✅ Server Actions for auth flow (login, register, logout)
- ✅ Automatic token refresh in middleware
- ✅ Protected routes and layouts
- ✅ Server Components by default (better performance)
- ✅ Progressive enhancement (forms work without JavaScript)
- ✅ Tailwind CSS v4 for styling
- ✅ Toast notifications for user feedback

## Getting Started

### Prerequisites

- Node.js 20+
- API server running on http://localhost:3001

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

3. Start development server:
```bash
npm run dev
```

Visit http://localhost:3000

## Architecture

This application follows the architecture guidelines in `.claude/references/architecture.md`:

### Route Groups

- `(auth)` - Authentication pages (login, register) with centered layout
- `(app)` - Protected application pages with sidebar + header layout
- `(landing)` - Public marketing pages

### Key Patterns

- **Server-first**: Default to Server Components, use Client Components only when needed
- **Co-location**: Components live near where they're used
- **Server Actions**: All form submissions and mutations use Server Actions
- **Type Safety**: Full TypeScript with Zod validation

### Folder Structure

```
apps/client/
├── app/
│   ├── (auth)/         # Login, register
│   ├── (app)/          # Protected dashboard
│   └── (landing)/      # Public homepage
├── src/shared/
│   ├── components/ui/  # Reusable UI components
│   ├── lib/
│   │   ├── api/        # API client
│   │   ├── auth/       # Auth utilities
│   │   └── validators/ # Zod schemas
└── middleware.ts       # Route protection & token refresh
```

## Authentication Flow

### Login
1. User submits form → Server Action validates with Zod
2. Server Action calls API `/auth/login`
3. Server Action sets httpOnly cookies (accessToken, refreshToken)
4. Redirect to `/app` dashboard

### Token Refresh
- Middleware checks token expiration on every `/app/*` request
- If token expires in <5 minutes, automatically refreshes
- Transparent to user, no failed requests

### Logout
1. Server Action calls API `/auth/logout` to revoke token
2. Deletes cookies
3. Redirects to `/login`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Environment Variables

See `.env.example` for required variables:

- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_APP_URL` - Frontend app URL
- `NEXT_PUBLIC_APP_NAME` - Application name

## Tech Stack

- **Next.js 16+** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling
- **Zod** - Schema validation
- **Sonner** - Toast notifications
- **jose** - JWT token handling

## Contributing

Follow the architecture guidelines and use Server Components by default.
```

**Step 2: Commit**

```bash
git add apps/client/README.md
git commit -m "docs: add comprehensive README for client application"
```

---

### Task 31: Final Verification Build

**Files:**
- None (verification only)

**Step 1: Build production bundle**

```bash
npm run build
```

Expected: Build completes successfully with no errors

**Step 2: Check build output**

Look for:
- ○ (Static) - Pages that are static
- ƒ (Dynamic) - Server-side renders at runtime
- Route sizes should be reasonable

**Step 3: Test production build locally**

```bash
npm run start
```

Visit http://localhost:3000 and verify:
- Landing page loads
- Can navigate to /login
- Static assets load correctly

Stop server with Ctrl+C.

**Step 4: Commit final verification**

```bash
git add -A
git commit -m "chore: verify production build completes successfully"
```

---

## Implementation Complete

All tasks completed. The client application now has:

✅ Complete authentication system (login, register, logout)
✅ Protected dashboard with app layout
✅ Automatic token refresh in middleware
✅ Server-first architecture with Server Actions
✅ Cookie-based session management
✅ Form validation with Zod
✅ Toast notifications for user feedback
✅ Responsive design with Tailwind CSS
✅ Type-safe API client
✅ Production-ready build

### Next Steps

1. **Test with real API** - Ensure API is running and reachable
2. **Add features** - Build on top of this auth foundation
3. **Customize styling** - Adjust Tailwind colors, fonts, etc.
4. **Add E2E tests** - Use Playwright for critical flows
5. **Deploy** - Deploy to Vercel or your preferred platform

### Deployment Checklist

- [ ] Set environment variables in hosting platform
- [ ] Ensure API URL is correct for production
- [ ] Enable HTTPS (cookies require secure flag)
- [ ] Test auth flow in production
- [ ] Monitor for errors

---

**Well done!** 🎉 You now have a fully functional Next.js authentication system integrated with your Express API.

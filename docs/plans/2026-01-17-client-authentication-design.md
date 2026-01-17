# Client Authentication & App Design

**Date:** 2026-01-17
**Status:** Approved
**Purpose:** Build Next.js client application with complete authentication flow integrating with Express API

---

## Overview

Build a complete authentication system for the Next.js 16+ client application that integrates with the existing Express API. The system will include login, registration, protected dashboard, and automatic token refresh using cookie-based session management.

## Architecture Decisions

### Session Management
- **Approach:** Cookie-based sessions with httpOnly cookies
- **Rationale:** Best security (tokens not accessible to JavaScript), works seamlessly with Next.js Server Components and middleware
- **Tokens:** Access token and refresh token stored in httpOnly cookies

### Authentication Pattern
- **Approach:** Server Actions with progressive enhancement
- **Rationale:** Aligns with Next.js 16+ App Router "server-first" architecture, works without JavaScript, better performance and SEO
- **Flow:** Forms submit to Server Actions → Server Actions call API → Server Actions set cookies → Redirect

### Post-Login Experience
- **Approach:** Dashboard/Overview page
- **Content:** Welcome message, user info, quick stats cards, placeholder for future features
- **Rationale:** Standard SaaS pattern, clear landing point for users

### User Feedback
- **Approach:** Inline form errors with toast notifications
- **Field Errors:** Displayed directly under form inputs (from Zod validation)
- **Toast Notifications:** Success/error messages for operations (login success, network errors, etc.)
- **Library:** Sonner for toast notifications

### Token Refresh Strategy
- **Approach:** Automatic refresh in middleware (proactive)
- **Timing:** Refresh token when access token has <5 minutes until expiry
- **Location:** Next.js middleware intercepts requests and refreshes transparently
- **Rationale:** Best UX - users never get logged out unexpectedly, no failed API calls

---

## File Structure

```
apps/client/
├── app/
│   ├── (auth)/                        # Authentication route group
│   │   ├── login/
│   │   │   ├── page.tsx               # Server Component wrapper
│   │   │   ├── components/
│   │   │   │   └── login-form.tsx     # Client Component with form
│   │   │   └── actions.ts             # Server Actions (loginAction)
│   │   ├── register/
│   │   │   ├── page.tsx
│   │   │   ├── components/
│   │   │   │   └── register-form.tsx
│   │   │   └── actions.ts             # Server Actions (registerAction)
│   │   └── layout.tsx                 # Centered auth layout
│   │
│   ├── (app)/                         # Protected app route group
│   │   ├── page.tsx                   # Dashboard (post-login landing)
│   │   ├── components/
│   │   │   ├── sidebar.tsx            # Navigation sidebar
│   │   │   ├── header.tsx             # Header with user menu
│   │   │   └── logout-button.tsx      # Logout functionality
│   │   └── layout.tsx                 # App layout (sidebar + header)
│   │
│   └── (landing)/                     # Public marketing route group
│       ├── page.tsx                   # Marketing homepage
│       └── layout.tsx                 # Landing layout
│
├── src/shared/
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts              # Base API client with error handling
│   │   │   └── auth.ts                # Auth API endpoints (login, register, refresh, logout)
│   │   ├── auth/
│   │   │   ├── session.ts             # Cookie helpers, getCurrentUser()
│   │   │   └── tokens.ts              # Token decode/validation utilities
│   │   ├── validators/
│   │   │   └── auth.ts                # Zod schemas (matching API validators)
│   │   └── utils.ts                   # cn() utility for class merging
│   │
│   └── components/
│       └── ui/
│           ├── button.tsx             # Button with variants and loading states
│           ├── input.tsx              # Input with label and error display
│           ├── card.tsx               # Card container for dashboard
│           └── toast.tsx              # Toast notifications (or sonner)
│
└── middleware.ts                      # Route protection and token refresh
```

---

## Authentication Flows

### Login Flow

1. User visits `/login` page (Server Component)
2. Server Component renders `LoginForm` (Client Component)
3. User fills form and submits
4. Form calls `loginAction` Server Action with FormData
5. Server Action validates input with Zod schema
6. Server Action calls API `/api/auth/login`
7. API returns `{ accessToken, refreshToken, user }`
8. Server Action sets httpOnly cookies for both tokens
9. Server Action redirects to `/app` (dashboard)
10. Middleware validates token on subsequent requests

**Error Handling:**
- Validation errors: Returned to form, displayed inline under fields
- API errors: Returned to form, displayed as toast notification
- Network errors: Generic error message in toast

### Register Flow

Same pattern as login:
1. User visits `/register` page
2. Fills registration form (email, password with strength requirements)
3. Form calls `registerAction` Server Action
4. Server Action validates (including password strength rules matching API)
5. Server Action calls API `/api/auth/register`
6. On success: Sets cookies and redirects to `/app`
7. On error: Returns validation/API errors to form

### Logout Flow

1. User clicks logout button in header/sidebar
2. Button calls `logoutAction` Server Action
3. Server Action reads refresh token from cookies
4. Server Action calls API `/api/auth/logout` to revoke token
5. Server Action deletes both cookies
6. Server Action redirects to `/login`

### Automatic Token Refresh

Handled transparently in middleware:
1. Middleware runs on every request to `/app/*`
2. Reads access token from cookie
3. Decodes token to check expiration time
4. If token expires in <5 minutes:
   - Reads refresh token from cookie
   - Calls API `/api/auth/refresh`
   - Receives new access and refresh tokens
   - Updates cookies with new tokens
   - Continues request with fresh tokens
5. If no valid tokens: Redirect to `/login`

---

## Middleware Logic

**File:** `middleware.ts`

**Responsibilities:**
1. Route protection (requires auth for `/app/*`)
2. Token validation (check token exists and isn't expired)
3. Proactive token refresh (refresh before expiration)
4. Redirect logic (authenticated users can't access `/login`)

**Protected Routes:**
- `/app/*` - Requires valid access token
- `/login`, `/register` - Redirects to `/app` if already authenticated
- `/` (landing) - Public, no restrictions

**Pseudo-code:**
```typescript
export async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('accessToken')?.value
  const refreshToken = request.cookies.get('refreshToken')?.value
  const path = request.nextUrl.pathname

  // Protect /app/* routes
  if (path.startsWith('/app')) {
    if (!accessToken) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check if token needs refresh (expires in <5 min)
    const tokenExpiry = getTokenExpiry(accessToken)
    const needsRefresh = tokenExpiry < Date.now() + (5 * 60 * 1000)

    if (needsRefresh && refreshToken) {
      const newTokens = await api.auth.refresh(refreshToken)

      if (newTokens.success) {
        const response = NextResponse.next()
        response.cookies.set('accessToken', newTokens.data.accessToken, {
          httpOnly: true,
          secure: true,
          sameSite: 'lax'
        })
        response.cookies.set('refreshToken', newTokens.data.refreshToken, {
          httpOnly: true,
          secure: true,
          sameSite: 'lax'
        })
        return response
      } else {
        // Refresh failed, logout
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }
  }

  // Redirect authenticated users away from auth pages
  if ((path === '/login' || path === '/register') && accessToken) {
    return NextResponse.redirect(new URL('/app', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/app/:path*', '/login', '/register']
}
```

---

## API Client

### Base Client

**File:** `src/shared/lib/api/client.ts`

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'Something went wrong'
      }
    }

    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: 'Network error. Please try again.'
    }
  }
}
```

### Auth Endpoints

**File:** `src/shared/lib/api/auth.ts`

```typescript
export const api = {
  auth: {
    login: (data: { email: string; password: string }) =>
      apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data)
      }),

    register: (data: { email: string; password: string }) =>
      apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data)
      }),

    refresh: (refreshToken: string) =>
      apiRequest('/api/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken })
      }),

    logout: (refreshToken: string) =>
      apiRequest('/api/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken })
      }),
  }
}
```

---

## Server Actions

### Login Action

**File:** `app/(auth)/login/actions.ts`

```typescript
"use server"

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { loginSchema } from '@/shared/lib/validators/auth'
import { api } from '@/shared/lib/api/auth'

export async function loginAction(prevState: any, formData: FormData) {
  // Validate input
  const result = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  })

  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors
    }
  }

  // Call API
  const response = await api.auth.login(result.data)

  if (!response.success) {
    return {
      success: false,
      error: response.error
    }
  }

  // Set cookies
  cookies().set('accessToken', response.data.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 15 // 15 minutes
  })

  cookies().set('refreshToken', response.data.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  })

  // Redirect to dashboard
  redirect('/app')
}
```

### Register Action

Similar to login action, but calls `/api/auth/register` and validates password strength.

### Logout Action

**File:** `app/(app)/components/logout-button.tsx` (inline Server Action)

```typescript
"use server"

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { api } from '@/shared/lib/api/auth'

export async function logoutAction() {
  const refreshToken = cookies().get('refreshToken')?.value

  if (refreshToken) {
    // Call API to revoke token
    await api.auth.logout(refreshToken)
  }

  // Delete cookies
  cookies().delete('accessToken')
  cookies().delete('refreshToken')

  // Redirect to login
  redirect('/login')
}
```

---

## Form Components

### Login Form

**File:** `app/(auth)/login/components/login-form.tsx`

```typescript
"use client"

import { useFormState, useFormStatus } from 'react-dom'
import { loginAction } from '../actions'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import { toast } from 'sonner'
import { useEffect } from 'react'

function SubmitButton() {
  const { pending } = useFormStatus()
  return <Button type="submit" loading={pending}>Log In</Button>
}

export function LoginForm() {
  const [state, formAction] = useFormState(loginAction, null)

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error)
    }
  }, [state?.error])

  return (
    <form action={formAction} className="space-y-4">
      <Input
        name="email"
        type="email"
        label="Email"
        placeholder="you@example.com"
        required
        error={state?.errors?.email?.[0]}
      />

      <Input
        name="password"
        type="password"
        label="Password"
        placeholder="••••••••"
        required
        error={state?.errors?.password?.[0]}
      />

      <SubmitButton />
    </form>
  )
}
```

### Register Form

Similar pattern to login form, but with password strength requirements displayed and validated.

---

## Validation

### Zod Schemas

**File:** `src/shared/lib/validators/auth.ts`

Must match API validators exactly:

```typescript
import { z } from 'zod'

// Match API password requirements
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: passwordSchema,
})
```

**Validation Strategy:**
- **Client-side:** HTML5 validation (required, email type)
- **Server-side:** Zod validation in Server Actions
- **Display:** Field-level errors inline, general errors as toasts

---

## Dashboard & App Layout

### Dashboard Page

**File:** `app/(app)/page.tsx`

```typescript
import { getCurrentUser } from '@/shared/lib/auth/session'
import { Card, CardHeader, CardContent } from '@/shared/components/ui/card'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user.email}!</h1>
        <p className="text-gray-600">Here's what's happening with your account</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>Account Status</CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-green-600">Active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>Quick Actions</CardHeader>
          <CardContent>
            <p className="text-gray-500">Your app features will go here</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>Getting Started</CardHeader>
          <CardContent>
            <p className="text-gray-500">Placeholder for onboarding</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

### App Layout

**File:** `app/(app)/layout.tsx`

```typescript
import { Sidebar } from './components/sidebar'
import { Header } from './components/header'

export default function AppLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - hidden on mobile, shown on desktop */}
      <Sidebar />

      <div className="flex flex-1 flex-col">
        {/* Header with user menu */}
        <Header />

        {/* Main content area */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

### Sidebar Component

**File:** `app/(app)/components/sidebar.tsx`

- Logo/app name at top
- Navigation links (Dashboard, Settings, etc.)
- Logout button at bottom
- Fixed width on desktop (256px)
- Drawer/overlay on mobile
- Active link highlighting

### Header Component

**File:** `app/(app)/components/header.tsx`

- User email/avatar display
- Dropdown menu (Profile, Settings, Logout)
- Mobile menu toggle button
- Fixed height (64px)
- Sticky positioning

---

## UI Components

### Button Component

**File:** `src/shared/components/ui/button.tsx`

**Variants:**
- Primary (black background, white text)
- Secondary (gray background)
- Outline (border only)

**States:**
- Default
- Hover
- Loading (disabled with loading text/spinner)
- Disabled

### Input Component

**File:** `src/shared/components/ui/input.tsx`

**Features:**
- Label support
- Error message display (red text below input)
- Types: text, email, password
- Placeholder support
- Required attribute support

### Card Component

**File:** `src/shared/components/ui/card.tsx`

**Structure:**
- Card container (white background, border, rounded corners)
- CardHeader (title area)
- CardContent (main content area)

### Toast Notifications

**Library:** Sonner (recommended)

**Usage:**
```typescript
import { toast } from 'sonner'

toast.success('Logged in successfully!')
toast.error('Invalid credentials')
```

**Positioning:** Top-right or top-center
**Auto-dismiss:** 3-5 seconds
**Variants:** Success, error, info

---

## Styling Guidelines

### Tailwind Configuration

- Use utility-first approach
- Zinc color palette for neutral colors
- Dark mode support via `dark:` variant
- Mobile-first responsive design

### Color Scheme

**Light Mode:**
- Background: white, zinc-50
- Text: zinc-900, zinc-700
- Borders: zinc-200
- Primary actions: black

**Dark Mode:**
- Background: black, zinc-900
- Text: zinc-50, zinc-300
- Borders: zinc-800
- Primary actions: white

**Semantic Colors:**
- Error: red-500/red-600
- Success: green-500/green-600
- Info: blue-500/blue-600

### Layout Spacing

- Page padding: `p-6` (24px)
- Section gaps: `gap-4` or `gap-6`
- Form fields: `space-y-4`

### Typography

- Headings: font-bold or font-semibold
- Body: font-normal
- Code/monospace: font-mono

---

## Environment Variables

**File:** `.env.local` (not committed)

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

**File:** `.env.example` (committed)

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Error Handling

### Form Errors
- Field validation errors: Inline below input fields
- General errors: Toast notifications
- Network errors: Generic "Network error" message

### API Errors
- Display backend error messages to user
- Fall back to generic message if no message provided

### Unexpected Errors
- Caught by Next.js error boundaries
- Show error page with "Something went wrong"
- Log errors to console (add monitoring in production)

---

## Testing Strategy

### Unit Tests
- Validate Zod schemas
- Test utility functions (cn, token decode)

### Integration Tests
- Test form submissions with mocked API
- Test Server Actions
- Test middleware logic

### E2E Tests
- Complete login flow
- Complete registration flow
- Token refresh flow
- Logout flow
- Protected route access

---

## Implementation Phases

### Phase 1: Foundation
1. Set up folder structure
2. Create base UI components (Button, Input, Card)
3. Set up API client
4. Create Zod validators
5. Configure environment variables

### Phase 2: Authentication
1. Create auth layouts
2. Build login page and form
3. Build register page and form
4. Implement Server Actions
5. Set up middleware for route protection

### Phase 3: App Layout
1. Create app layout with sidebar and header
2. Build dashboard page
3. Implement logout functionality
4. Add token refresh logic to middleware

### Phase 4: Polish
1. Add toast notifications
2. Improve error handling
3. Add loading states
4. Mobile responsiveness
5. Dark mode support

---

## Security Considerations

1. **httpOnly Cookies** - Tokens never accessible to JavaScript
2. **Secure Flag** - Cookies only sent over HTTPS in production
3. **SameSite** - CSRF protection via SameSite=Lax
4. **Token Expiration** - Short-lived access tokens (15 min)
5. **Password Validation** - Enforce strong passwords matching API requirements
6. **Input Validation** - All inputs validated with Zod on server
7. **Error Messages** - Generic error messages, don't leak system info

---

## Performance Optimizations

1. **Server Components** - Default to Server Components for better performance
2. **Progressive Enhancement** - Forms work without JavaScript
3. **Code Splitting** - Client Components loaded separately
4. **Middleware Efficiency** - Token refresh only when needed
5. **Cookie Size** - JWTs are compact, minimal cookie overhead

---

## Future Enhancements

- Password reset flow
- Email verification
- Remember me functionality
- Session management (view active sessions)
- Two-factor authentication
- OAuth providers (Google, GitHub)
- User profile editing
- Account settings page

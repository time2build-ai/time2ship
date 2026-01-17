# Client Application Architecture

## Overview

This is a Next.js 16+ SaaS application using:
- **App Router** with Server Components
- **TypeScript** for type safety
- **Tailwind CSS v4** for styling
- **Server-first architecture** - Next.js as frontend, separate backend API
- **Full testing setup** - Unit, Integration, and E2E tests

## Folder Structure

```
apps/client/
├── app/
│   ├── (auth)/                        # Route group: Authentication flows
│   │   ├── login/
│   │   │   ├── page.tsx
│   │   │   ├── components/            # Components only used in login
│   │   │   ├── actions.ts             # Server Actions for login
│   │   │   └── types.ts
│   │   ├── register/
│   │   ├── forgot-password/
│   │   └── layout.tsx                 # Auth layout (centered, minimal)
│   │
│   ├── (app)/                         # Route group: Main SaaS application
│   │   ├── page.tsx                   # App home/overview
│   │   ├── components/                # App-wide components (sidebar, header)
│   │   ├── settings/
│   │   │   ├── profile/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── components/
│   │   │   │   ├── actions.ts
│   │   │   │   └── types.ts
│   │   │   ├── account/
│   │   │   ├── billing/
│   │   │   ├── components/            # Settings-wide shared components
│   │   │   └── layout.tsx
│   │   ├── workspace/
│   │   │   ├── [workspaceId]/
│   │   │   ├── components/
│   │   │   └── actions.ts
│   │   └── layout.tsx                 # App layout (sidebar + header)
│   │
│   ├── (landing)/                     # Route group: Public marketing pages
│   │   ├── page.tsx                   # Landing page
│   │   ├── components/                # Landing-wide components
│   │   ├── pricing/
│   │   ├── about/
│   │   └── layout.tsx                 # Landing layout (nav + footer)
│   │
│   ├── api/                           # API Routes (webhooks, health checks only)
│   │   └── webhooks/
│   ├── layout.tsx                     # Root layout
│   ├── error.tsx                      # Global error boundary
│   └── globals.css
│
├── src/
│   ├── shared/
│   │   ├── components/                # Truly shared UI components
│   │   │   ├── ui/                    # Primitive components (button, input, card)
│   │   │   ├── forms/                 # Form components
│   │   │   └── layout/                # Layout components
│   │   ├── lib/
│   │   │   ├── api/                   # API client and endpoints
│   │   │   │   ├── client.ts          # Base API client
│   │   │   │   ├── auth.ts            # Auth API endpoints
│   │   │   │   └── users.ts           # User API endpoints
│   │   │   ├── utils.ts               # General utilities (cn, formatters)
│   │   │   ├── constants.ts
│   │   │   ├── env.ts                 # Environment variable validation
│   │   │   ├── auth/                  # Auth utilities
│   │   │   ├── email/                 # Email utilities
│   │   │   └── validators/            # Zod schemas
│   │   ├── types/                     # Shared TypeScript types
│   │   ├── hooks/                     # Shared React hooks
│   │   └── actions/                   # Shared Server Actions
│   └── config/                        # App configuration
│       └── site.ts                    # Site metadata
│
├── tests/
│   ├── unit/                          # Unit tests (Vitest/Jest)
│   ├── integration/                   # Integration tests (React Testing Library)
│   ├── e2e/                           # E2E tests (Playwright)
│   └── setup/                         # Test setup and helpers
│
├── public/
├── .env.example
├── middleware.ts                      # Auth middleware
└── tsconfig.json
```

## Architecture Rules

### 1. Co-location Principle

**Components:**
- Used in ONE route → lives in that route's `components/` folder
- Used in 2+ routes within same section → move to section's `components/` folder
- Used across different sections → move to `src/shared/components/`

**Example:**
```
app/(app)/settings/profile/components/avatar-upload.tsx    # Only in profile
app/(app)/settings/components/settings-nav.tsx             # Used across settings
src/shared/components/ui/button.tsx                        # Used everywhere
```

### 2. Route Groups

**Purpose:**
- `(auth)` - Unauthenticated flows, centered layout, no navigation
- `(app)` - Authenticated application, sidebar + header layout
- `(landing)` - Public marketing pages, nav + footer

**Rules:**
- Each route group has its own `layout.tsx`
- NEVER import components from one route group into another
- If needed in multiple groups → promote to `src/shared/components/`
- Authentication enforced via `middleware.ts`, not layouts

### 3. File Naming

**Conventions:**
- Files and folders: `kebab-case` (e.g., `user-profile.tsx`, `login-form.tsx`)
- React components: Export as PascalCase (e.g., `export function UserProfile()`)
- Special Next.js files: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`
- Server Actions: `actions.ts`
- Types: `types.ts`

### 4. Server vs Client Components

**Default to Server Components:**
- No `"use client"` directive needed
- Fetch data directly in component
- Better performance, less JavaScript

**Use Client Components when you need:**
- React hooks (`useState`, `useEffect`, etc.)
- Event handlers (`onClick`, `onChange`, etc.)
- Browser APIs
- Third-party libraries requiring client-side

**Pattern:**
```typescript
// Server Component (default)
export default async function ProfilePage() {
  const user = await api.users.getProfile()
  return <ProfileForm user={user} />
}

// Client Component
"use client"
export function ProfileForm({ user }) {
  const [name, setName] = useState(user.name)
  // ...
}
```

### 5. API Communication

**Next.js is frontend only - no direct database access.**

**API Client pattern:**
```typescript
// src/shared/lib/api/client.ts
export async function apiRequest<T>(endpoint: string, options?: RequestInit) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || ""
  const response = await fetch(`${baseUrl}${endpoint}`, options)
  return response.json()
}

// Domain-specific endpoints
export const api = {
  auth: {
    login: (data) => apiRequest("/api/auth/login", { method: "POST", body: JSON.stringify(data) })
  },
  users: {
    getProfile: () => apiRequest("/api/users/profile")
  }
}
```

**Usage:**
```typescript
// Server Component
const user = await api.users.getProfile()

// Server Action
"use server"
export async function updateProfile(data) {
  await api.users.updateProfile(data)
  revalidatePath("/settings/profile")
}
```

### 6. Type Safety

**Organization:**
- Route-specific types: `types.ts` next to the route
- Shared types: `src/shared/types/`
- Database types: `src/shared/types/database.ts`
- API types: `src/shared/types/api.ts`

**Validation with Zod:**
```typescript
// src/shared/lib/validators/auth.ts
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

// Server Action
export async function loginAction(formData: FormData) {
  const result = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  })

  if (!result.success) {
    return { error: result.error.flatten().fieldErrors }
  }

  // Use validated data
}
```

**Rules:**
- All Server Actions must validate input
- No `any` types (use `unknown` if type is unknown)
- Export types that cross file boundaries

### 7. Import Paths

**TypeScript aliases (`tsconfig.json`):**
```json
{
  "paths": {
    "@/*": ["./src/*"],
    "@/shared/*": ["./src/shared/*"],
    "@/config/*": ["./src/config/*"]
  }
}
```

**Import order:**
```typescript
// 1. External dependencies
import { useState } from "react"

// 2. Shared (using aliases)
import { Button } from "@/shared/components/ui"
import { cn } from "@/shared/lib/utils"

// 3. Local (relative imports)
import { LoginForm } from "./components/login-form"
import { loginUser } from "./actions"
```

**Rules:**
- Use `@/` aliases for imports from `src/`
- Use relative `./` for co-located files
- Barrel exports (`index.ts`) for shared components

### 8. Error Handling

**Error boundaries:**
- `app/error.tsx` - Global error boundary
- `app/(app)/error.tsx` - Section-specific errors
- Route-specific `error.tsx` when needed

**API errors:**
```typescript
// Server Action pattern
export async function updateProfile(data) {
  try {
    const result = await api.users.updateProfile(data)
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
```

**Rules:**
- Server Actions return `{ success: boolean, error?: string, data?: T }`
- Client components display errors from responses
- Log errors to monitoring in production

### 9. Environment Variables

**Structure:**
```bash
# Client-accessible (NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="Your SaaS"

# Server-only
SESSION_SECRET=your-secret
```

**Validation:**
```typescript
// src/shared/lib/env.ts
import { z } from "zod"

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_APP_NAME: z.string()
})

export const env = envSchema.parse(process.env)
```

**Rules:**
- Validate all env vars on startup
- Use `NEXT_PUBLIC_` only for client-accessible vars
- Import from `@/shared/lib/env`, never `process.env` directly
- Never commit `.env.local`

### 10. Testing Strategy

**Test types:**
- **Unit tests** (`tests/unit/`) - Utilities, pure functions, individual components
- **Integration tests** (`tests/integration/`) - Feature workflows, component interactions
- **E2E tests** (`tests/e2e/`) - Critical user flows, authentication, cross-page navigation

**Test file naming:**
```
src/shared/lib/utils.ts → tests/unit/lib/utils.test.ts
app/(auth)/login/components/login-form.tsx → tests/integration/auth/login.test.tsx
User flow → tests/e2e/auth.spec.ts
```

**Rules:**
- Each test file is independent (no shared state)
- Mock API responses with MSW for integration tests
- Test setup in `tests/setup/`

### 11. Styling

**Tailwind CSS:**
- Utility-first approach
- Component styles use Tailwind classes
- Global styles in `app/globals.css`

**Class merging utility:**
```typescript
// src/shared/lib/utils.ts
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
```

**Component pattern:**
```typescript
export function Button({ variant = "default", className, ...props }) {
  return (
    <button
      className={cn(
        "rounded-lg font-medium",
        variant === "default" && "bg-black text-white",
        className
      )}
      {...props}
    />
  )
}
```

**Rules:**
- Use `cn()` for conditional classes
- All shared components accept `className` prop
- No inline styles unless dynamically calculated

### 12. State Management

**Server-first approach:**
- Most state lives on server (fetched in Server Components)
- Form submissions via Server Actions
- URL state for filters/pagination

**Client state (minimal):**
- UI state only (modals, dropdowns, animations)
- Use `useState` for simple UI state
- Use React Context for shared UI state across components
- Use URL params for shareable state

**Rules:**
- No global state libraries unless absolutely necessary
- Fetch server data in Server Components, pass down as props
- Use Server Actions + revalidation instead of client mutations

## Quick Reference

### When to co-locate vs share components:
- 1 route → co-locate in route's `components/`
- 2+ routes in same section → section's `components/`
- Cross-section → `src/shared/components/`

### When to use Server vs Client Components:
- Default → Server Component
- Need hooks/events/browser APIs → Client Component

### Where to put types:
- Route-specific → `types.ts` next to route
- Shared → `src/shared/types/`

### Where to put Server Actions:
- Route-specific → `actions.ts` next to route
- Shared → `src/shared/actions/`

### How to fetch data:
- Server Components → `await api.users.getProfile()`
- Server Actions → `await api.users.updateProfile(data)` + `revalidatePath()`
- Never direct database access (Next.js is frontend only)

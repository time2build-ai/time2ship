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

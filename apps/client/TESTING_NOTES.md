# Manual Testing Notes - Task 29

## Test Environment Issues

### Docker Not Running
- **Issue**: Docker daemon is not running, preventing database startup
- **Impact**: Cannot start API server for end-to-end auth flow testing
- **Resolution Required**: Start Docker and run `docker-compose up -d` from project root

## Testing Status

### Completed
- ✅ TypeScript compilation passes with no errors
- ✅ Landing page route structure created
- ✅ Auth pages (login/register) structure verified

### Blocked - Requires Running Servers
The following tests require both API and client servers running:

1. **Registration Flow**
   - Visit http://localhost:3000
   - Click "Sign Up"
   - Fill form with valid credentials
   - Verify redirect to /app dashboard
   - Verify welcome message with email

2. **Logout Flow**
   - Click "Logout" button in sidebar
   - Verify redirect to /login
   - Verify /app route protection

3. **Login Flow**
   - Visit http://localhost:3000/login
   - Enter registered credentials
   - Verify redirect to /app dashboard

4. **Protected Routes**
   - Logged in: Access to /app routes
   - Logged out: Redirect to /login

5. **Auth Page Redirects**
   - Logged in users visiting /login or /register should redirect to /app

## Next Steps

To complete Task 29 manual testing:

1. Start Docker Desktop
2. Run database: `docker-compose up -d` from project root
3. Start API server: `cd apps/api && npm run dev`
4. Start client server: `cd apps/client && npm run dev`
5. Execute all test scenarios listed above
6. Document any issues found
7. Update this file with test results

## Recommendations

- Consider adding automated E2E tests with Playwright to prevent regression
- Add health check endpoints to verify server readiness
- Consider adding a startup script that checks dependencies (Docker, DB, etc.)

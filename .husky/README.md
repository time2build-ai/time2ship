# Git Hooks (Husky)

This directory contains Git hooks managed by [Husky](https://typicode.github.io/husky/) that run automatically during your Git workflow.

## Pre-commit Hooks

Runs before every commit to ensure code quality and security:

### 1. Branch Name Validation
**Script:** [scripts/validate-branch-name.sh](scripts/validate-branch-name.sh)

Ensures branch names follow the project's naming conventions:
- `development` - Main development branch
- `production` - Production branch
- `feature/*` - New features (e.g., `feature/user-authentication`)
- `fix/*` - Bug fixes (e.g., `fix/login-bug`)
- `hotfix/*` - Critical fixes (e.g., `hotfix/security-patch`)
- `release/*` - Release branches (e.g., `release/1.0.0`)
- `chore/*` - Maintenance tasks (e.g., `chore/update-deps`)

### 2. Secrets Detection
**Script:** [scripts/detect-secrets.sh](scripts/detect-secrets.sh)
**Config:** [.gitleaks.toml](../.gitleaks.toml)

Scans staged files for exposed secrets and API keys using [Gitleaks](https://github.com/gitleaks/gitleaks).

**Detects 30+ types of secrets:**
- **AI/ML:** OpenAI (sk-*), Anthropic/Claude (sk-ant-*)
- **Payments:** Stripe (sk_live_*, sk_test_*), PayPal, Square, Shopify
- **Cloud:** AWS (AKIA*, access/secret keys), Google Cloud, Heroku, Firebase
- **Dev Tools:** GitHub tokens (ghp_*, gho_*), GitLab tokens
- **Communication:** SendGrid, Twilio, Slack tokens/webhooks, Mailgun
- **Databases:** MongoDB, PostgreSQL, MySQL, Redis connection strings with passwords
- **Auth:** JWT secrets, OAuth client secrets, private keys (RSA/EC/DSA)
- **Project-specific:** NextAuth.js secrets, Supabase service role keys
- **Generic:** High-entropy API keys and tokens

**Installation required:**
```bash
# macOS
brew install gitleaks

# Linux - download from releases
# https://github.com/gitleaks/gitleaks/releases

# Windows
scoop install gitleaks
```

**Testing:**
```bash
# Test configuration
gitleaks detect --config=.gitleaks.toml --verbose

# Scan specific file
gitleaks detect --source=path/to/file

# Test with a fake secret
echo 'const key = "sk-1234567890abcdef";' > test.js
git add test.js
git commit -m "test"  # Should be blocked!
rm test.js
```

**Handling false positives:**

1. **Update allowlist** in [.gitleaks.toml](../.gitleaks.toml)
2. **Add inline comment** in your code:
   ```javascript
   const publicKey = "pk_test_1234"; // gitleaks:allow
   ```
3. **Skip check** (not recommended):
   ```bash
   git commit --no-verify
   ```

### 3. Lint-Staged
Runs linting and type checking on staged files:
- **Client (React/Next.js):** ESLint + TypeScript compilation
- **API (Express):** ESLint + TypeScript type checking

## Pre-push Hooks

**Script:** [pre-push](pre-push)

Runs comprehensive checks before pushing to remote to ensure code quality, security, and functionality:

### 1. Security Checks (Snyk + depcheck)
**Script:** [scripts/security-checks.sh](scripts/security-checks.sh)

Scans for vulnerabilities and dependency health issues:

**Snyk Vulnerability Scanning:**
- Checks for known security vulnerabilities in dependencies
- Fails on **high** or **critical** severity issues
- Uses Snyk's comprehensive vulnerability database

**depcheck - Unused Dependencies:**
- Identifies dependencies declared but never imported/used
- Helps maintain clean `package.json` files
- Reduces bundle size and attack surface

**Installation required:**
```bash
# Snyk (included as dev dependency)
npx snyk auth  # Authenticate once

# depcheck (included as dev dependency)
# No additional setup needed
```

**Running manually:**
```bash
# Run security checks
./.husky/scripts/security-checks.sh

# Just Snyk
npx snyk test --severity-threshold=high

# Just depcheck on client
cd apps/client && npx depcheck

# Just depcheck on API
cd apps/api && npx depcheck
```

**Fixing vulnerabilities:**
```bash
# Interactive wizard to fix vulnerabilities
npx snyk wizard

# Or update packages manually
npm update <package-name>
npm install <package-name>@latest
```

**Handling false positives:**
- For Snyk: Use `snyk ignore` or `.snyk` policy file
- For depcheck: Dependencies used in config files may be flagged; verify before removing

### 2. Build Validation
- **Client App:** Full production build (`npm run build`)
- **API App:** TypeScript compilation and build process

### 3. E2E Tests
- **API:** Runs end-to-end test suite to verify functionality

## Bypassing Hooks

In rare cases, you may need to bypass hooks:

```bash
# Skip pre-commit hooks
git commit --no-verify -m "message"

# Skip pre-push hooks
git push --no-verify
```

⚠️ **Warning:** Only use `--no-verify` when absolutely necessary. Your PR will still need to pass CI checks.

## Scripts

All hook scripts are located in the [scripts/](scripts/) directory:
- [validate-branch-name.sh](scripts/validate-branch-name.sh) - Branch name validation
- [detect-secrets.sh](scripts/detect-secrets.sh) - Secrets detection with Gitleaks
- [security-checks.sh](scripts/security-checks.sh) - Vulnerability scanning and dependency health checks
- [review-changes.sh](scripts/review-changes.sh) - Manual review helper (`npm run review`)

## Troubleshooting

### Gitleaks not found
Install Gitleaks following the instructions above, or skip the check temporarily:
```bash
git commit --no-verify
```

### Snyk authentication required
First time using Snyk? Authenticate once:
```bash
npx snyk auth
```

This opens a browser window to authenticate. The token is stored locally.

### Security vulnerabilities found
When Snyk detects high/critical vulnerabilities:
1. **Review the vulnerability report** - Snyk shows which package and vulnerability
2. **Try automatic fix:**
   ```bash
   npx snyk wizard
   ```
3. **Manual fix:**
   - Update the vulnerable package: `npm update <package>`
   - If no fix available, consider alternatives or assess risk
4. **Accept risk temporarily:**
   - Use Snyk's ignore feature for non-exploitable cases
   - Document why in `.snyk` policy file

### Unused dependencies detected
When depcheck finds unused dependencies:
1. **Verify they're truly unused** - Some may be used in config files
2. **Remove if confirmed:**
   ```bash
   npm uninstall <package-name>
   ```
3. **Common false positives:**
   - TypeScript type packages (`@types/*`) - May be used only in d.ts files
   - Build tools used in config - Check webpack.config.js, next.config.js, etc.
   - Peer dependencies - Required by other packages

### False positive in secrets detection
1. Check if it's a real secret that should be in `.env` instead
2. If it's truly a false positive, add to `.gitleaks.toml` allowlist
3. For test/mock secrets, ensure they match the allowlist patterns

### Hook fails unexpectedly
1. Check the error message carefully
2. Fix the underlying issue (linting, type errors, vulnerabilities, etc.)
3. Only use `--no-verify` as a last resort

## Learn More

- [Husky Documentation](https://typicode.github.io/husky/)
- [Gitleaks Documentation](https://github.com/gitleaks/gitleaks)
- [lint-staged Documentation](https://github.com/okonet/lint-staged)
- [Contributing Guide](../docs/contributing.md)

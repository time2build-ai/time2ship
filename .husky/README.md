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

Runs the full test suite before pushing to ensure all tests pass.

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
- [review-changes.sh](scripts/review-changes.sh) - Manual review helper (`npm run review`)

## Troubleshooting

### Gitleaks not found
Install Gitleaks following the instructions above, or skip the check temporarily:
```bash
git commit --no-verify
```

### False positive in secrets detection
1. Check if it's a real secret that should be in `.env` instead
2. If it's truly a false positive, add to `.gitleaks.toml` allowlist
3. For test/mock secrets, ensure they match the allowlist patterns

### Hook fails unexpectedly
1. Check the error message carefully
2. Fix the underlying issue (linting, type errors, etc.)
3. Only use `--no-verify` as a last resort

## Learn More

- [Husky Documentation](https://typicode.github.io/husky/)
- [Gitleaks Documentation](https://github.com/gitleaks/gitleaks)
- [lint-staged Documentation](https://github.com/okonet/lint-staged)
- [Contributing Guide](../docs/contributing.md)

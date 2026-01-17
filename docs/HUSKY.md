# Husky Git Hooks Configuration

This project uses [Husky](https://typicode.github.io/husky/) to manage Git hooks and ensure code quality before commits.

## Overview

Husky is configured at the root level of the monorepo and applies hooks to both the client and API applications.

## Installed Hooks

### 1. Pre-commit Hook

**Location**: `.husky/pre-commit`

**Purpose**: Runs linting and type checking on staged files before allowing a commit.

**What it does**:
- Runs ESLint with auto-fix on staged TypeScript files
- Performs TypeScript type checking
- Only processes files that are staged for commit (via lint-staged)

**Configuration** (in root `package.json`):
```json
{
  "lint-staged": {
    "apps/client/**/*.{ts,tsx}": [
      "cd apps/client && npm run lint --fix",
      "cd apps/client && tsc --noEmit"
    ],
    "apps/api/**/*.ts": [
      "cd apps/api && npm run lint -- --fix",
      "cd apps/api && npm run type-check"
    ]
  }
}
```

### 2. Pre-push Hook

**Location**: `.husky/pre-push`

**Purpose**: Offers optional code review with code-simplifier, then runs API end-to-end tests before allowing a push to remote.

**What it does**:
1. **Interactive Code Review (Optional)**:
   - Prompts you to run code review with Claude Code's code-simplifier skill
   - Analyzes your git diff and suggests simplifications
   - You can choose to skip this step by pressing 'N'
   - If you run the review, you'll be prompted again to continue with the push

2. **E2E Tests (Required)**:
   - Executes the full API e2e test suite using Docker
   - Ensures all integration tests pass before code is pushed
   - Prevents broken code from being pushed to the repository

**Manual Code Review**: You can also run code review manually anytime with:
```bash
npm run review
# or
./.husky/.husky/scripts/review-changes.sh
```

**Note**: This hook can take some time to run as it spins up Docker containers and runs the complete test suite. If you need to push urgently and tests are failing, you can bypass with `git push --no-verify` (not recommended).

### 3. Commit Message Hook

**Location**: `.husky/commit-msg`

**Purpose**: Enforces conventional commit message format.

**Format**: `type(scope?): description`

**Allowed types**:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that don't affect code meaning (white-space, formatting, etc)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `build`: Changes that affect the build system or external dependencies
- `ci`: Changes to CI configuration files and scripts
- `chore`: Other changes that don't modify src or test files
- `revert`: Reverts a previous commit

**Examples**:
```bash
# Valid commit messages
git commit -m "feat: add user authentication"
git commit -m "fix(api): resolve database connection issue"
git commit -m "docs: update README with setup instructions"
git commit -m "refactor(client): simplify auth logic"

# Invalid commit messages (will be rejected)
git commit -m "updated files"
git commit -m "fixed bug"
git commit -m "WIP"
```

## How to Use

### Normal Development Flow

1. Make your changes
2. Stage your files: `git add .`
3. Commit with a conventional message: `git commit -m "feat: your feature description"`
4. The hooks will automatically run:
   - Linting and type checking on pre-commit
   - Message format validation on commit-msg
5. Push your changes: `git push`
6. The pre-push hook will run:
   - **Optional**: Prompt to run code-simplifier review
   - **Required**: API e2e tests via Docker

### Code Review Workflow

**During Push** (Interactive):
```bash
git push
# → Prompts: "Run code review? [y/N]"
# → If 'y': Launches Claude Code with code-simplifier skill
# → After review: Prompts "Continue with push? [y/N]"
# → Runs e2e tests and pushes if all pass
```

**Manual Review** (Anytime):
```bash
# Review changes before committing
npm run review

# The script will:
# 1. Show changed files
# 2. Launch Claude Code with code-simplifier skill
# 3. Claude analyzes your diff and suggests improvements
# 4. You make changes based on suggestions
# 5. Commit and push when ready
```

### Bypassing Hooks (Not Recommended)

If you absolutely need to bypass hooks:

```bash
# Bypass commit hooks (pre-commit and commit-msg)
git commit --no-verify -m "WIP: work in progress"

# Bypass push hook (pre-push)
git push --no-verify
```

**Warning**: Bypassing hooks can lead to broken code in the repository. Use sparingly and only when absolutely necessary.

## Troubleshooting

### Pre-commit Hook Fails

If the pre-commit hook fails:

1. Review the error messages - they'll indicate which files have linting or type errors
2. Fix the issues in your code
3. Re-stage the fixed files: `git add <files>`
4. Try committing again

### Pre-push Hook Fails

If the pre-push hook fails (e2e tests fail):

1. Review the test output to identify which tests are failing
2. Fix the failing tests or the code causing the failures
3. Commit your fixes: `git commit -m "fix: resolve e2e test failures"`
4. Try pushing again

**Note**: If you need to push urgently (e.g., to share work-in-progress), you can bypass with `git push --no-verify`, but make sure to fix the tests afterwards.

### Commit Message Rejected

If your commit message is rejected:

1. Check that it follows the format: `type(scope?): description`
2. Use one of the allowed types (feat, fix, docs, etc.)
3. Ensure there's a colon after the type/scope
4. Provide a meaningful description

### Hooks Not Running

If hooks aren't running at all:

1. Ensure Husky is installed: `npm install`
2. Check that `.husky` directory exists with executable hook files
3. Verify that `prepare` script ran: `npm run prepare`
4. Check that hook files have execute permissions: `ls -la .husky/`

## Maintenance

### Adding New Hooks

1. Create a new file in `.husky/` directory
2. Make it executable: `chmod +x .husky/<hook-name>`
3. Add your hook logic
4. Test the hook before committing

### Modifying Lint-Staged Configuration

Edit the `lint-staged` section in the root `package.json` to change what runs on staged files.

### Updating Husky

```bash
npm install husky@latest --save-dev
npm run prepare
```

## Additional Tools

### Code Review Script

**Location**: `.husky/scripts/review-changes.sh`

A standalone script to review code changes using Claude Code's code-simplifier skill.

**Usage**:
```bash
# Review against origin/main (default)
npm run review

# Review against a specific branch
./.husky/scripts/review-changes.sh origin/develop
```

**What it does**:
- Compares your current branch against a base branch (default: origin/main)
- Shows list of changed files
- Launches Claude Code with the code-simplifier skill
- Claude analyzes your changes and suggests simplifications
- Focuses on reducing complexity, improving readability, and identifying patterns

**When to use**:
- Before committing significant changes
- During code reviews
- When refactoring code
- As part of your regular development workflow

## Dependencies

- **husky**: ^9.0.11 - Git hooks manager
- **lint-staged**: ^15.2.0 - Run linters on staged files only
- **Claude Code CLI**: Required for code-simplifier integration (install separately)

## References

- [Husky Documentation](https://typicode.github.io/husky/)
- [Lint-staged Documentation](https://github.com/okonet/lint-staged)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Claude Code](https://claude.com/claude-code) - For code-simplifier skill

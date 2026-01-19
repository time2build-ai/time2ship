# Contributing to Time2Ship

Thank you for your interest in contributing to Time2Ship! This guide will help you get started with contributing to the boilerplate itself.

## Getting Started

### Cloning the Repository

```bash
# Fork the repository on GitHub first, then:
git clone https://github.com/YOUR-USERNAME/time2ship.git
cd time2ship
```

### Setting Up Development

```bash
# Install dependencies
npm install

# Set up environment variables
cd apps/api
cp .env.example .env
# Edit .env with your configuration

cd ../client
cp .env.example .env
# Edit .env with your configuration
```

### Running the Full Stack

```bash
# From project root
docker-compose up
```

This starts:
- Client at http://localhost:3000
- API at http://localhost:3001
- PostgreSQL at localhost:5432

## Development Workflow

### Creating Branches

Use descriptive branch names following this pattern:

```bash
# Features
git checkout -b feature/add-oauth-support

# Bug fixes
git checkout -b fix/authentication-token-refresh

# Documentation
git checkout -b docs/improve-readme

# Refactoring
git checkout -b refactor/auth-service
```

### Making Changes

1. **Create a branch** from `main`
2. **Make your changes** following code quality standards
3. **Write/update tests** for your changes
4. **Run tests** to ensure everything passes
5. **Commit your changes** following conventional commits
6. **Push to your fork**
7. **Open a Pull Request**

### Running Tests

Before committing, ensure all tests pass:

```bash
# Run API tests
cd apps/api
npm test

# Run E2E tests
npm run test:e2e

# Run client tests (if applicable)
cd ../client
npm test
```

## Git Workflow

### Pre-commit Hooks

The project uses **Husky** to run automated checks before commits:

**Checks that run:**
- 🔍 **Linting** - ESLint on staged files
- ✅ **Type Checking** - TypeScript compilation check
- 📝 **Formatting** - Ensure code style consistency

If any check fails, the commit is blocked. Fix the issues and try again.

### Pre-push Hooks

Before pushing, the full test suite runs:

**Checks that run:**
- 🧪 **Tests** - Run all unit and integration tests

This ensures broken code doesn't reach the repository.

### Manual Review

Before committing, you can manually review changes:

```bash
npm run review
```

This shows all changes that will be committed.

### Bypassing Hooks (Not Recommended)

In rare cases, you may need to bypass hooks:

```bash
# Skip pre-commit hooks
git commit --no-verify -m "message"

# Skip pre-push hooks
git push --no-verify
```

⚠️ **Warning**: Only use this if absolutely necessary. Your PR will still need to pass CI checks.

## Code Quality Standards

### TypeScript

- ✅ Use TypeScript strict mode
- ✅ Avoid `any` types
- ✅ Define interfaces for complex objects
- ✅ Use type inference when obvious

```typescript
// Good
interface User {
  id: string;
  email: string;
  name: string;
}

const getUser = (id: string): Promise<User> => {
  // ...
};

// Bad
const getUser = (id: any): any => {
  // ...
};
```

### ESLint

Follow the project's ESLint configuration:

```bash
# Check for linting errors
npm run lint

# Auto-fix linting errors
npm run lint -- --fix
```

### Testing Requirements

**Required:**
- ✅ Unit tests for services
- ✅ Integration tests for API endpoints
- ✅ Test error cases
- ✅ Maintain/improve coverage

**Coverage thresholds:**
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

## Submitting Changes

### Conventional Commits

Use conventional commit format:

```bash
# Format
<type>(<scope>): <subject>

# Types
feat:     # New feature
fix:      # Bug fix
docs:     # Documentation changes
style:    # Code style changes (formatting)
refactor: # Code refactoring
test:     # Adding/updating tests
chore:    # Maintenance tasks

# Examples
feat(auth): add Google OAuth support
fix(api): resolve token refresh race condition
docs(readme): update installation instructions
test(auth): add missing login edge cases
refactor(db): optimize database queries
```

### Pull Request Process

**Step 1: Ensure Quality**

- [ ] All tests pass
- [ ] Code is linted
- [ ] TypeScript compiles without errors
- [ ] Coverage meets thresholds

**Step 2: Create Pull Request**

- Clear title following conventional commits
- Description explaining changes
- Link related issues
- Add screenshots (if UI changes)

**Step 3: Code Review**

- Address review feedback
- Keep discussions focused
- Be open to suggestions

**Step 4: Merge**

Once approved:
- Maintainer will merge your PR
- Your branch will be deleted
- Changes will be in the next release

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] All tests passing

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
```

## Code Review Guidelines

### As a Reviewer

- Be respectful and constructive
- Explain reasoning for suggestions
- Approve when quality standards are met
- Block if critical issues exist

### As an Author

- Respond to all feedback
- Ask questions if unclear
- Don't take feedback personally
- Make requested changes promptly

## Getting Help

If you need help:

- 💬 **GitHub Discussions** - Ask questions
- 🐛 **GitHub Issues** - Report bugs
- 📧 **Email** - thiago@time2build.ai

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- GitHub contributor graph

Thank you for contributing to Time2Ship! 🚀

## Related Documentation

- [Getting Started](getting-started.md) - Development setup
- [Testing](testing.md) - Testing guide
- [Architecture](architecture.md) - System architecture
- [Husky Configuration](HUSKY.md) - Git hooks details

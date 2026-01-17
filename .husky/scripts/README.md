# Husky Scripts

Helper scripts used by git hooks in this repository.

## Available Scripts

### review-changes.sh

Review code changes with Claude Code's code-simplifier skill.

**Usage**:
```bash
# Review changes against origin/main (default)
npm run review

# Or run directly
./.husky/scripts/review-changes.sh

# Review against a specific branch
./.husky/scripts/review-changes.sh origin/develop
```

**What it does**:
1. Compares your current branch against a base branch
2. Shows all changed files
3. Launches Claude Code with the code-simplifier skill
4. Claude analyzes your diff and suggests:
   - Code complexity reductions
   - Pattern abstractions
   - Readability improvements
   - Simplification opportunities

**When to use**:
- Before committing major changes
- During code reviews
- When refactoring
- As part of the pre-push hook (optional prompt)

**Requirements**:
- Claude Code CLI must be installed and available in your PATH
- Must be run from a git repository
- Works best in VS Code or supported terminals

## Adding New Scripts

1. Create your script in this directory
2. Make it executable: `chmod +x .husky/scripts/your-script.sh`
3. Reference it from the appropriate hook in `.husky/`
4. Add npm script alias in root `package.json` if needed
5. Document it in this README

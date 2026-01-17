#!/bin/bash

# Script to review code changes with Claude Code's code-simplifier skill
# Usage: ./scripts/review-changes.sh [base-branch]

set -e

BASE_BRANCH="${1:-origin/main}"

echo "🔍 Code Review with Claude Code"
echo "================================"
echo ""
echo "Comparing against: $BASE_BRANCH"
echo ""

# Check if there are changes
if git diff --quiet HEAD "$BASE_BRANCH" 2>/dev/null; then
    echo "✅ No changes to review."
    exit 0
fi

# Get list of changed files
echo "📝 Changed files:"
git diff --name-only "$BASE_BRANCH"..HEAD
echo ""

# Create a summary of the changes
CHANGES_SUMMARY=$(mktemp)
cat > "$CHANGES_SUMMARY" <<EOF
Please review the following code changes and suggest simplifications.
Focus on:
- Code complexity that can be reduced
- Repeated patterns that can be abstracted
- Overly verbose implementations
- Opportunities for better readability

Changed files:
$(git diff --name-status "$BASE_BRANCH"..HEAD)

Diff:
$(git diff "$BASE_BRANCH"..HEAD)
EOF

echo "🤖 Launching Claude Code with code-simplifier skill..."
echo ""
echo "Claude will review your changes and suggest simplifications."
echo "The review will focus on recently modified code."
echo ""

# Check if running in VS Code
if [ -n "$VSCODE_IPC_HOOK_CLI" ] || [ -n "$TERM_PROGRAM" ]; then
    # Running in VS Code or supported terminal
    claude --skill code-simplifier:code-simplifier
else
    # Fallback: just show the diff and instructions
    echo "⚠️  Unable to launch interactive Claude Code session."
    echo ""
    echo "Please run the following command manually:"
    echo "  claude --skill code-simplifier:code-simplifier"
    echo ""
    echo "Or run this script from VS Code integrated terminal."
fi

# Clean up
rm -f "$CHANGES_SUMMARY"

echo ""
echo "✅ Code review complete!"
echo ""
echo "Next steps:"
echo "  1. Review any suggestions from Claude"
echo "  2. Make improvements to your code if needed"
echo "  3. Commit your changes"
echo "  4. Push to remote"

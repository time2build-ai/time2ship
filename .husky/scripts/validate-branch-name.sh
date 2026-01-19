#!/bin/sh

# Get current branch name
branch=$(git symbolic-ref --short HEAD 2>/dev/null)

# Define allowed branch patterns
allowed_branches="^(development|production|feature\/.*|fix\/.*|hotfix\/.*|release\/.*|chore\/.*)$"

# Check if branch name matches allowed patterns
if ! echo "$branch" | grep -qE "$allowed_branches"; then
    echo ""
    echo "❌ Invalid branch name: '$branch'"
    echo ""
    echo "Branch names must follow one of these patterns:"
    echo "  - development"
    echo "  - production"
    echo "  - feature/*   (e.g., feature/user-authentication)"
    echo "  - fix/*       (e.g., fix/login-bug)"
    echo "  - hotfix/*    (e.g., hotfix/critical-security-fix)"
    echo "  - release/*   (e.g., release/1.0.0)"
    echo "  - chore/*     (e.g., chore/update-dependencies)"
    echo ""
    echo "To rename your branch:"
    echo "  git branch -m $branch <new-branch-name>"
    echo ""
    exit 1
fi

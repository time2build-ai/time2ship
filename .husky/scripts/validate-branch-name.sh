#!/bin/sh

# Validate Branch Name Script
# Returns exit code 0 for valid, 1 for invalid
# Can be used standalone or with UI utils

# Get current branch name
branch=$(git symbolic-ref --short HEAD 2>/dev/null)

# Define allowed branch patterns
allowed_branches="^(development|production|feature\/.*|fix\/.*|hotfix\/.*|release\/.*|chore\/.*)$"

# Check if branch name matches allowed patterns
if echo "$branch" | grep -qE "$allowed_branches"; then
    # Valid branch - only output if standalone (no UI utils loaded)
    if [ -z "$HUSKY_UI_LOADED" ]; then
        echo "✅ Branch name '$branch' is valid"
    fi
    exit 0
else
    # Invalid branch - always output error details
    if [ -z "$HUSKY_UI_LOADED" ]; then
        echo ""
        echo "❌ Invalid branch name: '$branch'"
        echo ""
    fi

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

    exit 1
fi

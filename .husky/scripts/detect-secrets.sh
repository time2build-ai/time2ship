#!/bin/sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "${YELLOW}🔍 Scanning for secrets...${NC}"

# Check if gitleaks is installed
if ! command -v gitleaks >/dev/null 2>&1; then
    echo "${RED}❌ Gitleaks is not installed!${NC}"
    echo ""
    echo "Please install Gitleaks to enable secrets detection:"
    echo ""
    echo "  macOS (Homebrew):"
    echo "    brew install gitleaks"
    echo ""
    echo "  Linux:"
    echo "    # Download from: https://github.com/gitleaks/gitleaks/releases"
    echo ""
    echo "  Windows:"
    echo "    # Download from: https://github.com/gitleaks/gitleaks/releases"
    echo "    # Or use: scoop install gitleaks"
    echo ""
    echo "Or skip secrets detection (not recommended):"
    echo "  git commit --no-verify"
    echo ""
    exit 1
fi

# Run gitleaks on staged files
# --no-git: Don't use git to find files (we'll pass them explicitly)
# --staged: Only scan staged changes
# --config: Use our custom config
# --verbose: Show more details
# --redact: Hide actual secret values in output

if gitleaks protect --staged --config=.gitleaks.toml --verbose --redact; then
    echo "${GREEN}✅ No secrets detected${NC}"
    exit 0
else
    echo ""
    echo "${RED}❌ Secrets detected in your commit!${NC}"
    echo ""
    echo "Please remove the secrets from your code and use environment variables instead."
    echo ""
    echo "If this is a false positive, you can:"
    echo "  1. Update .gitleaks.toml to allowlist the pattern"
    echo "  2. Use 'gitleaks:allow' comment in your code"
    echo "  3. Skip this check (not recommended): git commit --no-verify"
    echo ""
    exit 1
fi

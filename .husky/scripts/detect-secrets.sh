#!/bin/sh

# Detect Secrets Script
# Returns exit code 0 for no secrets, 1 for secrets found or not installed
# Can be used standalone or with UI utils

# Check if gitleaks is installed
if ! command -v gitleaks >/dev/null 2>&1; then
    # Output error details
    echo "Gitleaks is not installed!"
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

    exit 1
fi

# Run gitleaks on staged files
if gitleaks protect --staged --config=.gitleaks.toml --verbose --redact 2>&1; then
    # Success - only output if standalone (no UI utils loaded)
    if [ -z "$HUSKY_UI_LOADED" ]; then
        echo "✅ No secrets detected"
    fi
    exit 0
else
    # Secrets found - output error details
    echo ""
    echo "Please remove the secrets from your code and use environment variables instead."
    echo ""
    echo "If this is a false positive, you can:"
    echo "  1. Update .gitleaks.toml to allowlist the pattern"
    echo "  2. Use 'gitleaks:allow' comment in your code"
    echo "  3. Skip this check (not recommended): git commit --no-verify"

    exit 1
fi

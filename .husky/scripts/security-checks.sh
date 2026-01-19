#!/bin/sh

# Security Checks Script
# Runs vulnerability scanning and dependency health checks

set -e

echo "🔒 Running security checks..."
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Track if any checks fail
HAS_VULNERABILITIES=0
HAS_UNUSED_DEPS=0

# Step 1: Snyk vulnerability scan
echo "🔍 Scanning for known vulnerabilities with Snyk..."
echo ""

cd "$PROJECT_ROOT"

# Run Snyk test - will exit with code 1 if vulnerabilities found
if npx snyk test --severity-threshold=high 2>&1; then
    echo ""
    echo "✅ No high/critical vulnerabilities found"
else
    EXIT_CODE=$?
    if [ $EXIT_CODE -eq 1 ]; then
        HAS_VULNERABILITIES=1
        echo ""
        echo "⚠️  High or critical severity vulnerabilities detected!"
    elif [ $EXIT_CODE -eq 2 ]; then
        echo ""
        echo "⚠️  Snyk encountered an error. Please check your configuration."
        echo "Run 'npx snyk auth' to authenticate if needed."
        echo ""
        echo "Skipping Snyk check for now..."
    else
        HAS_VULNERABILITIES=1
        echo ""
        echo "⚠️  Snyk check failed with exit code $EXIT_CODE"
    fi
fi

echo ""

# Step 2: Check for unused dependencies
echo "📦 Checking for unused dependencies with depcheck..."
echo ""

# Run depcheck for both apps
check_unused_deps() {
    APP_PATH=$1
    APP_NAME=$2

    if [ -d "$PROJECT_ROOT/$APP_PATH" ]; then
        echo "Checking $APP_NAME..."
        cd "$PROJECT_ROOT/$APP_PATH"

        DEPCHECK_OUTPUT=$(npx depcheck --json)

        # Parse depcheck output
        UNUSED_COUNT=$(echo "$DEPCHECK_OUTPUT" | grep -o '"dependencies":\[' | wc -l || echo "0")

        if echo "$DEPCHECK_OUTPUT" | grep -q '"dependencies":\[.\+\]'; then
            HAS_UNUSED_DEPS=1
            echo ""
            echo "⚠️  Unused dependencies found in $APP_NAME:"
            echo "$DEPCHECK_OUTPUT" | npx depcheck --json | node -e "
                const data = JSON.parse(require('fs').readFileSync(0, 'utf-8'));
                if (data.dependencies && data.dependencies.length > 0) {
                    console.log('  Unused:', data.dependencies.join(', '));
                }
            " 2>/dev/null || echo "$DEPCHECK_OUTPUT"
        else
            echo "✅ No unused dependencies in $APP_NAME"
        fi

        cd "$PROJECT_ROOT"
    fi
}

check_unused_deps "apps/client" "Client App"
echo ""
check_unused_deps "apps/api" "API App"
echo ""

# Summary and exit
if [ $HAS_VULNERABILITIES -eq 1 ] || [ $HAS_UNUSED_DEPS -eq 1 ]; then
    echo ""
    echo "❌ Security checks failed!"
    echo ""

    if [ $HAS_VULNERABILITIES -eq 1 ]; then
        echo "📋 To fix vulnerabilities:"
        echo "  1. Run: npx snyk wizard"
        echo "  2. Or update vulnerable packages manually"
        echo "  3. For unfixable issues, consider alternatives or accept the risk"
        echo ""
    fi

    if [ $HAS_UNUSED_DEPS -eq 1 ]; then
        echo "📋 To fix unused dependencies:"
        echo "  1. Review the list above"
        echo "  2. Remove unused packages from package.json"
        echo "  3. Run: npm install"
        echo ""
    fi

    echo "To skip this check (not recommended):"
    echo "  git push --no-verify"
    echo ""

    exit 1
fi

echo ""
echo "✅ All security checks passed!"
echo ""

exit 0

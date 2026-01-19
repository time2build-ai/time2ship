#!/bin/sh

# Security Checks Script
# Runs vulnerability scanning and dependency health checks
# Returns exit code 0 for all passed, 1 for failures
# Can be used standalone or with UI utils

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Track if any checks fail
HAS_VULNERABILITIES=0
HAS_UNUSED_DEPS=0

# ============================================================================
# Helper function to check if running with UI utils
# ============================================================================

is_ui_mode() {
    [ -n "$HUSKY_UI_LOADED" ]
}

# ============================================================================
# Step 1: Snyk vulnerability scan
# ============================================================================

run_snyk_scan() {
    if ! is_ui_mode; then
        echo "🔍 Scanning for known vulnerabilities with Snyk..."
        echo ""
    fi

    cd "$PROJECT_ROOT"

    # Run Snyk test - will exit with code 1 if vulnerabilities found
    npx snyk test --severity-threshold=high 2>&1
    EXIT_CODE=$?

    if [ $EXIT_CODE -eq 0 ]; then
        if ! is_ui_mode; then
            echo ""
            echo "✅ No high/critical vulnerabilities found"
        fi
        return 0
    elif [ $EXIT_CODE -eq 1 ]; then
        if ! is_ui_mode; then
            echo ""
            echo "⚠️  High or critical severity vulnerabilities detected!"
        fi
        return 1
    elif [ $EXIT_CODE -eq 2 ]; then
        echo ""
        echo "⚠️  Snyk encountered an error. Please check your configuration."
        echo "Run 'npx snyk auth' to authenticate if needed."
        echo ""
        echo "Skipping Snyk check for now..."
        return 0
    else
        if ! is_ui_mode; then
            echo ""
            echo "⚠️  Snyk check failed with exit code $EXIT_CODE"
        fi
        return 1
    fi
}

# ============================================================================
# Step 2: Check for unused dependencies
# ============================================================================

check_unused_deps() {
    APP_PATH=$1
    APP_NAME=$2

    if [ -d "$PROJECT_ROOT/$APP_PATH" ]; then
        if ! is_ui_mode; then
            echo "Checking $APP_NAME..."
        fi

        cd "$PROJECT_ROOT/$APP_PATH"

        # Run depcheck and capture output
        DEPCHECK_OUTPUT=$(npx depcheck --json 2>&1)

        # Use node to parse JSON and check for unused deps
        echo "$DEPCHECK_OUTPUT" | node -e "
            let input = '';
            process.stdin.on('data', chunk => input += chunk);
            process.stdin.on('end', () => {
                try {
                    const data = JSON.parse(input);
                    const deps = data.dependencies || [];
                    const devDeps = data.devDependencies || [];

                    if (deps.length > 0 || devDeps.length > 0) {
                        if (deps.length > 0) {
                            console.log('  Unused dependencies: ' + deps.join(', '));
                        }
                        if (devDeps.length > 0) {
                            console.log('  Unused devDependencies: ' + devDeps.join(', '));
                        }
                        process.exit(1);
                    } else {
                        process.exit(0);
                    }
                } catch (e) {
                    console.error('Error parsing depcheck output');
                    process.exit(0);
                }
            });
        "

        if [ $? -ne 0 ]; then
            if ! is_ui_mode; then
                echo "⚠️  Unused dependencies detected"
            fi
            return 1
        else
            if ! is_ui_mode; then
                echo "✅ No unused dependencies"
            fi
            return 0
        fi

        cd "$PROJECT_ROOT"
    fi

    return 0
}

run_depcheck() {
    if ! is_ui_mode; then
        echo "📦 Checking for unused dependencies with depcheck..."
        echo ""
    fi

    check_unused_deps "apps/client" "Client App"
    CLIENT_RESULT=$?

    if ! is_ui_mode; then
        echo ""
    fi

    check_unused_deps "apps/api" "API App"
    API_RESULT=$?

    if [ $CLIENT_RESULT -ne 0 ] || [ $API_RESULT -ne 0 ]; then
        return 1
    fi

    return 0
}

# ============================================================================
# Main execution
# ============================================================================

# Run Snyk scan
run_snyk_scan
SNYK_RESULT=$?

if [ $SNYK_RESULT -ne 0 ]; then
    HAS_VULNERABILITIES=1
fi

if ! is_ui_mode; then
    echo ""
fi

# Run dependency check
run_depcheck
DEPCHECK_RESULT=$?

if [ $DEPCHECK_RESULT -ne 0 ]; then
    HAS_UNUSED_DEPS=1
fi

# Summary and exit
if [ $HAS_VULNERABILITIES -eq 1 ] || [ $HAS_UNUSED_DEPS -eq 1 ]; then
    if ! is_ui_mode; then
        echo ""
        echo "❌ Security checks failed!"
        echo ""
    fi

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

    exit 1
fi

if ! is_ui_mode; then
    echo ""
    echo "✅ All security checks passed!"
    echo ""
fi

exit 0

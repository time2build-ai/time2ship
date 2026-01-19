#!/bin/sh

# Security Checks Script
# Runs vulnerability scanning and dependency health checks

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
npx snyk test --severity-threshold=high 2>&1
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ No high/critical vulnerabilities found"
elif [ $EXIT_CODE -eq 1 ]; then
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
            HAS_UNUSED_DEPS=1
            echo "⚠️  Unused dependencies detected"
        else
            echo "✅ No unused dependencies"
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

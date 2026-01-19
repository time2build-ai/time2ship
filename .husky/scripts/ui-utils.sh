#!/bin/sh

# ============================================================================
# Husky UI Utilities
# Beautiful, informative output for git hooks
# ============================================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD_CYAN='\033[1;36m'
GRAY='\033[0;90m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m' # No Color

# Unicode characters for tree structure
TREE_BRANCH="├─"
TREE_LAST="└─"
TREE_PIPE="│"

# Logging variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null || cd "$(dirname "$0")" && pwd)"
LOG_DIR="$SCRIPT_DIR/../logs"
LOG_FILE=""
TEMP_OUTPUT=""
STEP_START_TIME=""

# ============================================================================
# Logging Setup
# ============================================================================

init_logging() {
    local hook_name=$1

    # Create logs directory if it doesn't exist
    mkdir -p "$LOG_DIR"

    # Generate timestamped log file
    local timestamp=$(date +"%Y-%m-%d-%H-%M-%S")
    LOG_FILE="$LOG_DIR/${timestamp}-${hook_name}.log"

    # Create/update symlink to latest log
    ln -sf "${timestamp}-${hook_name}.log" "$LOG_DIR/latest-${hook_name}.log"

    # Initialize log file
    echo "============================================" > "$LOG_FILE"
    echo "Hook: $hook_name" >> "$LOG_FILE"
    echo "Date: $(date)" >> "$LOG_FILE"
    echo "============================================" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"

    # Cleanup old logs (keep last 10 per hook type)
    cleanup_old_logs "$hook_name"
}

cleanup_old_logs() {
    local hook_name=$1
    local log_count=$(ls -1 "$LOG_DIR" | grep "^[0-9].*-${hook_name}.log$" | wc -l | tr -d ' ')

    if [ "$log_count" -gt 10 ]; then
        ls -1t "$LOG_DIR" | grep "^[0-9].*-${hook_name}.log$" | tail -n +11 | while read -r old_log; do
            rm -f "$LOG_DIR/$old_log"
        done
    fi
}

log() {
    if [ -n "$LOG_FILE" ]; then
        echo "$1" >> "$LOG_FILE"
    fi
}

# ============================================================================
# Visual Components
# ============================================================================

print_separator() {
    echo "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_header() {
    local title=$1
    local icon=$2

    echo ""
    print_separator
    echo "${BOLD_CYAN}${icon} ${title}${NC}"
    print_separator
    echo ""

    log ""
    log "========================================"
    log "${icon} ${title}"
    log "========================================"
    log ""
}

print_footer() {
    local status=$1
    local message=$2
    local time=$3

    echo ""
    print_separator
    if [ "$status" = "success" ]; then
        echo "${GREEN}✅ ${message}${NC}"
    else
        echo "${RED}❌ ${message}${NC}"
    fi
    print_separator
    if [ -n "$time" ]; then
        echo "${GRAY}✨ Total time: ${time}${NC}"
    fi
    echo ""
}

step_start() {
    local step_num=$1
    local total_steps=$2
    local title=$3
    local icon=$4

    STEP_START_TIME=$(date +%s)

    echo "${BOLD_CYAN}[${step_num}/${total_steps}] ${icon} ${title}${NC}"
    echo ""

    log "[${step_num}/${total_steps}] ${icon} ${title}"
    log ""
}

step_end() {
    local exit_code=$1
    local duration=$2

    if [ -n "$STEP_START_TIME" ]; then
        local end_time=$(date +%s)
        duration=$((end_time - STEP_START_TIME))
        duration="${duration}s"
    fi

    echo ""

    if [ $exit_code -eq 0 ]; then
        log "Step completed successfully (${duration})"
    else
        log "Step failed with exit code ${exit_code} (${duration})"
    fi
    log ""
}

substep_start() {
    local message=$1
    local is_last=${2:-0}

    if [ "$is_last" = "1" ]; then
        echo "  ${TREE_LAST} ${BLUE}${message}${NC}"
    else
        echo "  ${TREE_BRANCH} ${BLUE}${message}${NC}"
    fi

    log "  - ${message}"
}

substep_end() {
    local exit_code=$1
    local message=$2
    local duration=${3:-""}
    local is_last=${4:-0}

    local time_str=""
    if [ -n "$duration" ]; then
        time_str=" ${GRAY}(${duration})${NC}"
    fi

    if [ $exit_code -eq 0 ]; then
        if [ "$is_last" = "1" ]; then
            echo "  ${TREE_LAST} ${GREEN}✅ ${message}${NC}${time_str}"
        else
            echo "  ${TREE_BRANCH} ${GREEN}✅ ${message}${NC}${time_str}"
        fi
        log "  ✅ ${message} ${duration}"
    else
        if [ "$is_last" = "1" ]; then
            echo "  ${TREE_LAST} ${RED}❌ ${message}${NC}${time_str}"
        else
            echo "  ${TREE_BRANCH} ${RED}❌ ${message}${NC}${time_str}"
        fi
        log "  ❌ ${message} ${duration}"
    fi
}

substep_nested() {
    local message=$1
    local is_last=${2:-0}

    if [ "$is_last" = "1" ]; then
        echo "  ${TREE_PIPE}  ${TREE_LAST} ${message}"
    else
        echo "  ${TREE_PIPE}  ${TREE_BRANCH} ${message}"
    fi

    log "    - ${message}"
}

# ============================================================================
# Output Capture & Display
# ============================================================================

capture_output() {
    local cmd=$1

    # Create temp file for output
    TEMP_OUTPUT=$(mktemp)

    # Run command and capture output to both temp file and log
    if eval "$cmd" > "$TEMP_OUTPUT" 2>&1; then
        cat "$TEMP_OUTPUT" >> "$LOG_FILE"
        rm -f "$TEMP_OUTPUT"
        return 0
    else
        local exit_code=$?
        cat "$TEMP_OUTPUT" >> "$LOG_FILE"
        return $exit_code
    fi
}

show_captured_output() {
    if [ -f "$TEMP_OUTPUT" ]; then
        echo "  ${TREE_PIPE}"
        echo "  ${TREE_LAST} ${RED}Failed output:${NC}"
        echo "     ${GRAY}┌─────────────────────────────────────${NC}"

        # Show output with proper indentation
        while IFS= read -r line; do
            echo "     ${GRAY}│${NC} $line"
        done < "$TEMP_OUTPUT"

        echo "     ${GRAY}└─────────────────────────────────────${NC}"

        rm -f "$TEMP_OUTPUT"
    fi
}

show_error() {
    local message=$1
    local exit_code=${2:-1}

    echo ""
    echo "  ${TREE_LAST} ${RED}Error (exit code ${exit_code}):${NC}"
    echo "     ${GRAY}┌─────────────────────────────────────${NC}"
    echo "     ${GRAY}│${NC} ${message}"
    echo "     ${GRAY}└─────────────────────────────────────${NC}"
    echo ""

    log "ERROR: ${message} (exit code: ${exit_code})"
}

show_log_location() {
    echo ""
    echo "  ${BLUE}ℹ️  Full logs:${NC} ${GRAY}${LOG_FILE}${NC}"
    echo ""
}

show_skip_hint() {
    echo "  ${YELLOW}To skip this check (not recommended):${NC}"
    echo "     ${GRAY}git push --no-verify${NC}"
    echo "     ${GRAY}# or for commits: git commit --no-verify${NC}"
}

# ============================================================================
# Utility Functions
# ============================================================================

format_duration() {
    local seconds=$1

    if [ "$seconds" -lt 60 ]; then
        echo "${seconds}s"
    else
        local minutes=$((seconds / 60))
        local remaining_seconds=$((seconds % 60))
        echo "${minutes}m ${remaining_seconds}s"
    fi
}

get_elapsed_time() {
    local start_time=$1
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    format_duration $duration
}

# ============================================================================
# Cleanup on Exit
# ============================================================================

cleanup_temp_files() {
    if [ -f "$TEMP_OUTPUT" ]; then
        rm -f "$TEMP_OUTPUT"
    fi
}

# Set trap to cleanup temp files on exit
trap cleanup_temp_files EXIT INT TERM

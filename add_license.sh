#!/bin/bash

# TNT License Header Addition Script
# Adds license headers to all source code files in the project

set -e

# License text for non-commercial internal use
LICENSE_TEXT="TNT - Team New Tab
Copyright (c) 2025 Nitin Chauhan
All rights reserved.

This software is provided for internal use only and is not licensed
for commercial use, redistribution, or modification without explicit
written permission from the copyright holder.

For commercial licensing inquiries, please contact the author.

THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE."

# Function to check if file already has license (checks for complete license block)
has_license() {
    local file="$1"
    # Check for the complete license signature including copyright and key phrases
    if grep -q "TNT - Team New Tab" "$file" 2>/dev/null && \
       grep -q "Copyright (c) 2025 Nitin Chauhan" "$file" 2>/dev/null && \
       grep -q "internal use only" "$file" 2>/dev/null && \
       grep -q "THE SOFTWARE IS PROVIDED" "$file" 2>/dev/null; then
        return 0  # Has complete license
    else
        return 1  # No license or incomplete license
    fi
}

# Function to remove existing license header from file
remove_existing_license() {
    local file="$1"
    local temp_file=$(mktemp)
    local file_ext="${file##*.}"
    local in_license=false
    local license_start_found=false
    local preserve_shebang=false
    local shebang_line=""
    
    # Check if file starts with shebang and preserve it
    if head -n1 "$file" | grep -q "^#!"; then
        preserve_shebang=true
        shebang_line=$(head -n1 "$file")
    fi
    
    case "$file_ext" in
        js|ts|go)
            # For multi-line comment files, remove everything between /* TNT and */
            awk '
                /\/\* TNT - Team New Tab/ { in_license=1; next }
                in_license && /\*\// { in_license=0; next }
                !in_license { print }
            ' "$file" > "$temp_file"
            ;;
        py|sh)
            # For single-line comment files, remove consecutive lines starting with # TNT or # Copyright etc.
            if [ "$preserve_shebang" = true ]; then
                echo "$shebang_line" > "$temp_file"
                tail -n +2 "$file" | awk '
                    /^# TNT - Team New Tab/ { in_license=1; next }
                    in_license && /^#/ { next }
                    in_license && /^$/ { next }
                    { in_license=0; print }
                ' >> "$temp_file"
            else
                awk '
                    /^# TNT - Team New Tab/ { in_license=1; next }
                    in_license && /^#/ { next }
                    in_license && /^$/ { next }
                    { in_license=0; print }
                ' "$file" > "$temp_file"
            fi
            ;;
    esac
    
    mv "$temp_file" "$file"
}

# Function to add license header to JavaScript/TypeScript/Go files
add_js_license() {
    local file="$1"
    local temp_file=$(mktemp)
    
    echo "/*" > "$temp_file"
    echo " * $LICENSE_TEXT" | sed 's/^/ * /' >> "$temp_file"
    echo " */" >> "$temp_file"
    echo "" >> "$temp_file"
    cat "$file" >> "$temp_file"
    mv "$temp_file" "$file"
}

# Function to add license header to Python files
add_py_license() {
    local file="$1"
    local temp_file=$(mktemp)
    local has_shebang=false
    
    # Check if file starts with shebang
    if head -n1 "$file" | grep -q "^#!"; then
        has_shebang=true
        head -n1 "$file" > "$temp_file"
        echo "" >> "$temp_file"
    fi
    
    # Add license header
    echo "# TNT - Team New Tab" >> "$temp_file"
    echo "$LICENSE_TEXT" | sed 's/^/# /' >> "$temp_file"
    echo "" >> "$temp_file"
    
    # Add original content (skip shebang if it exists)
    if [ "$has_shebang" = true ]; then
        tail -n +2 "$file" >> "$temp_file"
    else
        cat "$file" >> "$temp_file"
    fi
    
    mv "$temp_file" "$file"
}

# Function to add license header to Shell files
add_sh_license() {
    local file="$1"
    local temp_file=$(mktemp)
    local has_shebang=false
    
    # Check if file starts with shebang
    if head -n1 "$file" | grep -q "^#!"; then
        has_shebang=true
        head -n1 "$file" > "$temp_file"
        echo "" >> "$temp_file"
    fi
    
    # Add license header
    echo "# TNT - Team New Tab" >> "$temp_file"
    echo "$LICENSE_TEXT" | sed 's/^/# /' >> "$temp_file"
    echo "" >> "$temp_file"
    
    # Add original content (skip shebang if it exists)
    if [ "$has_shebang" = true ]; then
        tail -n +2 "$file" >> "$temp_file"
    else
        cat "$file" >> "$temp_file"
    fi
    
    mv "$temp_file" "$file"
}

# Function to process files by extension
process_files() {
    local extension="$1"
    local add_function="$2"
    local force_update="$3"
    
    echo "Processing $extension files..."
    
    # Find files with the given extension, excluding node_modules
    find . -name "*.${extension}" -not -path "./node_modules/*" -type f | while read -r file; do
        if has_license "$file"; then
            if [ "$force_update" = "true" ]; then
                echo "  ↻ $file (updating existing license)"
                remove_existing_license "$file"
                $add_function "$file"
            else
                echo "  ✓ $file (already has license)"
            fi
        else
            echo "  + $file (adding license)"
            $add_function "$file"
        fi
    done
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -u, --update    Update existing license headers (force overwrite)"
    echo "  -h, --help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0              Add license headers to files that don't have them"
    echo "  $0 --update     Update all license headers (including existing ones)"
    echo ""
}

# Parse command line arguments
FORCE_UPDATE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -u|--update)
            FORCE_UPDATE=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Main execution
echo "TNT License Header Addition Script"
echo "=================================="
if [ "$FORCE_UPDATE" = "true" ]; then
    echo "Mode: UPDATE (will overwrite existing licenses)"
else
    echo "Mode: ADD (will skip files with existing licenses)"
fi
echo ""

# Process different file types
process_files "js" "add_js_license" "$FORCE_UPDATE"
process_files "ts" "add_js_license" "$FORCE_UPDATE"
process_files "go" "add_js_license" "$FORCE_UPDATE"
process_files "py" "add_py_license" "$FORCE_UPDATE"
process_files "sh" "add_sh_license" "$FORCE_UPDATE"

echo ""
echo "License header processing complete!"
echo ""
echo "Summary:"
if [ "$FORCE_UPDATE" = "true" ]; then
    echo "- Updated all license headers (including existing ones)"
    echo "- Added headers to files that didn't have them"
else
    echo "- Added headers to files that didn't have them"
    echo "- Skipped files that already contain the complete license"
fi
echo "- Preserved shebang lines in Python and Shell scripts"
echo "- Used robust license detection (checks multiple key phrases)"
echo ""
echo "Note: This script adds a non-commercial internal use license."
echo "For commercial use, please contact the copyright holder." 
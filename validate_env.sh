#!/bin/bash

# Environment validation script
# Checks that all required environment variables are set

echo "=========================================="
echo "🔍 Validating Environment Variables"
echo "=========================================="
echo ""

# Load .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | xargs)
    echo "✅ Loaded .env file"
else
    echo "❌ .env file not found"
    exit 1
fi

# Required variables
REQUIRED_VARS=(
    "OPENAI_API_KEY"
    "GOOGLE_PLACES_API_KEY"
)

# Optional variables
OPTIONAL_VARS=(
    "ANTHROPIC_API_KEY"
    "HUNTER_API_KEY"
    "DATAFORSEO_LOGIN"
    "DATAFORSEO_PASSWORD"
)

echo ""
echo "Required Variables:"
MISSING=0
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "  ❌ $var is NOT set"
        MISSING=$((MISSING + 1))
    else
        # Show first 10 chars and last 4 chars
        value="${!var}"
        if [ ${#value} -gt 14 ]; then
            display="${value:0:10}...${value: -4}"
        else
            display="***"
        fi
        echo "  ✅ $var is set ($display)"
    fi
done

echo ""
echo "Optional Variables:"
for var in "${OPTIONAL_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "  ⚠️  $var is NOT set"
    else
        echo "  ✅ $var is set"
    fi
done

echo ""
if [ $MISSING -gt 0 ]; then
    echo "❌ Missing $MISSING required variable(s)"
    exit 1
else
    echo "✅ All required variables are set!"
    exit 0
fi

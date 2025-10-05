#!/bin/bash

# Staging Smoke Tests
# Railway Staging: https://url-shortener-production-ce62.up.railway.app

STAGING_URL="https://url-shortener-production-ce62.up.railway.app"

echo "🧪 Running staging smoke tests..."
echo "Staging URL: $STAGING_URL"
echo ""

# Test 1: Health Check
echo "1️⃣  Health Check"
echo "-------------------"
curl -s "$STAGING_URL/api/health" | jq '.'
echo ""

# Test 2: API Info
echo "2️⃣  API Information"
echo "-------------------"
curl -s "$STAGING_URL/" | jq '.'
echo ""

# Test 3: Create Short URL
echo "3️⃣  Create Short URL"
echo "-------------------"
RESPONSE=$(curl -s -X POST "$STAGING_URL/api/shorten" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://github.com/kaikezhang/url-shortener"}')
echo "$RESPONSE" | jq '.'
SHORT_CODE=$(echo "$RESPONSE" | jq -r '.shortCode')
echo ""

# Test 4: Test Redirect
echo "4️⃣  Test Redirect (Short Code: $SHORT_CODE)"
echo "-------------------"
curl -I "$STAGING_URL/$SHORT_CODE" 2>&1 | grep -E "HTTP|Location"
echo ""

# Test 5: Get Analytics (if enabled)
echo "5️⃣  Get Analytics"
echo "-------------------"
curl -s "$STAGING_URL/api/analytics/$SHORT_CODE" | jq '.'
echo ""

# Test 6: Create Custom Short URL (if enabled)
echo "6️⃣  Create Custom Short URL"
echo "-------------------"
curl -s -X POST "$STAGING_URL/api/shorten" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://github.com", "customCode": "gh-staging"}' | jq '.'
echo ""

# Test 7: Test Custom Redirect
echo "7️⃣  Test Custom Redirect"
echo "-------------------"
curl -I "$STAGING_URL/gh-staging" 2>&1 | grep -E "HTTP|Location"
echo ""

# Test 8: Delete URL
echo "8️⃣  Delete URL"
echo "-------------------"
curl -X DELETE "$STAGING_URL/api/urls/gh-staging"
echo "Deleted: gh-staging"
echo ""

echo "✅ Staging smoke tests complete!"
echo ""
echo "Next steps:"
echo "  - Check all features work correctly"
echo "  - Verify database is separate from production"
echo "  - Test rate limiting"
echo "  - Run integration tests"

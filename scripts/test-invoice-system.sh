#!/bin/bash

# ============================================
# Invoice System Testing Script
# ============================================
# Tests all components of the invoice system
# Can run against localhost or production
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
ADMIN_TOKEN="${ADMIN_TOKEN:-}"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Invoice System Test Suite${NC}"
echo -e "${BLUE}================================================${NC}"
echo -e "Testing against: ${YELLOW}$BASE_URL${NC}"
echo ""

# Test counter
PASSED=0
FAILED=0

# Helper functions
test_api() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local expected_status="$4"
    
    echo -n "Testing $name... "
    
    response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json")
    
    status=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $status)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (Expected $expected_status, got $status)"
        echo "Response: $body"
        ((FAILED++))
        return 1
    fi
}

test_database() {
    local name="$1"
    local query="$2"
    
    echo -n "Testing $name... "
    
    if [ -z "$PGPASSWORD" ]; then
        echo -e "${YELLOW}⊘ SKIPPED${NC} (No database access)"
        return 0
    fi
    
    result=$(psql -U postgres -d bereifung24 -tAc "$query" 2>&1)
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ PASSED${NC}"
        echo "  Result: $result"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        echo "  Error: $result"
        ((FAILED++))
        return 1
    fi
}

# ============================================
# Test 1: Database Structure
# ============================================
echo -e "\n${BLUE}[1] Database Structure Tests${NC}"

if [ -n "$PGPASSWORD" ]; then
    test_database "Commission invoices table exists" \
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='commission_invoices';"
    
    test_database "Invoice settings table exists" \
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='invoice_settings';"
    
    test_database "Email template exists" \
        "SELECT COUNT(*) FROM email_templates WHERE slug='commission-invoice';"
    
    test_database "Default settings exist" \
        "SELECT COUNT(*) FROM invoice_settings WHERE id='default-settings';"
else
    echo -e "${YELLOW}⊘ Database tests skipped (set PGPASSWORD to enable)${NC}"
fi

# ============================================
# Test 2: API Endpoints
# ============================================
echo -e "\n${BLUE}[2] API Endpoint Tests${NC}"

if [ -n "$ADMIN_TOKEN" ]; then
    test_api "Get invoice settings" "GET" "/api/admin/invoices/settings" "200"
    test_api "Get invoices list" "GET" "/api/admin/invoices" "200"
    test_api "Cron endpoint (auth required)" "POST" "/api/cron/generate-commission-invoices" "401"
else
    echo -e "${YELLOW}⊘ API tests skipped (set ADMIN_TOKEN to enable)${NC}"
    echo "  Get token from: document.cookie in browser console"
fi

# ============================================
# Test 3: PDF Generation (if puppeteer available)
# ============================================
echo -e "\n${BLUE}[3] PDF Generation Tests${NC}"

if command -v node &> /dev/null; then
    echo -n "Testing puppeteer availability... "
    if node -e "require('puppeteer')" 2>/dev/null; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((PASSED++))
        
        echo -n "Testing chromium launch... "
        node -e "
        const puppeteer = require('puppeteer');
        puppeteer.launch({ headless: true })
            .then(browser => {
                console.log('SUCCESS');
                return browser.close();
            })
            .catch(err => {
                console.error('FAILED:', err.message);
                process.exit(1);
            });
        " 2>&1 | grep -q "SUCCESS"
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ PASSED${NC}"
            ((PASSED++))
        else
            echo -e "${RED}✗ FAILED${NC}"
            ((FAILED++))
        fi
    else
        echo -e "${RED}✗ FAILED${NC} (puppeteer not installed)"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⊘ PDF tests skipped (Node.js not available)${NC}"
fi

# ============================================
# Test 4: File System Permissions
# ============================================
echo -e "\n${BLUE}[4] File System Tests${NC}"

echo -n "Testing invoice directory... "
if [ -d "public/invoices" ]; then
    echo -e "${GREEN}✓ EXISTS${NC}"
    ((PASSED++))
    
    echo -n "Testing write permissions... "
    test_file="public/invoices/.test_write_$$"
    if touch "$test_file" 2>/dev/null; then
        rm "$test_file"
        echo -e "${GREEN}✓ PASSED${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC} (No write permission)"
        ((FAILED++))
    fi
else
    echo -e "${RED}✗ NOT FOUND${NC}"
    ((FAILED++))
    echo "  Creating directory..."
    mkdir -p public/invoices
fi

# ============================================
# Test 5: Environment Variables
# ============================================
echo -e "\n${BLUE}[5] Environment Variable Tests${NC}"

check_env() {
    local var="$1"
    echo -n "Checking $var... "
    if [ -n "${!var}" ]; then
        echo -e "${GREEN}✓ SET${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}⊘ NOT SET${NC}"
    fi
}

check_env "DATABASE_URL"
check_env "NEXTAUTH_SECRET"
check_env "SMTP_HOST"
check_env "SMTP_USER"
check_env "CRON_SECRET"
check_env "GOCARDLESS_ACCESS_TOKEN"

# ============================================
# Test 6: Service Integration (Optional)
# ============================================
echo -e "\n${BLUE}[6] Service Integration Tests${NC}"

# Test SMTP connection
if [ -n "$SMTP_HOST" ] && [ -n "$SMTP_USER" ]; then
    echo -n "Testing SMTP connection... "
    if command -v nc &> /dev/null; then
        if nc -zv "$SMTP_HOST" "${SMTP_PORT:-587}" 2>&1 | grep -q "succeeded"; then
            echo -e "${GREEN}✓ PASSED${NC}"
            ((PASSED++))
        else
            echo -e "${RED}✗ FAILED${NC}"
            ((FAILED++))
        fi
    else
        echo -e "${YELLOW}⊘ SKIPPED${NC} (nc command not available)"
    fi
else
    echo -e "${YELLOW}⊘ SMTP tests skipped (SMTP_HOST not set)${NC}"
fi

# Test database connection
echo -n "Testing database connection... "
if [ -n "$DATABASE_URL" ]; then
    if command -v psql &> /dev/null && [ -n "$PGPASSWORD" ]; then
        if psql -U postgres -d bereifung24 -c "SELECT 1" &>/dev/null; then
            echo -e "${GREEN}✓ PASSED${NC}"
            ((PASSED++))
        else
            echo -e "${RED}✗ FAILED${NC}"
            ((FAILED++))
        fi
    else
        echo -e "${YELLOW}⊘ SKIPPED${NC} (psql not available or PGPASSWORD not set)"
    fi
else
    echo -e "${YELLOW}⊘ SKIPPED${NC} (DATABASE_URL not set)"
fi

# ============================================
# Summary
# ============================================
echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Test Summary${NC}"
echo -e "${BLUE}================================================${NC}"
TOTAL=$((PASSED + FAILED))
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "Total:  $TOTAL"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Please review the output above.${NC}"
    exit 1
fi

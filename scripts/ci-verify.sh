#!/usr/bin/env bash
# ==============================================================================
# India Trikotaj Monorepo — Local CI Verification Script
# Runs the exact same pipeline steps locally as GitHub Actions CI
# ==============================================================================
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}  Starting Local CI Verification Pipeline           ${NC}"
echo -e "${BLUE}====================================================${NC}"

echo -e "\n${YELLOW}Step 1/5: Formatting check (Prettier)...${NC}"
pnpm format:check

echo -e "\n${YELLOW}Step 2/5: Building shared packages...${NC}"
pnpm build:packages

echo -e "\n${YELLOW}Step 3/5: Monorepo TypeCheck (TypeScript)...${NC}"
pnpm type-check

echo -e "\n${YELLOW}Step 4/5: Running full automated test suite (233+ tests)...${NC}"
pnpm test:all

echo -e "\n${YELLOW}Step 5/5: Verifying Web & API production builds...${NC}"
pnpm --filter @india-trikotaj/api build
pnpm --filter @india-trikotaj/web build

echo -e "\n${GREEN}====================================================${NC}"
echo -e "${GREEN}  ✓ All CI checks passed successfully! Ready to push! ${NC}"
echo -e "${GREEN}====================================================${NC}"

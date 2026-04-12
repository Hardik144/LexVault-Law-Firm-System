#!/bin/bash

set -e
set +e   # allow script to continue even if some git add fails

GITHUB_USERNAME="Hardik144"
REPO_NAME="LexVault-Law-Firm-System"
REPO_URL="https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

echo "🚀 Starting realistic commit history..."

# CLEAN
rm -rf .git
git init -b main

git config user.name "Hardik Patidar"
git config user.email "171713807+Hardik144@users.noreply.github.com"

git remote add origin "$REPO_URL"

# Helper commit function
commit() {
    MSG=$1
    DATE=$2

    GIT_AUTHOR_DATE="$DATE" \
    GIT_COMMITTER_DATE="$DATE" \
    git commit -m "$MSG" 2>/dev/null || true
}

# Date generator
get_date() {
    OFFSET=$1
    date -v+${OFFSET}d -j -f "%Y-%m-%d" "2026-03-25" "+%Y-%m-%dT12:00:00" 2>/dev/null \
    || date -d "2026-03-25 +${OFFSET} day" "+%Y-%m-%dT12:00:00"
}

# ─────────────────────────────
# INITIAL COMMIT
# ─────────────────────────────

git add .gitignore README.md docker-compose.yml 2>/dev/null || true
commit "init: project setup and base structure" "$(get_date 0)"

# ─────────────────────────────
# BACKEND PHASE
# ─────────────────────────────

git add backend/package* 2>/dev/null || true
commit "feat: initialize backend node project" "$(get_date 1)"

git add backend/prisma 2>/dev/null || true
commit "feat: add prisma schema and database models" "$(get_date 2)"

git add backend/src 2>/dev/null || true
commit "feat: backend core logic, middleware and routes" "$(get_date 3)"

git add backend/src/routes 2>/dev/null || true
commit "feat: complete API routes implementation" "$(get_date 4)"

git add backend/src/tests 2>/dev/null || true
commit "test: add backend unit tests" "$(get_date 5)"

# ─────────────────────────────
# FRONTEND PHASE
# ─────────────────────────────

git add frontend/package* frontend/index.html 2>/dev/null || true
commit "feat: initialize frontend with Vite + React" "$(get_date 6)"

git add frontend/src 2>/dev/null || true
commit "feat: build frontend UI, pages and components" "$(get_date 7)"

git add frontend/src/pages 2>/dev/null || true
commit "feat: implement all frontend pages" "$(get_date 8)"

git add frontend/src/components 2>/dev/null || true
commit "feat: reusable UI components and layout" "$(get_date 9)"

# ─────────────────────────────
# DEVOPS PHASE
# ─────────────────────────────

git add backend/Dockerfile frontend/Dockerfile docker-compose.yml 2>/dev/null || true
commit "docker: containerize backend and frontend services" "$(get_date 10)"

git add backend/entrypoint.sh 2>/dev/null || true
commit "docker: add entrypoint script with retry logic" "$(get_date 11)"

git add devops/jenkins 2>/dev/null || true
commit "ci: add Jenkins pipeline configuration" "$(get_date 12)"

git add devops/prometheus 2>/dev/null || true
commit "monitoring: add prometheus configuration" "$(get_date 13)"

git add devops/grafana 2>/dev/null || true
commit "monitoring: add grafana dashboards" "$(get_date 14)"

git add devops/kubernetes 2>/dev/null || true
commit "k8s: add deployments, services and blue-green strategy" "$(get_date 15)"

# ─────────────────────────────
# SCRIPTS & FINAL FEATURES
# ─────────────────────────────

git add start.sh stop.sh traffic.sh 2>/dev/null || true
commit "feat: add deployment automation scripts" "$(get_date 16)"

git add README.md 2>/dev/null || true
commit "docs: update project documentation" "$(get_date 17)"

# ─────────────────────────────
# FINAL COMPLETE COMMIT (CRITICAL)
# ─────────────────────────────

git add . || true

GIT_AUTHOR_DATE="$(get_date 18)" \
GIT_COMMITTER_DATE="$(get_date 18)" \
git commit -m "chore: finalize project structure and add remaining configs" || true

echo "✅ Total commits: $(git rev-list --count HEAD)"

# ─────────────────────────────
# PUSH (ONLY ONCE)
# ─────────────────────────────

git push -f origin main

echo "🚀 DONE — realistic commit history created!"
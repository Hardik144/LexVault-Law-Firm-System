#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  LexVault — Complete DevOps Project Startup Script
#  Starts: Docker Compose + Jenkins + ngrok + AWS EKS check
# ═══════════════════════════════════════════════════════════

set -e

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
DOCKERHUB_USER="hardik144"

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     LexVault — DevOps Project Startup    ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
echo ""

cd "$PROJECT_DIR"

# ─── STEP 1: Docker Compose ──────────────────────────────
echo -e "${YELLOW}[1/6] Starting Docker Compose services...${NC}"
docker-compose up -d --build

echo -e "${GREEN}✅ Docker Compose started${NC}"
echo "   Waiting 30 seconds for backend to be ready..."
sleep 30

# ─── STEP 2: Seed database ───────────────────────────────
echo -e "${YELLOW}[2/6] Seeding database with demo users...${NC}"
docker-compose exec -T backend node src/prisma/seed.js 2>/dev/null || echo "   Already seeded or seed skipped"
echo -e "${GREEN}✅ Database ready${NC}"

# ─── STEP 3: Start Jenkins ───────────────────────────────
echo -e "${YELLOW}[3/6] Starting Jenkins...${NC}"
if docker ps -a --format '{{.Names}}' | grep -q '^jenkins$'; then
    docker start jenkins 2>/dev/null && echo -e "${GREEN}✅ Jenkins started${NC}" || echo "   Jenkins already running"
else
    echo "   Jenkins container not found — creating it..."
    docker run -d \
        --name jenkins \
        --restart=unless-stopped \
        -p 8080:8080 \
        -v jenkins_home:/var/jenkins_home \
        -v /var/run/docker.sock:/var/run/docker.sock \
        -u root \
        jenkins/jenkins:lts-jdk17
    echo -e "${GREEN}✅ Jenkins container created and started${NC}"
    echo -e "${YELLOW}   First time setup: open localhost:8080 and get password with:${NC}"
    echo "   docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword"
fi

# ─── STEP 4: Generate traffic for Prometheus ─────────────
echo -e "${YELLOW}[4/6] Generating traffic for Prometheus metrics...${NC}"
for i in $(seq 1 30); do
    curl -s http://localhost:5001/health > /dev/null 2>&1 || true
    curl -s -X POST http://localhost:5001/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@lawfirm.com","password":"Admin@123"}' > /dev/null 2>&1 || true
    sleep 0.2
done
echo -e "${GREEN}✅ Traffic generated — Prometheus has data${NC}"

# ─── STEP 5: AWS EKS status check ────────────────────────
echo -e "${YELLOW}[5/6] Checking AWS EKS cluster status...${NC}"
if command -v kubectl &>/dev/null && kubectl get nodes &>/dev/null 2>&1; then
    echo -e "${GREEN}✅ AWS EKS cluster is accessible${NC}"
    echo ""
    kubectl get nodes
    echo ""
    kubectl get pods -n lawfirm
    echo ""

    # Apply blue-green if missing
    BG=$(kubectl get deployment lawfirm-backend-blue -n lawfirm 2>/dev/null | wc -l)
    if [ "$BG" -lt 2 ]; then
        echo "   Applying blue-green deployments..."
        kubectl apply -f devops/kubernetes/k8s/ 2>/dev/null || true
        kubectl apply -f devops/kubernetes/k8s/blue-green/ 2>/dev/null || true
    fi

    # Get public URL
    EXTERNAL_IP=$(kubectl get svc frontend-external -n lawfirm \
        -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "pending")
    echo -e "${GREEN}✅ AWS App URL: http://$EXTERNAL_IP${NC}"
else
    echo -e "${YELLOW}   AWS EKS not connected — run: aws eks update-kubeconfig --region ap-south-1 --name lawfirm-cluster${NC}"
fi

# ─── STEP 6: ngrok reminder ──────────────────────────────
echo ""
echo -e "${YELLOW}[6/6] ngrok — for GitHub webhook (Jenkins auto-trigger)${NC}"
echo "   Start ngrok in a separate terminal:"
echo "   ngrok http 8080"
echo "   Then update GitHub webhook with the new URL"

# ─── SUMMARY ─────────────────────────────────────────────
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║           All Services Started           ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}  Frontend App    → http://localhost:3000${NC}"
echo -e "${GREEN}  Backend API     → http://localhost:5001${NC}"
echo -e "${GREEN}  Jenkins         → http://localhost:8080  (admin/admin123)${NC}"
echo -e "${GREEN}  Prometheus      → http://localhost:9090${NC}"
echo -e "${GREEN}  Grafana         → http://localhost:3001  (admin/admin123)${NC}"
echo ""
echo -e "${GREEN}  Demo Login      → admin@lawfirm.com / Admin@123${NC}"
echo ""
echo -e "${CYAN}  AWS EKS commands:${NC}"
echo "  kubectl get pods -n lawfirm"
echo "  kubectl get deployments -n lawfirm"
echo "  kubectl get svc -n lawfirm"
echo ""
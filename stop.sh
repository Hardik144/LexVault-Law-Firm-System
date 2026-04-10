#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  LexVault — Complete DevOps Project Shutdown Script
#  Stops: Docker Compose + Jenkins + ngrok + optional AWS
# ═══════════════════════════════════════════════════════════

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     LexVault — DevOps Project Shutdown   ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
echo ""

# Ask what to stop
echo -e "${YELLOW}What do you want to stop?${NC}"
echo "  1) Local only  (Docker Compose + Jenkins)  — keeps AWS running"
echo "  2) Everything  (Local + delete AWS namespace)"
echo "  3) Full AWS    (delete EKS cluster entirely — costs stop)"
echo ""
read -p "Enter choice (1/2/3): " CHOICE

cd "$PROJECT_DIR"

# ─── STOP LOCAL ──────────────────────────────────────────
echo ""
echo -e "${YELLOW}[1/4] Stopping Docker Compose services...${NC}"
docker-compose down 2>/dev/null && echo -e "${GREEN}✅ Docker Compose stopped${NC}" || echo "   Already stopped"

echo -e "${YELLOW}[2/4] Stopping Jenkins...${NC}"
docker stop jenkins 2>/dev/null && echo -e "${GREEN}✅ Jenkins stopped${NC}" || echo "   Jenkins not running"

echo -e "${YELLOW}[3/4] Killing ngrok...${NC}"
pkill -f "ngrok http" 2>/dev/null && echo -e "${GREEN}✅ ngrok stopped${NC}" || echo "   ngrok not running"

# ─── OPTION 2: Stop AWS namespace ────────────────────────
if [ "$CHOICE" = "2" ]; then
    echo -e "${YELLOW}[4/4] Deleting Kubernetes namespace lawfirm on AWS...${NC}"
    if command -v kubectl &>/dev/null; then
        kubectl delete namespace lawfirm --grace-period=0 2>/dev/null && \
            echo -e "${GREEN}✅ AWS namespace lawfirm deleted — pods stopped${NC}" || \
            echo "   Namespace already deleted or not accessible"
    else
        echo -e "${RED}   kubectl not found — skipping AWS cleanup${NC}"
    fi

# ─── OPTION 3: Delete entire EKS cluster ─────────────────
elif [ "$CHOICE" = "3" ]; then
    echo -e "${RED}[4/4] WARNING: Deleting entire EKS cluster — this stops all AWS costs${NC}"
    read -p "Are you sure? Type YES to confirm: " CONFIRM
    if [ "$CONFIRM" = "YES" ]; then
        echo "   Deleting EKS cluster lawfirm-cluster in ap-south-1..."
        eksctl delete cluster \
            --name lawfirm-cluster \
            --region ap-south-1 \
            --wait
        echo -e "${GREEN}✅ EKS cluster deleted — AWS costs stopped${NC}"
    else
        echo "   Cluster deletion cancelled"
    fi

# ─── OPTION 1: Local only ────────────────────────────────
else
    echo -e "${GREEN}[4/4] AWS EKS kept running — only local services stopped${NC}"
    echo "   To stop AWS later run: kubectl delete namespace lawfirm"
fi

# ─── CLEAN DOCKER ────────────────────────────────────────
echo ""
echo -e "${YELLOW}Clean up unused Docker resources? (y/n)${NC}"
read -p "" CLEAN
if [ "$CLEAN" = "y" ] || [ "$CLEAN" = "Y" ]; then
    docker container prune -f 2>/dev/null
    docker network prune -f 2>/dev/null
    echo -e "${GREEN}✅ Docker cleaned${NC}"
fi

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║         Shutdown Complete                ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo "  To start again: ./start.sh"
echo ""
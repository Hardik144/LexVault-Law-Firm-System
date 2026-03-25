<div align="center">

# ⚖️ LexVault
### Law Firm Case File & Access Management System

**A production-grade full-stack web application with a complete DevOps pipeline**

![GitHub last commit](https://img.shields.io/github/last-commit/Hardik144/LexVault-Law-Firm-System)
![Docker](https://img.shields.io/badge/Docker-✓-blue)
![Kubernetes](https://img.shields.io/badge/Kubernetes-AWS%20EKS-orange)
![Jenkins](https://img.shields.io/badge/CI%2FCD-Jenkins-red)
![Prometheus](https://img.shields.io/badge/Monitoring-Prometheus%20%2B%20Grafana-orange)
![React](https://img.shields.io/badge/Frontend-React%2018-61DAFB)
![Node.js](https://img.shields.io/badge/Backend-Node.js%2020-green)

</div>

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [DevOps Pipeline](#-devops-pipeline)
- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [System Architecture](#-system-architecture)
- [Quick Start (Docker Compose)](#-quick-start-docker-compose)
- [Jenkins CI/CD Setup](#-jenkins-cicd-setup)
- [Kubernetes on AWS EKS](#-kubernetes-on-aws-eks)
- [Blue-Green Deployment](#-blue-green-deployment)
- [Monitoring — Prometheus & Grafana](#-monitoring--prometheus--grafana)
- [Testing](#-testing)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [Demo Credentials](#-demo-credentials)
- [Start & Stop Scripts](#-start--stop-scripts)

---

## 🎯 Project Overview

LexVault is a **production-grade Law Firm Case File and Access Management System** built as a DevOps mini project for the course **21IPE333P – Essentials in Cloud and DevOps** at **SRM Institute of Science and Technology**.

The project demonstrates a **complete end-to-end DevOps pipeline** integrating 9 tools:

```
GitHub → Jenkins → Docker → Docker Hub → Kubernetes (AWS EKS) → Prometheus → Grafana
```

The application enables law firms to manage **cases**, **users**, **legal documents**, and **compliance audit trails** with strict Role-Based Access Control (RBAC).

---

## 🚀 DevOps Pipeline

Every git push to the `main` branch triggers the full pipeline automatically:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    COMPLETE CI/CD PIPELINE                           │
│                                                                      │
│  git push                                                            │
│     │                                                                │
│     ▼  (webhook via ngrok)                                           │
│  Jenkins                                                             │
│     │                                                                │
│     ├── Stage 1: Checkout Code          (git clone)                 │
│     ├── Stage 2: Install Dependencies   (npm install — parallel)    │
│     ├── Stage 3: Run Tests             (Jest — 8 test cases)        │
│     ├── Stage 4: Security Audit        (npm audit — parallel)       │
│     ├── Stage 5: Build Docker Images   (linux/amd64 — buildx)       │
│     ├── Stage 6: Push to Docker Hub    (hardik144/lawfirm-*)        │
│     ├── Stage 7: Deploy to AWS EKS     (kubectl apply)              │
│     ├── Stage 8: Blue-Green Switch     (traffic switching)          │
│     └── Stage 9: Health Check         (kubectl get pods)            │
│                                                                      │
│  Total pipeline time: ~3-5 minutes                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, Tailwind CSS, Axios, React Router v6 |
| **Backend** | Node.js 20, Express.js, JWT Auth, Multer, prom-client, Winston |
| **Database** | PostgreSQL 16, Prisma ORM v5 |
| **Security** | bcryptjs (12 rounds), Helmet.js, CORS, Rate Limiting, RBAC |
| **Testing** | Jest + Supertest (3 files, 8 test cases) |
| **Version Control** | Git + GitHub |
| **CI/CD** | Jenkins LTS (lts-jdk17) in Docker |
| **Containerisation** | Docker, Docker Compose (5 services) |
| **Image Registry** | Docker Hub |
| **Orchestration** | Kubernetes — AWS EKS (production), Minikube (local) |
| **Cloud** | AWS EKS, ap-south-1 (Mumbai), 3× EC2 t3.small, EBS gp2 |
| **Deployment Strategy** | Blue-Green deployment, zero downtime |
| **Monitoring** | Prometheus v2.48, Grafana v10.2 |
| **Webhook Tunnel** | ngrok |

---

## ✨ Features

### Application Features
- 🔐 **JWT Authentication** with bcrypt password hashing (12 rounds)
- 👥 **Role-Based Access Control** — Admin, Judge, Lawyer, Clerk
- 📁 **Case Management** — Create, assign, filter, search cases with status tracking
- 📄 **Document Management** — Upload, download, version control per case
- ✅ **Case Tasks** — Todo / In Progress / Done kanban
- 💬 **Case Discussion** — Comment threads per case
- 📊 **Dashboard** — Live stats with recent cases and activity
- 📈 **Reports** — Cases by status and judge analytics
- 🔍 **Audit Logs** — Every document action logged with IP and timestamp

### DevOps Features
- 🔄 **Automated CI/CD** — Push to trigger full pipeline
- 🐳 **Docker Containers** — 5 services with health checks
- ☸️ **Kubernetes on AWS** — 3 EC2 nodes, HPA auto-scaling
- 🔵🟢 **Blue-Green Deployment** — Zero downtime, instant rollback
- 📊 **Real-time Monitoring** — Prometheus + Grafana dashboards
- 🧪 **Automated Testing** — Jest unit tests in pipeline
- 🔒 **Security Scanning** — npm audit in pipeline

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AWS Cloud (ap-south-1)                    │
│                                                              │
│  EKS Control Plane (managed by AWS)                         │
│                                                              │
│  ┌──────────────────┐    ┌──────────────────┐               │
│  │  EC2 t3.small    │    │  EC2 t3.small    │               │
│  │  Node 1          │    │  Node 2          │               │
│  │                  │    │                  │               │
│  │  [postgres]      │    │  [backend-blue]  │               │
│  │  [frontend]      │    │  [backend-green] │               │
│  └──────────────────┘    └──────────────────┘               │
│                                                              │
│  EBS gp2 Volumes   AWS Network Load Balancer                │
│  (postgres 5Gi)    (public URL → frontend pods)             │
│  (uploads 10Gi)                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚡ Quick Start (Docker Compose)

### Prerequisites
- Docker Desktop ≥ 4.x
- Mac, Linux, or Windows with WSL2

### 1. Clone the repository
```bash
git clone https://github.com/Hardik144/LexVault-Law-Firm-System.git
cd LexVault-Law-Firm-System
```

### 2. Start everything with one command
```bash
./start.sh
```

Or manually:
```bash
docker-compose up --build
```

### 3. Seed the database
```bash
docker-compose exec backend node src/prisma/seed.js
```

### 4. Open in browser
| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | admin@lawfirm.com / Admin@123 |
| Backend API | http://localhost:5001 | — |
| Prometheus | http://localhost:9090 | — |
| Grafana | http://localhost:3001 | admin / admin123 |
| Jenkins | http://localhost:8080 | admin / admin123 |

> **Note:** Port 5001 is used instead of 5000 because macOS AirPlay Receiver reserves port 5000.

---

## 🔧 Jenkins CI/CD Setup

### Start Jenkins
```bash
docker run -d --name jenkins -p 8080:8080 \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -u root jenkins/jenkins:lts-jdk17
```

### Install tools inside Jenkins
```bash
# Node.js 20
docker exec -u root jenkins bash -c \
  "curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs"

# Docker CLI
docker exec -u root jenkins bash -c "apt-get install -y docker.io"

# kubectl
docker exec -u root jenkins bash -c \
  "curl -LO https://dl.k8s.io/release/v1.29.0/bin/linux/amd64/kubectl && \
   chmod +x kubectl && mv kubectl /usr/local/bin/kubectl"

# AWS CLI
docker exec -u root jenkins bash -c "apt-get install -y awscli"
```

### Jenkins Credentials Required
| ID | Kind | Value |
|----|------|-------|
| `dockerhub-credentials` | Username with password | Docker Hub login |
| `kubeconfig` | Secret file | EKS kubeconfig file |
| `aws-access-key` | Secret text | AWS Access Key ID |
| `aws-secret-key` | Secret text | AWS Secret Access Key |

### Pipeline Job Setup
1. New Item → **LexVault-Pipeline** → Pipeline
2. Build Triggers → ✅ **GitHub hook trigger for GITScm polling**
3. Pipeline → SCM: Git → this repo URL → Branch: `main`
4. Script Path: `Jenkinsfile`

### GitHub Webhook (Auto-trigger)
```bash
# Install ngrok
brew install ngrok
ngrok http 8080
# Copy https://xxxx.ngrok-free.app URL

# GitHub repo → Settings → Webhooks → Add webhook
# Payload URL: https://xxxx.ngrok-free.app/github-webhook/
# Content type: application/json
# Events: Just the push event
```

---

## ☸️ Kubernetes on AWS EKS

### Create EKS Cluster
```bash
eksctl create cluster \
  --name lawfirm-cluster \
  --region ap-south-1 \
  --nodegroup-name lawfirm-nodes \
  --node-type t3.small \
  --nodes 2 --nodes-min 1 --nodes-max 3 \
  --managed
```

### Connect kubectl
```bash
aws eks update-kubeconfig --region ap-south-1 --name lawfirm-cluster
```

### Install EBS CSI Driver
```bash
eksctl utils associate-iam-oidc-provider \
  --cluster lawfirm-cluster --region ap-south-1 --approve

eksctl create iamserviceaccount \
  --name ebs-csi-controller-sa --namespace kube-system \
  --cluster lawfirm-cluster --region ap-south-1 \
  --attach-policy-arn arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy \
  --approve --override-existing-serviceaccounts

aws eks create-addon \
  --cluster-name lawfirm-cluster \
  --addon-name aws-ebs-csi-driver \
  --region ap-south-1 \
  --resolve-conflicts OVERWRITE
```

### Deploy Application
```bash
# Create namespace and secrets
kubectl create namespace lawfirm

kubectl create secret generic backend-secret \
  --from-literal=DATABASE_URL="postgresql://lawfirm:lawfirm123@postgres:5432/lawfirmdb" \
  --from-literal=JWT_SECRET="your-secret-key" -n lawfirm

kubectl create secret generic postgres-secret \
  --from-literal=POSTGRES_DB=lawfirmdb \
  --from-literal=POSTGRES_USER=lawfirm \
  --from-literal=POSTGRES_PASSWORD=lawfirm123 -n lawfirm

# Apply manifests
kubectl apply -f devops/kubernetes/k8s/
kubectl apply -f devops/kubernetes/k8s/blue-green/

# Verify
kubectl get pods -n lawfirm
kubectl get svc -n lawfirm    # Get public Load Balancer URL
```

### Key kubectl Commands
```bash
kubectl get nodes                          # EC2 nodes on AWS
kubectl get pods -n lawfirm               # All pods
kubectl get deployments -n lawfirm        # Deployments
kubectl get svc -n lawfirm                # Services + Load Balancer URL
kubectl get hpa -n lawfirm                # Auto-scaler status
kubectl get pvc -n lawfirm                # EBS persistent volumes
kubectl get all -n lawfirm                # Everything at once
kubectl logs -l app=lawfirm-backend -n lawfirm --tail=20
```

---

## 🔵🟢 Blue-Green Deployment

Two identical backend deployments run simultaneously:

```
Users → backend-live Service → version: blue (current live)
                             ↕ switch with one command
                             → version: green (new version)
```

### Switch Traffic to Green
```bash
kubectl patch svc backend-live -n lawfirm \
  -p '{"spec":{"selector":{"version":"green"}}}'
```

### Rollback to Blue (instant)
```bash
kubectl patch svc backend-live -n lawfirm \
  -p '{"spec":{"selector":{"version":"blue"}}}'
```

### Check Which Version is Live
```bash
kubectl get svc backend-live -n lawfirm \
  -o jsonpath='Live: {.spec.selector.version}'
```

### Demonstrate Red State
```bash
# Deploy broken image → pods show ImagePullBackOff (RED)
kubectl set image deployment/lawfirm-backend-green \
  backend=hardik144/lawfirm-backend:broken-999 -n lawfirm

# Instantly switch traffic away from broken version
kubectl patch svc backend-live -n lawfirm \
  -p '{"spec":{"selector":{"version":"blue"}}}'

# Fix the broken deployment
kubectl set image deployment/lawfirm-backend-green \
  backend=hardik144/lawfirm-backend:latest -n lawfirm
```

---

## 📊 Monitoring — Prometheus & Grafana

### Prometheus
- URL: http://localhost:9090
- Scrapes `/metrics` from backend every **10 seconds**
- Targets page: http://localhost:9090/targets (shows GREEN when backend is UP)

### Useful Prometheus Queries
```promql
# Request rate
rate(lawfirm_http_requests_total[1m])

# Memory usage
lawfirm_nodejs_heap_size_used_bytes

# Error rate (5xx)
rate(lawfirm_http_requests_total{status_code=~"5.."}[1m])

# p95 response time
histogram_quantile(0.95, rate(lawfirm_http_request_duration_seconds_bucket[5m]))
```

### Grafana
- URL: http://localhost:3001
- Login: `admin` / `admin123`
- Dashboard: **LexVault Backend** (auto-provisioned)
- Panels: HTTP Request Rate, p95 Response Time, Heap Memory, Event Loop Lag

### Generate Traffic (for graphs)
```bash
./traffic.sh
# Or manually:
for i in $(seq 1 50); do
  curl -s http://localhost:5001/health > /dev/null
  sleep 0.3
done
```

---

## 🧪 Testing

### Automated Tests (Jest + Supertest)
```bash
cd backend
npm test

# Output:
# PASS src/tests/health.test.js
# PASS src/tests/auth.test.js
# PASS src/tests/cases.test.js
# Tests: 8 passed, 8 total
```

### API Testing with curl
```bash
# Health check
curl http://localhost:5001/health

# Login and get JWT token
TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lawfirm.com","password":"Admin@123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# Get cases
curl http://localhost:5001/api/cases -H "Authorization: Bearer $TOKEN"

# Test RBAC — Clerk cannot access audit logs
CLERK_TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"clerk@lawfirm.com","password":"Clerk@123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

curl http://localhost:5001/api/audit/logs -H "Authorization: Bearer $CLERK_TOKEN"
# Returns: {"error":"Access denied. Insufficient permissions."}
```

---

## 📁 Project Structure

```
LexVault-Law-Firm-System/
├── frontend/
│   ├── src/
│   │   ├── components/     # Layout.jsx, ui.jsx
│   │   ├── context/        # AuthContext.jsx
│   │   ├── pages/          # 8 pages: Dashboard, Cases, Documents, etc.
│   │   └── utils/          # api.js (Axios + JWT interceptor)
│   ├── Dockerfile          # Multi-stage: node builder + nginx:alpine
│   └── nginx.conf          # Reverse proxy /api to backend:5000
├── backend/
│   ├── src/
│   │   ├── middleware/     # auth.js, upload.js, auditLog.js, errorHandler.js
│   │   ├── prisma/         # client.js, seed.js
│   │   ├── routes/         # 9 modules: auth, users, cases, documents, etc.
│   │   ├── tests/          # health.test.js, auth.test.js, cases.test.js
│   │   └── index.js        # Express entry point
│   ├── prisma/
│   │   └── schema.prisma   # 7 models: User, Case, Document, etc.
│   ├── Dockerfile          # node:20-slim (Debian — needs OpenSSL for Prisma)
│   └── entrypoint.sh       # DB retry loop + prisma db push + start
├── devops/
│   ├── kubernetes/
│   │   ├── k8s/            # postgres.yaml, backend-deployment.yaml,
│   │   │                   # frontend-deployment.yaml, services.yaml
│   │   └── blue-green/     # backend-blue.yaml, backend-green.yaml, service.yaml
│   ├── prometheus/
│   │   └── prometheus.yml  # Scrapes backend:5000/metrics every 10s
│   └── grafana/
│       ├── provisioning/   # Auto-configure Prometheus datasource
│       └── dashboards/     # backend.json pre-built dashboard
├── Jenkinsfile             # 9-stage CI/CD pipeline definition
├── docker-compose.yml      # 5 services: postgres, backend, frontend, prometheus, grafana
├── start.sh                # One-command startup script
├── stop.sh                 # One-command shutdown script
└── README.md
```

---

## 📡 API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | None | Login, returns JWT token |
| GET | `/api/auth/me` | JWT | Current user info |
| GET | `/api/users` | Admin | List all users |
| POST | `/api/users` | Admin | Create user |
| GET | `/api/cases` | JWT | List cases (RBAC filtered) |
| POST | `/api/cases` | Admin/Clerk | Create case |
| GET | `/api/cases/:id` | JWT | Case detail with docs |
| POST | `/api/documents/upload` | JWT | Upload file (Multer) |
| GET | `/api/documents/download/:id` | JWT | Download + audit log |
| GET | `/api/audit/logs` | Admin | Paginated audit logs |
| GET | `/api/dashboard/summary` | JWT | Stats for dashboard |
| GET | `/api/reports/cases-by-status` | Admin/Judge | Reports |
| GET | `/health` | None | Health check for K8s |
| GET | `/metrics` | None | Prometheus scrape endpoint |

---

## 🔑 Demo Credentials

| Role | Email | Password | Access |
|------|-------|----------|--------|
| **Admin** | admin@lawfirm.com | Admin@123 | Full access |
| **Judge** | judge@lawfirm.com | Judge@123 | Cases + Reports |
| **Lawyer** | lawyer@lawfirm.com | Lawyer@123 | Assigned cases |
| **Clerk** | clerk@lawfirm.com | Clerk@123 | Create cases |

---

## 🚀 Start & Stop Scripts

### Start Everything
```bash
./start.sh
```
Starts Docker Compose, seeds database, starts Jenkins, generates Prometheus traffic, checks AWS EKS.

### Stop Everything
```bash
./stop.sh
```
Options:
- **1** — Stop local only (Docker + Jenkins). AWS keeps running.
- **2** — Stop local + delete AWS namespace (pods stop).
- **3** — Delete entire EKS cluster (all AWS costs stop).

---

## 🏫 Academic Information

| Field | Details |
|-------|---------|
| **Institution** | SRM Institute of Science and Technology, Kattankulathur |
| **Department** | Department of Networking and Communications |
| **Course** | 21IPE333P – Essentials in Cloud and DevOps |
| **Guide** | Dr. R. Radhika |
| **Team** | Hardik Patidar, Jaibrat Yadav, Vedant Agrawal |

---

## 📄 License

This project was created for academic purposes at SRM Institute of Science and Technology.

---

<div align="center">

**Built with ❤️ using DevOps best practices**

`Docker` • `Jenkins` • `Kubernetes` • `AWS EKS` • `Prometheus` • `Grafana`

</div>

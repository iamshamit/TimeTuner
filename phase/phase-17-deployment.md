# 📋 PHASE 17: Deployment & DevOps

> **Duration:** 3-4 days  
> **Dependencies:** Phase 16

---

## 🎯 Phase Objectives

Containerize all services and deploy to production with CI/CD.

---

## 📑 Task Breakdown

---

### 17.1-17.4 Dockerfiles & Compose

**Backend Dockerfile:**
```dockerfile
# backend/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "src/app.js"]
```

**Solver Dockerfile:**
```dockerfile
# solver/Dockerfile
FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends gcc && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Frontend Dockerfile:**
```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

**Docker Compose:**
```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./backend
    ports: ["5000:5000"]
    environment:
      - MONGODB_URI=${MONGODB_URI}
      - JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}
      - SOLVER_URL=http://solver:8000
      - REDIS_URL=redis://redis:6379
    depends_on: [redis, solver]
  
  solver:
    build: ./solver
    ports: ["8000:8000"]
    environment:
      - ENV=production
  
  frontend:
    build: ./frontend
    ports: ["80:80"]
    depends_on: [backend]
  
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    volumes: [redis-data:/data]

volumes:
  redis-data:
```

---

### 17.5-17.7 CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push: { branches: [main, develop] }
  pull_request: { branches: [main] }

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd backend && npm ci && npm test

  test-solver:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.11' }
      - run: cd solver && pip install -r requirements.txt && pytest

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd frontend && npm ci && npm run test

  build-and-push:
    needs: [test-backend, test-solver, test-frontend]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - run: |
          docker build -t ghcr.io/${{ github.repository }}/backend:latest ./backend
          docker build -t ghcr.io/${{ github.repository }}/solver:latest ./solver
          docker build -t ghcr.io/${{ github.repository }}/frontend:latest ./frontend
          docker push --all-tags ghcr.io/${{ github.repository }}

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Render/Railway
        run: curl -X POST ${{ secrets.DEPLOY_WEBHOOK_URL }}
```

---

### 17.8-17.14 Production Setup

**Render/Railway Deployment:**
1. Create services for backend, solver, frontend
2. Connect to GitHub repository
3. Set environment variables
4. Configure custom domains

**MongoDB Atlas Production:**
- Use M10+ cluster for production
- Enable backups
- Configure IP whitelist

**Redis (Upstash):**
- Create free tier Redis instance
- Copy connection URL

**Monitoring (Sentry):**
```javascript
// backend - install: npm install @sentry/node
const Sentry = require('@sentry/node');
Sentry.init({ dsn: process.env.SENTRY_DSN });
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

---

## ✅ Phase 17 Completion Checklist

```
□ Backend Dockerfile working
□ Solver Dockerfile working
□ Frontend Dockerfile working
□ Docker Compose tested locally
□ GitHub Actions CI pipeline
□ Automated tests in CI
□ Container registry push
□ Production deployment
□ MongoDB Atlas production
□ Redis cloud configured
□ SSL/Domain configured
□ Monitoring (Sentry) setup
□ Backup automation
```

---

## ⏭️ Next: Phase 18 - Documentation

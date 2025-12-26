# 📋 PHASE 0: Pre-Development Foundation

> **Duration:** 1-2 days  
> **Dependencies:** None  
> **Priority:** Critical - Must complete before any development

---

## 🎯 Phase Objectives

Complete all prerequisite setup including development environment, tools, accounts, and project planning.

---

## 📑 Task Breakdown

---

### 0.1 Development Environment Setup

**Goal:** Install and configure all development tools.

**Step-by-Step Instructions:**

1. **Install Node.js (v20 LTS):**
   - Download from https://nodejs.org/
   - Verify installation:
   ```bash
   node --version  # Should show v20.x.x
   npm --version   # Should show 10.x.x
   ```

2. **Install Python (v3.11+):**
   - Download from https://python.org/
   - **Important:** Check "Add Python to PATH" during installation
   - Verify installation:
   ```bash
   python --version  # Should show 3.11.x
   pip --version
   ```

3. **Install Git:**
   - Download from https://git-scm.com/
   - Configure identity:
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

4. **Install VS Code (Recommended):**
   - Download from https://code.visualstudio.com/
   - Install extensions:
     - ESLint
     - Prettier
     - Python
     - MongoDB for VS Code
     - Thunder Client (API testing)

5. **Install Docker Desktop:**
   - Download from https://docker.com/products/docker-desktop
   - Verify installation:
   ```bash
   docker --version
   docker-compose --version
   ```

---

### 0.2 Account Creation

**Goal:** Set up all required cloud service accounts.

1. **MongoDB Atlas:**
   - Go to https://cloud.mongodb.com/
   - Create free account
   - Create an organization and project
   - Note: Cluster creation is in Phase 2

2. **GitHub:**
   - Create account at https://github.com/ (if not existing)
   - Create new repository: `TimeTuner` or `smart-timetable-scheduler`
   - Set repository to private (recommended for development)

3. **Upstash (Redis):**
   - Go to https://upstash.com/
   - Create free account
   - Create a Redis database (free tier)
   - Save the connection URL

4. **Render or Railway (Optional for deployment):**
   - Render: https://render.com/
   - Railway: https://railway.app/
   - Create free account for future deployment

---

### 0.3 OR-Tools Verification

**Goal:** Ensure OR-Tools can be installed and runs correctly.

```bash
# Create a test environment
python -m venv ortools-test
# Activate (Windows)
ortools-test\Scripts\activate
# Activate (macOS/Linux)
source ortools-test/bin/activate

# Install OR-Tools
pip install ortools

# Test the installation
python -c "from ortools.sat.python import cp_model; print('OR-Tools OK!')"

# Clean up
deactivate
```

If this fails, check:
- Python version is 3.8+
- pip is up to date: `pip install --upgrade pip`
- Try: `pip install --upgrade ortools`

---

### 0.4 Git Repository Setup

**Goal:** Initialize the project repository.

```bash
# Create project directory
mkdir TimeTuner
cd TimeTuner

# Initialize Git
git init

# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
venv/
__pycache__/
*.pyc

# Environment
.env
.env.local
.env.*.local

# Build outputs
dist/
build/
*.egg-info/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Testing
coverage/
.pytest_cache/

# Docker
*.pid
EOF

# Initial commit
git add .
git commit -m "Initial commit: project setup"

# Connect to GitHub
git remote add origin https://github.com/YOUR_USERNAME/TimeTuner.git
git push -u origin main
```

---

### 0.5 Project Structure Creation

**Goal:** Create the monorepo folder structure.

```bash
# Create directories
mkdir -p backend/src/{routes,controllers,models,services,middleware,utils,config}
mkdir -p solver/app/{api,core,models,solver/constraints,solver/builders,utils}
mkdir -p solver/tests
mkdir -p frontend/src/{components,pages,hooks,services,store,lib}
mkdir -p docs
mkdir -p docker

# Create placeholder files
touch backend/package.json
touch solver/requirements.txt
touch frontend/package.json
touch docker/docker-compose.yml
touch README.md

# Verify structure
tree -L 3  # or use: dir /s /b on Windows
```

**Expected Structure:**
```
TimeTuner/
├── backend/
│   └── src/
│       ├── routes/
│       ├── controllers/
│       ├── models/
│       ├── services/
│       ├── middleware/
│       ├── utils/
│       └── config/
├── solver/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── solver/
│   │   └── utils/
│   └── tests/
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       ├── services/
│       ├── store/
│       └── lib/
├── docs/
├── docker/
└── README.md
```

---

### 0.6 Technology Stack Review

**Goal:** Understand the chosen technologies.

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Backend** | Node.js + Express | REST API, business logic |
| **Database** | MongoDB Atlas | Document storage |
| **Solver** | Python + FastAPI | Timetable optimization |
| **Optimizer** | Google OR-Tools | Constraint programming |
| **Queue** | Redis + BullMQ | Async job processing |
| **Frontend** | React + Vite | User interface |
| **Styling** | Tailwind CSS | UI styling |
| **State** | Zustand + React Query | State management |

---

### 0.7 Constraint Research

**Goal:** Understand timetabling constraints.

**Hard Constraints (Must Never Violate):**
1. No batch can have two classes at the same time
2. No room can host two classes at the same time
3. No faculty can teach two classes at the same time
4. Faculty can only teach subjects they're qualified for
5. Room capacity must accommodate batch size
6. Labs must be in lab rooms

**Soft Constraints (Optimize When Possible):**
1. Balance faculty teaching load across days
2. Minimize consecutive classes for faculty
3. Limit daily classes per batch (comfort)
4. Distribute subject classes evenly across week
5. Minimize idle gaps for faculty
6. Prefer faculty preferred time slots

---

### 0.8 Documentation Plan

**Goal:** Establish documentation standards.

**Files to maintain:**
- `README.md` - Project overview
- `PLAN.md` - Development plan
- `Phases.md` - Phase breakdown
- `docs/api.md` - API documentation
- `docs/database.md` - Schema documentation
- Swagger at `/api-docs` - Interactive API docs

---

## ✅ Phase 0 Completion Checklist

```
□ Node.js v20 installed
□ Python v3.11+ installed
□ Git installed and configured
□ VS Code with extensions installed
□ Docker Desktop installed
□ MongoDB Atlas account created
□ GitHub repository created
□ Upstash Redis account created
□ OR-Tools verified working
□ Project folder structure created
□ .gitignore configured
□ Initial commit pushed
□ Technology stack understood
□ Constraints documented
```

---

## ⏭️ Next Phase

Once all items are checked, proceed to **Phase 1: Project Initialization**

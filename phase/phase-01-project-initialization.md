# 📋 PHASE 1: Project Initialization

> **Duration:** 1-2 days  
> **Dependencies:** Phase 0  
> **Priority:** Critical - Foundation for all development

---

## 🎯 Phase Objectives

Initialize all three services (backend, solver, frontend) with proper configurations, dependencies, and basic structure.

---

## 📑 Task Breakdown

---

### 1.1 Backend Initialization (Node.js + Express)

**Goal:** Set up the Node.js backend service.

**Step-by-Step Instructions:**

1. **Navigate to backend folder:**
   ```bash
   cd backend
   ```

2. **Initialize npm project:**
   ```bash
   npm init -y
   ```

3. **Install dependencies:**
   ```bash
   # Core dependencies
   npm install express mongoose dotenv cors helmet morgan
   
   # Authentication
   npm install jsonwebtoken bcrypt cookie-parser
   
   # Validation
   npm install joi
   
   # Queue (for later phases)
   npm install bullmq ioredis
   
   # Dev dependencies
   npm install -D nodemon jest supertest
   ```

4. **Update `package.json` scripts:**
   ```json
   {
     "name": "timetuner-backend",
     "version": "1.0.0",
     "main": "src/app.js",
     "scripts": {
       "start": "node src/app.js",
       "dev": "nodemon src/app.js",
       "test": "jest --coverage",
       "lint": "eslint src/"
     },
     "type": "commonjs"
   }
   ```

5. **Create main application file (`src/app.js`):**
   ```javascript
   const express = require('express');
   const cors = require('cors');
   const helmet = require('helmet');
   const morgan = require('morgan');
   const cookieParser = require('cookie-parser');
   require('dotenv').config();
   
   const errorHandler = require('./middleware/errorHandler');
   const connectDB = require('./config/database');
   
   const app = express();
   
   // Middleware
   app.use(helmet());
   app.use(cors({
     origin: process.env.FRONTEND_URL || 'http://localhost:5173',
     credentials: true
   }));
   app.use(morgan('dev'));
   app.use(express.json());
   app.use(express.urlencoded({ extended: true }));
   app.use(cookieParser());
   
   // Health check
   app.get('/health', (req, res) => {
     res.json({ status: 'healthy', service: 'timetuner-backend' });
   });
   
   // Routes (to be added later)
   // app.use('/api/v1/auth', require('./routes/auth'));
   // app.use('/api/v1/departments', require('./routes/departments'));
   // ... more routes
   
   // Error handling
   app.use(errorHandler);
   
   // Start server
   const PORT = process.env.PORT || 5000;
   
   const startServer = async () => {
     try {
       await connectDB();
       app.listen(PORT, () => {
         console.log(`🚀 Server running on http://localhost:${PORT}`);
       });
     } catch (error) {
       console.error('Failed to start server:', error);
       process.exit(1);
     }
   };
   
   startServer();
   
   module.exports = app;
   ```

6. **Create database config (`src/config/database.js`):**
   ```javascript
   const mongoose = require('mongoose');
   
   const connectDB = async () => {
     try {
       const conn = await mongoose.connect(process.env.MONGODB_URI, {
         maxPoolSize: 10,
         serverSelectionTimeoutMS: 5000,
         socketTimeoutMS: 45000
       });
       console.log(`📦 MongoDB Connected: ${conn.connection.host}`);
     } catch (error) {
       console.error('MongoDB connection error:', error.message);
       throw error;
     }
   };
   
   module.exports = connectDB;
   ```

7. **Create error handler (`src/middleware/errorHandler.js`):**
   ```javascript
   module.exports = (err, req, res, next) => {
     console.error(err.stack);
     
     const statusCode = err.statusCode || 500;
     const status = err.status || 'error';
     
     res.status(statusCode).json({
       success: false,
       status,
       message: err.message || 'Internal Server Error',
       ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
     });
   };
   ```

8. **Create environment file (`.env`):**
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/timetuner
   JWT_ACCESS_SECRET=your-access-secret-key-min-32-chars
   JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars
   FRONTEND_URL=http://localhost:5173
   SOLVER_URL=http://localhost:8000
   REDIS_URL=redis://localhost:6379
   ```

9. **Test the backend:**
   ```bash
   npm run dev
   # Visit http://localhost:5000/health
   ```

---

### 1.2 Solver Initialization (Python + FastAPI)

**Goal:** Set up the Python solver service.

**Step-by-Step Instructions:**

1. **Navigate to solver folder:**
   ```bash
   cd solver
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   
   # Activate (Windows)
   venv\Scripts\activate
   
   # Activate (macOS/Linux)
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install fastapi uvicorn ortools pydantic pydantic-settings python-dotenv pytest httpx
   ```

4. **Save requirements:**
   ```bash
   pip freeze > requirements.txt
   ```

5. **Create main application (`main.py`):**
   ```python
   from fastapi import FastAPI
   from fastapi.middleware.cors import CORSMiddleware
   from contextlib import asynccontextmanager
   import logging
   
   from app.core.config import settings
   
   logging.basicConfig(level=logging.INFO)
   logger = logging.getLogger(__name__)
   
   @asynccontextmanager
   async def lifespan(app: FastAPI):
       logger.info("Starting Timetable Solver Service...")
       yield
       logger.info("Shutting down...")
   
   app = FastAPI(
       title="Timetable Solver API",
       version="1.0.0",
       lifespan=lifespan
   )
   
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["http://localhost:5000", "http://localhost:5173"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   
   @app.get("/health")
   async def health_check():
       return {"status": "healthy", "service": "timetable-solver"}
   
   @app.get("/ready")
   async def readiness_check():
       try:
           from ortools.sat.python import cp_model
           model = cp_model.CpModel()
           return {"status": "ready", "ortools": "available"}
       except Exception as e:
           return {"status": "error", "message": str(e)}
   
   if __name__ == "__main__":
       import uvicorn
       uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
   ```

6. **Create config (`app/core/config.py`):**
   ```python
   from pydantic_settings import BaseSettings
   from typing import List
   
   class Settings(BaseSettings):
       PORT: int = 8000
       DEBUG: bool = True
       ALLOWED_ORIGINS: List[str] = ["http://localhost:5000"]
       DEFAULT_TIMEOUT: int = 300
       DEFAULT_MAX_SOLUTIONS: int = 5
       
       class Config:
           env_file = ".env"
   
   settings = Settings()
   ```

7. **Create `__init__.py` files:**
   ```bash
   type nul > app/__init__.py
   type nul > app/core/__init__.py
   type nul > app/api/__init__.py
   type nul > app/models/__init__.py
   type nul > app/solver/__init__.py
   type nul > app/utils/__init__.py
   ```

8. **Create environment file (`.env`):**
   ```env
   PORT=8000
   DEBUG=true
   ```

9. **Test the solver:**
   ```bash
   python main.py
   # Visit http://localhost:8000/health
   # Visit http://localhost:8000/ready
   ```

---

### 1.3 Frontend Initialization (React + Vite)

**Goal:** Set up the React frontend with Vite.

**Step-by-Step Instructions:**

1. **Create Vite project:**
   ```bash
   cd ..  # Go back to project root
   npm create vite@latest frontend -- --template react
   cd frontend
   npm install
   ```

2. **Install dependencies:**
   ```bash
   # Routing
   npm install react-router-dom
   
   # State management
   npm install zustand @tanstack/react-query
   
   # HTTP client
   npm install axios
   
   # UI utilities
   npm install lucide-react
   
   # Forms
   npm install react-hook-form
   
   # Dev dependencies
   npm install -D tailwindcss postcss autoprefixer
   ```

3. **Initialize Tailwind:**
   ```bash
   npx tailwindcss init -p
   ```

4. **Configure Tailwind (`tailwind.config.js`):**
   ```javascript
   /** @type {import('tailwindcss').Config} */
   export default {
     content: [
       "./index.html",
       "./src/**/*.{js,ts,jsx,tsx}",
     ],
     darkMode: 'class',
     theme: {
       extend: {
         colors: {
           primary: {
             50: '#eff6ff',
             100: '#dbeafe',
             200: '#bfdbfe',
             300: '#93c5fd',
             400: '#60a5fa',
             500: '#3b82f6',
             600: '#2563eb',
             700: '#1d4ed8',
             800: '#1e40af',
             900: '#1e3a8a',
           }
         }
       },
     },
     plugins: [],
   }
   ```

5. **Update `src/index.css`:**
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   
   :root {
     font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
   }
   
   body {
     @apply bg-gray-50 text-gray-900;
   }
   ```

6. **Update `src/App.jsx`:**
   ```jsx
   import { BrowserRouter, Routes, Route } from 'react-router-dom';
   import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
   
   const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         staleTime: 5 * 60 * 1000,
         retry: 1,
       },
     },
   });
   
   function App() {
     return (
       <QueryClientProvider client={queryClient}>
         <BrowserRouter>
           <Routes>
             <Route path="/" element={
               <div className="min-h-screen flex items-center justify-center">
                 <div className="text-center">
                   <h1 className="text-4xl font-bold text-primary-600">TimeTuner</h1>
                   <p className="text-gray-600 mt-2">Smart Timetable Scheduler</p>
                   <p className="text-green-600 mt-4">✓ React + Vite Setup Complete</p>
                 </div>
               </div>
             } />
           </Routes>
         </BrowserRouter>
       </QueryClientProvider>
     );
   }
   
   export default App;
   ```

7. **Create environment file (`.env`):**
   ```env
   VITE_API_URL=http://localhost:5000/api/v1
   ```

8. **Test the frontend:**
   ```bash
   npm run dev
   # Visit http://localhost:5173
   ```

---

### 1.4 Verify All Services Running

**Goal:** Ensure all three services can run simultaneously.

**Open 3 terminals:**

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Should show: Server running on http://localhost:5000
```

**Terminal 2 - Solver:**
```bash
cd solver
venv\Scripts\activate  # or source venv/bin/activate
python main.py
# Should show: Uvicorn running on http://localhost:8000
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
# Should show: Local: http://localhost:5173
```

**Verification:**
- http://localhost:5000/health → `{"status":"healthy"}`
- http://localhost:8000/health → `{"status":"healthy"}`
- http://localhost:8000/ready → `{"status":"ready","ortools":"available"}`
- http://localhost:5173 → React app with "TimeTuner" heading

---

### 1.5 README Update

**Goal:** Document the project.

**Update `README.md`:**
```markdown
# TimeTuner - Smart Timetable Scheduler

An intelligent classroom timetable scheduling system using constraint programming.

## Tech Stack

- **Backend:** Node.js + Express + MongoDB
- **Solver:** Python + FastAPI + OR-Tools
- **Frontend:** React + Vite + Tailwind CSS

## Quick Start

### Prerequisites
- Node.js v20+
- Python 3.11+
- MongoDB (local or Atlas)

### Installation

1. **Backend:**
   ```bash
   cd backend
   npm install
   cp .env.example .env  # Configure environment
   npm run dev
   ```

2. **Solver:**
   ```bash
   cd solver
   python -m venv venv
   venv\Scripts\activate  # Windows
   pip install -r requirements.txt
   python main.py
   ```

3. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Services

| Service | URL | Description |
|---------|-----|-------------|
| Backend | http://localhost:5000 | REST API |
| Solver | http://localhost:8000 | Optimization engine |
| Frontend | http://localhost:5173 | User interface |
```

---

## ✅ Phase 1 Completion Checklist

```
□ Backend npm initialized
□ Backend dependencies installed
□ Express server running on :5000
□ Database config created
□ Error handler middleware added
□ .env file configured

□ Solver virtual environment created
□ Solver dependencies installed
□ FastAPI server running on :8000
□ OR-Tools verified via /ready endpoint
□ Config module created

□ Frontend Vite project created
□ React Router installed
□ Tailwind CSS configured
□ Zustand & React Query installed
□ Frontend running on :5173

□ All 3 services run simultaneously
□ Health checks passing
□ README documented
□ Changes committed to Git
```

---

## ⏭️ Next Phase

Once all items are checked, proceed to **Phase 2: Database Design & Setup**

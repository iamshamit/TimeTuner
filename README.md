# TimeTuner - Smart Timetable Scheduler

An intelligent classroom timetable scheduling system using constraint programming for higher education institutions.

## 🎯 Features

- **Optimized Timetable Generation** - Zero conflicts with balanced workloads
- **Multi-department Support** - Handle multiple departments and shifts
- **Constraint Programming** - Google OR-Tools powered optimization
- **Approval Workflow** - Review and publish timetables
- **Multiple Options** - Generate and compare alternative schedules

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Backend** | Node.js + Express | REST API, business logic |
| **Database** | MongoDB Atlas | Document storage |
| **Solver** | Python + FastAPI | Timetable optimization |
| **Optimizer** | Google OR-Tools | Constraint programming |
| **Queue** | Redis + BullMQ | Async job processing |
| **Frontend** | React + Vite | User interface |
| **Styling** | Tailwind CSS | UI styling |

## 📁 Project Structure

```
TimeTuner/
├── backend/          # Node.js REST API
│   └── src/
│       ├── routes/
│       ├── controllers/
│       ├── models/
│       ├── services/
│       ├── middleware/
│       └── config/
├── solver/           # Python optimization engine
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   └── solver/
│   └── tests/
├── frontend/         # React application
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       └── services/
├── docs/             # Documentation
└── docker/           # Docker configuration
```

## 🚀 Quick Start

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

## 🔗 Services

| Service | URL | Description |
|---------|-----|-------------|
| Backend | http://localhost:5000 | REST API |
| Solver | http://localhost:8000 | Optimization engine |
| Frontend | http://localhost:5173 | User interface |

## 📝 License

MIT License

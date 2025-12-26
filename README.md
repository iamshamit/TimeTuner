# TimeTuner - Smart Timetable Scheduler

TimeTuner is an intelligent, constraint-based classroom timetable scheduling system designed for higher education institutions. It leverages Google OR-Tools to automatically generate conflict-free, optimized schedules that balance faculty workloads, room utilization, and student requirements.

## 🎯 Key Features

*   **Optimized Scheduling**: Automatically generates timetables with zero hard conflicts (clashes).
*   **Constraint Programming**: Powered by Google OR-Tools to handle complex scheduling rules.
*   **Multi-Department & Multi-Shift**: Supports complex institutional structures.
*   **Workflow Management**: Draft → Review → Approved → Published workflow for timetables.
*   **Alternative Options**: Generates multiple timetable variations to choose from.
*   **User Roles**: Role-based access for Admins, HODs, Schedulers, and Viewers.
*   **Interactive UI**: Drag-and-drop manual adjustments with real-time conflict validation.

## 🏗️ System Architecture

The project follows a microservices-inspired architecture:

*   **Frontend**: React + Vite + Tailwind CSS (User Interface)
*   **Backend**: Node.js + Express (REST API, Auth, Business Logic)
*   **Solver Service**: Python + FastAPI + Google OR-Tools (Optimization Engine)
*   **Database**: MongoDB Atlas (Data Storage)
*   **Queue**: Redis + BullMQ (Asynchronous Job Processing for Solver)

## 🛠️ Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React, Vite | Modern, fast web client |
| | Tailwind CSS | Utility-first styling |
| | Zustand/Redux | State management |
| **Backend** | Node.js, Express | Core API server |
| | Mongoose | MongoDB object modeling |
| | JWT | Secure authentication |
| **Solver** | Python 3.11+ | Optimization logic |
| | FastAPI | High-performance API for solver |
| | Google OR-Tools | Constraint programming library |
| **Infra** | MongoDB | NoSQL Database |
| | Redis | Caching and Message Broker |
| | Docker | Containerization |

## 🚀 Getting Started

### Prerequisites

*   **Node.js** (v20+)
*   **Python** (v3.11+)
*   **MongoDB** (MongoDB Atlas or local instance with TLS enabled)
*   **Redis** (Local or Cloud)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd TimeTuner
    ```

2.  **Backend Setup:**
    ```bash
    cd backend
    npm install
    cp .env.example .env
    # Edit .env with your MongoDB and Redis credentials
    npm run dev
    ```

3.  **Solver Setup:**
    ```bash
    cd solver
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    pip install -r requirements.txt
    python main.py
    ```

4.  **Frontend Setup:**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

### Environment Variables

Ensure your `backend/.env` includes:
```env
PORT=5000
# Note: The application requires a TLS-enabled MongoDB connection (e.g., MongoDB Atlas)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/timetuner
JWT_ACCESS_SECRET=your_secret
SOLVER_URL=http://localhost:8000
REDIS_URL=redis://localhost:6379
```

## 🧠 Solver Logic

The heart of TimeTuner is the Python-based solver using **Google OR-Tools**. It treats the scheduling problem as a constraint satisfaction problem.

### Hard Constraints (Must satisfy)
*   **One Class Per Batch**: A student batch cannot have two classes at the same time.
*   **One Class Per Room**: A room cannot host two classes simultaneously.
*   **One Class Per Faculty**: A faculty cannot teach two classes simultaneously.
*   **Room Capacity**: Class size must not exceed room capacity.
*   **Faculty Availability**: Respect faculty unavailable slots.
*   **Subject Qualification**: Faculty must be qualified to teach the assigned subject.

### Soft Constraints (Optimized for)
*   **Faculty Load Balance**: Avoid consecutive classes for faculty.
*   **Student Comfort**: Even distribution of classes throughout the week.
*   **Room Utilization**: Maximize the usage of available rooms.
*   **Preferred Slots**: Try to assign classes to faculty's preferred time slots.

## 🗺️ Development Roadmap

The project is divided into 19 phases. Here is a high-level overview:

*   **Phase 0-1**: Foundation & Setup
*   **Phase 2-4**: Backend Core (DB, Auth, CRUD APIs)
*   **Phase 5-8**: Python Solver Engine (Modeling, Constraints, Optimization)
*   **Phase 9**: Integration (Node.js ↔ Python via Redis)
*   **Phase 10**: Approval Workflow
*   **Phase 11-15**: Frontend Development (Dashboard, Management, Timetable View)
*   **Phase 16**: Testing (Unit, Integration, E2E)
*   **Phase 17**: Deployment & DevOps (Docker, CI/CD)
*   **Phase 18**: Documentation
*   **Phase 19**: Future Enhancements (AI features)

For detailed phase breakdown, check [Phases.md](./Phases.md).

## 🤝 Contributing

Contributions are welcome! Please follow the standard pull request workflow.

1.  Fork the repository.
2.  Create a feature branch.
3.  Commit your changes.
4.  Push to the branch.
5.  Open a Pull Request.

## 📝 License

This project is licensed under the MIT License.

# 📋 PHASE 5: Python Solver Engine - Foundation

> **Duration:** 2-3 days  
> **Dependencies:** Phase 1  
> **Priority:** High - Core optimization engine

---

## 🎯 Phase Objectives

Set up the Python FastAPI service with OR-Tools installed and create the foundational structure for the timetable solver.

---

## 📑 Task Breakdown

---

### 5.1 FastAPI Application Setup

**Goal:** Create a production-ready FastAPI application.

**Step-by-Step Instructions:**

1. **Navigate to solver directory:**
   ```bash
   cd solver
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   
   # Activate on Windows
   venv\Scripts\activate
   
   # Activate on macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install fastapi uvicorn ortools pydantic python-dotenv pytest httpx
   pip freeze > requirements.txt
   ```

4. **Create main application file:**

```python
# main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.api import routes
from app.core.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info("Starting Timetable Solver Service...")
    yield
    logger.info("Shutting down Timetable Solver Service...")

app = FastAPI(
    title="Timetable Solver API",
    description="OR-Tools based constraint programming solver for class scheduling",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(routes.router, prefix="/api/v1")

# Health check endpoints
@app.get("/health")
async def health_check():
    """Basic health check."""
    return {"status": "healthy", "service": "timetable-solver"}

@app.get("/ready")
async def readiness_check():
    """Readiness check - verify solver is ready."""
    try:
        # Quick OR-Tools test
        from ortools.sat.python import cp_model
        model = cp_model.CpModel()
        return {"status": "ready", "ortools": "available"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Solver not ready: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.DEBUG
    )
```

---

### 5.2 OR-Tools Installation & Verification

**Goal:** Ensure OR-Tools is properly installed.

**Verification Script:**

```python
# scripts/verify_ortools.py
def verify_ortools():
    """Verify OR-Tools installation."""
    try:
        from ortools.sat.python import cp_model
        
        # Create a simple model
        model = cp_model.CpModel()
        
        # Create variables
        x = model.NewIntVar(0, 10, 'x')
        y = model.NewIntVar(0, 10, 'y')
        
        # Add constraint
        model.Add(x + y <= 10)
        
        # Maximize x + y
        model.Maximize(x + y)
        
        # Solve
        solver = cp_model.CpSolver()
        status = solver.Solve(model)
        
        if status == cp_model.OPTIMAL:
            print(f"✅ OR-Tools working correctly!")
            print(f"   Solution: x={solver.Value(x)}, y={solver.Value(y)}")
            print(f"   Objective: {solver.ObjectiveValue()}")
            return True
        else:
            print("❌ Solver did not find optimal solution")
            return False
            
    except ImportError as e:
        print(f"❌ OR-Tools import failed: {e}")
        return False
    except Exception as e:
        print(f"❌ OR-Tools error: {e}")
        return False

if __name__ == "__main__":
    verify_ortools()
```

**Run verification:**
```bash
python scripts/verify_ortools.py
```

---

### 5.3 Project Structure for Solver

**Goal:** Create organized folder structure.

```bash
# Create directories
mkdir -p app/api app/core app/models app/solver/constraints app/solver/builders app/utils tests
```

**Final Structure:**

```
solver/
├── app/
│   ├── __init__.py
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes.py           # API endpoints
│   ├── core/
│   │   ├── __init__.py
│   │   └── config.py           # Configuration
│   ├── models/
│   │   ├── __init__.py
│   │   ├── request.py          # Input schemas
│   │   └── response.py         # Output schemas
│   ├── solver/
│   │   ├── __init__.py
│   │   ├── engine.py           # Main solver class
│   │   ├── constraints/
│   │   │   ├── __init__.py
│   │   │   ├── hard.py         # Hard constraints
│   │   │   └── soft.py         # Soft constraints
│   │   └── builders/
│   │       ├── __init__.py
│   │       └── variable_builder.py
│   └── utils/
│       ├── __init__.py
│       └── helpers.py
├── tests/
│   ├── __init__.py
│   ├── test_solver.py
│   └── test_api.py
├── scripts/
│   └── verify_ortools.py
├── main.py
├── requirements.txt
├── .env
└── .env.example
```

**Create `__init__.py` files:**
```bash
# Windows
type nul > app/__init__.py
type nul > app/api/__init__.py
type nul > app/core/__init__.py
# ... etc

# Linux/macOS
touch app/__init__.py app/api/__init__.py app/core/__init__.py
```

---

### 5.4 Input Data Schema Definition (Pydantic)

**Goal:** Define all input data models.

```python
# app/models/request.py
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from enum import Enum

class DayEnum(str, Enum):
    MON = "Mon"
    TUE = "Tue"
    WED = "Wed"
    THU = "Thu"
    FRI = "Fri"
    SAT = "Sat"

class RoomType(str, Enum):
    LECTURE = "lecture"
    LAB = "lab"
    SEMINAR = "seminar"

# ============ INPUT MODELS ============

class TimeSlotInput(BaseModel):
    """Time slot configuration."""
    slot_number: int = Field(..., ge=1, le=10)
    start_time: str
    end_time: str
    is_break: bool = False

class UnavailableSlot(BaseModel):
    """Represents a blocked slot."""
    day: DayEnum
    slot: int = Field(..., ge=1)

class FacultyPreferences(BaseModel):
    """Faculty scheduling preferences."""
    preferred_slots: List[UnavailableSlot] = []
    avoid_consecutive: bool = False
    prefer_morning: bool = False

class FacultyInput(BaseModel):
    """Faculty data for solver."""
    id: str
    name: str
    department_id: str
    subject_ids: List[str]  # Subjects they can teach
    max_daily_classes: int = Field(default=4, ge=1, le=8)
    max_weekly_classes: int = Field(default=20, ge=1, le=35)
    unavailable_slots: List[UnavailableSlot] = []
    preferences: Optional[FacultyPreferences] = None

class RoomInput(BaseModel):
    """Room data for solver."""
    id: str
    code: str
    capacity: int = Field(..., ge=1)
    type: RoomType = RoomType.LECTURE
    department_id: Optional[str] = None
    unavailable_slots: List[UnavailableSlot] = []

class SubjectInput(BaseModel):
    """Subject data for solver."""
    id: str
    code: str
    name: str
    department_id: str
    is_lab: bool = False
    credits: int = Field(default=3, ge=1, le=6)

class BatchSubject(BaseModel):
    """Subject requirement for a batch."""
    subject_id: str
    classes_per_week: int = Field(..., ge=1, le=10)
    assigned_faculty_id: Optional[str] = None

class BatchInput(BaseModel):
    """Batch/Section data for solver."""
    id: str
    code: str
    department_id: str
    semester: int = Field(..., ge=1, le=8)
    size: int = Field(..., ge=1)
    subjects: List[BatchSubject]

class FixedSlotInput(BaseModel):
    """Fixed slot that cannot be changed."""
    batch_id: str
    subject_id: str
    faculty_id: Optional[str]
    room_id: Optional[str]
    day: DayEnum
    slot: int

class HardConstraints(BaseModel):
    """Hard constraints - must not be violated."""
    max_classes_per_day_batch: int = Field(default=6, ge=1)
    no_consecutive_labs: bool = True
    respect_faculty_unavailability: bool = True
    respect_room_capacity: bool = True
    labs_only_in_lab_rooms: bool = True

class SoftConstraintConfig(BaseModel):
    """Configuration for a soft constraint."""
    enabled: bool = True
    weight: int = Field(default=5, ge=1, le=10)

class SoftConstraints(BaseModel):
    """Soft constraints - penalized but allowed."""
    faculty_load_balance: SoftConstraintConfig = SoftConstraintConfig()
    avoid_consecutive_for_faculty: SoftConstraintConfig = SoftConstraintConfig()
    student_daily_load_limit: SoftConstraintConfig = SoftConstraintConfig(weight=7)
    even_distribution: SoftConstraintConfig = SoftConstraintConfig(weight=4)
    room_utilization: SoftConstraintConfig = SoftConstraintConfig(enabled=False, weight=3)
    minimize_idle_gaps: SoftConstraintConfig = SoftConstraintConfig()
    preferred_slot_matching: SoftConstraintConfig = SoftConstraintConfig(enabled=False, weight=2)

class Constraints(BaseModel):
    """All constraints."""
    hard: HardConstraints = HardConstraints()
    soft: SoftConstraints = SoftConstraints()

class SolverConfig(BaseModel):
    """Solver configuration."""
    timeout_seconds: int = Field(default=300, ge=30, le=3600)
    max_solutions: int = Field(default=5, ge=1, le=10)
    num_workers: int = Field(default=4, ge=1, le=8)

class SolverRequest(BaseModel):
    """Complete solver input."""
    faculties: List[FacultyInput]
    rooms: List[RoomInput]
    subjects: List[SubjectInput]
    batches: List[BatchInput]
    days: List[DayEnum] = [DayEnum.MON, DayEnum.TUE, DayEnum.WED, 
                           DayEnum.THU, DayEnum.FRI, DayEnum.SAT]
    slots_per_day: int = Field(default=6, ge=1, le=10)
    time_slots: List[TimeSlotInput] = []
    constraints: Constraints = Constraints()
    fixed_slots: List[FixedSlotInput] = []
    config: SolverConfig = SolverConfig()
    
    @validator('batches')
    def validate_batches(cls, v, values):
        """Ensure batch subjects reference valid subjects."""
        if 'subjects' in values:
            subject_ids = {s.id for s in values['subjects']}
            for batch in v:
                for bs in batch.subjects:
                    if bs.subject_id not in subject_ids:
                        raise ValueError(
                            f"Batch {batch.code} references unknown subject {bs.subject_id}"
                        )
        return v
```

---

### 5.5 Output Data Schema Definition

**Goal:** Define response models.

```python
# app/models/response.py
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class SolverStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    OPTIMAL = "optimal"
    FEASIBLE = "feasible"
    INFEASIBLE = "infeasible"
    TIMEOUT = "timeout"
    ERROR = "error"

class TimetableEvent(BaseModel):
    """Single class/event in timetable."""
    day: str
    slot: int
    batch_id: str
    batch_code: str
    subject_id: str
    subject_code: str
    faculty_id: str
    faculty_name: str
    room_id: str
    room_code: str
    duration: int = 1
    is_fixed: bool = False

class ViolationDetail(BaseModel):
    """Details of a constraint violation."""
    type: str  # 'hard' or 'soft'
    constraint: str
    description: str
    severity: str = "low"  # low, medium, high

class TimetableMetrics(BaseModel):
    """Quality metrics for a timetable."""
    faculty_load_variance: float = Field(default=0.0, description="Lower is better")
    room_utilization_percent: float = Field(default=0.0)
    avg_daily_classes_per_batch: float = Field(default=0.0)
    faculty_idle_gaps: int = Field(default=0)
    classes_in_preferred_slots: int = Field(default=0)

class TimetableSolution(BaseModel):
    """Single timetable solution."""
    score: float = Field(..., ge=0.0, le=1.0)
    events: List[TimetableEvent]
    violations: Dict[str, int] = {"hard": 0, "soft": 0}
    violation_details: List[ViolationDetail] = []
    metrics: TimetableMetrics = TimetableMetrics()

class SolverResponse(BaseModel):
    """Complete solver response."""
    status: SolverStatus
    message: str
    solve_time_seconds: float = 0.0
    solutions: List[TimetableSolution] = []
    best_solution_index: int = 0
    statistics: Dict[str, Any] = {}

class SolverProgress(BaseModel):
    """Progress update during solving."""
    job_id: str
    progress_percent: int = Field(ge=0, le=100)
    current_best_score: Optional[float]
    solutions_found: int
    elapsed_seconds: float
    status: SolverStatus

class ErrorResponse(BaseModel):
    """Error response."""
    error: str
    details: Optional[str]
    code: str
```

---

### 5.6 Solver Configuration Parameters

**Goal:** Create configuration management.

```python
# app/core/config.py
from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    """Application settings."""
    
    # Server
    PORT: int = 8000
    DEBUG: bool = False
    ENV: str = "development"
    
    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5000"]
    
    # Solver defaults
    DEFAULT_TIMEOUT: int = 300  # seconds
    DEFAULT_MAX_SOLUTIONS: int = 5
    DEFAULT_NUM_WORKERS: int = 4
    
    # Constraint weights (defaults)
    WEIGHT_FACULTY_LOAD: int = 5
    WEIGHT_CONSECUTIVE_CLASSES: int = 5
    WEIGHT_STUDENT_LOAD: int = 7
    WEIGHT_EVEN_DISTRIBUTION: int = 4
    WEIGHT_ROOM_UTILIZATION: int = 3
    WEIGHT_IDLE_GAPS: int = 5
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
```

**Create `.env.example`:**

```env
PORT=8000
DEBUG=true
ENV=development
ALLOWED_ORIGINS=["http://localhost:3000","http://localhost:5000"]
DEFAULT_TIMEOUT=300
DEFAULT_MAX_SOLUTIONS=5
```

---

### 5.7 Basic Health Check Endpoints

**Already included in `main.py`:**
- `GET /health` - Basic health check
- `GET /ready` - Readiness check with OR-Tools verification

---

### 5.8 Logging Framework Setup

**Goal:** Configure structured logging.

```python
# app/utils/logger.py
import logging
import sys
from datetime import datetime

def setup_logger(name: str, level: int = logging.INFO) -> logging.Logger:
    """Configure and return a logger instance."""
    logger = logging.getLogger(name)
    logger.setLevel(level)
    
    # Console handler with formatted output
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(level)
    
    formatter = logging.Formatter(
        '%(asctime)s | %(levelname)-8s | %(name)s | %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    handler.setFormatter(formatter)
    
    if not logger.handlers:
        logger.addHandler(handler)
    
    return logger

# Create loggers for different modules
solver_logger = setup_logger('solver')
api_logger = setup_logger('api')
constraint_logger = setup_logger('constraints')
```

---

### 5.9 Error Handling Architecture

**Goal:** Create custom exceptions.

```python
# app/utils/exceptions.py
from fastapi import HTTPException
from typing import Optional

class SolverException(Exception):
    """Base exception for solver errors."""
    def __init__(self, message: str, details: Optional[str] = None):
        self.message = message
        self.details = details
        super().__init__(message)

class InfeasibleError(SolverException):
    """Raised when no solution exists."""
    pass

class TimeoutError(SolverException):
    """Raised when solver times out."""
    pass

class ValidationError(SolverException):
    """Raised for input validation errors."""
    pass

class ConfigurationError(SolverException):
    """Raised for configuration issues."""
    pass

# Exception handlers for FastAPI
from fastapi import Request
from fastapi.responses import JSONResponse

async def solver_exception_handler(request: Request, exc: SolverException):
    return JSONResponse(
        status_code=400,
        content={
            "error": exc.message,
            "details": exc.details,
            "code": type(exc).__name__
        }
    )

async def infeasible_exception_handler(request: Request, exc: InfeasibleError):
    return JSONResponse(
        status_code=422,
        content={
            "error": exc.message,
            "details": exc.details,
            "code": "INFEASIBLE"
        }
    )
```

---

### 5.10 Solver Class Skeleton Creation

**Goal:** Create the main solver class structure.

```python
# app/solver/engine.py
from ortools.sat.python import cp_model
from typing import List, Dict, Tuple, Optional
from app.models.request import SolverRequest, FacultyInput, RoomInput, BatchInput
from app.models.response import (
    SolverResponse, TimetableSolution, TimetableEvent, 
    SolverStatus, TimetableMetrics, ViolationDetail
)
from app.utils.logger import solver_logger as logger
from app.utils.exceptions import InfeasibleError, TimeoutError
import time

class TimetableSolver:
    """Main timetable optimization solver using OR-Tools CP-SAT."""
    
    def __init__(self, request: SolverRequest):
        """Initialize solver with input data."""
        self.request = request
        self.model = cp_model.CpModel()
        self.solver = cp_model.CpSolver()
        
        # Index mappings for quick lookup
        self.faculty_idx: Dict[str, int] = {}
        self.room_idx: Dict[str, int] = {}
        self.subject_idx: Dict[str, int] = {}
        self.batch_idx: Dict[str, int] = {}
        
        # Decision variables
        # x[batch_id, subject_id, day, slot, room_id, faculty_id] = BoolVar
        self.x: Dict[Tuple, cp_model.IntVar] = {}
        
        # Penalty variables for soft constraints
        self.penalties: Dict[str, List[cp_model.IntVar]] = {}
        
        # Solutions storage
        self.solutions: List[TimetableSolution] = []
        
        # Statistics
        self.stats: Dict = {}
        
        logger.info(f"Solver initialized with {len(request.batches)} batches, "
                   f"{len(request.faculties)} faculties, {len(request.rooms)} rooms")
    
    def _build_indexes(self):
        """Create index mappings for all entities."""
        self.faculty_idx = {f.id: i for i, f in enumerate(self.request.faculties)}
        self.room_idx = {r.id: i for i, r in enumerate(self.request.rooms)}
        self.subject_idx = {s.id: i for i, s in enumerate(self.request.subjects)}
        self.batch_idx = {b.id: i for i, b in enumerate(self.request.batches)}
        
        logger.debug(f"Indexes built: {len(self.faculty_idx)} faculties, "
                    f"{len(self.room_idx)} rooms, {len(self.subject_idx)} subjects, "
                    f"{len(self.batch_idx)} batches")
    
    def _create_variables(self):
        """Create decision variables for the model."""
        logger.info("Creating decision variables...")
        
        variable_count = 0
        days = [d.value for d in self.request.days]
        slots = range(1, self.request.slots_per_day + 1)
        
        for batch in self.request.batches:
            for batch_subject in batch.subjects:
                subject = self._get_subject(batch_subject.subject_id)
                qualified_faculties = self._get_qualified_faculties(subject.id)
                suitable_rooms = self._get_suitable_rooms(batch, subject)
                
                for day in days:
                    for slot in slots:
                        for room in suitable_rooms:
                            for faculty in qualified_faculties:
                                var_name = f"x_{batch.id}_{subject.id}_{day}_{slot}_{room.id}_{faculty.id}"
                                self.x[(batch.id, subject.id, day, slot, room.id, faculty.id)] = \
                                    self.model.NewBoolVar(var_name)
                                variable_count += 1
        
        logger.info(f"Created {variable_count} decision variables")
        self.stats['variables'] = variable_count
    
    def _add_hard_constraints(self):
        """Add all hard constraints to the model."""
        logger.info("Adding hard constraints...")
        
        # Import constraint builders
        from app.solver.constraints.hard import (
            add_one_class_per_batch_slot,
            add_one_class_per_room_slot,
            add_one_class_per_faculty_slot,
            add_classes_per_week_requirement,
            add_faculty_unavailability,
            add_fixed_slots
        )
        
        constraint_count = 0
        
        constraint_count += add_one_class_per_batch_slot(self)
        constraint_count += add_one_class_per_room_slot(self)
        constraint_count += add_one_class_per_faculty_slot(self)
        constraint_count += add_classes_per_week_requirement(self)
        constraint_count += add_faculty_unavailability(self)
        constraint_count += add_fixed_slots(self)
        
        logger.info(f"Added {constraint_count} hard constraints")
        self.stats['hard_constraints'] = constraint_count
    
    def _add_soft_constraints(self):
        """Add soft constraints with penalties."""
        logger.info("Adding soft constraints...")
        
        from app.solver.constraints.soft import (
            add_faculty_load_balance,
            add_avoid_consecutive,
            add_student_daily_limit,
            add_even_distribution,
            add_minimize_idle_gaps
        )
        
        soft_config = self.request.constraints.soft
        
        if soft_config.faculty_load_balance.enabled:
            add_faculty_load_balance(self, soft_config.faculty_load_balance.weight)
        
        if soft_config.avoid_consecutive_for_faculty.enabled:
            add_avoid_consecutive(self, soft_config.avoid_consecutive_for_faculty.weight)
        
        if soft_config.student_daily_load_limit.enabled:
            add_student_daily_limit(self, soft_config.student_daily_load_limit.weight)
        
        if soft_config.even_distribution.enabled:
            add_even_distribution(self, soft_config.even_distribution.weight)
        
        if soft_config.minimize_idle_gaps.enabled:
            add_minimize_idle_gaps(self, soft_config.minimize_idle_gaps.weight)
    
    def _build_objective(self):
        """Build the objective function."""
        logger.info("Building objective function...")
        
        # Minimize total penalties
        all_penalties = []
        for penalty_list in self.penalties.values():
            all_penalties.extend(penalty_list)
        
        if all_penalties:
            self.model.Minimize(sum(all_penalties))
            logger.info(f"Objective: minimize {len(all_penalties)} penalty terms")
        else:
            logger.info("No soft constraints active, using satisfiability mode")
    
    def _configure_solver(self):
        """Configure solver parameters."""
        config = self.request.config
        
        self.solver.parameters.max_time_in_seconds = config.timeout_seconds
        self.solver.parameters.num_search_workers = config.num_workers
        self.solver.parameters.log_search_progress = True
        
        logger.info(f"Solver configured: timeout={config.timeout_seconds}s, "
                   f"workers={config.num_workers}")
    
    def solve(self) -> SolverResponse:
        """Execute the solver and return results."""
        start_time = time.time()
        
        try:
            # Build the model
            self._build_indexes()
            self._create_variables()
            self._add_hard_constraints()
            self._add_soft_constraints()
            self._build_objective()
            self._configure_solver()
            
            # Solve
            logger.info("Starting solver...")
            status = self.solver.Solve(self.model)
            
            solve_time = time.time() - start_time
            
            # Process result
            if status == cp_model.OPTIMAL:
                logger.info(f"Optimal solution found in {solve_time:.2f}s")
                solution = self._extract_solution()
                return SolverResponse(
                    status=SolverStatus.OPTIMAL,
                    message="Optimal solution found",
                    solve_time_seconds=solve_time,
                    solutions=[solution],
                    statistics=self.stats
                )
            
            elif status == cp_model.FEASIBLE:
                logger.info(f"Feasible solution found in {solve_time:.2f}s")
                solution = self._extract_solution()
                return SolverResponse(
                    status=SolverStatus.FEASIBLE,
                    message="Feasible solution found (may not be optimal)",
                    solve_time_seconds=solve_time,
                    solutions=[solution],
                    statistics=self.stats
                )
            
            elif status == cp_model.INFEASIBLE:
                logger.warning("No feasible solution exists")
                return SolverResponse(
                    status=SolverStatus.INFEASIBLE,
                    message="No feasible solution exists with current constraints",
                    solve_time_seconds=solve_time,
                    statistics=self.stats
                )
            
            else:  # UNKNOWN, timeout
                logger.warning(f"Solver timeout after {solve_time:.2f}s")
                return SolverResponse(
                    status=SolverStatus.TIMEOUT,
                    message="Solver timed out",
                    solve_time_seconds=solve_time,
                    statistics=self.stats
                )
                
        except Exception as e:
            logger.error(f"Solver error: {str(e)}")
            return SolverResponse(
                status=SolverStatus.ERROR,
                message=f"Solver error: {str(e)}",
                solve_time_seconds=time.time() - start_time,
                statistics=self.stats
            )
    
    def _extract_solution(self) -> TimetableSolution:
        """Extract solution from solver."""
        events = []
        
        for (batch_id, subject_id, day, slot, room_id, faculty_id), var in self.x.items():
            if self.solver.Value(var) == 1:
                batch = self._get_batch(batch_id)
                subject = self._get_subject(subject_id)
                faculty = self._get_faculty(faculty_id)
                room = self._get_room(room_id)
                
                events.append(TimetableEvent(
                    day=day,
                    slot=slot,
                    batch_id=batch_id,
                    batch_code=batch.code,
                    subject_id=subject_id,
                    subject_code=subject.code,
                    faculty_id=faculty_id,
                    faculty_name=faculty.name,
                    room_id=room_id,
                    room_code=room.code
                ))
        
        score = self._calculate_score()
        metrics = self._calculate_metrics(events)
        
        return TimetableSolution(
            score=score,
            events=events,
            violations=self._count_violations(),
            metrics=metrics
        )
    
    # Helper methods
    def _get_faculty(self, faculty_id: str) -> FacultyInput:
        return next(f for f in self.request.faculties if f.id == faculty_id)
    
    def _get_room(self, room_id: str) -> RoomInput:
        return next(r for r in self.request.rooms if r.id == room_id)
    
    def _get_subject(self, subject_id: str):
        return next(s for s in self.request.subjects if s.id == subject_id)
    
    def _get_batch(self, batch_id: str) -> BatchInput:
        return next(b for b in self.request.batches if b.id == batch_id)
    
    def _get_qualified_faculties(self, subject_id: str) -> List[FacultyInput]:
        return [f for f in self.request.faculties if subject_id in f.subject_ids]
    
    def _get_suitable_rooms(self, batch: BatchInput, subject) -> List[RoomInput]:
        rooms = []
        for room in self.request.rooms:
            if room.capacity >= batch.size:
                if subject.is_lab and room.type.value != 'lab':
                    continue
                rooms.append(room)
        return rooms
    
    def _calculate_score(self) -> float:
        if self.solver.ObjectiveValue() == 0:
            return 1.0
        # Normalize score (higher is better)
        return max(0.0, 1.0 - (self.solver.ObjectiveValue() / 1000))
    
    def _calculate_metrics(self, events: List[TimetableEvent]) -> TimetableMetrics:
        return TimetableMetrics()  # Implement detailed metrics
    
    def _count_violations(self) -> Dict[str, int]:
        return {"hard": 0, "soft": int(self.solver.ObjectiveValue())}
```

---

## ✅ Phase 5 Completion Checklist

```
□ FastAPI application created and running
□ OR-Tools installed and verified
□ Project structure created
□ Input Pydantic models defined (SolverRequest)
□ Output Pydantic models defined (SolverResponse)
□ Configuration management setup
□ Health check endpoints working
□ Logging framework configured
□ Exception handling architecture
□ Solver class skeleton created
□ All files have proper __init__.py
□ Requirements.txt up to date
□ .env.example created
□ Changes committed to Git
```

---

## ⏭️ Next Phase

Proceed to **Phase 6: Python Solver - Variable & Constraint Modeling**

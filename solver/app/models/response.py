from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
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
    severity: str = "low"


class TimetableMetrics(BaseModel):
    """Quality metrics for a timetable."""
    faculty_load_variance: float = Field(default=0.0)
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
    current_best_score: Optional[float] = None
    solutions_found: int = 0
    elapsed_seconds: float = 0.0
    status: SolverStatus = SolverStatus.RUNNING


class ErrorResponse(BaseModel):
    """Error response."""
    error: str
    details: Optional[str] = None
    code: str

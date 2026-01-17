from pydantic import BaseModel, Field, field_validator
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


class ShiftEnum(str, Enum):
    MORNING = "morning"
    AFTERNOON = "afternoon"


# ============ INPUT MODELS ============

class TimeSlotInput(BaseModel):
    """Time slot configuration."""
    slot_number: int = Field(..., ge=1, le=10)
    start_time: str
    end_time: str
    is_break: bool = False
    shift: Optional[ShiftEnum] = None  # Will be inferred from start_time if not provided


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
    subject_ids: List[str]
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
    shift: ShiftEnum = ShiftEnum.MORNING  # morning or afternoon
    subjects: List[BatchSubject]


class FixedSlotInput(BaseModel):
    """Fixed slot that cannot be changed."""
    batch_id: str
    subject_id: str
    faculty_id: Optional[str] = None
    room_id: Optional[str] = None
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
    minimize_idle_gaps: SoftConstraintConfig = SoftConstraintConfig(weight=10)
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

    @field_validator('batches')
    @classmethod
    def validate_batches(cls, v, info):
        """Ensure batch subjects reference valid subjects."""
        if 'subjects' in info.data:
            subject_ids = {s.id for s in info.data['subjects']}
            for batch in v:
                for bs in batch.subjects:
                    if bs.subject_id not in subject_ids:
                        raise ValueError(
                            f"Batch {batch.code} references unknown subject {bs.subject_id}"
                        )
        return v

# 📋 PHASE 6: Python Solver - Variable & Constraint Modeling

> **Duration:** 5-7 days  
> **Dependencies:** Phase 5  
> **Priority:** Critical - Core solver logic

---

## 🎯 Phase Objectives

Implement the complete constraint programming model with all hard constraints that must never be violated.

---

## 📑 Task Breakdown

---

### 6.1 Understanding CP-SAT Model Basics

**Key Concepts:**

```python
from ortools.sat.python import cp_model

# 1. Create model
model = cp_model.CpModel()

# 2. Create boolean variable
x = model.NewBoolVar('x')

# 3. Create integer variable
y = model.NewIntVar(0, 100, 'y')

# 4. Add constraint
model.Add(x + y <= 50)

# 5. Create solver and solve
solver = cp_model.CpSolver()
status = solver.Solve(model)

# 6. Get solution values
if status == cp_model.OPTIMAL:
    print(solver.Value(x))
```

---

### 6.2-6.3 Decision Variables Design & Indexing

**Goal:** Create efficient variable structure.

```python
# app/solver/builders/variable_builder.py
from ortools.sat.python import cp_model
from typing import Dict, Tuple, List
from app.models.request import SolverRequest
from app.utils.logger import solver_logger as logger

class VariableBuilder:
    """Builds decision variables for the timetable model."""
    
    def __init__(self, model: cp_model.CpModel, request: SolverRequest):
        self.model = model
        self.request = request
        self.variables: Dict[Tuple, cp_model.IntVar] = {}
        
        # Quick lookup indexes
        self.faculty_subjects: Dict[str, set] = {}
        self.subject_batches: Dict[str, List[str]] = {}
        self.room_capacity: Dict[str, int] = {}
        
        self._build_indexes()
    
    def _build_indexes(self):
        """Build lookup indexes for faster variable creation."""
        # Faculty -> Subjects they can teach
        for faculty in self.request.faculties:
            self.faculty_subjects[faculty.id] = set(faculty.subject_ids)
        
        # Subject -> Batches that need it
        for batch in self.request.batches:
            for bs in batch.subjects:
                if bs.subject_id not in self.subject_batches:
                    self.subject_batches[bs.subject_id] = []
                self.subject_batches[bs.subject_id].append(batch.id)
        
        # Room capacities
        for room in self.request.rooms:
            self.room_capacity[room.id] = room.capacity
    
    def build(self) -> Dict[Tuple, cp_model.IntVar]:
        """
        Create all decision variables.
        
        Variable: x[batch_id, subject_id, day, slot, room_id, faculty_id]
        Value: 1 if this assignment happens, 0 otherwise
        """
        days = [d.value for d in self.request.days]
        slots = range(1, self.request.slots_per_day + 1)
        
        variable_count = 0
        skipped_count = 0
        
        for batch in self.request.batches:
            batch_size = batch.size
            
            for batch_subject in batch.subjects:
                subject_id = batch_subject.subject_id
                subject = self._get_subject(subject_id)
                
                # Get qualified faculties for this subject
                qualified_faculty_ids = [
                    f.id for f in self.request.faculties 
                    if subject_id in f.subject_ids
                ]
                
                if not qualified_faculty_ids:
                    logger.warning(f"No qualified faculty for subject {subject_id}")
                    continue
                
                # Get suitable rooms
                suitable_rooms = self._get_suitable_rooms(batch_size, subject.is_lab)
                
                if not suitable_rooms:
                    logger.warning(f"No suitable rooms for batch {batch.code}")
                    continue
                
                for day in days:
                    for slot in slots:
                        for room in suitable_rooms:
                            for faculty_id in qualified_faculty_ids:
                                # Check if this combination is feasible
                                if self._is_valid_combination(
                                    faculty_id, day, slot, room.id
                                ):
                                    key = (batch.id, subject_id, day, slot, 
                                           room.id, faculty_id)
                                    name = f"x_{batch.id}_{subject_id}_{day}_{slot}_{room.id}_{faculty_id}"
                                    self.variables[key] = self.model.NewBoolVar(name)
                                    variable_count += 1
                                else:
                                    skipped_count += 1
        
        logger.info(f"Created {variable_count} variables, skipped {skipped_count}")
        return self.variables
    
    def _get_subject(self, subject_id: str):
        """Get subject by ID."""
        for s in self.request.subjects:
            if s.id == subject_id:
                return s
        raise ValueError(f"Subject {subject_id} not found")
    
    def _get_suitable_rooms(self, batch_size: int, is_lab: bool):
        """Get rooms that fit the batch and match type."""
        suitable = []
        for room in self.request.rooms:
            if room.capacity < batch_size:
                continue
            if is_lab and room.type.value != 'lab':
                continue
            if not is_lab and room.type.value == 'lab':
                continue  # Don't use labs for lectures
            suitable.append(room)
        return suitable
    
    def _is_valid_combination(self, faculty_id: str, day: str, 
                              slot: int, room_id: str) -> bool:
        """Check if this assignment is feasible (pre-filter)."""
        # Check faculty unavailability
        faculty = next(f for f in self.request.faculties if f.id == faculty_id)
        for unavail in faculty.unavailable_slots:
            if unavail.day.value == day and unavail.slot == slot:
                return False
        
        # Check room unavailability
        room = next(r for r in self.request.rooms if r.id == room_id)
        for unavail in room.unavailable_slots:
            if unavail.day == day and unavail.slot == slot:
                return False
        
        return True
```

---

### 6.4-6.12 Hard Constraint Implementations

**Goal:** Implement all hard constraints.

```python
# app/solver/constraints/hard.py
from ortools.sat.python import cp_model
from typing import TYPE_CHECKING
from app.utils.logger import constraint_logger as logger

if TYPE_CHECKING:
    from app.solver.engine import TimetableSolver

def add_one_class_per_batch_slot(solver: 'TimetableSolver') -> int:
    """
    HARD CONSTRAINT: A batch can attend only ONE class at any time slot.
    
    For each batch b, for each (day, slot):
        sum of all assignments for b at (day, slot) <= 1
    """
    constraint_count = 0
    days = [d.value for d in solver.request.days]
    slots = range(1, solver.request.slots_per_day + 1)
    
    for batch in solver.request.batches:
        for day in days:
            for slot in slots:
                # Find all variables for this batch at this time
                vars_at_time = [
                    var for (b, s, d, sl, r, f), var in solver.x.items()
                    if b == batch.id and d == day and sl == slot
                ]
                
                if vars_at_time:
                    solver.model.Add(sum(vars_at_time) <= 1)
                    constraint_count += 1
    
    logger.info(f"Added {constraint_count} batch-slot constraints")
    return constraint_count


def add_one_class_per_room_slot(solver: 'TimetableSolver') -> int:
    """
    HARD CONSTRAINT: A room can host only ONE class at a time.
    
    For each room r, for each (day, slot):
        sum of all assignments using r at (day, slot) <= 1
    """
    constraint_count = 0
    days = [d.value for d in solver.request.days]
    slots = range(1, solver.request.slots_per_day + 1)
    
    for room in solver.request.rooms:
        for day in days:
            for slot in slots:
                vars_at_time = [
                    var for (b, s, d, sl, r, f), var in solver.x.items()
                    if r == room.id and d == day and sl == slot
                ]
                
                if vars_at_time:
                    solver.model.Add(sum(vars_at_time) <= 1)
                    constraint_count += 1
    
    logger.info(f"Added {constraint_count} room-slot constraints")
    return constraint_count


def add_one_class_per_faculty_slot(solver: 'TimetableSolver') -> int:
    """
    HARD CONSTRAINT: A faculty can teach only ONE class at a time.
    
    For each faculty f, for each (day, slot):
        sum of all assignments for f at (day, slot) <= 1
    """
    constraint_count = 0
    days = [d.value for d in solver.request.days]
    slots = range(1, solver.request.slots_per_day + 1)
    
    for faculty in solver.request.faculties:
        for day in days:
            for slot in slots:
                vars_at_time = [
                    var for (b, s, d, sl, r, f), var in solver.x.items()
                    if f == faculty.id and d == day and sl == slot
                ]
                
                if vars_at_time:
                    solver.model.Add(sum(vars_at_time) <= 1)
                    constraint_count += 1
    
    logger.info(f"Added {constraint_count} faculty-slot constraints")
    return constraint_count


def add_classes_per_week_requirement(solver: 'TimetableSolver') -> int:
    """
    HARD CONSTRAINT: Each batch-subject must have exactly N classes per week.
    
    For each (batch, subject) with required classes_per_week = N:
        sum of all assignments = N
    """
    constraint_count = 0
    
    for batch in solver.request.batches:
        for batch_subject in batch.subjects:
            subject_id = batch_subject.subject_id
            required = batch_subject.classes_per_week
            
            # Find all variables for this batch-subject
            vars_for_batch_subject = [
                var for (b, s, d, sl, r, f), var in solver.x.items()
                if b == batch.id and s == subject_id
            ]
            
            if vars_for_batch_subject:
                solver.model.Add(sum(vars_for_batch_subject) == required)
                constraint_count += 1
                logger.debug(f"Batch {batch.code} needs {required} classes of {subject_id}")
    
    logger.info(f"Added {constraint_count} classes-per-week constraints")
    return constraint_count


def add_faculty_unavailability(solver: 'TimetableSolver') -> int:
    """
    HARD CONSTRAINT: Faculty cannot teach during their unavailable slots.
    
    Variables for unavailable combinations are already filtered out
    during variable creation, but we can add explicit constraints too.
    """
    constraint_count = 0
    
    for faculty in solver.request.faculties:
        for unavail in faculty.unavailable_slots:
            day = unavail.day.value
            slot = unavail.slot
            
            # Find any variables that violate this
            violating_vars = [
                var for (b, s, d, sl, r, f), var in solver.x.items()
                if f == faculty.id and d == day and sl == slot
            ]
            
            # Force all to 0
            for var in violating_vars:
                solver.model.Add(var == 0)
                constraint_count += 1
    
    logger.info(f"Added {constraint_count} faculty unavailability constraints")
    return constraint_count


def add_fixed_slots(solver: 'TimetableSolver') -> int:
    """
    HARD CONSTRAINT: Fixed slots must remain fixed.
    
    If a slot is pre-defined, force that variable = 1.
    """
    constraint_count = 0
    
    for fixed in solver.request.fixed_slots:
        day = fixed.day.value
        slot = fixed.slot
        
        # Find the matching variable
        for (b, s, d, sl, r, f), var in solver.x.items():
            if (b == fixed.batch_id and s == fixed.subject_id and 
                d == day and sl == slot):
                
                # If faculty/room specified, match exactly
                if fixed.faculty_id and f != fixed.faculty_id:
                    continue
                if fixed.room_id and r != fixed.room_id:
                    continue
                
                solver.model.Add(var == 1)
                constraint_count += 1
                logger.debug(f"Fixed: {fixed.batch_id} {fixed.subject_id} at {day}-{slot}")
                break
    
    logger.info(f"Added {constraint_count} fixed slot constraints")
    return constraint_count


def add_max_classes_per_day_batch(solver: 'TimetableSolver') -> int:
    """
    HARD CONSTRAINT: A batch cannot have more than N classes per day.
    """
    constraint_count = 0
    max_classes = solver.request.constraints.hard.max_classes_per_day_batch
    days = [d.value for d in solver.request.days]
    
    for batch in solver.request.batches:
        for day in days:
            vars_on_day = [
                var for (b, s, d, sl, r, f), var in solver.x.items()
                if b == batch.id and d == day
            ]
            
            if vars_on_day:
                solver.model.Add(sum(vars_on_day) <= max_classes)
                constraint_count += 1
    
    logger.info(f"Added {constraint_count} max-classes-per-day constraints")
    return constraint_count


def add_no_consecutive_labs(solver: 'TimetableSolver') -> int:
    """
    HARD CONSTRAINT: No consecutive lab sessions for a batch.
    """
    if not solver.request.constraints.hard.no_consecutive_labs:
        return 0
    
    constraint_count = 0
    days = [d.value for d in solver.request.days]
    slots = range(1, solver.request.slots_per_day)  # Exclude last slot
    
    # Get lab subject IDs
    lab_subjects = {s.id for s in solver.request.subjects if s.is_lab}
    
    for batch in solver.request.batches:
        for day in days:
            for slot in slots:
                # Lab vars at slot
                lab_vars_slot = [
                    var for (b, s, d, sl, r, f), var in solver.x.items()
                    if b == batch.id and d == day and sl == slot 
                    and s in lab_subjects
                ]
                
                # Lab vars at slot+1
                lab_vars_next = [
                    var for (b, s, d, sl, r, f), var in solver.x.items()
                    if b == batch.id and d == day and sl == slot + 1 
                    and s in lab_subjects
                ]
                
                # For each pair, add constraint
                for v1 in lab_vars_slot:
                    for v2 in lab_vars_next:
                        solver.model.Add(v1 + v2 <= 1)
                        constraint_count += 1
    
    logger.info(f"Added {constraint_count} no-consecutive-labs constraints")
    return constraint_count
```

---

### 6.13 Constraint Testing & Validation

**Goal:** Create test cases for constraints.

```python
# tests/test_constraints.py
import pytest
from app.solver.engine import TimetableSolver
from app.models.request import (
    SolverRequest, FacultyInput, RoomInput, SubjectInput, 
    BatchInput, BatchSubject, DayEnum, SolverConfig
)

def create_simple_request():
    """Create a minimal test case."""
    return SolverRequest(
        faculties=[
            FacultyInput(
                id="f1", name="Dr. Smith", department_id="d1",
                subject_ids=["s1"], max_daily_classes=4
            )
        ],
        rooms=[
            RoomInput(id="r1", code="R101", capacity=60, type="lecture")
        ],
        subjects=[
            SubjectInput(
                id="s1", code="CS101", name="Intro to CS",
                department_id="d1", is_lab=False
            )
        ],
        batches=[
            BatchInput(
                id="b1", code="CSE-1A", department_id="d1",
                semester=1, size=50,
                subjects=[BatchSubject(subject_id="s1", classes_per_week=3)]
            )
        ],
        days=[DayEnum.MON, DayEnum.TUE, DayEnum.WED],
        slots_per_day=4,
        config=SolverConfig(timeout_seconds=30)
    )

def test_solver_finds_solution():
    """Test that solver finds a solution for simple case."""
    request = create_simple_request()
    solver = TimetableSolver(request)
    result = solver.solve()
    
    assert result.status in ["optimal", "feasible"]
    assert len(result.solutions) > 0
    assert len(result.solutions[0].events) == 3  # 3 classes per week

def test_batch_no_overlap():
    """Test that batch is not double-booked."""
    request = create_simple_request()
    solver = TimetableSolver(request)
    result = solver.solve()
    
    events = result.solutions[0].events
    
    # Check no overlapping times for same batch
    time_slots = [(e.day, e.slot) for e in events]
    assert len(time_slots) == len(set(time_slots)), "Batch has overlapping classes"

def test_infeasible_scenario():
    """Test that solver correctly identifies infeasible case."""
    request = SolverRequest(
        faculties=[],  # No faculty!
        rooms=[RoomInput(id="r1", code="R101", capacity=60)],
        subjects=[SubjectInput(id="s1", code="CS101", name="Test", department_id="d1")],
        batches=[
            BatchInput(
                id="b1", code="CSE-1A", department_id="d1",
                semester=1, size=50,
                subjects=[BatchSubject(subject_id="s1", classes_per_week=3)]
            )
        ],
        slots_per_day=4,
        config=SolverConfig(timeout_seconds=10)
    )
    
    solver = TimetableSolver(request)
    result = solver.solve()
    
    assert result.status == "infeasible"
```

**Run tests:**
```bash
pytest tests/test_constraints.py -v
```

---

## ✅ Phase 6 Completion Checklist

```
□ CP-SAT basics understood
□ Decision variables created efficiently
□ Variable indexing optimized
□ One class per batch per slot constraint
□ One class per room per slot constraint
□ One class per faculty per slot constraint
□ Faculty-subject qualification enforced
□ Room capacity constraint implemented
□ Lab room requirement working
□ Fixed slot enforcement working
□ Faculty unavailability respected
□ Classes per week requirement met
□ All constraints tested
□ Unit tests passing
□ Changes committed to Git
```

---

## ⏭️ Next Phase

Proceed to **Phase 7: Python Solver - Soft Constraints & Optimization**

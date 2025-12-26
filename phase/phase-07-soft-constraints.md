# 📋 PHASE 7: Python Solver - Soft Constraints & Optimization

> **Duration:** 4-5 days  
> **Dependencies:** Phase 6  
> **Priority:** High - Quality optimization

---

## 🎯 Phase Objectives

Implement soft constraints that improve timetable quality when possible but don't make the problem infeasible.

---

## 📑 Task Breakdown

---

### 7.1 Penalty Variable Architecture

**Goal:** Create penalty variables for soft constraint violations.

```python
# app/solver/constraints/soft.py
from ortools.sat.python import cp_model
from typing import TYPE_CHECKING, List
from app.utils.logger import constraint_logger as logger

if TYPE_CHECKING:
    from app.solver.engine import TimetableSolver


def create_penalty_var(solver: 'TimetableSolver', name: str, weight: int):
    """
    Create a weighted penalty variable.
    
    Returns a tuple of (bool_var, weighted_penalty) where:
    - bool_var is 1 when violation occurs
    - weighted_penalty = bool_var * weight (for objective)
    """
    bool_var = solver.model.NewBoolVar(f"penalty_{name}")
    weighted = solver.model.NewIntVar(0, weight * 10, f"weighted_{name}")
    solver.model.Add(weighted == bool_var * weight)
    return bool_var, weighted
```

---

### 7.2 Faculty Daily Load Balance

**Goal:** Balance classes evenly across days for each faculty.

```python
def add_faculty_load_balance(solver: 'TimetableSolver', weight: int) -> None:
    """
    SOFT CONSTRAINT: Balance faculty teaching load across days.
    
    Penalize if a faculty has significantly more classes on one day
    than another. Uses max-min difference as penalty.
    """
    logger.info(f"Adding faculty load balance (weight={weight})")
    days = [d.value for d in solver.request.days]
    
    penalties = []
    
    for faculty in solver.request.faculties:
        day_loads = []
        
        for day in days:
            # Sum of classes for this faculty on this day
            vars_on_day = [
                var for (b, s, d, sl, r, f), var in solver.x.items()
                if f == faculty.id and d == day
            ]
            
            if vars_on_day:
                day_load = solver.model.NewIntVar(
                    0, len(vars_on_day), f"load_{faculty.id}_{day}"
                )
                solver.model.Add(day_load == sum(vars_on_day))
                day_loads.append(day_load)
        
        if len(day_loads) >= 2:
            # Penalize variance - minimize max - min
            max_load = solver.model.NewIntVar(0, 10, f"max_load_{faculty.id}")
            min_load = solver.model.NewIntVar(0, 10, f"min_load_{faculty.id}")
            
            solver.model.AddMaxEquality(max_load, day_loads)
            solver.model.AddMinEquality(min_load, day_loads)
            
            diff = solver.model.NewIntVar(0, 10, f"diff_{faculty.id}")
            solver.model.Add(diff == max_load - min_load)
            
            # Create penalty (diff * weight)
            penalty = solver.model.NewIntVar(0, 100, f"penalty_balance_{faculty.id}")
            solver.model.Add(penalty == diff * weight)
            penalties.append(penalty)
    
    # Store penalties
    if 'faculty_load_balance' not in solver.penalties:
        solver.penalties['faculty_load_balance'] = []
    solver.penalties['faculty_load_balance'].extend(penalties)
    
    logger.info(f"Added {len(penalties)} faculty load balance penalties")
```

---

### 7.3 Avoid Consecutive Classes for Faculty

**Goal:** Prevent faculty exhaustion from back-to-back classes.

```python
def add_avoid_consecutive(solver: 'TimetableSolver', weight: int) -> None:
    """
    SOFT CONSTRAINT: Penalize consecutive classes for faculty.
    
    For each faculty, for each pair of consecutive slots:
        If both are assigned, add penalty.
    """
    logger.info(f"Adding avoid consecutive constraint (weight={weight})")
    days = [d.value for d in solver.request.days]
    slots = range(1, solver.request.slots_per_day)  # Exclude last
    
    penalties = []
    
    for faculty in solver.request.faculties:
        # Skip if faculty allows consecutive
        if faculty.preferences and not faculty.preferences.avoid_consecutive:
            continue
        
        for day in days:
            for slot in slots:
                # Vars at slot
                vars_slot = [
                    var for (b, s, d, sl, r, f), var in solver.x.items()
                    if f == faculty.id and d == day and sl == slot
                ]
                
                # Vars at slot + 1
                vars_next = [
                    var for (b, s, d, sl, r, f), var in solver.x.items()
                    if f == faculty.id and d == day and sl == slot + 1
                ]
                
                if vars_slot and vars_next:
                    # Sum at slot
                    sum_slot = solver.model.NewBoolVar(f"has_class_{faculty.id}_{day}_{slot}")
                    solver.model.AddMaxEquality(sum_slot, vars_slot)
                    
                    # Sum at next slot
                    sum_next = solver.model.NewBoolVar(f"has_class_{faculty.id}_{day}_{slot+1}")
                    solver.model.AddMaxEquality(sum_next, vars_next)
                    
                    # Penalty if both are 1
                    both = solver.model.NewBoolVar(f"consec_{faculty.id}_{day}_{slot}")
                    solver.model.AddBoolAnd([sum_slot, sum_next]).OnlyEnforceIf(both)
                    solver.model.AddBoolOr([sum_slot.Not(), sum_next.Not()]).OnlyEnforceIf(both.Not())
                    
                    # Weighted penalty
                    penalty = solver.model.NewIntVar(0, weight * 2, f"penalty_consec_{faculty.id}_{day}_{slot}")
                    solver.model.Add(penalty == both * weight)
                    penalties.append(penalty)
    
    if 'consecutive' not in solver.penalties:
        solver.penalties['consecutive'] = []
    solver.penalties['consecutive'].extend(penalties)
    
    logger.info(f"Added {len(penalties)} consecutive class penalties")
```

---

### 7.4 Student Daily Load Limit

**Goal:** Limit classes per day for student comfort.

```python
def add_student_daily_limit(solver: 'TimetableSolver', weight: int) -> None:
    """
    SOFT CONSTRAINT: Penalize if batch has more than N classes per day.
    
    Default max = 5 classes per day for student comfort.
    """
    logger.info(f"Adding student daily limit (weight={weight})")
    days = [d.value for d in solver.request.days]
    max_classes = 5  # Comfortable limit
    
    penalties = []
    
    for batch in solver.request.batches:
        for day in days:
            vars_on_day = [
                var for (b, s, d, sl, r, f), var in solver.x.items()
                if b == batch.id and d == day
            ]
            
            if len(vars_on_day) > max_classes:
                # Count classes on this day
                count = solver.model.NewIntVar(
                    0, len(vars_on_day), f"count_{batch.id}_{day}"
                )
                solver.model.Add(count == sum(vars_on_day))
                
                # Excess over limit
                excess = solver.model.NewIntVar(
                    0, len(vars_on_day), f"excess_{batch.id}_{day}"
                )
                solver.model.AddMaxEquality(excess, [count - max_classes, 0])
                
                # Penalty
                penalty = solver.model.NewIntVar(
                    0, weight * 10, f"penalty_excess_{batch.id}_{day}"
                )
                solver.model.Add(penalty == excess * weight)
                penalties.append(penalty)
    
    if 'student_load' not in solver.penalties:
        solver.penalties['student_load'] = []
    solver.penalties['student_load'].extend(penalties)
    
    logger.info(f"Added {len(penalties)} student load penalties")
```

---

### 7.5 Even Weekly Distribution

**Goal:** Spread subject classes evenly across the week.

```python
def add_even_distribution(solver: 'TimetableSolver', weight: int) -> None:
    """
    SOFT CONSTRAINT: Distribute subject classes evenly across week.
    
    Penalize having multiple classes of same subject on same day.
    """
    logger.info(f"Adding even distribution (weight={weight})")
    days = [d.value for d in solver.request.days]
    
    penalties = []
    
    for batch in solver.request.batches:
        for batch_subject in batch.subjects:
            subject_id = batch_subject.subject_id
            
            for day in days:
                # Count subject classes on this day
                vars_on_day = [
                    var for (b, s, d, sl, r, f), var in solver.x.items()
                    if b == batch.id and s == subject_id and d == day
                ]
                
                if len(vars_on_day) >= 2:
                    # Penalty for more than 1 class of same subject per day
                    count = solver.model.NewIntVar(0, len(vars_on_day), f"subj_count_{batch.id}_{subject_id}_{day}")
                    solver.model.Add(count == sum(vars_on_day))
                    
                    # Excess over 1
                    excess = solver.model.NewIntVar(0, len(vars_on_day), f"subj_excess_{batch.id}_{subject_id}_{day}")
                    solver.model.AddMaxEquality(excess, [count - 1, 0])
                    
                    penalty = solver.model.NewIntVar(0, weight * 5, f"penalty_dist_{batch.id}_{subject_id}_{day}")
                    solver.model.Add(penalty == excess * weight)
                    penalties.append(penalty)
    
    if 'distribution' not in solver.penalties:
        solver.penalties['distribution'] = []
    solver.penalties['distribution'].extend(penalties)
    
    logger.info(f"Added {len(penalties)} distribution penalties")
```

---

### 7.6-7.8 Additional Soft Constraints

```python
def add_room_utilization(solver: 'TimetableSolver', weight: int) -> None:
    """
    SOFT CONSTRAINT: Prefer using smaller rooms that fit the batch.
    
    Penalize using rooms much larger than the batch size.
    """
    logger.info(f"Adding room utilization (weight={weight})")
    penalties = []
    
    for (b, s, d, sl, r, f), var in solver.x.items():
        batch = next(batch for batch in solver.request.batches if batch.id == b)
        room = next(room for room in solver.request.rooms if room.id == r)
        
        # Calculate waste (unused capacity percentage)
        waste_percent = (room.capacity - batch.size) / room.capacity
        
        if waste_percent > 0.5:  # More than 50% wasted
            # Penalty proportional to waste
            penalty_value = int(waste_percent * weight)
            penalty = solver.model.NewIntVar(0, weight, f"penalty_room_{b}_{r}_{d}_{sl}")
            solver.model.Add(penalty == var * penalty_value)
            penalties.append(penalty)
    
    if 'room_util' not in solver.penalties:
        solver.penalties['room_util'] = []
    solver.penalties['room_util'].extend(penalties)


def add_minimize_idle_gaps(solver: 'TimetableSolver', weight: int) -> None:
    """
    SOFT CONSTRAINT: Minimize gaps between classes for faculty.
    
    Penalize schedules like: Class at slot 1, free slot 2, class at slot 3.
    """
    logger.info(f"Adding minimize idle gaps (weight={weight})")
    days = [d.value for d in solver.request.days]
    max_slot = solver.request.slots_per_day
    
    penalties = []
    
    for faculty in solver.request.faculties:
        for day in days:
            for gap_start in range(2, max_slot):
                # Check pattern: class at gap_start-1, no class at gap_start, class at gap_start+1
                if gap_start + 1 > max_slot:
                    continue
                
                vars_before = [var for (b, s, d, sl, r, f), var in solver.x.items()
                              if f == faculty.id and d == day and sl == gap_start - 1]
                vars_during = [var for (b, s, d, sl, r, f), var in solver.x.items()
                              if f == faculty.id and d == day and sl == gap_start]
                vars_after = [var for (b, s, d, sl, r, f), var in solver.x.items()
                             if f == faculty.id and d == day and sl == gap_start + 1]
                
                if vars_before and vars_during and vars_after:
                    # Create indicators
                    has_before = solver.model.NewBoolVar(f"gap_before_{faculty.id}_{day}_{gap_start}")
                    has_during = solver.model.NewBoolVar(f"gap_during_{faculty.id}_{day}_{gap_start}")
                    has_after = solver.model.NewBoolVar(f"gap_after_{faculty.id}_{day}_{gap_start}")
                    
                    solver.model.AddMaxEquality(has_before, vars_before)
                    solver.model.AddMaxEquality(has_during, vars_during)
                    solver.model.AddMaxEquality(has_after, vars_after)
                    
                    # Penalty when: has_before AND NOT has_during AND has_after
                    is_gap = solver.model.NewBoolVar(f"is_gap_{faculty.id}_{day}_{gap_start}")
                    solver.model.AddBoolAnd([has_before, has_during.Not(), has_after]).OnlyEnforceIf(is_gap)
                    
                    penalty = solver.model.NewIntVar(0, weight, f"penalty_gap_{faculty.id}_{day}_{gap_start}")
                    solver.model.Add(penalty == is_gap * weight)
                    penalties.append(penalty)
    
    if 'idle_gaps' not in solver.penalties:
        solver.penalties['idle_gaps'] = []
    solver.penalties['idle_gaps'].extend(penalties)
```

---

### 7.9-7.12 Objective Function & Solver Tuning

```python
# In engine.py, update _build_objective method:

def _build_objective(self):
    """Build the objective function - minimize total weighted penalties."""
    logger.info("Building objective function...")
    
    all_penalties = []
    penalty_summary = {}
    
    for constraint_name, penalty_list in self.penalties.items():
        all_penalties.extend(penalty_list)
        penalty_summary[constraint_name] = len(penalty_list)
    
    if all_penalties:
        self.model.Minimize(sum(all_penalties))
        logger.info(f"Objective: minimize {len(all_penalties)} penalties")
        logger.info(f"Penalty breakdown: {penalty_summary}")
    else:
        logger.info("No penalties - satisfiability mode")
    
    self.stats['penalty_counts'] = penalty_summary

def _configure_solver(self):
    """Configure solver parameters for better performance."""
    config = self.request.config
    
    # Time limit
    self.solver.parameters.max_time_in_seconds = config.timeout_seconds
    
    # Parallelism
    self.solver.parameters.num_search_workers = config.num_workers
    
    # Search strategy
    self.solver.parameters.search_branching = cp_model.AUTOMATIC_SEARCH
    
    # Logging
    self.solver.parameters.log_search_progress = True
    
    logger.info(f"Solver: timeout={config.timeout_seconds}s, workers={config.num_workers}")
```

---

## ✅ Phase 7 Completion Checklist

```
□ Penalty variable architecture implemented
□ Faculty load balance constraint
□ Avoid consecutive classes constraint
□ Student daily load limit
□ Even weekly distribution
□ Room utilization optimization
□ Faculty idle gap minimization
□ Preferred slot matching (optional)
□ Objective function combining all penalties
□ Weight configuration system working
□ Solver parameters optimized
□ Timeout handling implemented
□ All constraints tested
□ Changes committed to Git
```

---

## ⏭️ Next Phase

Proceed to **Phase 8: Python Solver - Multi-Solution & Scoring**

"""Soft constraints for timetable solver - penalized but allowed."""
from typing import TYPE_CHECKING, List

if TYPE_CHECKING:
    from app.solver.engine import TimetableSolver


def add_faculty_load_balance(solver: 'TimetableSolver', weight: int) -> None:
    """Penalize faculty having too many classes in one day."""
    days = [d.value for d in solver.request.days]
    max_preferred = 3  # Prefer max 3 classes per day
    
    if 'faculty_balance' not in solver.penalties:
        solver.penalties['faculty_balance'] = []
    
    for faculty in solver.request.faculties:
        for day in days:
            day_vars = []
            for (b_id, s_id, d, sl, r_id, f_id), var in solver.x.items():
                if f_id == faculty.id and d == day:
                    day_vars.append(var)
            
            if day_vars:
                # Simple penalty: if more than preferred, add penalty
                for i, var in enumerate(day_vars[max_preferred:], max_preferred):
                    penalty = solver.model.NewIntVar(0, weight, f"bal_pen_{faculty.id}_{day}_{i}")
                    solver.model.Add(penalty == weight).OnlyEnforceIf(var)
                    solver.model.Add(penalty == 0).OnlyEnforceIf(var.Not())
                    solver.penalties['faculty_balance'].append(penalty)


def add_avoid_consecutive(solver: 'TimetableSolver', weight: int) -> None:
    """Penalize consecutive classes for faculty.
    
    This gives faculty a break between classes when possible.
    """
    days = [d.value for d in solver.request.days]
    slots = range(1, solver.request.slots_per_day + 1)
    
    if 'avoid_consecutive' not in solver.penalties:
        solver.penalties['avoid_consecutive'] = []
    
    for faculty in solver.request.faculties:
        for day in days:
            for slot in list(slots)[:-1]:  # All slots except last
                next_slot = slot + 1
                
                # Get vars for this faculty at this day-slot and next slot
                current_vars = []
                next_vars = []
                
                for (b_id, s_id, d, sl, r_id, f_id), var in solver.x.items():
                    if f_id == faculty.id and d == day:
                        if sl == slot:
                            current_vars.append(var)
                        elif sl == next_slot:
                            next_vars.append(var)
                
                if current_vars and next_vars:
                    # If faculty has class in both consecutive slots, add penalty
                    for cv in current_vars:
                        for nv in next_vars:
                            # Boolean: both are true
                            both_true = solver.model.NewBoolVar(f"consec_{faculty.id}_{day}_{slot}")
                            solver.model.AddBoolAnd([cv, nv]).OnlyEnforceIf(both_true)
                            solver.model.AddBoolOr([cv.Not(), nv.Not()]).OnlyEnforceIf(both_true.Not())
                            
                            penalty = solver.model.NewIntVar(0, weight, f"consec_pen_{faculty.id}_{day}_{slot}")
                            solver.model.Add(penalty == weight).OnlyEnforceIf(both_true)
                            solver.model.Add(penalty == 0).OnlyEnforceIf(both_true.Not())
                            solver.penalties['avoid_consecutive'].append(penalty)


def add_student_daily_limit(solver: 'TimetableSolver', weight: int) -> None:
    """Penalize exceeding preferred daily class limit for batches."""
    days = [d.value for d in solver.request.days]
    preferred_max = 5
    
    if 'student_load' not in solver.penalties:
        solver.penalties['student_load'] = []
    
    for batch in solver.request.batches:
        for day in days:
            day_vars = []
            for (b_id, s_id, d, sl, r_id, f_id), var in solver.x.items():
                if b_id == batch.id and d == day:
                    day_vars.append(var)
            
            if day_vars:
                # Simple penalty: each class beyond preferred_max adds weight
                for i, var in enumerate(day_vars[preferred_max:], preferred_max):
                    penalty = solver.model.NewIntVar(0, weight, f"load_pen_{batch.id}_{day}_{i}")
                    solver.model.Add(penalty == weight).OnlyEnforceIf(var)
                    solver.model.Add(penalty == 0).OnlyEnforceIf(var.Not())
                    solver.penalties['student_load'].append(penalty)


def add_even_distribution(solver: 'TimetableSolver', weight: int) -> None:
    """Penalize scheduling the same subject twice on the same day for a batch.
    
    This encourages an even distribution of subjects across the week,
    avoiding situations where a batch has the same subject multiple times in one day.
    """
    days = [d.value for d in solver.request.days]
    
    if 'even_distribution' not in solver.penalties:
        solver.penalties['even_distribution'] = []
    
    for batch in solver.request.batches:
        for batch_subject in batch.subjects:
            subject_id = batch_subject.subject_id
            
            for day in days:
                # Get all variables for this batch-subject on this day
                day_vars = []
                for (b_id, s_id, d, sl, r_id, f_id), var in solver.x.items():
                    if b_id == batch.id and s_id == subject_id and d == day:
                        day_vars.append(var)
                
                if len(day_vars) > 1:
                    # Count how many times this subject appears on this day
                    count_var = solver.model.NewIntVar(0, len(day_vars), f"count_{batch.id}_{subject_id}_{day}")
                    solver.model.Add(count_var == sum(day_vars))
                    
                    # Penalize if subject appears more than once on the same day
                    # penalty = weight * max(0, count - 1)
                    excess = solver.model.NewIntVar(0, len(day_vars), f"excess_{batch.id}_{subject_id}_{day}")
                    solver.model.AddMaxEquality(excess, [count_var - 1, 0])
                    
                    penalty = solver.model.NewIntVar(0, weight * len(day_vars), f"dist_pen_{batch.id}_{subject_id}_{day}")
                    solver.model.Add(penalty == excess * weight)
                    solver.penalties['even_distribution'].append(penalty)


def add_minimize_idle_gaps(solver: 'TimetableSolver', weight: int) -> None:
    """Minimize idle gaps by preferring earlier slots.
    
    Simple and efficient approach: Add a small penalty for each class based on 
    its slot number. Classes in slot 1 have 0 penalty, slot 2 has weight*1, 
    slot 3 has weight*2, etc.
    
    This naturally pushes all classes towards earlier slots, filling from 
    slot 1 first, which eliminates gaps.
    """
    if 'idle_gaps' not in solver.penalties:
        solver.penalties['idle_gaps'] = []
    
    # Simple weighted cost: later slots cost more
    for (b_id, s_id, d, sl, r_id, f_id), var in solver.x.items():
        # Penalty increases with slot number (slot 1 = 0, slot 2 = weight, etc.)
        slot_penalty = (sl - 1) * weight
        if slot_penalty > 0:
            penalty = solver.model.NewIntVar(0, slot_penalty, f"slot_cost_{b_id}_{s_id}_{d}_{sl}_{r_id}_{f_id}")
            solver.model.Add(penalty == slot_penalty).OnlyEnforceIf(var)
            solver.model.Add(penalty == 0).OnlyEnforceIf(var.Not())
            solver.penalties['idle_gaps'].append(penalty)

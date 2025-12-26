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
    """Penalize consecutive classes for faculty (simplified)."""
    # Skip for now to ensure model validity
    pass


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
    """Encourage even distribution of subjects across the week (simplified)."""
    # Skip for now to ensure model validity
    pass


def add_minimize_idle_gaps(solver: 'TimetableSolver', weight: int) -> None:
    """Minimize idle gaps in faculty schedules (simplified)."""
    # Skip for now to ensure model validity
    pass

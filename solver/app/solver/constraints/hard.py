"""Hard constraints for timetable solver."""
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.solver.engine import TimetableSolver


def add_one_class_per_batch_slot(solver: 'TimetableSolver') -> int:
    """Each batch can have at most one class per time slot."""
    constraint_count = 0
    days = [d.value for d in solver.request.days]
    slots = range(1, solver.request.slots_per_day + 1)
    
    for batch in solver.request.batches:
        for day in days:
            for slot in slots:
                # Get all variables for this batch at this day/slot
                vars_at_slot = []
                for (b_id, s_id, d, sl, r_id, f_id), var in solver.x.items():
                    if b_id == batch.id and d == day and sl == slot:
                        vars_at_slot.append(var)
                
                if vars_at_slot:
                    solver.model.Add(sum(vars_at_slot) <= 1)
                    constraint_count += 1
    
    return constraint_count


def add_one_class_per_room_slot(solver: 'TimetableSolver') -> int:
    """Each room can have at most one class per time slot."""
    constraint_count = 0
    days = [d.value for d in solver.request.days]
    slots = range(1, solver.request.slots_per_day + 1)
    
    for room in solver.request.rooms:
        for day in days:
            for slot in slots:
                vars_at_slot = []
                for (b_id, s_id, d, sl, r_id, f_id), var in solver.x.items():
                    if r_id == room.id and d == day and sl == slot:
                        vars_at_slot.append(var)
                
                if vars_at_slot:
                    solver.model.Add(sum(vars_at_slot) <= 1)
                    constraint_count += 1
    
    return constraint_count


def add_one_class_per_faculty_slot(solver: 'TimetableSolver') -> int:
    """Each faculty can teach at most one class per time slot."""
    constraint_count = 0
    days = [d.value for d in solver.request.days]
    slots = range(1, solver.request.slots_per_day + 1)
    
    for faculty in solver.request.faculties:
        for day in days:
            for slot in slots:
                vars_at_slot = []
                for (b_id, s_id, d, sl, r_id, f_id), var in solver.x.items():
                    if f_id == faculty.id and d == day and sl == slot:
                        vars_at_slot.append(var)
                
                if vars_at_slot:
                    solver.model.Add(sum(vars_at_slot) <= 1)
                    constraint_count += 1
    
    return constraint_count


def add_classes_per_week_requirement(solver: 'TimetableSolver') -> int:
    """Each batch must have exactly the required number of classes per subject per week."""
    constraint_count = 0
    
    for batch in solver.request.batches:
        for batch_subject in batch.subjects:
            # Get all variables for this batch-subject combination
            subject_vars = []
            for (b_id, s_id, d, sl, r_id, f_id), var in solver.x.items():
                if b_id == batch.id and s_id == batch_subject.subject_id:
                    subject_vars.append(var)
            
            if subject_vars:
                solver.model.Add(sum(subject_vars) == batch_subject.classes_per_week)
                constraint_count += 1
    
    return constraint_count


def add_faculty_unavailability(solver: 'TimetableSolver') -> int:
    """Respect faculty unavailability constraints."""
    constraint_count = 0
    
    for faculty in solver.request.faculties:
        for unavailable in faculty.unavailable_slots:
            day = unavailable.day.value
            slot = unavailable.slot
            
            # Block all variables for this faculty at this day/slot
            for (b_id, s_id, d, sl, r_id, f_id), var in solver.x.items():
                if f_id == faculty.id and d == day and sl == slot:
                    solver.model.Add(var == 0)
                    constraint_count += 1
    
    return constraint_count


def add_fixed_slots(solver: 'TimetableSolver') -> int:
    """Enforce fixed slot assignments."""
    constraint_count = 0
    
    for fixed in solver.request.fixed_slots:
        day = fixed.day.value
        slot = fixed.slot
        
        # Find the matching variable and set it to 1
        for (b_id, s_id, d, sl, r_id, f_id), var in solver.x.items():
            if (b_id == fixed.batch_id and s_id == fixed.subject_id and 
                d == day and sl == slot):
                
                # Check if faculty and room match (if specified)
                if fixed.faculty_id and f_id != fixed.faculty_id:
                    solver.model.Add(var == 0)
                elif fixed.room_id and r_id != fixed.room_id:
                    solver.model.Add(var == 0)
                else:
                    solver.model.Add(var == 1)
                constraint_count += 1
    
    return constraint_count


def add_max_daily_classes_per_batch(solver: 'TimetableSolver') -> int:
    """Limit maximum classes per day for each batch."""
    constraint_count = 0
    max_classes = solver.request.constraints.hard.max_classes_per_day_batch
    days = [d.value for d in solver.request.days]
    
    for batch in solver.request.batches:
        for day in days:
            vars_for_day = []
            for (b_id, s_id, d, sl, r_id, f_id), var in solver.x.items():
                if b_id == batch.id and d == day:
                    vars_for_day.append(var)
            
            if vars_for_day:
                solver.model.Add(sum(vars_for_day) <= max_classes)
                constraint_count += 1
    
    return constraint_count

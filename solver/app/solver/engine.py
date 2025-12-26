"""Main timetable optimization solver using OR-Tools CP-SAT."""
from ortools.sat.python import cp_model
from typing import List, Dict, Tuple
import time

from app.models.request import (
    SolverRequest, FacultyInput, RoomInput, BatchInput, SubjectInput
)
from app.models.response import (
    SolverResponse, TimetableSolution, TimetableEvent, 
    SolverStatus, TimetableMetrics
)
from app.utils.logger import solver_logger as logger


class TimetableSolver:
    """Main timetable optimization solver using OR-Tools CP-SAT."""
    
    def __init__(self, request: SolverRequest):
        """Initialize solver with input data."""
        self.request = request
        self.model = cp_model.CpModel()
        self.solver = cp_model.CpSolver()
        
        # Index mappings
        self.faculty_idx: Dict[str, int] = {}
        self.room_idx: Dict[str, int] = {}
        self.subject_idx: Dict[str, int] = {}
        self.batch_idx: Dict[str, int] = {}
        
        # Decision variables: x[batch, subject, day, slot, room, faculty] = BoolVar
        self.x: Dict[Tuple, cp_model.IntVar] = {}
        
        # Penalty variables for soft constraints
        self.penalties: Dict[str, List[cp_model.IntVar]] = {}
        
        # Statistics
        self.stats: Dict = {}
        
        logger.info(f"Solver initialized: {len(request.batches)} batches, "
                   f"{len(request.faculties)} faculties, {len(request.rooms)} rooms")
    
    def _build_indexes(self):
        """Create index mappings for all entities."""
        self.faculty_idx = {f.id: i for i, f in enumerate(self.request.faculties)}
        self.room_idx = {r.id: i for i, r in enumerate(self.request.rooms)}
        self.subject_idx = {s.id: i for i, s in enumerate(self.request.subjects)}
        self.batch_idx = {b.id: i for i, b in enumerate(self.request.batches)}
    
    def _create_variables(self):
        """Create decision variables for the model."""
        logger.info("Creating decision variables...")
        
        variable_count = 0
        days = [d.value for d in self.request.days]
        slots = range(1, self.request.slots_per_day + 1)
        
        for batch in self.request.batches:
            for batch_subject in batch.subjects:
                subject = self._get_subject(batch_subject.subject_id)
                if not subject:
                    continue
                    
                qualified_faculties = self._get_qualified_faculties(subject.id, batch_subject.assigned_faculty_id)
                suitable_rooms = self._get_suitable_rooms(batch, subject)
                
                if not qualified_faculties or not suitable_rooms:
                    logger.warning(f"No faculty/room for {batch.code}-{subject.code}")
                    continue
                
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
        
        from app.solver.constraints.hard import (
            add_one_class_per_batch_slot,
            add_one_class_per_room_slot,
            add_one_class_per_faculty_slot,
            add_classes_per_week_requirement,
            add_faculty_unavailability,
            add_fixed_slots,
            add_max_daily_classes_per_batch
        )
        
        constraint_count = 0
        constraint_count += add_one_class_per_batch_slot(self)
        constraint_count += add_one_class_per_room_slot(self)
        constraint_count += add_one_class_per_faculty_slot(self)
        constraint_count += add_classes_per_week_requirement(self)
        constraint_count += add_faculty_unavailability(self)
        constraint_count += add_fixed_slots(self)
        constraint_count += add_max_daily_classes_per_batch(self)
        
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
        all_penalties = []
        for penalty_list in self.penalties.values():
            all_penalties.extend(penalty_list)
        
        if all_penalties:
            self.model.Minimize(sum(all_penalties))
            logger.info(f"Objective: minimize {len(all_penalties)} penalty terms")
        else:
            logger.info("No soft constraints, using satisfiability mode")
    
    def _configure_solver(self):
        """Configure solver parameters."""
        config = self.request.config
        self.solver.parameters.max_time_in_seconds = config.timeout_seconds
        self.solver.parameters.num_search_workers = config.num_workers
        logger.info(f"Solver: timeout={config.timeout_seconds}s, workers={config.num_workers}")
    
    def solve(self) -> SolverResponse:
        """Execute the solver and return results."""
        start_time = time.time()
        
        try:
            self._build_indexes()
            self._create_variables()
            
            if not self.x:
                return SolverResponse(
                    status=SolverStatus.ERROR,
                    message="No valid class assignments possible",
                    solve_time_seconds=time.time() - start_time
                )
            
            self._add_hard_constraints()
            self._add_soft_constraints()
            self._build_objective()
            self._configure_solver()
            
            logger.info("Starting solver...")
            status = self.solver.Solve(self.model)
            solve_time = time.time() - start_time
            
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
            
            else:
                # Status could be MODEL_INVALID or UNKNOWN
                status_name = {
                    cp_model.UNKNOWN: "UNKNOWN",
                    cp_model.MODEL_INVALID: "MODEL_INVALID"
                }.get(status, f"STATUS_{status}")
                logger.warning(f"Solver returned {status_name} after {solve_time:.2f}s")
                
                # For UNKNOWN, the model might be valid but no solution found in time
                return SolverResponse(
                    status=SolverStatus.TIMEOUT,
                    message=f"Solver returned {status_name} - check constraints",
                    solve_time_seconds=solve_time,
                    statistics=self.stats
                )
                
        except Exception as e:
            logger.error(f"Solver error: {str(e)}")
            return SolverResponse(
                status=SolverStatus.ERROR,
                message=f"Solver error: {str(e)}",
                solve_time_seconds=time.time() - start_time
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
                    batch_code=batch.code if batch else "",
                    subject_id=subject_id,
                    subject_code=subject.code if subject else "",
                    faculty_id=faculty_id,
                    faculty_name=faculty.name if faculty else "",
                    room_id=room_id,
                    room_code=room.code if room else ""
                ))
        
        score = self._calculate_score()
        
        return TimetableSolution(
            score=score,
            events=events,
            violations={"hard": 0, "soft": int(self.solver.ObjectiveValue()) if self.penalties else 0},
            metrics=TimetableMetrics()
        )
    
    # Helper methods
    def _get_faculty(self, faculty_id: str) -> FacultyInput:
        return next((f for f in self.request.faculties if f.id == faculty_id), None)
    
    def _get_room(self, room_id: str) -> RoomInput:
        return next((r for r in self.request.rooms if r.id == room_id), None)
    
    def _get_subject(self, subject_id: str) -> SubjectInput:
        return next((s for s in self.request.subjects if s.id == subject_id), None)
    
    def _get_batch(self, batch_id: str) -> BatchInput:
        return next((b for b in self.request.batches if b.id == batch_id), None)
    
    def _get_qualified_faculties(self, subject_id: str, assigned_id: str = None) -> List[FacultyInput]:
        if assigned_id:
            faculty = self._get_faculty(assigned_id)
            return [faculty] if faculty else []
        return [f for f in self.request.faculties if subject_id in f.subject_ids]
    
    def _get_suitable_rooms(self, batch: BatchInput, subject: SubjectInput) -> List[RoomInput]:
        rooms = []
        for room in self.request.rooms:
            if room.capacity >= batch.size:
                room_type = room.type.value if hasattr(room.type, 'value') else str(room.type)
                if subject.is_lab and room_type != 'lab':
                    continue
                rooms.append(room)
        return rooms
    
    def _calculate_score(self) -> float:
        if not self.penalties or self.solver.ObjectiveValue() == 0:
            return 1.0
        return max(0.0, 1.0 - (self.solver.ObjectiveValue() / 1000))

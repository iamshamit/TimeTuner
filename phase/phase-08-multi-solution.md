# 📋 PHASE 8: Python Solver - Multi-Solution & Scoring

> **Duration:** 2-3 days  
> **Dependencies:** Phase 7

---

## 🎯 Phase Objectives

Generate multiple timetable solutions, score them based on quality metrics, and return the best options.

---

## 📑 Task Breakdown

---

### 8.1-8.2 Solution Callback & Multiple Generation

```python
# app/solver/solution_collector.py
from ortools.sat.python import cp_model
from typing import List, Dict, Tuple, TYPE_CHECKING
from app.models.response import TimetableSolution, TimetableEvent, TimetableMetrics
from app.utils.logger import solver_logger as logger

if TYPE_CHECKING:
    from app.solver.engine import TimetableSolver


class SolutionCollector(cp_model.CpSolverSolutionCallback):
    """Collects multiple solutions during solving."""
    
    def __init__(self, solver_instance: 'TimetableSolver', max_solutions: int = 5):
        super().__init__()
        self.solver_instance = solver_instance
        self.max_solutions = max_solutions
        self.solutions: List[TimetableSolution] = []
        self.solution_count = 0
    
    def on_solution_callback(self):
        """Called when a solution is found."""
        self.solution_count += 1
        
        # Extract current solution
        events = self._extract_events()
        score = self._calculate_score()
        metrics = self._calculate_metrics(events)
        violations = self._count_violations()
        
        solution = TimetableSolution(
            score=score,
            events=events,
            violations=violations,
            metrics=metrics
        )
        
        self.solutions.append(solution)
        logger.info(f"Solution {self.solution_count} found: score={score:.3f}")
        
        if self.solution_count >= self.max_solutions:
            logger.info(f"Reached max solutions ({self.max_solutions}), stopping")
            self.StopSearch()
    
    def _extract_events(self) -> List[TimetableEvent]:
        """Extract timetable events from current solution."""
        events = []
        
        for (b, s, d, sl, r, f), var in self.solver_instance.x.items():
            if self.Value(var) == 1:
                batch = self._get_entity('batch', b)
                subject = self._get_entity('subject', s)
                faculty = self._get_entity('faculty', f)
                room = self._get_entity('room', r)
                
                events.append(TimetableEvent(
                    day=d,
                    slot=sl,
                    batch_id=b,
                    batch_code=batch.code,
                    subject_id=s,
                    subject_code=subject.code,
                    faculty_id=f,
                    faculty_name=faculty.name,
                    room_id=r,
                    room_code=room.code
                ))
        
        return events
    
    def _get_entity(self, entity_type: str, entity_id: str):
        """Get entity by type and ID."""
        req = self.solver_instance.request
        if entity_type == 'batch':
            return next(b for b in req.batches if b.id == entity_id)
        elif entity_type == 'subject':
            return next(s for s in req.subjects if s.id == entity_id)
        elif entity_type == 'faculty':
            return next(f for f in req.faculties if f.id == entity_id)
        elif entity_type == 'room':
            return next(r for r in req.rooms if r.id == entity_id)
    
    def _calculate_score(self) -> float:
        """Calculate quality score (0-1, higher is better)."""
        obj_value = self.ObjectiveValue()
        if obj_value <= 0:
            return 1.0
        # Normalize: assume max penalty = 1000
        normalized = max(0.0, 1.0 - (obj_value / 1000))
        return round(normalized, 3)
    
    def _calculate_metrics(self, events: List[TimetableEvent]) -> TimetableMetrics:
        """Calculate detailed quality metrics."""
        return TimetableMetricsCalculator(
            events, self.solver_instance.request
        ).calculate()
    
    def _count_violations(self) -> Dict[str, int]:
        """Count constraint violations."""
        soft_count = 0
        for penalty_list in self.solver_instance.penalties.values():
            for penalty_var in penalty_list:
                if self.Value(penalty_var) > 0:
                    soft_count += 1
        return {"hard": 0, "soft": soft_count}
```

---

### 8.3-8.5 Solution Scoring & Quality Metrics

```python
# app/solver/metrics.py
from typing import List, Dict
from collections import defaultdict
from statistics import stdev, mean
from app.models.request import SolverRequest
from app.models.response import TimetableEvent, TimetableMetrics


class TimetableMetricsCalculator:
    """Calculate quality metrics for a timetable solution."""
    
    def __init__(self, events: List[TimetableEvent], request: SolverRequest):
        self.events = events
        self.request = request
    
    def calculate(self) -> TimetableMetrics:
        """Calculate all metrics."""
        return TimetableMetrics(
            faculty_load_variance=self._faculty_load_variance(),
            room_utilization_percent=self._room_utilization(),
            avg_daily_classes_per_batch=self._avg_daily_classes(),
            faculty_idle_gaps=self._count_idle_gaps(),
            classes_in_preferred_slots=self._preferred_slot_count()
        )
    
    def _faculty_load_variance(self) -> float:
        """Calculate variance in faculty daily loads."""
        faculty_daily_loads: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
        
        for event in self.events:
            faculty_daily_loads[event.faculty_id][event.day] += 1
        
        all_variances = []
        for faculty_id, daily_loads in faculty_daily_loads.items():
            loads = list(daily_loads.values())
            if len(loads) >= 2:
                all_variances.append(stdev(loads))
        
        return round(mean(all_variances) if all_variances else 0.0, 2)
    
    def _room_utilization(self) -> float:
        """Calculate average room utilization percentage."""
        total_slots = len(self.request.days) * self.request.slots_per_day
        rooms_used = len(set(e.room_id for e in self.events))
        
        if rooms_used == 0:
            return 0.0
        
        events_per_room = len(self.events) / rooms_used
        utilization = (events_per_room / total_slots) * 100
        return round(min(utilization, 100.0), 1)
    
    def _avg_daily_classes(self) -> float:
        """Calculate average classes per day per batch."""
        batch_daily: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
        
        for event in self.events:
            batch_daily[event.batch_id][event.day] += 1
        
        daily_counts = []
        for batch_id, days in batch_daily.items():
            daily_counts.extend(days.values())
        
        return round(mean(daily_counts) if daily_counts else 0.0, 1)
    
    def _count_idle_gaps(self) -> int:
        """Count total idle gaps for all faculty."""
        gaps = 0
        faculty_schedule: Dict[str, Dict[str, List[int]]] = defaultdict(lambda: defaultdict(list))
        
        for event in self.events:
            faculty_schedule[event.faculty_id][event.day].append(event.slot)
        
        for faculty_id, days in faculty_schedule.items():
            for day, slots in days.items():
                sorted_slots = sorted(slots)
                for i in range(len(sorted_slots) - 1):
                    gap = sorted_slots[i + 1] - sorted_slots[i] - 1
                    gaps += gap
        
        return gaps
    
    def _preferred_slot_count(self) -> int:
        """Count classes scheduled in faculty preferred slots."""
        count = 0
        
        faculty_prefs = {}
        for f in self.request.faculties:
            if f.preferences and f.preferences.preferred_slots:
                faculty_prefs[f.id] = {
                    (p.day.value, p.slot) for p in f.preferences.preferred_slots
                }
        
        for event in self.events:
            if event.faculty_id in faculty_prefs:
                if (event.day, event.slot) in faculty_prefs[event.faculty_id]:
                    count += 1
        
        return count
```

---

### 8.6-8.8 Solution Comparison & Selection

```python
# app/solver/solution_comparator.py
from typing import List
from app.models.response import TimetableSolution


def compare_and_rank_solutions(solutions: List[TimetableSolution]) -> List[TimetableSolution]:
    """
    Rank solutions by quality.
    
    Primary: Score (higher is better)
    Secondary: Fewer soft violations
    Tertiary: Better metrics
    """
    def solution_key(sol: TimetableSolution):
        return (
            -sol.score,  # Negative for descending (higher score first)
            sol.violations.get('soft', 0),
            sol.metrics.faculty_load_variance,
            sol.metrics.faculty_idle_gaps
        )
    
    sorted_solutions = sorted(solutions, key=solution_key)
    return sorted_solutions


def get_best_solution_index(solutions: List[TimetableSolution]) -> int:
    """Get index of the best solution."""
    if not solutions:
        return 0
    
    best_score = -1
    best_idx = 0
    
    for i, sol in enumerate(solutions):
        if sol.score > best_score:
            best_score = sol.score
            best_idx = i
    
    return best_idx
```

---

### 8.9-8.10 Performance & Memory Optimization

```python
# Optimization techniques in engine.py

class TimetableSolver:
    # ... existing code ...
    
    def solve_multiple(self) -> SolverResponse:
        """Generate multiple solutions using different strategies."""
        start_time = time.time()
        all_solutions = []
        
        # Strategy 1: Standard solve
        solution1 = self._solve_once()
        if solution1:
            all_solutions.extend(solution1)
        
        # Strategy 2: Perturbed weights
        if len(all_solutions) < self.request.config.max_solutions:
            perturbed = self._solve_with_perturbation()
            all_solutions.extend(perturbed)
        
        # Remove duplicates and rank
        unique_solutions = self._deduplicate_solutions(all_solutions)
        ranked_solutions = compare_and_rank_solutions(unique_solutions)
        
        # Take top N
        top_solutions = ranked_solutions[:self.request.config.max_solutions]
        
        return SolverResponse(
            status=SolverStatus.OPTIMAL if top_solutions else SolverStatus.INFEASIBLE,
            message=f"Found {len(top_solutions)} solutions",
            solve_time_seconds=time.time() - start_time,
            solutions=top_solutions,
            best_solution_index=0,
            statistics=self.stats
        )
    
    def _solve_with_perturbation(self) -> List[TimetableSolution]:
        """Solve with randomly perturbed weights."""
        import random
        
        # Randomly adjust weights by ±20%
        original_weights = {}
        for name, config in vars(self.request.constraints.soft).items():
            if hasattr(config, 'weight'):
                original_weights[name] = config.weight
                config.weight = int(config.weight * random.uniform(0.8, 1.2))
        
        # Rebuild and solve
        self._add_soft_constraints()
        self._build_objective()
        
        collector = SolutionCollector(self, max_solutions=2)
        status = self.solver.Solve(self.model, collector)
        
        # Restore weights
        for name, weight in original_weights.items():
            getattr(self.request.constraints.soft, name).weight = weight
        
        return collector.solutions
    
    def _deduplicate_solutions(self, solutions: List[TimetableSolution]) -> List[TimetableSolution]:
        """Remove duplicate solutions based on event fingerprints."""
        seen_fingerprints = set()
        unique = []
        
        for sol in solutions:
            # Create fingerprint from events
            fingerprint = frozenset(
                (e.batch_id, e.subject_id, e.day, e.slot, e.room_id, e.faculty_id)
                for e in sol.events
            )
            
            if fingerprint not in seen_fingerprints:
                seen_fingerprints.add(fingerprint)
                unique.append(sol)
        
        return unique
```

---

## ✅ Phase 8 Completion Checklist

```
□ SolutionCollector callback implemented
□ Multiple solution generation working
□ Solution scoring algorithm complete
□ Quality metrics calculated
□ Violation counting working
□ Solution comparison and ranking
□ Top-N solution selection
□ Solution serialization for API
□ Performance benchmarks acceptable
□ Memory usage optimized
□ Tests for multi-solution
□ Changes committed to Git
```

---

## ⏭️ Next Phase

Proceed to **Phase 9: Node.js ↔ Python Integration**

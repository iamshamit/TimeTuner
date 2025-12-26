"""API routes for the solver service."""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Optional
import uuid

from app.models.request import SolverRequest
from app.models.response import SolverResponse, SolverStatus, SolverProgress
from app.solver.engine import TimetableSolver
from app.utils.logger import api_logger as logger

router = APIRouter()

# In-memory job storage (use Redis in production)
jobs: dict = {}


@router.post("/solve", response_model=SolverResponse)
async def solve_timetable(request: SolverRequest):
    """
    Solve timetable synchronously.
    
    Returns the solution directly. Use for small problems.
    For larger problems, use /solve/async endpoint.
    """
    logger.info(f"Received solve request: {len(request.batches)} batches, "
                f"{len(request.faculties)} faculties")
    
    try:
        solver = TimetableSolver(request)
        response = solver.solve()
        
        logger.info(f"Solve complete: status={response.status}, "
                   f"time={response.solve_time_seconds:.2f}s")
        
        return response
        
    except Exception as e:
        logger.error(f"Solve error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/solve/async")
async def solve_timetable_async(
    request: SolverRequest, 
    background_tasks: BackgroundTasks
):
    """
    Start async timetable solving.
    
    Returns job_id immediately. Use /solve/status/{job_id} to check progress.
    """
    job_id = str(uuid.uuid4())
    
    jobs[job_id] = {
        "status": SolverStatus.PENDING,
        "progress": 0,
        "result": None
    }
    
    background_tasks.add_task(run_solver_job, job_id, request)
    
    logger.info(f"Started async job: {job_id}")
    
    return {"job_id": job_id, "status": "pending"}


async def run_solver_job(job_id: str, request: SolverRequest):
    """Background task to run solver."""
    try:
        jobs[job_id]["status"] = SolverStatus.RUNNING
        jobs[job_id]["progress"] = 10
        
        solver = TimetableSolver(request)
        response = solver.solve()
        
        jobs[job_id]["status"] = response.status
        jobs[job_id]["progress"] = 100
        jobs[job_id]["result"] = response
        
        logger.info(f"Job {job_id} complete: {response.status}")
        
    except Exception as e:
        jobs[job_id]["status"] = SolverStatus.ERROR
        jobs[job_id]["error"] = str(e)
        logger.error(f"Job {job_id} error: {str(e)}")


@router.get("/solve/status/{job_id}")
async def get_job_status(job_id: str):
    """Get status of an async solve job."""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = jobs[job_id]
    
    return SolverProgress(
        job_id=job_id,
        progress_percent=job.get("progress", 0),
        current_best_score=None,
        solutions_found=1 if job.get("result") else 0,
        elapsed_seconds=0,
        status=job["status"]
    )


@router.get("/solve/result/{job_id}", response_model=SolverResponse)
async def get_job_result(job_id: str):
    """Get result of a completed async solve job."""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = jobs[job_id]
    
    if job["status"] not in [SolverStatus.OPTIMAL, SolverStatus.FEASIBLE, 
                              SolverStatus.INFEASIBLE, SolverStatus.TIMEOUT, 
                              SolverStatus.ERROR]:
        raise HTTPException(status_code=202, detail="Job still running")
    
    if job.get("result"):
        return job["result"]
    
    return SolverResponse(
        status=job["status"],
        message=job.get("error", "Job completed without result"),
        solve_time_seconds=0
    )


@router.delete("/solve/cancel/{job_id}")
async def cancel_job(job_id: str):
    """Cancel a running solve job."""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Note: Actual cancellation of OR-Tools solver is complex
    # This just marks the job as cancelled
    jobs[job_id]["status"] = "cancelled"
    
    return {"job_id": job_id, "status": "cancelled"}


@router.post("/validate")
async def validate_input(request: SolverRequest):
    """
    Validate solver input without solving.
    
    Checks for data consistency and potential issues.
    """
    issues = []
    
    # Check subjects referenced by batches exist
    subject_ids = {s.id for s in request.subjects}
    for batch in request.batches:
        for bs in batch.subjects:
            if bs.subject_id not in subject_ids:
                issues.append(f"Batch {batch.code}: unknown subject {bs.subject_id}")
    
    # Check faculties have subjects they can teach
    for faculty in request.faculties:
        valid_subjects = [s for s in faculty.subject_ids if s in subject_ids]
        if not valid_subjects:
            issues.append(f"Faculty {faculty.name}: no valid subjects assigned")
    
    # Check room capacity vs batch sizes
    max_batch_size = max((b.size for b in request.batches), default=0)
    max_room_capacity = max((r.capacity for r in request.rooms), default=0)
    if max_batch_size > max_room_capacity:
        issues.append(f"Largest batch ({max_batch_size}) exceeds largest room ({max_room_capacity})")
    
    # Check for lab rooms if there are lab subjects
    has_labs = any(s.is_lab for s in request.subjects)
    has_lab_rooms = any(r.type.value == 'lab' for r in request.rooms)
    if has_labs and not has_lab_rooms:
        issues.append("Lab subjects exist but no lab rooms available")
    
    return {
        "valid": len(issues) == 0,
        "issues": issues,
        "summary": {
            "faculties": len(request.faculties),
            "rooms": len(request.rooms),
            "subjects": len(request.subjects),
            "batches": len(request.batches),
            "total_classes_per_week": sum(
                sum(bs.classes_per_week for bs in b.subjects)
                for b in request.batches
            )
        }
    }

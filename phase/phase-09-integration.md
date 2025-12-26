# 📋 PHASE 9: Node.js ↔ Python Integration

> **Duration:** 3-4 days  
> **Dependencies:** Phase 4, Phase 8

---

## 🎯 Phase Objectives

Connect the Node.js backend to the Python solver using REST API communication and implement job queue for long-running solver tasks.

---

## 📑 Task Breakdown

---

### 9.1-9.3 Inter-Service Communication & Job Queue

```bash
# Install dependencies in backend
npm install axios bullmq ioredis
```

```javascript
// services/solverClient.js
const axios = require('axios');
const { AppError } = require('../utils/appError');

class SolverClient {
  constructor() {
    this.baseURL = process.env.SOLVER_URL || 'http://localhost:8000';
    this.timeout = parseInt(process.env.SOLVER_TIMEOUT) || 300000; // 5 min
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  async checkHealth() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      throw new AppError('Solver service unavailable', 503);
    }
  }
  
  async solve(inputData) {
    try {
      const response = await this.client.post('/api/v1/solve', inputData);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new AppError(
          error.response.data.message || 'Solver error',
          error.response.status
        );
      }
      throw new AppError('Failed to connect to solver', 503);
    }
  }
}

module.exports = new SolverClient();
```

```javascript
// config/queue.js
const { Queue, Worker, QueueEvents } = require('bullmq');
const Redis = require('ioredis');

const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null
});

// Solver job queue
const solverQueue = new Queue('solver-jobs', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 50
  }
});

// Queue events for monitoring
const solverQueueEvents = new QueueEvents('solver-jobs', {
  connection: redisConnection
});

module.exports = { solverQueue, solverQueueEvents, redisConnection };
```

---

### 9.4-9.6 Solver Job Schema & Data Aggregation

```javascript
// services/solverJobService.js
const SolverJob = require('../models/SolverJob');
const Timetable = require('../models/Timetable');
const { Faculty, Room, Subject, Batch, TimeSlot, Constraint, FixedSlot } = require('../models');
const { solverQueue } = require('../config/queue');
const SolverClient = require('./solverClient');
const { AppError } = require('../utils/appError');

class SolverJobService {
  
  /**
   * Create a new solver job and queue it.
   */
  async createJob(userId, department, semester, options = {}) {
    // 1. Aggregate input data
    const inputData = await this.aggregateInputData(department, semester);
    
    // 2. Create job record
    const job = await SolverJob.create({
      name: `Timetable for ${department} Sem ${semester}`,
      requestedBy: userId,
      department: department,
      semester: semester,
      status: 'pending',
      inputData: {
        batches: inputData.batchIds,
        faculties: inputData.facultyIds,
        rooms: inputData.roomIds,
        subjects: inputData.subjectIds,
        constraints: options.constraintId,
        fixedSlots: options.fixedSlotId,
        timeSlots: options.timeSlotId
      },
      config: {
        timeout: options.timeout || 300,
        maxSolutions: options.maxSolutions || 5,
        weights: options.weights || {}
      }
    });
    
    // 3. Add to queue
    await solverQueue.add('solve', {
      jobId: job._id.toString(),
      solverInput: inputData.solverPayload
    }, {
      jobId: job._id.toString()
    });
    
    return job;
  }
  
  /**
   * Aggregate all data needed for solver.
   */
  async aggregateInputData(departmentId, semester) {
    // Fetch all entities
    const [batches, faculties, rooms, subjects, timeSlotConfig, constraints] = await Promise.all([
      Batch.find({ 
        department: departmentId, 
        semester: semester,
        isActive: true 
      }).populate('subjects.subject'),
      
      Faculty.find({ 
        department: departmentId, 
        isActive: true 
      }).populate('subjects'),
      
      Room.find({ isActive: true }),
      
      Subject.find({ 
        department: departmentId, 
        semester: semester,
        isActive: true 
      }),
      
      TimeSlot.findOne({ 
        $or: [{ department: departmentId }, { isDefault: true }],
        isActive: true 
      }),
      
      Constraint.findOne({
        $or: [{ department: departmentId }, { isDefault: true }],
        isActive: true
      })
    ]);
    
    // Transform to solver format
    const solverPayload = {
      faculties: faculties.map(f => ({
        id: f._id.toString(),
        name: f.name,
        department_id: f.department.toString(),
        subject_ids: f.subjects.map(s => s._id.toString()),
        max_daily_classes: f.maxDailyClasses,
        max_weekly_classes: f.maxWeeklyClasses,
        unavailable_slots: f.unavailableSlots.map(u => ({
          day: u.day,
          slot: u.slot
        })),
        preferences: f.preferences ? {
          preferred_slots: f.preferences.preferredSlots || [],
          avoid_consecutive: f.preferences.avoidConsecutive || false
        } : null
      })),
      
      rooms: rooms.map(r => ({
        id: r._id.toString(),
        code: r.code,
        capacity: r.capacity,
        type: r.type,
        department_id: r.department?.toString() || null,
        unavailable_slots: r.unavailableSlots || []
      })),
      
      subjects: subjects.map(s => ({
        id: s._id.toString(),
        code: s.code,
        name: s.name,
        department_id: s.department.toString(),
        is_lab: s.isLab,
        credits: s.credits
      })),
      
      batches: batches.map(b => ({
        id: b._id.toString(),
        code: b.code,
        department_id: b.department.toString(),
        semester: b.semester,
        size: b.size,
        subjects: b.subjects.map(bs => ({
          subject_id: bs.subject._id.toString(),
          classes_per_week: bs.classesPerWeek,
          assigned_faculty_id: bs.assignedFaculty?.toString()
        }))
      })),
      
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      slots_per_day: timeSlotConfig?.slots?.length || 6,
      time_slots: timeSlotConfig?.slots || [],
      
      constraints: {
        hard: constraints?.constraints?.hard || {},
        soft: constraints?.constraints?.soft || {}
      },
      
      fixed_slots: [],
      
      config: {
        timeout_seconds: 300,
        max_solutions: 5,
        num_workers: 4
      }
    };
    
    return {
      solverPayload,
      batchIds: batches.map(b => b._id),
      facultyIds: faculties.map(f => f._id),
      roomIds: rooms.map(r => r._id),
      subjectIds: subjects.map(s => s._id)
    };
  }
  
  /**
   * Get job status.
   */
  async getJobStatus(jobId) {
    const job = await SolverJob.findById(jobId);
    if (!job) throw new AppError('Job not found', 404);
    return job;
  }
}

module.exports = new SolverJobService();
```

---

### 9.7-9.11 Worker, Status Tracking & Result Storage

```javascript
// workers/solverWorker.js
const { Worker } = require('bullmq');
const { redisConnection } = require('../config/queue');
const SolverJob = require('../models/SolverJob');
const Timetable = require('../models/Timetable');
const SolverClient = require('../services/solverClient');

const solverWorker = new Worker('solver-jobs', async (job) => {
  const { jobId, solverInput } = job.data;
  console.log(`Processing solver job: ${jobId}`);
  
  try {
    // Update status to running
    await SolverJob.findByIdAndUpdate(jobId, {
      status: 'running',
      startedAt: new Date(),
      progress: 10
    });
    
    // Call Python solver
    const result = await SolverClient.solve(solverInput);
    
    // Update progress
    await SolverJob.findByIdAndUpdate(jobId, { progress: 80 });
    
    if (result.status === 'optimal' || result.status === 'feasible') {
      // Save timetables
      const timetables = await Promise.all(
        result.solutions.map(async (sol, idx) => {
          return await Timetable.create({
            name: `Generated Option ${idx + 1}`,
            department: solverInput.batches[0]?.department_id,
            semester: solverInput.batches[0]?.semester,
            score: sol.score,
            status: 'draft',
            events: sol.events.map(e => ({
              day: e.day,
              slot: e.slot,
              batch: e.batch_id,
              subject: e.subject_id,
              faculty: e.faculty_id,
              room: e.room_id,
              duration: e.duration || 1
            })),
            violations: sol.violations,
            metadata: { generatedBy: 'solver', solverJob: jobId }
          });
        })
      );
      
      // Update job with results
      await SolverJob.findByIdAndUpdate(jobId, {
        status: 'completed',
        progress: 100,
        completedAt: new Date(),
        results: timetables.map((tt, idx) => ({
          score: result.solutions[idx].score,
          timetable: tt._id,
          violations: result.solutions[idx].violations
        }))
      });
      
      return { success: true, timetableCount: timetables.length };
      
    } else {
      // Solver failed
      await SolverJob.findByIdAndUpdate(jobId, {
        status: 'failed',
        completedAt: new Date(),
        error: result.message || 'No feasible solution'
      });
      
      return { success: false, error: result.message };
    }
    
  } catch (error) {
    console.error(`Solver job ${jobId} failed:`, error);
    
    await SolverJob.findByIdAndUpdate(jobId, {
      status: 'failed',
      completedAt: new Date(),
      error: error.message
    });
    
    throw error;
  }
}, {
  connection: redisConnection,
  concurrency: 2  // Max 2 concurrent solver jobs
});

// Worker event handlers
solverWorker.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed:`, result);
});

solverWorker.on('failed', (job, error) => {
  console.error(`Job ${job?.id} failed:`, error.message);
});

module.exports = solverWorker;
```

---

### 9.12 API Routes for Solver

```javascript
// routes/solver.js
const express = require('express');
const router = express.Router();
const { protect, checkPermission } = require('../middleware/auth');
const SolverJobService = require('../services/solverJobService');
const Response = require('../utils/responseFormatter');

router.use(protect);

// Create solver job
router.post('/jobs', checkPermission('solver:run'), async (req, res, next) => {
  try {
    const { department, semester, options } = req.body;
    
    const job = await SolverJobService.createJob(
      req.user._id,
      department,
      semester,
      options
    );
    
    Response.created(res, {
      jobId: job._id,
      status: job.status,
      message: 'Solver job queued successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get job status
router.get('/jobs/:id', async (req, res, next) => {
  try {
    const job = await SolverJobService.getJobStatus(req.params.id);
    Response.success(res, job);
  } catch (error) {
    next(error);
  }
});

// Get all jobs for department
router.get('/jobs', async (req, res, next) => {
  try {
    const { department, status } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (status) filter.status = status;
    
    const jobs = await SolverJob.find(filter)
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('requestedBy', 'name email');
    
    Response.success(res, jobs);
  } catch (error) {
    next(error);
  }
});

// Cancel job
router.post('/jobs/:id/cancel', checkPermission('solver:cancel'), async (req, res, next) => {
  try {
    const job = await SolverJob.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled', completedAt: new Date() },
      { new: true }
    );
    Response.success(res, job, 'Job cancelled');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

---

## ✅ Phase 9 Completion Checklist

```
□ Redis installed and connected
□ BullMQ queue configured
□ Solver client service created
□ Data aggregation working
□ Solver job model complete
□ Worker processing jobs
□ Status tracking working
□ Result storage to Timetable model
□ Retry logic for failures
□ API routes implemented
□ Error handling complete
□ Integration tested end-to-end
□ Changes committed to Git
```

---

## ⏭️ Next Phase

Proceed to **Phase 10: Workflow & Approval System**

const express = require('express');
const router = express.Router();
const { protect, checkPermission } = require('../middleware/auth');
const SolverJobService = require('../services/solverJobService');
const SolverClient = require('../services/solverClient');
const SolverJob = require('../models/SolverJob');
const Response = require('../utils/responseFormatter');
const { catchAsync } = require('../utils/appError');

router.use(protect);

// Check solver health
router.get('/health', catchAsync(async (req, res) => {
    const health = await SolverClient.checkHealth();
    Response.success(res, health);
}));

// Create solver job
router.post('/jobs', checkPermission('solver:run'), catchAsync(async (req, res) => {
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
}));

// Get job status
router.get('/jobs/:id', catchAsync(async (req, res) => {
    const job = await SolverJobService.getJobStatus(req.params.id);
    Response.success(res, job);
}));

// Get all jobs
router.get('/jobs', catchAsync(async (req, res) => {
    const { department, status, limit } = req.query;
    const filter = {};

    if (department) filter.department = department;
    if (status) filter.status = status;

    // Non-admin users only see their own jobs
    if (req.user.role !== 'admin') {
        if (req.user.role === 'hod' && req.user.department) {
            filter.department = req.user.department;
        } else {
            filter.requestedBy = req.user._id;
        }
    }

    const jobs = await SolverJobService.getJobs(filter, parseInt(limit) || 20);
    Response.success(res, jobs);
}));

// Cancel job
router.post('/jobs/:id/cancel', checkPermission('solver:cancel'), catchAsync(async (req, res) => {
    const job = await SolverJobService.cancelJob(req.params.id);
    Response.success(res, job, 'Job cancelled');
}));

// Validate input without solving
router.post('/validate', checkPermission('solver:run'), catchAsync(async (req, res) => {
    const { department, semester } = req.body;

    const inputData = await SolverJobService.aggregateInputData(department, semester);
    const validation = await SolverClient.validate(inputData.solverPayload);

    Response.success(res, {
        ...validation,
        inputSummary: {
            batches: inputData.batches.length,
            faculties: inputData.facultyIds.length,
            rooms: inputData.roomIds.length,
            subjects: inputData.subjectIds.length
        }
    });
}));

module.exports = router;

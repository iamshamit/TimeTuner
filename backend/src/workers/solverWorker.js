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
            // Get department and semester from first batch
            const batchInfo = solverInput.batches[0];

            // Save timetables
            const timetables = await Promise.all(
                result.solutions.map(async (sol, idx) => {
                    return await Timetable.create({
                        name: `Generated Option ${idx + 1}`,
                        department: batchInfo?.department_id,
                        semester: batchInfo?.semester,
                        academicYear: new Date().getFullYear().toString(),
                        score: sol.score,
                        status: 'draft',
                        // Save time slots so timetable view can display correct times
                        timeSlots: {
                            slots: solverInput.time_slots.map(ts => ({
                                slotNumber: ts.slot_number,
                                startTime: ts.start_time,
                                endTime: ts.end_time,
                                isBreak: ts.is_break,
                                shift: ts.shift
                            }))
                        },
                        events: sol.events.map(e => ({
                            day: e.day,
                            slot: e.slot,
                            batch: e.batch_id,
                            subject: e.subject_id,
                            faculty: e.faculty_id,
                            room: e.room_id,
                            duration: e.duration || 1,
                            isFixed: e.is_fixed || false
                        })),
                        violations: sol.violations,
                        metadata: {
                            generatedBy: 'solver',
                            solverJob: jobId
                        }
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

            console.log(`Job ${jobId} completed: ${timetables.length} timetables generated`);
            return { success: true, timetableCount: timetables.length };

        } else {
            // Solver failed
            await SolverJob.findByIdAndUpdate(jobId, {
                status: 'failed',
                progress: 100,
                completedAt: new Date(),
                error: result.message || 'No feasible solution found'
            });

            console.log(`Job ${jobId} failed: ${result.message}`);
            return { success: false, error: result.message };
        }

    } catch (error) {
        console.error(`Solver job ${jobId} error:`, error.message);

        await SolverJob.findByIdAndUpdate(jobId, {
            status: 'failed',
            progress: 100,
            completedAt: new Date(),
            error: error.message
        });

        throw error;
    }
}, {
    connection: redisConnection,
    concurrency: 2
});

// Worker event handlers
solverWorker.on('completed', (job, result) => {
    console.log(`Worker: Job ${job.id} completed`, result);
});

solverWorker.on('failed', (job, error) => {
    console.error(`Worker: Job ${job?.id} failed:`, error.message);
});

solverWorker.on('error', (err) => {
    console.error('Worker error:', err);
});

module.exports = solverWorker;

const SolverJob = require('../models/SolverJob');
const Timetable = require('../models/Timetable');
const { Faculty, Room, Subject, Batch, TimeSlot, Constraint, FixedSlot } = require('../models');
const { solverQueue } = require('../config/queue');
const { AppError } = require('../utils/appError');

class SolverJobService {

    /**
     * Create a new solver job and queue it.
     */
    async createJob(userId, departmentId, semester, options = {}) {
        // Aggregate input data
        const inputData = await this.aggregateInputData(departmentId, semester);

        if (inputData.batches.length === 0) {
            throw new AppError('No batches found for this department/semester', 400);
        }

        // Create job record
        const job = await SolverJob.create({
            name: options.name || `Timetable Generation`,
            requestedBy: userId,
            department: departmentId,
            semester: semester,
            academicYear: options.academicYear || new Date().getFullYear().toString(),
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

        // Add to queue
        try {
            await solverQueue.add('solve', {
                jobId: job._id.toString(),
                solverInput: inputData.solverPayload
            }, {
                jobId: job._id.toString()
            });

            await SolverJob.findByIdAndUpdate(job._id, { status: 'queued' });
        } catch (queueError) {
            // If queue fails, update job status
            await SolverJob.findByIdAndUpdate(job._id, {
                status: 'failed',
                error: 'Failed to queue job: ' + queueError.message
            });
            throw new AppError('Failed to queue solver job', 503);
        }

        return job;
    }

    /**
     * Aggregate all data needed for solver.
     */
    async aggregateInputData(departmentId, semester) {
        const [batches, faculties, rooms, subjects, timeSlotConfig, constraints] = await Promise.all([
            Batch.find({
                department: departmentId,
                semester: semester,
                isActive: true
            }).populate('subjects.subject').populate('subjects.assignedFaculty'),

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
                max_daily_classes: f.maxDailyClasses || 4,
                max_weekly_classes: f.maxWeeklyClasses || 20,
                unavailable_slots: (f.unavailableSlots || []).map(u => ({
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
                unavailable_slots: (r.unavailableSlots || []).map(u => ({
                    day: u.day,
                    slot: u.slot
                }))
            })),

            subjects: subjects.map(s => ({
                id: s._id.toString(),
                code: s.code,
                name: s.name,
                department_id: s.department.toString(),
                is_lab: s.isLab || false,
                credits: s.credits || 3
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
                    assigned_faculty_id: bs.assignedFaculty?._id?.toString() || null
                }))
            })),

            days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            slots_per_day: timeSlotConfig?.slots?.filter(s => !s.isBreak)?.length || 6,
            time_slots: (timeSlotConfig?.slots || []).map(s => ({
                slot_number: s.slotNumber,
                start_time: s.startTime,
                end_time: s.endTime,
                is_break: s.isBreak || false
            })),

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
            batches: batches,
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
        const job = await SolverJob.findById(jobId)
            .populate('requestedBy', 'name email')
            .populate('department', 'code name')
            .populate('results.timetable');

        if (!job) throw new AppError('Job not found', 404);
        return job;
    }

    /**
     * Get all jobs for user/department.
     */
    async getJobs(filter = {}, limit = 20) {
        return SolverJob.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('requestedBy', 'name email')
            .populate('department', 'code name');
    }

    /**
     * Cancel a running job.
     */
    async cancelJob(jobId) {
        const job = await SolverJob.findById(jobId);
        if (!job) throw new AppError('Job not found', 404);

        if (!['pending', 'queued', 'running'].includes(job.status)) {
            throw new AppError('Job cannot be cancelled in current state', 400);
        }

        return SolverJob.findByIdAndUpdate(
            jobId,
            { status: 'cancelled', completedAt: new Date() },
            { new: true }
        );
    }
}

module.exports = new SolverJobService();

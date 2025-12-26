const mongoose = require('mongoose');

const solverJobSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true
    },
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: true
    },
    semester: Number,
    academicYear: String,
    status: {
        type: String,
        enum: ['pending', 'queued', 'running', 'completed', 'failed', 'cancelled'],
        default: 'pending'
    },
    progress: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    inputData: {
        batches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Batch' }],
        faculties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' }],
        rooms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }],
        subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
        constraints: { type: mongoose.Schema.Types.ObjectId, ref: 'Constraint' },
        fixedSlots: { type: mongoose.Schema.Types.ObjectId, ref: 'FixedSlot' },
        timeSlots: { type: mongoose.Schema.Types.ObjectId, ref: 'TimeSlot' }
    },
    config: {
        timeout: { type: Number, default: 300 },  // seconds
        maxSolutions: { type: Number, default: 5 },
        weights: {
            type: Map,
            of: Number
        }
    },
    results: [{
        score: Number,
        timetable: { type: mongoose.Schema.Types.ObjectId, ref: 'Timetable' },
        violations: {
            hard: Number,
            soft: Number,
            details: [String]
        }
    }],
    error: String,
    startedAt: Date,
    completedAt: Date
}, { timestamps: true });

// Indexes
solverJobSchema.index({ status: 1, createdAt: -1 });
solverJobSchema.index({ requestedBy: 1 });
solverJobSchema.index({ department: 1 });

module.exports = mongoose.model('SolverJob', solverJobSchema);

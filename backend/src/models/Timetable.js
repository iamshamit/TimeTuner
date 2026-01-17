const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: true
    },
    semester: {
        type: Number,
        required: true
    },
    academicYear: {
        type: String,
        required: true
    },
    version: {
        type: Number,
        default: 1
    },
    score: {
        type: Number,
        min: 0,
        max: 1
    },
    status: {
        type: String,
        enum: ['draft', 'review', 'approved', 'published', 'archived'],
        default: 'draft'
    },
    // Time slot configuration for this timetable
    timeSlots: {
        slots: [{
            slotNumber: { type: Number },
            startTime: { type: String },
            endTime: { type: String },
            isBreak: { type: Boolean, default: false },
            shift: { type: String, enum: ['morning', 'afternoon'] }
        }]
    },
    events: [{
        day: {
            type: String,
            enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            required: true
        },
        slot: {
            type: Number,
            required: true
        },
        batch: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Batch',
            required: true
        },
        subject: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subject',
            required: true
        },
        faculty: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Faculty',
            required: true
        },
        room: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Room',
            required: true
        },
        duration: {
            type: Number,
            default: 1
        },
        isFixed: {
            type: Boolean,
            default: false
        }
    }],
    violations: {
        hard: { type: Number, default: 0 },
        soft: { type: Number, default: 0 },
        details: [{
            type: { type: String },
            description: String,
            severity: {
                type: String,
                enum: ['low', 'medium', 'high']
            }
        }]
    },
    metadata: {
        generatedBy: {
            type: String,
            enum: ['solver', 'manual'],
            default: 'solver'
        },
        solverJob: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SolverJob'
        },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        approvedAt: Date,
        publishedAt: Date
    },
    comments: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        comment: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

// Indexes
timetableSchema.index({ department: 1, semester: 1, status: 1 });
timetableSchema.index({ 'events.batch': 1 });
timetableSchema.index({ 'events.faculty': 1 });
timetableSchema.index({ 'events.room': 1 });
timetableSchema.index({ academicYear: 1 });

module.exports = mongoose.model('Timetable', timetableSchema);

const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'Batch code is required'],
        unique: true,
        uppercase: true,
        trim: true
    },
    name: {
        type: String,
        trim: true
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: true
    },
    semester: {
        type: Number,
        required: true,
        min: 1,
        max: 8
    },
    academicYear: {
        type: String,  // e.g., "2024-25"
        required: true
    },
    size: {
        type: Number,
        required: true,
        min: 1,
        max: 200
    },
    shift: {
        type: String,
        enum: ['morning', 'afternoon', 'evening'],
        default: 'morning'
    },
    subjects: [{
        subject: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subject',
            required: true
        },
        classesPerWeek: {
            type: Number,
            required: true,
            min: 1,
            max: 10
        },
        assignedFaculty: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Faculty'
        }
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Indexes
batchSchema.index({ code: 1 }, { unique: true });
batchSchema.index({ department: 1, semester: 1 });
batchSchema.index({ academicYear: 1 });

module.exports = mongoose.model('Batch', batchSchema);

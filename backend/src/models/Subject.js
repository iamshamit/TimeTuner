const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'Subject code is required'],
        unique: true,
        uppercase: true,
        trim: true
    },
    name: {
        type: String,
        required: [true, 'Subject name is required'],
        trim: true
    },
    shortName: {
        type: String,
        trim: true,
        maxlength: 10
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
    credits: {
        type: Number,
        min: 1,
        max: 6,
        default: 3
    },
    isLab: {
        type: Boolean,
        default: false
    },
    labHoursPerWeek: {
        type: Number,
        min: 0,
        default: 0
    },
    lectureHoursPerWeek: {
        type: Number,
        min: 0,
        default: 3
    },
    requiresSpecialRoom: {
        type: Boolean,
        default: false
    },
    roomType: {
        type: String,
        enum: ['lecture', 'lab', 'seminar']
    },
    isElective: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Indexes
subjectSchema.index({ code: 1 }, { unique: true });
subjectSchema.index({ department: 1, semester: 1 });
subjectSchema.index({ isLab: 1 });

module.exports = mongoose.model('Subject', subjectSchema);

const mongoose = require('mongoose');

const fixedSlotSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: true
    },
    semester: Number,
    academicYear: String,
    fixedSlots: [{
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
            ref: 'Faculty'
        },
        room: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Room'
        },
        day: {
            type: String,
            enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            required: true
        },
        slot: {
            type: Number,
            required: true
        },
        reason: String
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Indexes
fixedSlotSchema.index({ department: 1, semester: 1 });
fixedSlotSchema.index({ academicYear: 1 });

module.exports = mongoose.model('FixedSlot', fixedSlotSchema);

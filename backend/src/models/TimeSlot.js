const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department'
        // null = default for all departments
    },
    shift: {
        type: String,
        enum: ['morning', 'afternoon', 'evening'],
        required: true
    },
    slots: [{
        slotNumber: {
            type: Number,
            required: true
        },
        startTime: {
            type: String,  // "09:00"
            required: true,
            match: /^\d{2}:\d{2}$/
        },
        endTime: {
            type: String,  // "09:50"
            required: true,
            match: /^\d{2}:\d{2}$/
        },
        isBreak: {
            type: Boolean,
            default: false
        },
        breakName: String  // "Tea Break", "Lunch"
    }],
    days: [{
        type: String,
        enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    }],
    isDefault: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Indexes
timeSlotSchema.index({ department: 1, shift: 1 });
timeSlotSchema.index({ isDefault: 1 });

module.exports = mongoose.model('TimeSlot', timeSlotSchema);

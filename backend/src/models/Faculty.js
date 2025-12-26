const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
    employeeId: {
        type: String,
        required: [true, 'Employee ID is required'],
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
    },
    phone: {
        type: String,
        match: [/^\d{10}$/, 'Phone must be 10 digits']
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: true
    },
    designation: {
        type: String,
        enum: ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Guest Faculty'],
        default: 'Assistant Professor'
    },
    subjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
    }],
    maxDailyClasses: {
        type: Number,
        min: 1,
        max: 8,
        default: 4
    },
    maxWeeklyClasses: {
        type: Number,
        min: 1,
        max: 30,
        default: 20
    },
    avgLeavesPerMonth: {
        type: Number,
        min: 0,
        max: 10,
        default: 1
    },
    unavailableSlots: [{
        day: {
            type: String,
            enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        },
        slot: Number
    }],
    preferences: {
        preferredSlots: [{
            day: String,
            slot: Number
        }],
        avoidConsecutive: {
            type: Boolean,
            default: false
        },
        preferMorning: {
            type: Boolean,
            default: false
        }
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Indexes
facultySchema.index({ employeeId: 1 }, { unique: true });
facultySchema.index({ department: 1 });
facultySchema.index({ subjects: 1 });
facultySchema.index({ isActive: 1 });

module.exports = mongoose.model('Faculty', facultySchema);

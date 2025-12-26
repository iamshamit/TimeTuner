const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'Room code is required'],
        unique: true,
        uppercase: true,
        trim: true
    },
    name: {
        type: String,
        trim: true
    },
    building: {
        type: String,
        trim: true
    },
    floor: {
        type: Number,
        min: 0,
        max: 20
    },
    capacity: {
        type: Number,
        required: [true, 'Room capacity is required'],
        min: [1, 'Capacity must be at least 1'],
        max: 500
    },
    type: {
        type: String,
        enum: ['lecture', 'lab', 'seminar', 'auditorium'],
        default: 'lecture'
    },
    facilities: [{
        type: String,
        enum: ['projector', 'ac', 'whiteboard', 'smartboard', 'computers', 'lab_equipment']
    }],
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department'
        // Optional: null means shared room
    },
    shifts: [{
        type: String,
        enum: ['morning', 'afternoon', 'evening']
    }],
    unavailableSlots: [{
        day: String,
        slot: Number,
        reason: String
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Indexes
roomSchema.index({ code: 1 }, { unique: true });
roomSchema.index({ type: 1, capacity: 1 });
roomSchema.index({ department: 1 });
roomSchema.index({ isActive: 1 });

module.exports = mongoose.model('Room', roomSchema);

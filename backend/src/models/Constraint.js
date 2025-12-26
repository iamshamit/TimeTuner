const mongoose = require('mongoose');

const constraintSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department'
    },
    constraints: {
        hard: {
            maxClassesPerDayBatch: {
                type: Number,
                default: 6
            },
            noConsecutiveLabsForBatch: {
                type: Boolean,
                default: true
            },
            respectFacultyUnavailability: {
                type: Boolean,
                default: true
            },
            respectRoomCapacity: {
                type: Boolean,
                default: true
            },
            labsOnlyInLabRooms: {
                type: Boolean,
                default: true
            }
        },
        soft: {
            facultyLoadBalance: {
                enabled: { type: Boolean, default: true },
                weight: { type: Number, min: 1, max: 10, default: 5 }
            },
            avoidConsecutiveForFaculty: {
                enabled: { type: Boolean, default: true },
                maxConsecutive: { type: Number, default: 2 },
                weight: { type: Number, min: 1, max: 10, default: 5 }
            },
            studentDailyLoadLimit: {
                enabled: { type: Boolean, default: true },
                maxClasses: { type: Number, default: 5 },
                weight: { type: Number, min: 1, max: 10, default: 7 }
            },
            evenDistribution: {
                enabled: { type: Boolean, default: true },
                weight: { type: Number, min: 1, max: 10, default: 4 }
            },
            roomUtilization: {
                enabled: { type: Boolean, default: false },
                weight: { type: Number, min: 1, max: 10, default: 3 }
            },
            minimizeIdleGaps: {
                enabled: { type: Boolean, default: true },
                weight: { type: Number, min: 1, max: 10, default: 5 }
            },
            preferredSlotMatching: {
                enabled: { type: Boolean, default: false },
                weight: { type: Number, min: 1, max: 10, default: 2 }
            }
        }
    },
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
constraintSchema.index({ department: 1 });
constraintSchema.index({ isDefault: 1 });

module.exports = mongoose.model('Constraint', constraintSchema);

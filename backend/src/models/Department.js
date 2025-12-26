const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'Department code is required'],
        unique: true,
        uppercase: true,
        trim: true,
        maxlength: 10
    },
    name: {
        type: String,
        required: [true, 'Department name is required'],
        trim: true,
        maxlength: 100
    },
    hod: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    shifts: [{
        type: String,
        enum: ['morning', 'afternoon', 'evening']
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Indexes
departmentSchema.index({ code: 1 }, { unique: true });
departmentSchema.index({ isActive: 1 });

module.exports = mongoose.model('Department', departmentSchema);

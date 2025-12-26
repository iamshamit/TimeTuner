const TimeSlot = require('../models/TimeSlot');
const Constraint = require('../models/Constraint');
const { AppError, catchAsync } = require('../utils/appError');
const Response = require('../utils/responseFormatter');

// TimeSlot Controllers
exports.getAllTimeSlots = catchAsync(async (req, res, next) => {
    const filter = { isActive: true };
    if (req.query.department) filter.department = req.query.department;
    if (req.query.shift) filter.shift = req.query.shift;

    const timeSlots = await TimeSlot.find(filter)
        .populate('department', 'code name')
        .sort('shift');

    Response.success(res, timeSlots);
});

exports.getTimeSlot = catchAsync(async (req, res, next) => {
    const timeSlot = await TimeSlot.findById(req.params.id)
        .populate('department', 'code name');

    if (!timeSlot) {
        return next(new AppError('TimeSlot not found', 404));
    }

    Response.success(res, timeSlot);
});

exports.createTimeSlot = catchAsync(async (req, res, next) => {
    const timeSlot = await TimeSlot.create(req.body);
    Response.created(res, timeSlot);
});

exports.updateTimeSlot = catchAsync(async (req, res, next) => {
    const timeSlot = await TimeSlot.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    );

    if (!timeSlot) {
        return next(new AppError('TimeSlot not found', 404));
    }

    Response.success(res, timeSlot, 'TimeSlot updated successfully');
});

exports.deleteTimeSlot = catchAsync(async (req, res, next) => {
    const timeSlot = await TimeSlot.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true }
    );

    if (!timeSlot) {
        return next(new AppError('TimeSlot not found', 404));
    }

    Response.success(res, null, 'TimeSlot deleted successfully');
});

// Constraint Controllers
exports.getAllConstraints = catchAsync(async (req, res, next) => {
    const filter = { isActive: true };
    if (req.query.department) filter.department = req.query.department;

    const constraints = await Constraint.find(filter)
        .populate('department', 'code name');

    Response.success(res, constraints);
});

exports.getConstraint = catchAsync(async (req, res, next) => {
    const constraint = await Constraint.findById(req.params.id)
        .populate('department', 'code name');

    if (!constraint) {
        return next(new AppError('Constraint not found', 404));
    }

    Response.success(res, constraint);
});

exports.createConstraint = catchAsync(async (req, res, next) => {
    const constraint = await Constraint.create(req.body);
    Response.created(res, constraint);
});

exports.updateConstraint = catchAsync(async (req, res, next) => {
    const constraint = await Constraint.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    );

    if (!constraint) {
        return next(new AppError('Constraint not found', 404));
    }

    Response.success(res, constraint, 'Constraint updated successfully');
});

exports.deleteConstraint = catchAsync(async (req, res, next) => {
    const constraint = await Constraint.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true }
    );

    if (!constraint) {
        return next(new AppError('Constraint not found', 404));
    }

    Response.success(res, null, 'Constraint deleted successfully');
});

// Get default constraint (for solver)
exports.getDefaultConstraint = catchAsync(async (req, res, next) => {
    const constraint = await Constraint.findOne({ isDefault: true, isActive: true });

    if (!constraint) {
        return next(new AppError('No default constraint found', 404));
    }

    Response.success(res, constraint);
});

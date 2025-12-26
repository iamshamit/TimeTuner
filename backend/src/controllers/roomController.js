const Room = require('../models/Room');
const { AppError, catchAsync } = require('../utils/appError');
const Response = require('../utils/responseFormatter');
const APIFeatures = require('../utils/apiFeatures');

exports.getAllRooms = catchAsync(async (req, res, next) => {
    const features = new APIFeatures(Room.find({ isActive: true }), req.query)
        .filter()
        .search(['name', 'code', 'building'])
        .sort()
        .limitFields()
        .paginate();

    const rooms = await features.query.populate('department', 'code name');
    const total = await Room.countDocuments({ isActive: true, ...features.queryObj });

    Response.paginated(res, rooms, {
        page: req.query.page * 1 || 1,
        limit: req.query.limit * 1 || 10,
        total
    });
});

exports.getRoom = catchAsync(async (req, res, next) => {
    const room = await Room.findById(req.params.id)
        .populate('department', 'code name');

    if (!room) {
        return next(new AppError('Room not found', 404));
    }

    Response.success(res, room);
});

exports.createRoom = catchAsync(async (req, res, next) => {
    const room = await Room.create(req.body);
    Response.created(res, room);
});

exports.updateRoom = catchAsync(async (req, res, next) => {
    const room = await Room.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    );

    if (!room) {
        return next(new AppError('Room not found', 404));
    }

    Response.success(res, room, 'Room updated successfully');
});

exports.deleteRoom = catchAsync(async (req, res, next) => {
    const room = await Room.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true }
    );

    if (!room) {
        return next(new AppError('Room not found', 404));
    }

    Response.success(res, null, 'Room deleted successfully');
});

// Get available rooms by capacity and type
exports.getAvailableRooms = catchAsync(async (req, res, next) => {
    const { capacity, type, shift } = req.query;

    const filter = { isActive: true };
    if (capacity) filter.capacity = { $gte: parseInt(capacity) };
    if (type) filter.type = type;
    if (shift) filter.shifts = shift;

    const rooms = await Room.find(filter)
        .populate('department', 'code name')
        .sort('capacity');

    Response.success(res, rooms);
});

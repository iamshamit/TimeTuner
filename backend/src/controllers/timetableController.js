const Timetable = require('../models/Timetable');
const { AppError, catchAsync } = require('../utils/appError');
const Response = require('../utils/responseFormatter');
const APIFeatures = require('../utils/apiFeatures');

exports.getAllTimetables = catchAsync(async (req, res, next) => {
    let filter = {};

    // Filter by department for HOD
    if (req.user.role === 'hod' && req.user.department) {
        filter.department = req.user.department;
    }

    if (req.query.department) filter.department = req.query.department;
    if (req.query.semester) filter.semester = req.query.semester;
    if (req.query.status) filter.status = req.query.status;

    const features = new APIFeatures(Timetable.find(filter), req.query)
        .sort()
        .limitFields()
        .paginate();

    const timetables = await features.query
        .populate('department', 'code name')
        .populate('createdBy', 'name email')
        .select('-events'); // Don't include events in list view

    const total = await Timetable.countDocuments(filter);

    Response.paginated(res, timetables, {
        page: req.query.page * 1 || 1,
        limit: req.query.limit * 1 || 10,
        total
    });
});

exports.getTimetable = catchAsync(async (req, res, next) => {
    const timetable = await Timetable.findById(req.params.id)
        .populate('department', 'code name')
        .populate('events.batch', 'code name')
        .populate('events.subject', 'code name shortName isLab')
        .populate('events.faculty', 'name employeeId')
        .populate('events.room', 'code name building')
        .populate('createdBy', 'name email')
        .populate('metadata.approvedBy', 'name');

    if (!timetable) {
        return next(new AppError('Timetable not found', 404));
    }

    Response.success(res, timetable);
});

exports.updateTimetable = catchAsync(async (req, res, next) => {
    // Only allow updating name, status, and comments
    const allowedFields = ['name', 'status', 'comments'];
    const updates = {};

    Object.keys(req.body).forEach(key => {
        if (allowedFields.includes(key)) {
            updates[key] = req.body[key];
        }
    });

    const timetable = await Timetable.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true, runValidators: true }
    );

    if (!timetable) {
        return next(new AppError('Timetable not found', 404));
    }

    Response.success(res, timetable, 'Timetable updated');
});

exports.deleteTimetable = catchAsync(async (req, res, next) => {
    const timetable = await Timetable.findById(req.params.id);

    if (!timetable) {
        return next(new AppError('Timetable not found', 404));
    }

    // Only allow deleting draft timetables
    if (timetable.status !== 'draft') {
        return next(new AppError('Only draft timetables can be deleted', 400));
    }

    await Timetable.findByIdAndDelete(req.params.id);
    Response.success(res, null, 'Timetable deleted');
});

exports.approveTimetable = catchAsync(async (req, res, next) => {
    const timetable = await Timetable.findById(req.params.id);

    if (!timetable) {
        return next(new AppError('Timetable not found', 404));
    }

    if (timetable.status !== 'review') {
        return next(new AppError('Only timetables in review status can be approved', 400));
    }

    const updated = await Timetable.findByIdAndUpdate(
        req.params.id,
        {
            status: 'approved',
            'metadata.approvedBy': req.user._id,
            'metadata.approvedAt': new Date()
        },
        { new: true }
    );

    Response.success(res, updated, 'Timetable approved');
});

exports.publishTimetable = catchAsync(async (req, res, next) => {
    const timetable = await Timetable.findById(req.params.id);

    if (!timetable) {
        return next(new AppError('Timetable not found', 404));
    }

    if (timetable.status !== 'approved') {
        return next(new AppError('Only approved timetables can be published', 400));
    }

    // Archive previously published timetables for same dept/semester
    await Timetable.updateMany(
        {
            department: timetable.department,
            semester: timetable.semester,
            status: 'published',
            _id: { $ne: timetable._id }
        },
        { status: 'archived' }
    );

    const updated = await Timetable.findByIdAndUpdate(
        req.params.id,
        {
            status: 'published',
            'metadata.publishedAt': new Date()
        },
        { new: true }
    );

    Response.success(res, updated, 'Timetable published');
});

exports.submitForReview = catchAsync(async (req, res, next) => {
    const timetable = await Timetable.findById(req.params.id);

    if (!timetable) {
        return next(new AppError('Timetable not found', 404));
    }

    if (timetable.status !== 'draft') {
        return next(new AppError('Only draft timetables can be submitted for review', 400));
    }

    const updated = await Timetable.findByIdAndUpdate(
        req.params.id,
        { status: 'review' },
        { new: true }
    );

    Response.success(res, updated, 'Timetable submitted for review');
});

exports.addComment = catchAsync(async (req, res, next) => {
    const { comment } = req.body;

    const timetable = await Timetable.findByIdAndUpdate(
        req.params.id,
        {
            $push: {
                comments: {
                    user: req.user._id,
                    comment: comment,
                    createdAt: new Date()
                }
            }
        },
        { new: true }
    ).populate('comments.user', 'name');

    if (!timetable) {
        return next(new AppError('Timetable not found', 404));
    }

    Response.success(res, timetable.comments, 'Comment added');
});

// Get timetable for specific batch (public view)
exports.getBatchTimetable = catchAsync(async (req, res, next) => {
    const { batchId } = req.params;

    const timetable = await Timetable.findOne({
        'events.batch': batchId,
        status: 'published'
    })
        .populate('events.subject', 'code name shortName')
        .populate('events.faculty', 'name')
        .populate('events.room', 'code building');

    if (!timetable) {
        return next(new AppError('No published timetable found for this batch', 404));
    }

    // Filter events for this batch only
    const batchEvents = timetable.events.filter(
        e => e.batch.toString() === batchId
    );

    Response.success(res, {
        timetableId: timetable._id,
        batchId,
        events: batchEvents
    });
});

// Get timetable for specific faculty (public view)
exports.getFacultyTimetable = catchAsync(async (req, res, next) => {
    const { facultyId } = req.params;

    const timetable = await Timetable.findOne({
        'events.faculty': facultyId,
        status: 'published'
    })
        .populate('events.batch', 'code name')
        .populate('events.subject', 'code name shortName')
        .populate('events.room', 'code building');

    if (!timetable) {
        return next(new AppError('No published timetable found for this faculty', 404));
    }

    // Filter events for this faculty only
    const facultyEvents = timetable.events.filter(
        e => e.faculty.toString() === facultyId
    );

    Response.success(res, {
        timetableId: timetable._id,
        facultyId,
        events: facultyEvents
    });
});

const Batch = require('../models/Batch');
const { AppError, catchAsync } = require('../utils/appError');
const Response = require('../utils/responseFormatter');
const APIFeatures = require('../utils/apiFeatures');

exports.getAllBatches = catchAsync(async (req, res, next) => {
    let filter = { isActive: true };
    if (req.user.role === 'hod' && req.user.department) {
        filter.department = req.user.department;
    }

    const features = new APIFeatures(Batch.find(filter), req.query)
        .filter()
        .search(['name', 'code'])
        .sort()
        .limitFields()
        .paginate();

    const batches = await features.query
        .populate('department', 'code name')
        .populate('subjects.subject', 'code name')
        .populate('subjects.assignedFaculty', 'name employeeId');

    const total = await Batch.countDocuments({ ...filter, ...features.queryObj });

    Response.paginated(res, batches, {
        page: req.query.page * 1 || 1,
        limit: req.query.limit * 1 || 10,
        total
    });
});

exports.getBatch = catchAsync(async (req, res, next) => {
    const batch = await Batch.findById(req.params.id)
        .populate('department', 'code name')
        .populate('subjects.subject', 'code name shortName isLab')
        .populate('subjects.assignedFaculty', 'name employeeId email');

    if (!batch) {
        return next(new AppError('Batch not found', 404));
    }

    Response.success(res, batch);
});

exports.createBatch = catchAsync(async (req, res, next) => {
    const batch = await Batch.create(req.body);

    const populated = await Batch.findById(batch._id)
        .populate('department', 'code name')
        .populate('subjects.subject', 'code name');

    Response.created(res, populated);
});

exports.updateBatch = catchAsync(async (req, res, next) => {
    const batch = await Batch.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    )
        .populate('department', 'code name')
        .populate('subjects.subject', 'code name')
        .populate('subjects.assignedFaculty', 'name employeeId');

    if (!batch) {
        return next(new AppError('Batch not found', 404));
    }

    Response.success(res, batch, 'Batch updated successfully');
});

exports.deleteBatch = catchAsync(async (req, res, next) => {
    const batch = await Batch.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true }
    );

    if (!batch) {
        return next(new AppError('Batch not found', 404));
    }

    Response.success(res, null, 'Batch deleted successfully');
});

// Assign faculty to batch subjects
exports.assignFaculty = catchAsync(async (req, res, next) => {
    const { subjectId, facultyId } = req.body;

    const batch = await Batch.findOneAndUpdate(
        { _id: req.params.id, 'subjects.subject': subjectId },
        { $set: { 'subjects.$.assignedFaculty': facultyId } },
        { new: true }
    )
        .populate('subjects.subject', 'code name')
        .populate('subjects.assignedFaculty', 'name employeeId');

    if (!batch) {
        return next(new AppError('Batch or subject not found', 404));
    }

    Response.success(res, batch, 'Faculty assigned successfully');
});
